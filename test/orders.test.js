import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHmac } from 'node:crypto';
import { createMercadoPagoProvider } from '../server/services/payments/mercadopago.js';
import { createMockProvider } from '../server/services/payments/mock.js';
import { localToday } from '../server/lib/time.js';
import { createOrder, login, makeApp, makeStaff, orderPayload, participant, slotFor } from './helpers.js';

async function pay(app, body) {
  const r = await app.inject({ method: 'POST', url: `/api/dev/pay/${body.accessToken}` });
  assert.equal(r.statusCode, 200);
  return (await app.inject({ method: 'GET', url: `/api/orders/${body.accessToken}` })).json();
}

test('fluxo completo: pedido → pagamento → ingressos com QR → check-in único', async () => {
  const { app, db, ctx } = await makeApp();
  const { res, body, slot } = await createOrder(app, db, { qty: 2 });
  assert.equal(res.statusCode, 201);
  assert.equal(body.status, 'pending');
  assert.equal(body.totalCents, 30000);
  assert.ok(body.pixCopyPaste);
  assert.ok(body.tickets.every((t) => t.qr === null), 'sem QR antes de pagar');
  assert.equal(db.prepare('SELECT reserved FROM slots WHERE id = ?').get(slot.id).reserved, 2);

  const paid = await pay(app, body);
  assert.equal(paid.status, 'paid');
  assert.equal(paid.tickets.length, 2);
  assert.match(paid.tickets[0].qr, /^TDC1\.[0-9A-Z]{10}\.[A-Z2-7]{13}$/);

  const svg = await app.inject({ method: 'GET', url: `/api/orders/${body.accessToken}/tickets/${paid.tickets[0].code}/qr.svg` });
  assert.equal(svg.statusCode, 200);
  assert.match(svg.headers['content-type'], /svg/);

  // Check-in: só equipe autenticada; ingresso de outro dia é barrado.
  const staff = await makeStaff(ctx, { role: 'checkin', email: 'porta@example.com' });
  const { cookie, csrf } = await login(app, staff);
  const headers = { cookie, 'x-csrf-token': csrf };
  const wrong = await app.inject({ method: 'POST', url: '/api/checkin', headers, payload: { code: paid.tickets[0].qr } });
  assert.equal(wrong.json().result, 'wrong_day');
  db.prepare('UPDATE slots SET day = ? WHERE id = ?').run(localToday(), slot.id);
  const ok = await app.inject({ method: 'POST', url: '/api/checkin', headers, payload: { code: paid.tickets[0].qr } });
  assert.equal(ok.json().result, 'ok');
  assert.equal(ok.json().holderName, 'Participante Número 1');
  const again = await app.inject({ method: 'POST', url: '/api/checkin', headers, payload: { code: paid.tickets[0].code } });
  assert.equal(again.json().result, 'already_used');
  const forged = await app.inject({ method: 'POST', url: '/api/checkin', headers, payload: { code: `TDC1.${paid.tickets[1].code}.AAAAAAAAAAAAA` } });
  assert.equal(forged.json().result, 'invalid_signature');
  const unknown = await app.inject({ method: 'POST', url: '/api/checkin', headers, payload: { code: 'ZZZZZZZZZZ' } });
  assert.equal(unknown.json().result, 'not_found');
  await app.close();
});

test('check-in exige autenticação e CSRF; "force" é só do admin', async () => {
  const { app, db, ctx } = await makeApp();
  const { body } = await createOrder(app, db);
  const paid = await pay(app, body);
  const anon = await app.inject({ method: 'POST', url: '/api/checkin', payload: { code: paid.tickets[0].code } });
  assert.equal(anon.statusCode, 401);

  const staff = await makeStaff(ctx, { role: 'checkin', email: 'porta@example.com' });
  const { cookie, csrf } = await login(app, staff);
  const noCsrf = await app.inject({ method: 'POST', url: '/api/checkin', headers: { cookie }, payload: { code: paid.tickets[0].code } });
  assert.equal(noCsrf.statusCode, 403);
  const badOrigin = await app.inject({ method: 'POST', url: '/api/checkin', headers: { cookie, 'x-csrf-token': csrf, origin: 'https://evil.example' }, payload: { code: paid.tickets[0].code } });
  assert.equal(badOrigin.statusCode, 403);
  const forced = await app.inject({ method: 'POST', url: '/api/checkin', headers: { cookie, 'x-csrf-token': csrf }, payload: { code: paid.tickets[0].code, force: true } });
  assert.equal(forced.json().result, 'wrong_day', 'checkin não pode forçar');
  await app.close();
});

test('nunca vende além da capacidade e libera vagas ao expirar', async () => {
  const { app, db, ctx } = await makeApp();
  const slot = slotFor(db);
  db.prepare('UPDATE slots SET capacity = 3, reserved = 0 WHERE id = ?').run(slot.id);
  const a = await createOrder(app, db, { qty: 2, _slot: slot });
  assert.equal(a.res.statusCode, 201);
  const b = await createOrder(app, db, { qty: 2, _slot: slot });
  assert.equal(b.res.statusCode, 409);
  assert.equal(b.body.error, 'sold_out');
  assert.equal(db.prepare('SELECT reserved FROM slots WHERE id = ?').get(slot.id).reserved, 2);

  db.prepare("UPDATE orders SET expires_at = '2000-01-01T00:00:00.000Z' WHERE code = ?").run(a.body.code);
  assert.equal(ctx.orders.expirePending(), 1);
  assert.equal(db.prepare('SELECT reserved FROM slots WHERE id = ?').get(slot.id).reserved, 0);
  const c = await createOrder(app, db, { qty: 3, _slot: slot });
  assert.equal(c.res.statusCode, 201);
  await app.close();
});

test('pagamento tardio re-reserva a vaga; sem vaga, estorna', async () => {
  const mock = createMockProvider();
  const { app, db, ctx } = await makeApp({ payments: mock });
  const slot = slotFor(db);
  db.prepare('UPDATE slots SET capacity = 1, reserved = 0 WHERE id = ?').run(slot.id);
  const a = await createOrder(app, db, { qty: 1, _slot: slot });
  db.prepare("UPDATE orders SET expires_at = '2000-01-01T00:00:00.000Z' WHERE code = ?").run(a.body.code);
  ctx.orders.expirePending();
  const ref = db.prepare('SELECT payment_ref FROM orders WHERE code = ?').get(a.body.code).payment_ref;
  mock._approve(ref);
  await app.inject({ method: 'GET', url: `/api/orders/${a.body.accessToken}` });
  assert.equal(db.prepare('SELECT status FROM orders WHERE code = ?').get(a.body.code).status, 'paid');
  assert.equal(db.prepare('SELECT reserved FROM slots WHERE id = ?').get(slot.id).reserved, 1);

  // segundo caso: expirado, vaga ocupada por outro → estorno
  db.prepare('UPDATE slots SET capacity = 1, reserved = 0 WHERE id = ?').run(slotFor(db, { min: 1 }).id);
  const s2 = slotFor(db, { min: 1 });
  const b = await createOrder(app, db, { qty: 1, _slot: s2 });
  db.prepare("UPDATE orders SET expires_at = '2000-01-01T00:00:00.000Z' WHERE code = ?").run(b.body.code);
  ctx.orders.expirePending();
  const c = await createOrder(app, db, { qty: 1, _slot: s2 });
  assert.equal(c.res.statusCode, 201);
  const refB = db.prepare('SELECT payment_ref FROM orders WHERE code = ?').get(b.body.code).payment_ref;
  mock._approve(refB);
  await app.inject({ method: 'GET', url: `/api/orders/${b.body.accessToken}` });
  assert.equal(db.prepare('SELECT status FROM orders WHERE code = ?').get(b.body.code).status, 'expired');
  assert.equal((await mock.fetchPayment(refB)).status, 'refunded');
  await app.close();
});

test('valor pago diferente do pedido NÃO confirma', async () => {
  const mock = createMockProvider();
  const { app, db } = await makeApp({ payments: mock });
  const { body } = await createOrder(app, db);
  const ref = db.prepare('SELECT payment_ref FROM orders WHERE code = ?').get(body.code).payment_ref;
  (await mock.fetchPayment(ref)).amountCents = 1;
  mock._approve(ref);
  const v = (await app.inject({ method: 'GET', url: `/api/orders/${body.accessToken}` })).json();
  assert.equal(v.status, 'pending');
  assert.ok(db.prepare("SELECT 1 FROM audit_log WHERE action = 'payment.amount_mismatch'").get());
  await app.close();
});

test('validações: peso, menor sem adulto, consentimento e e-mail', async () => {
  const { app, db } = await makeApp();
  const slot = slotFor(db);
  const post = (payload) => app.inject({ method: 'POST', url: '/api/orders', payload });
  const heavy = await post(orderPayload(slot.id, { participants: [participant({ weightKg: 130 })] }));
  assert.equal(heavy.json().error, 'weight_out_of_range');
  const light = await post(orderPayload(slot.id, { participants: [participant({ weightKg: 30 })] }));
  assert.equal(light.json().error, 'weight_out_of_range');
  const minor = await post(orderPayload(slot.id, { participants: [participant({ birthDate: '2015-01-01' })] }));
  assert.equal(minor.json().error, 'minor_needs_adult');
  const withAdult = await post(orderPayload(slot.id, { qty: 2, participants: [participant({ birthDate: '2015-01-01' }), participant()] }));
  assert.equal(withAdult.statusCode, 201);
  const noConsent = await post({ ...orderPayload(slot.id), acceptedWaiver: false });
  assert.equal(noConsent.statusCode, 400);
  const badMail = await post({ ...orderPayload(slot.id), buyer: { name: 'João Pereira', email: 'x', phone: '54999887766' } });
  assert.equal(badMail.statusCode, 400);
  const extra = await post({ ...orderPayload(slot.id), isAdmin: true });
  assert.equal(extra.statusCode, 400, 'campos extras rejeitados (strict)');
  assert.equal(db.prepare('SELECT reserved FROM slots WHERE id = ?').get(slot.id).reserved, 2, 'falhas não vazam reserva');
  await app.close();
});

test('idempotência: repetir a requisição devolve o mesmo pedido', async () => {
  const { app, db } = await makeApp();
  const slot = slotFor(db);
  const headers = { 'idempotency-key': 'abcdefghijklmnop1234' };
  const a = await app.inject({ method: 'POST', url: '/api/orders', headers, payload: orderPayload(slot.id) });
  const b = await app.inject({ method: 'POST', url: '/api/orders', headers, payload: orderPayload(slot.id) });
  assert.equal(a.json().code, b.json().code);
  assert.equal(db.prepare('SELECT reserved FROM slots WHERE id = ?').get(slot.id).reserved, 1);
  await app.close();
});

test('descontos: grupo automático, cupom, placa QR e contagem de scans', async () => {
  const { app, db } = await makeApp();
  const slot = slotFor(db, { qty: 4 });
  const quote = (payload) => app.inject({ method: 'POST', url: '/api/products/tirolesa-mais-alta-das-americas/quote', payload }).then((r) => r.json());
  assert.equal((await quote({ qty: 1 })).totalCents, 15000);
  const g = await quote({ qty: 4 });
  assert.equal(g.totalCents, 54000);
  assert.equal(g.discountLabel, 'Desconto de grupo (4+ ingressos)');
  assert.equal((await quote({ qty: 1, coupon: 'placa10' })).totalCents, 13500);
  assert.equal((await app.inject({ method: 'POST', url: '/api/products/tirolesa-mais-alta-das-americas/quote', payload: { qty: 1, coupon: 'NAOEXISTE' } })).statusCode, 400);

  const redirect = await app.inject({ method: 'GET', url: '/q/praca-01' });
  assert.equal(redirect.statusCode, 302);
  assert.equal(redirect.headers.location, '/tirolesa?q=praca-01');
  assert.equal(db.prepare("SELECT scans FROM qr_codes WHERE code = 'praca-01'").get().scans, 1);
  assert.equal((await app.inject({ method: 'GET', url: '/q/inexistente' })).headers.location, '/');

  assert.equal((await quote({ qty: 1, qr: 'praca-01' })).totalCents, 13500, 'placa aplica o cupom automaticamente');
  const { body } = await createOrder(app, db, { qty: 1, qr: 'praca-01', _slot: slot });
  assert.equal(body.totalCents, 13500);
  assert.equal(db.prepare("SELECT used_count FROM coupons WHERE code = 'PLACA10'").get().used_count, 1);
  assert.equal(db.prepare('SELECT qr_id FROM orders WHERE code = ?').get(body.code).qr_id, 1);
  await app.close();
});

test('pedido 100% desconto é confirmado sem cobrança', async () => {
  const { app, db } = await makeApp();
  db.prepare("INSERT INTO coupons (code, kind, value) VALUES ('CORTESIA', 'percent', 100)").run();
  const { body } = await createOrder(app, db, { coupon: 'CORTESIA' });
  assert.equal(body.status, 'paid');
  assert.equal(body.totalCents, 0);
  await app.close();
});

test('dados pessoais ficam cifrados no banco e o link do pedido é infalsificável', async () => {
  const { app, db } = await makeApp();
  const { body } = await createOrder(app, db);
  const dump = JSON.stringify(db.prepare('SELECT * FROM orders').all()) + JSON.stringify(db.prepare('SELECT * FROM tickets').all());
  for (const secret of ['João Pereira', 'joao@example.com', '99988', 'Participante Número', '1990-05-10']) {
    assert.ok(!dump.includes(secret), `${secret} não pode aparecer em claro`);
  }
  const forged = body.accessToken.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A'));
  assert.equal((await app.inject({ method: 'GET', url: `/api/orders/${forged}` })).statusCode, 404);
  assert.equal((await app.inject({ method: 'GET', url: `/api/orders/${body.code}` })).statusCode, 404, 'código curto sozinho não dá acesso');
  await app.close();
});

test('cancelamento com estorno libera vagas e bloqueia ingressos', async () => {
  const mock = createMockProvider();
  const { app, db, ctx } = await makeApp({ payments: mock });
  const { body, slot } = await createOrder(app, db, { qty: 2 });
  const ref = db.prepare('SELECT payment_ref FROM orders WHERE code = ?').get(body.code).payment_ref;
  mock._approve(ref);
  await app.inject({ method: 'GET', url: `/api/orders/${body.accessToken}` });
  const admin = await makeStaff(ctx);
  const { cookie, csrf } = await login(app, admin);
  const r = await app.inject({ method: 'POST', url: `/api/admin/orders/${body.code}/cancel`, headers: { cookie, 'x-csrf-token': csrf } });
  assert.equal(r.statusCode, 200);
  assert.equal(db.prepare('SELECT status FROM orders WHERE code = ?').get(body.code).status, 'refunded');
  assert.equal(db.prepare('SELECT reserved FROM slots WHERE id = ?').get(slot.id).reserved, 0);
  assert.equal((await mock.fetchPayment(ref)).status, 'refunded');
  assert.equal(db.prepare("SELECT COUNT(*) n FROM tickets WHERE status = 'cancelled'").get().n, 2);
  await app.close();
});

test('webhook Mercado Pago: assinatura, anti-replay, idempotência e confirmação via API', async () => {
  const secret = 'whsec_test';
  const calls = [];
  let paymentState = { id: 777, status: 'approved', transaction_amount: 150, external_reference: null };
  const fetchImpl = async (url, opts) => {
    calls.push(url);
    if (url.endsWith('/v1/payments') && opts.method === 'POST') {
      return { ok: true, json: async () => ({ id: 777, point_of_interaction: { transaction_data: { qr_code: 'PIXCODE' } } }) };
    }
    return { ok: true, json: async () => paymentState };
  };
  const provider = createMercadoPagoProvider({ accessToken: 'TEST-token', webhookSecret: secret, baseUrl: 'http://localhost:3000' }, { fetchImpl });
  const { app, db } = await makeApp({ payments: provider });
  const { body } = await createOrder(app, db);
  assert.equal(body.pixCopyPaste, 'PIXCODE');
  paymentState.external_reference = body.code;

  const sign = (id, ts = String(Date.now()), reqId = 'req-1') => ({
    'x-request-id': reqId,
    'x-signature': `ts=${ts},v1=${createHmac('sha256', secret).update(`id:${id};request-id:${reqId};ts:${ts};`).digest('hex')}`,
  });
  const hit = (headers, id = '777') => app.inject({ method: 'POST', url: `/api/webhooks/mercadopago?data.id=${id}`, headers, payload: {} });

  assert.equal((await hit({ 'x-request-id': 'r', 'x-signature': 'ts=1,v1=00' })).statusCode, 401);
  assert.equal((await hit(sign('777', String(Date.now() - 3600_000)))).statusCode, 401, 'replay antigo');
  assert.equal(db.prepare('SELECT status FROM orders WHERE code = ?').get(body.code).status, 'pending');
  assert.equal((await hit(sign('777'))).statusCode, 200);
  assert.equal(db.prepare('SELECT status FROM orders WHERE code = ?').get(body.code).status, 'paid');
  assert.equal((await hit(sign('777'))).statusCode, 200, 'duplicado é aceito sem reprocessar');
  assert.equal(db.prepare('SELECT COUNT(*) n FROM webhook_events').get().n, 1);
  void calls;
  await app.close();
});
