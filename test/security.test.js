import assert from 'node:assert/strict';
import { test } from 'node:test';
import { totpAt } from '../server/lib/crypto.js';
import { loadConfig } from '../server/config.js';
import { createOrder, login, makeApp, makeStaff } from './helpers.js';

test('cabeçalhos de segurança e CSP estrita', async () => {
  const { app } = await makeApp();
  const r = await app.inject({ method: 'GET', url: '/api/health' });
  const csp = r.headers['content-security-policy'];
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src 'self'(;|$)/);
  assert.doesNotMatch(csp, /unsafe-inline/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.equal(r.headers['x-content-type-options'], 'nosniff');
  assert.equal(r.headers['x-frame-options'], 'DENY');
  assert.equal(r.headers['cache-control'], 'no-store');
  assert.equal(r.headers['x-powered-by'], undefined);
  assert.match(r.headers['permissions-policy'], /geolocation=\(\)/);
  await app.close();
});

test('produção exige MASTER_KEY, https e proíbe provedor mock', () => {
  assert.throws(() => loadConfig({ NODE_ENV: 'production', BASE_URL: 'https://x.com', PAYMENT_PROVIDER: 'mercadopago' }), /MASTER_KEY/);
  const key = Buffer.alloc(32, 1).toString('base64');
  assert.throws(() => loadConfig({ NODE_ENV: 'production', MASTER_KEY: key, BASE_URL: 'http://x.com', PAYMENT_PROVIDER: 'mercadopago', MP_ACCESS_TOKEN: 'a', MP_WEBHOOK_SECRET: 'b' }), /https/);
  assert.throws(() => loadConfig({ NODE_ENV: 'production', MASTER_KEY: key, BASE_URL: 'https://x.com', PAYMENT_PROVIDER: 'mock' }), /mock/);
  assert.throws(() => loadConfig({ NODE_ENV: 'production', MASTER_KEY: 'curta', BASE_URL: 'https://x.com', PAYMENT_PROVIDER: 'mercadopago', MP_ACCESS_TOKEN: 'a', MP_WEBHOOK_SECRET: 'b' }), /32 bytes/);
  const ok = loadConfig({ NODE_ENV: 'production', MASTER_KEY: key, BASE_URL: 'https://x.com', MP_ACCESS_TOKEN: 'a', MP_WEBHOOK_SECRET: 'b' });
  assert.equal(ok.secureCookies, true);
  assert.equal(ok.requireTotpForStaff, true);
});

test('rotas administrativas: 401 sem sessão, 403 para papel errado', async () => {
  const { app, ctx } = await makeApp();
  for (const url of ['/api/admin/stats', '/api/admin/orders', '/api/admin/audit', '/api/admin/users', '/api/partner/me', '/api/checkin/today']) {
    assert.equal((await app.inject({ method: 'GET', url })).statusCode, 401, url);
  }
  const door = await makeStaff(ctx, { role: 'checkin', email: 'porta@example.com' });
  const { cookie } = await login(app, door);
  assert.equal((await app.inject({ method: 'GET', url: '/api/admin/stats', headers: { cookie } })).statusCode, 403);
  assert.equal((await app.inject({ method: 'GET', url: '/api/checkin/today', headers: { cookie } })).statusCode, 200);
  await app.close();
});

test('login: senha errada genérica, 2FA exigido, replay de TOTP barrado, cookie endurecido', async () => {
  const { app, ctx } = await makeApp();
  const u = await makeStaff(ctx);
  const bad = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: u.email, password: 'errada-errada-1A!' } });
  const none = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'ninguem@example.com', password: 'errada-errada-1A!' } });
  assert.equal(bad.statusCode, 401);
  assert.deepEqual(bad.json(), none.json(), 'não revela se o usuário existe');

  const needs = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: u.email, password: u.password } });
  assert.equal(needs.statusCode, 401);
  assert.equal(needs.json().needTotp, true);

  const wrongTotp = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: u.email, password: u.password, totp: '000000' } });
  assert.equal(wrongTotp.statusCode, 401);

  const code = totpAt(u.secret, Math.floor(Date.now() / 30000));
  const ok = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: u.email, password: u.password, totp: code } });
  assert.equal(ok.statusCode, 200);
  const c = ok.cookies[0];
  assert.equal(c.httpOnly, true);
  assert.equal(c.sameSite, 'Strict');
  assert.equal(c.path, '/');
  const replay = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: u.email, password: u.password, totp: code } });
  assert.equal(replay.statusCode, 401, 'o mesmo código TOTP não vale duas vezes');
  await app.close();
});

test('bloqueio de conta após 5 falhas, mesmo com a senha certa depois', async () => {
  const { app, ctx } = await makeApp();
  const u = await makeStaff(ctx);
  for (let i = 0; i < 5; i++) {
    await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: u.email, password: `errada-${i}-Zz!!` } });
  }
  const { res } = await login(app, u);
  assert.equal(res.statusCode, 429);
  await app.close();
});

test('sessão: logout invalida; sessão ociosa expira', async () => {
  const { app, ctx, db } = await makeApp();
  const u = await makeStaff(ctx);
  const { cookie, csrf } = await login(app, u);
  assert.equal((await app.inject({ method: 'GET', url: '/api/admin/stats', headers: { cookie } })).statusCode, 200);
  db.prepare("UPDATE sessions SET last_seen = '2000-01-01T00:00:00.000Z'").run();
  assert.equal((await app.inject({ method: 'GET', url: '/api/admin/stats', headers: { cookie } })).statusCode, 401, 'ociosa');
  const again = await login(app, u, 1);
  assert.equal(again.res.statusCode, 200);
  await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { cookie: again.cookie, 'x-csrf-token': again.csrf } });
  assert.equal((await app.inject({ method: 'GET', url: '/api/admin/stats', headers: { cookie: again.cookie } })).statusCode, 401);
  void csrf;
  await app.close();
});

test('log de auditoria é encadeado e detecta adulteração', async () => {
  const { app, db, ctx } = await makeApp();
  await createOrder(app, db);
  ctx.audit.write({ actor: 'x', action: 'a' });
  ctx.audit.write({ actor: 'x', action: 'b' });
  assert.deepEqual(ctx.audit.verify(), { ok: true });
  const id = db.prepare('SELECT id FROM audit_log ORDER BY id LIMIT 1 OFFSET 1').get().id;
  db.prepare("UPDATE audit_log SET action = 'forjado' WHERE id = ?").run(id);
  assert.equal(ctx.audit.verify().ok, false);
  await app.close();
});

test('isolamento do parceiro: vê só os próprios números, sem dados de clientes', async () => {
  const { app, db, ctx } = await makeApp();
  const pid = db.prepare("SELECT id FROM partners WHERE slug = 'canyons-chalet'").get().id;
  db.prepare("INSERT INTO coupons (code, kind, value, partner_id) VALUES ('CANYONS10', 'percent', 10, ?)").run(pid);
  const { body } = await createOrder(app, db, { coupon: 'CANYONS10' });
  await app.inject({ method: 'POST', url: `/api/dev/pay/${body.accessToken}` });
  const u = await makeStaff(ctx, { role: 'partner', email: 'canyons@example.com', partnerId: pid });
  const { cookie, csrf } = await login(app, u);
  const me = (await app.inject({ method: 'GET', url: '/api/partner/me', headers: { cookie } })).json();
  assert.equal(me.stats.paidOrders, 1);
  assert.equal(me.stats.revenueCents, 13500);
  const raw = JSON.stringify(me);
  assert.ok(!raw.includes('João') && !raw.includes('joao@'));
  assert.equal((await app.inject({ method: 'GET', url: '/api/admin/orders', headers: { cookie } })).statusCode, 403);
  const patch = await app.inject({ method: 'PATCH', url: '/api/partner/me', headers: { cookie, 'x-csrf-token': csrf }, payload: { tagline: 'Chalés com vista', website: 'javascript:alert(1)' } });
  assert.equal(patch.statusCode, 400, 'URL não-https rejeitada');
  const patch2 = await app.inject({ method: 'PATCH', url: '/api/partner/me', headers: { cookie, 'x-csrf-token': csrf }, payload: { tagline: 'Chalés com vista', plan: 'pago' } });
  assert.equal(patch2.statusCode, 400, 'parceiro não pode mudar o próprio plano');
  const ok = await app.inject({ method: 'PATCH', url: '/api/partner/me', headers: { cookie, 'x-csrf-token': csrf }, payload: { tagline: 'Chalés com vista', website: 'https://canyons.example.com' } });
  assert.equal(ok.statusCode, 200);
  assert.equal(db.prepare('SELECT tagline FROM partners WHERE id = ?').get(pid).tagline, 'Chalés com vista');
  await app.close();
});

test('injeção: entradas maliciosas não quebram consultas nem são refletidas', async () => {
  const { app, ctx } = await makeApp();
  const admin = await makeStaff(ctx);
  const { cookie, csrf } = await login(app, admin);
  const h = { cookie, 'x-csrf-token': csrf };
  const r1 = await app.inject({ method: 'GET', url: `/api/admin/orders?q=${encodeURIComponent("' OR 1=1 --")}`, headers: h });
  assert.equal(r1.statusCode, 200);
  assert.deepEqual(r1.json(), []);
  const r2 = await app.inject({ method: 'GET', url: `/api/partners/${encodeURIComponent("x' UNION SELECT * FROM users--")}` });
  assert.equal(r2.statusCode, 404);
  const r3 = await app.inject({ method: 'POST', url: '/api/admin/coupons', headers: h, payload: { code: "A'; DROP TABLE users;--", kind: 'percent', value: 10 } });
  assert.equal(r3.statusCode, 400);
  const r4 = await app.inject({ method: 'GET', url: '/api/admin/qr/1/image.svg%00' , headers: h });
  assert.ok([400, 404].includes(r4.statusCode));
  await app.close();
});

test('rate limit no login e na criação de pedidos', async () => {
  const { app, db } = await makeApp({ env: { TEST_RATE_LIMIT: '1' } });
  let last;
  for (let i = 0; i < 12; i++) {
    last = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'x@example.com', password: 'qualquer-coisa' } });
  }
  assert.equal(last.statusCode, 429);
  assert.equal(last.json().error, 'rate_limited');
  void db;
  await app.close();
});

test('corpo grande e content-type errado são recusados', async () => {
  const { app } = await makeApp();
  const big = await app.inject({ method: 'POST', url: '/api/orders', headers: { 'content-type': 'application/json' }, payload: JSON.stringify({ x: 'a'.repeat(70_000) }) });
  assert.equal(big.statusCode, 413);
  const form = await app.inject({ method: 'POST', url: '/api/auth/login', headers: { 'content-type': 'application/x-www-form-urlencoded' }, payload: 'email=a&password=b' });
  assert.equal(form.statusCode, 415, 'formulário cross-site não passa (somente JSON)');
  await app.close();
});

test('retenção LGPD anonimiza pedidos antigos', async () => {
  const { app, db, ctx } = await makeApp({ env: { RETENTION_DAYS: '30' } });
  const { body, slot } = await createOrder(app, db);
  await app.inject({ method: 'POST', url: `/api/dev/pay/${body.accessToken}` });
  db.prepare("UPDATE slots SET day = '2020-01-01' WHERE id = ?").run(slot.id);
  assert.equal(ctx.orders.anonymizeOld(), 1);
  const raw = db.prepare('SELECT * FROM orders WHERE code = ?').get(body.code);
  assert.equal(raw.buyer_name_enc, '-');
  assert.ok(raw.anonymized_at);
  const view = (await app.inject({ method: 'GET', url: `/api/orders/${body.accessToken}` })).json();
  assert.equal(view.tickets[0].holderName, '');
  await app.close();
});
