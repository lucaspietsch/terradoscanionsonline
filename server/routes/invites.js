import { z } from 'zod';
import { AuthError } from '../auth.js';
import { checkPasswordPolicy, verifyPassword, hashPassword } from '../lib/crypto.js';

const inviteBody = z.object({ email: z.string().trim().toLowerCase().email().max(160), name: z.string().trim().min(2).max(100) }).strict();
const acceptBody = z.object({ token: z.string().min(20).max(100), password: z.string().min(1).max(128) }).strict();
const forgotBody = z.object({ email: z.string().trim().toLowerCase().email().max(160) }).strict();
const changeBody = z.object({ current: z.string().min(1).max(128), next: z.string().min(1).max(128) }).strict();

export async function inviteRoutes(api, { db, auth, audit, invites, mailer, rl }) {
  // ---- Público (o próprio token é a credencial) ----
  api.get('/invites/:token', { config: rl(30, '10 minutes') }, async (req) => invites.describe(req.params.token));

  api.post('/invites/accept', { config: rl(10, '15 minutes') }, async (req) => {
    const b = acceptBody.parse(req.body);
    await invites.accept(b.token, b.password);
    return { ok: true };
  });

  api.post('/auth/forgot', { config: rl(5, '1 hour') }, async (req, reply) => {
    const b = forgotBody.parse(req.body);
    await invites.forgot(b.email).catch((e) => req.log.warn({ err: e.message }, 'forgot falhou'));
    return reply.code(202).send({ ok: true, message: 'Se este e-mail tiver acesso e o envio por e-mail estiver ativo, você receberá um link. Se não chegar, peça um novo link ao administrador.' });
  });

  // ---- Admin: gera o link de acesso de um parceiro ----
  api.post('/admin/partners/:id/invite', { preHandler: api.requireRole('admin'), config: rl(30, '10 minutes') }, async (req) => {
    const b = inviteBody.parse(req.body);
    const partnerId = Number(req.params.id);
    const inv = await invites.create({ partnerId, email: b.email, name: b.name, actor: `user:${req.session.user.id}` });
    const emailed = mailer.enabled ? await invites.sendInviteEmail(inv, b.email, b.name) : false;
    const partner = db.prepare('SELECT whatsapp FROM partners WHERE id = ?').get(partnerId);
    return {
      url: inv.url, purpose: inv.purpose, expiresAt: inv.expiresAt, emailed, partnerWhatsapp: partner.whatsapp,
      message: `Olá, ${b.name.split(' ')[0]}! O ${inv.partnerName} já está no Terra dos Cânions Online. Crie sua senha neste link (vale por ${invites.INVITE_DAYS} dias, uso único) e preencha seus dados e produtos: ${inv.url}`,
    };
  });

  // ---- Qualquer usuário logado: troca a própria senha ----
  api.post('/auth/change-password', { preHandler: api.requireRole('admin', 'checkin', 'partner'), config: rl(5, '15 minutes') }, async (req) => {
    const b = changeBody.parse(req.body);
    const u = db.prepare('SELECT id, pass_hash FROM users WHERE id = ?').get(req.session.user.id);
    // 400 (e não 401) para a tela não interpretar como "sessão expirada".
    if (!(await verifyPassword(b.current, u.pass_hash))) throw new AuthError('A senha atual está incorreta.', 400);
    const problem = checkPasswordPolicy(b.next);
    if (problem) throw new AuthError(problem, 400);
    if (b.current === b.next) throw new AuthError('A nova senha deve ser diferente da atual.', 400);
    const hash = await hashPassword(b.next);
    db.transaction(() => {
      db.prepare('UPDATE users SET pass_hash = ? WHERE id = ?').run(hash, u.id);
      // Encerra as OUTRAS sessões (aparelhos perdidos/esquecidos); mantém a atual.
      db.prepare('DELETE FROM sessions WHERE user_id = ? AND id_hash <> ?').run(u.id, req.session.id_hash);
    })();
    audit.write({ actor: `user:${u.id}`, action: 'auth.password_changed', entity: 'user', entityId: u.id });
    return { ok: true };
  });
}
