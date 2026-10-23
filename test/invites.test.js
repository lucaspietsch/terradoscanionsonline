import assert from 'node:assert/strict';
import { test } from 'node:test';
import { login, makeApp, makeStaff } from './helpers.js';

const STRONG = 'Parceiro-Forte-2026!';
const pid = (db, slug) => db.prepare('SELECT id FROM partners WHERE slug = ?').get(slug).id;
const tokenOf = (url) => url.split('/convite/')[1];

async function admin(app, ctx) {
  const u = await makeStaff(ctx);
  const s = await login(app, u);
  return { headers: { cookie: s.cookie, 'x-csrf-token': s.csrf } };
}
async function invite(app, headers, partnerId, over = {}) {
  const r = await app.inject({ method: 'POST', url: `/api/admin/partners/${partnerId}/invite`, headers, payload: { email: 'dono@canyons.example', name: 'Ana Souza', ...over } });
  return { r, body: r.json() };
}
const partnerLogin = (app, email, password) => app.inject({ method: 'POST', url: '/api/auth/login', payload: { email, password } });

test('admin gera convite; parceiro cria a própria senha e entra só na própria vitrine', async () => {
  const { app, ctx, db } = await makeApp();
  const { headers } = await admin(app, ctx);
  const p = pid(db, 'canyons-chalet');
  const { r, body } = await invite(app, headers, p);
  assert.equal(r.statusCode, 200);
  assert.equal(body.purpose, 'invite');
  assert.match(body.url, /\/convite\/[A-Za-z0-9_-]{40,}$/);
  assert.match(body.message, /Canyons Chalet/);
  // o token NÃO fica no banco em claro
  assert.ok(!JSON.stringify(db.prepare('SELECT * FROM invites').all()).includes(tokenOf(body.url)));

  const info = await app.inject({ method: 'GET', url: `/api/invites/${tokenOf(body.url)}` });
  assert.equal(info.statusCode, 200);
  assert.deepEqual(info.json(), { partnerName: 'Canyons Chalet', email: 'dono@canyons.example', name: 'Ana Souza', purpose: 'invite' });

  const weak = await app.inject({ method: 'POST', url: '/api/invites/accept', payload: { token: tokenOf(body.url), password: 'curta' } });
  assert.equal(weak.statusCode, 400);
  const ok = await app.inject({ method: 'POST', url: '/api/invites/accept', payload: { token: tokenOf(body.url), password: STRONG } });
  assert.equal(ok.statusCode, 200);

  const lg = await partnerLogin(app, 'dono@canyons.example', STRONG);
  assert.equal(lg.statusCode, 200);
  assert.equal(lg.json().user.role, 'partner');
  assert.equal(lg.json().user.partnerId, p);
  const c = lg.cookies[0];
  const me = await app.inject({ method: 'GET', url: '/api/partner/me', headers: { cookie: `${c.name}=${c.value}` } });
  assert.equal(me.json().partner.slug, 'canyons-chalet');
  assert.equal((await app.inject({ method: 'GET', url: '/api/admin/stats', headers: { cookie: `${c.name}=${c.value}` } })).statusCode, 403);
  await app.close();
});

test('convite é de uso único, expira e token errado é recusado', async () => {
  const { app, ctx, db } = await makeApp();
  const { headers } = await admin(app, ctx);
  const { body } = await invite(app, headers, pid(db, 'canyons-chalet'));
  const t = tokenOf(body.url);
  const accept = (token, password = STRONG) => app.inject({ method: 'POST', url: '/api/invites/accept', payload: { token, password } });
  assert.equal((await accept('x'.repeat(43))).statusCode, 410);
  assert.equal((await accept(t)).statusCode, 200);
  assert.equal((await accept(t, 'Outra-Senha-Forte-9!')).statusCode, 410, 'segundo uso recusado');
  assert.equal((await app.inject({ method: 'GET', url: `/api/invites/${t}` })).statusCode, 410);

  const { body: b2 } = await invite(app, headers, pid(db, 'campanario-chales'), { email: 'outro@x.example' });
  db.prepare("UPDATE invites SET expires_at = '2000-01-01T00:00:00.000Z'").run();
  assert.equal((await accept(tokenOf(b2.url))).statusCode, 410, 'expirado');
  await app.close();
});

test('novo convite invalida o anterior; e-mail de outro usuário é recusado; só admin convida', async () => {
  const { app, ctx, db } = await makeApp();
  const { headers } = await admin(app, ctx);
  const p = pid(db, 'canyons-chalet');
  const a = (await invite(app, headers, p)).body;
  const b = (await invite(app, headers, p)).body;
  assert.equal((await app.inject({ method: 'GET', url: `/api/invites/${tokenOf(a.url)}` })).statusCode, 410);
  assert.equal((await app.inject({ method: 'GET', url: `/api/invites/${tokenOf(b.url)}` })).statusCode, 200);

  const dup = await invite(app, headers, pid(db, 'campanario-chales'), { email: 'admin@example.com' });
  assert.equal(dup.r.statusCode, 409, 'e-mail do admin não pode virar parceiro');
  assert.equal((await invite(app, headers, 99999)).r.statusCode, 404);
  assert.equal((await app.inject({ method: 'POST', url: `/api/admin/partners/${p}/invite`, payload: { email: 'a@b.co', name: 'Zé Silva' } })).statusCode, 401);

  const partnerUser = await makeStaff(ctx, { role: 'partner', email: 'p@x.example', partnerId: p });
  const s = await login(app, partnerUser);
  const asPartner = await app.inject({ method: 'POST', url: `/api/admin/partners/${p}/invite`, headers: { cookie: s.cookie, 'x-csrf-token': s.csrf }, payload: { email: 'a@b.co', name: 'Zé Silva' } });
  assert.equal(asPartner.statusCode, 403, 'parceiro não gera convites');
  await app.close();
});

test('convite para e-mail já cadastrado do mesmo parceiro vira REDEFINIÇÃO e destrava a conta', async () => {
  const { app, ctx, db } = await makeApp();
  const { headers } = await admin(app, ctx);
  const p = pid(db, 'canyons-chalet');
  const first = (await invite(app, headers, p)).body;
  await app.inject({ method: 'POST', url: '/api/invites/accept', payload: { token: tokenOf(first.url), password: STRONG } });
  for (let i = 0; i < 5; i++) await partnerLogin(app, 'dono@canyons.example', `errada-${i}-Zz!!`);
  assert.equal((await partnerLogin(app, 'dono@canyons.example', STRONG)).statusCode, 429, 'conta bloqueada');

  const reset = (await invite(app, headers, p)).body;
  assert.equal(reset.purpose, 'reset');
  const NEW = 'Nova-Senha-Forte-77!';
  assert.equal((await app.inject({ method: 'POST', url: '/api/invites/accept', payload: { token: tokenOf(reset.url), password: NEW } })).statusCode, 200);
  assert.equal((await partnerLogin(app, 'dono@canyons.example', STRONG)).statusCode, 401, 'senha antiga não vale mais');
  assert.equal((await partnerLogin(app, 'dono@canyons.example', NEW)).statusCode, 200, 'desbloqueada com a nova senha');
  assert.equal(db.prepare("SELECT COUNT(*) n FROM users WHERE email = 'dono@canyons.example'").get().n, 1);
  assert.ok(db.prepare("SELECT 1 FROM audit_log WHERE action = 'invite.reset_accepted'").get());
  await app.close();
});

test('"esqueci minha senha": resposta idêntica para e-mail existente e inexistente', async () => {
  const { app, ctx, db } = await makeApp();
  await makeStaff(ctx, { role: 'partner', email: 'p@x.example', partnerId: pid(db, 'canyons-chalet') });
  const a = await app.inject({ method: 'POST', url: '/api/auth/forgot', payload: { email: 'p@x.example' } });
  const b = await app.inject({ method: 'POST', url: '/api/auth/forgot', payload: { email: 'ninguem@x.example' } });
  assert.equal(a.statusCode, 202);
  assert.deepEqual(a.json(), b.json());
  assert.equal(db.prepare('SELECT COUNT(*) n FROM invites').get().n, 0, 'sem SMTP nada é gerado nem vazado');
  await app.close();
});

test('trocar a própria senha: exige a atual, aplica a política e encerra as outras sessões', async () => {
  const { app, ctx, db } = await makeApp();
  await ctx.auth.createUser({ email: 'p@x.example', name: 'Parceiro', role: 'partner', partnerId: pid(db, 'canyons-chalet'), password: STRONG });
  const sess = async () => { const r = await partnerLogin(app, 'p@x.example', STRONG); const c = r.cookies[0]; return { cookie: `${c.name}=${c.value}`, csrf: r.json().csrf }; };
  const s1 = await sess();
  const s2 = await sess();
  const post = (payload, s = s1) => app.inject({ method: 'POST', url: '/api/auth/change-password', headers: { cookie: s.cookie, 'x-csrf-token': s.csrf }, payload });
  assert.equal((await post({ current: 'errada', next: 'Nova-Senha-Forte-77!' })).statusCode, 400);
  assert.equal((await post({ current: STRONG, next: 'fraca' })).statusCode, 400);
  assert.equal((await post({ current: STRONG, next: STRONG })).statusCode, 400);
  assert.equal((await app.inject({ method: 'POST', url: '/api/auth/change-password', payload: { current: STRONG, next: 'Nova-Senha-Forte-77!' } })).statusCode, 401);
  assert.equal((await post({ current: STRONG, next: 'Nova-Senha-Forte-77!' })).statusCode, 200);

  assert.equal((await app.inject({ method: 'GET', url: '/api/partner/me', headers: { cookie: s1.cookie } })).statusCode, 200, 'sessão atual continua');
  assert.equal((await app.inject({ method: 'GET', url: '/api/partner/me', headers: { cookie: s2.cookie } })).statusCode, 401, 'outra sessão foi encerrada');
  assert.equal((await partnerLogin(app, 'p@x.example', STRONG)).statusCode, 401);
  assert.equal((await partnerLogin(app, 'p@x.example', 'Nova-Senha-Forte-77!')).statusCode, 200);
  await app.close();
});

test('lista de parceiros do admin mostra a situação do acesso e produtos publicados', async () => {
  const { app, ctx, db } = await makeApp();
  const { headers } = await admin(app, ctx);
  const p = pid(db, 'campanario-chales');
  let row = (await app.inject({ method: 'GET', url: '/api/admin/partners', headers })).json().find((x) => x.id === p);
  assert.equal(row.access_users, 0);
  assert.equal(row.pending_invite_until, null);
  await invite(app, headers, p, { email: 'camp@x.example' });
  row = (await app.inject({ method: 'GET', url: '/api/admin/partners', headers })).json().find((x) => x.id === p);
  assert.ok(row.pending_invite_until);
  await app.close();
});
