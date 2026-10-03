import {
  checkPasswordPolicy,
  decryptField,
  dummyHash,
  encryptField,
  hashPassword,
  randomToken,
  sha256,
  verifyPassword,
  verifyTotp,
} from './lib/crypto.js';

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

export class AuthError extends Error {
  constructor(message, status = 401, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export function createAuth({ db, config, audit }) {
  const cookieName = config.secureCookies ? '__Host-sid' : 'sid';

  async function login({ email, password, totp }) {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).trim());
    const now = new Date();

    // Sempre gasta o mesmo tempo de scrypt, exista o usuário ou não.
    const okPass = await verifyPassword(password, user ? user.pass_hash : await dummyHash());

    if (user?.locked_until && new Date(user.locked_until) > now) {
      throw new AuthError('Conta temporariamente bloqueada por excesso de tentativas. Tente novamente mais tarde.', 429);
    }
    const fail = (reason) => {
      if (user) {
        const fails = user.failed_attempts + 1;
        const lock = fails >= MAX_FAILS ? new Date(now.getTime() + LOCK_MINUTES * 60000).toISOString() : null;
        db.prepare('UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?').run(lock ? 0 : fails, lock, user.id);
        audit.write({ actor: `user:${user.id}`, action: 'auth.login_failed', entity: 'user', entityId: user.id, meta: { reason, locked: Boolean(lock) } });
      }
      throw new AuthError('Credenciais inválidas.');
    };

    if (!user || user.disabled || !okPass) return fail('password');

    const needsTotp = Boolean(user.totp_enabled);
    if (!needsTotp && config.requireTotpForStaff && user.role !== 'partner') {
      throw new AuthError('Autenticação em dois fatores obrigatória: peça ao administrador para ativá-la na sua conta.', 403);
    }
    if (needsTotp) {
      if (!totp) throw new AuthError('Informe o código do aplicativo autenticador.', 401, { needTotp: true });
      const secret = decryptField(config.keys.totp, user.totp_secret_enc, `users.totp:${user.id}`);
      const step = verifyTotp(secret, totp);
      // Recusa passos já usados (anti-replay do código de 6 dígitos).
      if (step === null || step <= user.totp_last_step) return fail('totp');
      db.prepare('UPDATE users SET totp_last_step = ? WHERE id = ?').run(step, user.id);
    }

    db.prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);
    const session = createSession(user.id, now);
    audit.write({ actor: `user:${user.id}`, action: 'auth.login', entity: 'user', entityId: user.id });
    return { user: publicUser(user), ...session };
  }

  function createSession(userId, now = new Date()) {
    const token = randomToken(32);
    const csrf = randomToken(24);
    const idle = config.session.idleMinutes * 60000;
    const abs = config.session.absoluteHours * 3600000;
    db.prepare('INSERT INTO sessions (id_hash, user_id, csrf, created_at, last_seen, expires_at) VALUES (?,?,?,?,?,?)').run(
      sha256(token), userId, csrf, now.toISOString(), now.toISOString(), new Date(now.getTime() + abs).toISOString(),
    );
    return { token, csrf, maxAgeSeconds: Math.floor(idle / 1000) };
  }

  function loadSession(token, now = new Date()) {
    if (!token) return null;
    const row = db
      .prepare(
        `SELECT s.*, u.email, u.name, u.role, u.partner_id, u.disabled FROM sessions s
         JOIN users u ON u.id = s.user_id WHERE s.id_hash = ?`,
      )
      .get(sha256(token));
    if (!row || row.disabled) return null;
    const idle = config.session.idleMinutes * 60000;
    if (new Date(row.expires_at) < now || now.getTime() - new Date(row.last_seen).getTime() > idle) {
      db.prepare('DELETE FROM sessions WHERE id_hash = ?').run(row.id_hash);
      return null;
    }
    db.prepare('UPDATE sessions SET last_seen = ? WHERE id_hash = ?').run(now.toISOString(), row.id_hash);
    return { id_hash: row.id_hash, csrf: row.csrf, user: { id: row.user_id, email: row.email, name: row.name, role: row.role, partnerId: row.partner_id } };
  }

  const destroySession = (token) => token && db.prepare('DELETE FROM sessions WHERE id_hash = ?').run(sha256(token));
  const destroyAllSessions = (userId) => db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);

  async function createUser({ email, name, role, partnerId = null, password, enableTotp = false, totpSecret = null }) {
    const problem = checkPasswordPolicy(password);
    if (problem) throw new AuthError(problem, 400);
    const hash = await hashPassword(password);
    const res = db
      .prepare('INSERT INTO users (email, name, role, partner_id, pass_hash) VALUES (?,?,?,?,?)')
      .run(email.trim(), name.trim(), role, partnerId, hash);
    const id = Number(res.lastInsertRowid);
    if (enableTotp && totpSecret) {
      db.prepare('UPDATE users SET totp_secret_enc = ?, totp_enabled = 1 WHERE id = ?').run(encryptField(config.keys.totp, totpSecret, `users.totp:${id}`), id);
    }
    return id;
  }

  const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name, role: u.role, partnerId: u.partner_id });

  function purgeExpiredSessions(now = new Date()) {
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now.toISOString());
  }

  return { cookieName, login, createSession, loadSession, destroySession, destroyAllSessions, createUser, purgeExpiredSessions };
}
