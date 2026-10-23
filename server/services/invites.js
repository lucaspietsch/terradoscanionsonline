import { checkPasswordPolicy, hashPassword, randomToken, sha256 } from '../lib/crypto.js';
import { AuthError } from '../auth.js';
import { OrderError } from './orders.js';

const INVITE_DAYS = 7;
const RESET_HOURS = 2;
const invalid = () => new OrderError('Link inválido ou expirado. Peça um novo ao administrador.', 'invalid_invite', 410);

export function createInviteService({ db, config, auth, audit, mailer }) {
  const urlFor = (token) => `${config.baseUrl}/convite/${token}`;

  // Cria (ou renova) o link de acesso de um parceiro. Se o e-mail já tem login desse mesmo parceiro,
  // vira uma redefinição de senha; se pertence a outra pessoa/parceiro, recusa.
  async function create({ partnerId, email, name, actor = 'system', purposeHint = null }) {
    const partner = db.prepare('SELECT id, name FROM partners WHERE id = ?').get(partnerId);
    if (!partner) throw new OrderError('Parceiro não encontrado.', 'not_found', 404);
    email = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id, role, partner_id, disabled FROM users WHERE email = ?').get(email);
    let purpose = 'invite';
    if (existing) {
      if (existing.role !== 'partner' || existing.partner_id !== partnerId) throw new OrderError('Este e-mail já está em uso por outro usuário.', 'email_taken', 409);
      purpose = 'reset';
    }
    if (purposeHint === 'reset' && purpose !== 'reset') throw new OrderError('Este e-mail ainda não tem acesso.', 'not_found', 404);
    const token = randomToken(32);
    const ttlMs = purpose === 'reset' && actor === 'self' ? RESET_HOURS * 3600000 : INVITE_DAYS * 86400000;
    const expiresAt = new Date(Date.now() + ttlMs).toISOString();
    db.transaction(() => {
      db.prepare('DELETE FROM invites WHERE partner_id = ? AND email = ? AND used_at IS NULL').run(partnerId, email);
      db.prepare('INSERT INTO invites (token_hash, partner_id, email, name, purpose, expires_at, created_by) VALUES (?,?,?,?,?,?,?)')
        .run(sha256(token), partnerId, email, name.trim(), purpose, expiresAt, actor);
    })();
    audit.write({ actor, action: purpose === 'reset' ? 'invite.reset_created' : 'invite.created', entity: 'partner', entityId: partnerId, meta: { purpose } });
    return { token, url: urlFor(token), purpose, expiresAt, partnerName: partner.name };
  }

  const find = (token) => {
    if (typeof token !== 'string' || token.length < 20 || token.length > 100) return null;
    return db
      .prepare(
        `SELECT i.*, p.name AS partner_name FROM invites i JOIN partners p ON p.id = i.partner_id
         WHERE i.token_hash = ? AND i.used_at IS NULL AND i.expires_at > ?`,
      )
      .get(sha256(token), new Date().toISOString());
  };

  function describe(token) {
    const i = find(token);
    if (!i) throw invalid();
    return { partnerName: i.partner_name, email: i.email, name: i.name, purpose: i.purpose };
  }

  async function accept(token, password) {
    const problem = checkPasswordPolicy(password);
    if (problem) throw new AuthError(problem, 400);
    if (!find(token)) throw invalid();
    const hash = await hashPassword(password); // custoso: fora da transação
    const userId = db.transaction(() => {
      const i = find(token);
      if (!i) throw invalid();
      // Consumo atômico: dois cliques/abas não usam o mesmo link duas vezes.
      const used = db.prepare('UPDATE invites SET used_at = ? WHERE id = ? AND used_at IS NULL').run(new Date().toISOString(), i.id);
      if (used.changes !== 1) throw invalid();
      let id;
      const user = db.prepare('SELECT id FROM users WHERE email = ?').get(i.email);
      if (i.purpose === 'reset' && user) {
        db.prepare('UPDATE users SET pass_hash = ?, failed_attempts = 0, locked_until = NULL, disabled = 0 WHERE id = ?').run(hash, user.id);
        auth.destroyAllSessions(user.id);
        id = user.id;
      } else {
        if (user) throw invalid();
        id = Number(db.prepare("INSERT INTO users (email, name, role, partner_id, pass_hash) VALUES (?,?, 'partner', ?, ?)").run(i.email, i.name, i.partner_id, hash).lastInsertRowid);
      }
      audit.write({ actor: `user:${id}`, action: i.purpose === 'reset' ? 'invite.reset_accepted' : 'invite.accepted', entity: 'partner', entityId: i.partner_id });
      return id;
    })();
    return { userId };
  }

  // "Esqueci minha senha": resposta sempre igual (não revela se o e-mail existe) e só envia se houver SMTP.
  async function forgot(email) {
    const u = db.prepare("SELECT id, name, partner_id, disabled FROM users WHERE email = ? AND role = 'partner'").get(email.trim().toLowerCase());
    if (!u || u.disabled || !mailer.enabled) return;
    const inv = await create({ partnerId: u.partner_id, email, name: u.name, actor: 'self', purposeHint: 'reset' });
    await mailer.send({
      to: email.trim().toLowerCase(),
      subject: 'Redefinir sua senha — Terra dos Cânions',
      text: `Olá, ${u.name.split(' ')[0]}!\n\nPara criar uma nova senha, abra o link (vale por ${RESET_HOURS} horas e só pode ser usado uma vez):\n${inv.url}\n\nSe não foi você, ignore este e-mail.`,
    });
  }

  async function sendInviteEmail(inv, email, name) {
    const reset = inv.purpose === 'reset';
    return mailer.send({
      to: email,
      subject: reset ? 'Nova senha do seu painel — Terra dos Cânions' : 'Seu acesso ao painel — Terra dos Cânions',
      text: `Olá, ${name.split(' ')[0]}!\n\n${reset ? 'Crie uma nova senha' : `O ${inv.partnerName} já tem uma página no Terra dos Cânions Online. Crie sua senha e preencha seus dados e produtos`} pelo link abaixo (vale por ${INVITE_DAYS} dias e só pode ser usado uma vez):\n${inv.url}\n\nDepois é só entrar em ${config.baseUrl}/admin`,
    });
  }

  // Situação de acesso por parceiro (para o painel do admin).
  function accessSummary(partnerId) {
    const users = db.prepare('SELECT COUNT(*) AS n FROM users WHERE partner_id = ? AND disabled = 0').get(partnerId).n;
    const pending = db.prepare('SELECT MAX(expires_at) AS e FROM invites WHERE partner_id = ? AND used_at IS NULL AND expires_at > ?').get(partnerId, new Date().toISOString()).e;
    return { users, pendingInviteUntil: pending };
  }

  return { create, describe, accept, forgot, sendInviteEmail, accessSummary, INVITE_DAYS };
}
