import { buildApp } from '../server/app.js';
import { loadConfig } from '../server/config.js';
import { openDb } from '../server/db.js';
import { seed } from '../scripts/seed.js';
import { newTotpSecret, totpAt } from '../server/lib/crypto.js';

export async function makeApp({ env = {}, payments, demo = true } = {}) {
  const config = loadConfig({ NODE_ENV: 'test', DB_PATH: ':memory:', PAYMENT_PROVIDER: 'mock', ...env });
  const db = openDb(':memory:');
  seed(db, { demo });
  const app = await buildApp({ config, db, payments });
  await app.ready();
  return { app, db, config, ctx: app.ctx };
}

export const slotFor = (db, { qty = 1, min = 0 } = {}) =>
  db.prepare(`SELECT * FROM slots WHERE capacity - reserved >= ? ORDER BY day, time LIMIT 1 OFFSET ?`).get(qty, min);

export const participant = (over = {}) => ({ name: 'Maria da Silva', birthDate: '1990-05-10', weightKg: 65, ...over });

export function orderPayload(slotId, over = {}) {
  const qty = over.qty ?? 1;
  return {
    slotId,
    qty,
    buyer: { name: 'João Pereira', email: 'joao@example.com', phone: '(54) 99988-7766' },
    participants: Array.from({ length: qty }, (_, i) => participant({ name: `Participante Número ${i + 1}` })),
    acceptedWaiver: true,
    acceptedPrivacy: true,
    ...over,
  };
}

export async function createOrder(app, db, over = {}) {
  const slot = over._slot ?? slotFor(db, { qty: over.qty ?? 1 });
  const { _slot, ...rest } = over;
  void _slot;
  const res = await app.inject({ method: 'POST', url: '/api/orders', payload: orderPayload(slot.id, rest) });
  return { res, body: res.json(), slot };
}

export async function makeStaff(ctx, { role = 'admin', email = 'admin@example.com', password = 'Senha-Forte-123!', partnerId = null } = {}) {
  const secret = newTotpSecret();
  const id = await ctx.auth.createUser({ email, name: 'Equipe', role, password, partnerId, enableTotp: true, totpSecret: secret });
  return { id, email, password, secret };
}

let stepOffset = 0;
export const nextTotp = (secret) => totpAt(secret, Math.floor(Date.now() / 30000) + stepOffset++ % 1);

export async function login(app, user, step = 0) {
  const res = await app.inject({
    method: 'POST', url: '/api/auth/login',
    payload: { email: user.email, password: user.password, totp: totpAt(user.secret, Math.floor(Date.now() / 30000) + step) },
  });
  const cookie = res.cookies?.[0];
  return { res, cookie: cookie && `${cookie.name}=${cookie.value}`, csrf: res.json().csrf };
}
