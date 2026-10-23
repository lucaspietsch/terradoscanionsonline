import assert from 'node:assert/strict';
import { test } from 'node:test';
import { login, makeApp, makeStaff } from './helpers.js';

// O seed de demonstração traz produtos de exemplo; os testes partem de um catálogo vazio.
const fresh = async () => { const x = await makeApp(); x.db.prepare('DELETE FROM partner_products').run(); return x; };
const product = (over = {}) => ({ kind: 'hospedagem', name: 'Chalé para casal', description: 'Vista para o campo.', priceCents: 45000, priceNote: 'por noite', ...over });
const pid = (db, slug) => db.prepare('SELECT id FROM partners WHERE slug = ?').get(slug).id;

async function partnerSession(app, ctx, db, slug = 'canyons-chalet', email = 'canyons@example.com') {
  const u = await makeStaff(ctx, { role: 'partner', email, partnerId: pid(db, slug) });
  const s = await login(app, u);
  return { headers: { cookie: s.cookie, 'x-csrf-token': s.csrf }, user: u };
}

test('parceiro cria, edita e remove os próprios produtos; o site público só mostra os publicados', async () => {
  const { app, ctx, db } = await fresh();
  const { headers } = await partnerSession(app, ctx, db);
  const c = await app.inject({ method: 'POST', url: '/api/partner/products', headers, payload: product() });
  assert.equal(c.statusCode, 201);
  const hidden = await app.inject({ method: 'POST', url: '/api/partner/products', headers, payload: product({ name: 'Rascunho', published: false, priceCents: null }) });
  const id = c.json().id;

  const pub = (await app.inject({ method: 'GET', url: '/api/partners/canyons-chalet' })).json();
  assert.deepEqual(pub.products.map((p) => p.name), ['Chalé para casal']);
  assert.equal(pub.products[0].priceCents, 45000);
  assert.equal(pub.products[0].priceNote, 'por noite');

  const mine = (await app.inject({ method: 'GET', url: '/api/partner/products', headers })).json();
  assert.equal(mine.length, 2, 'o parceiro vê também os rascunhos');

  assert.equal((await app.inject({ method: 'PATCH', url: `/api/partner/products/${id}`, headers, payload: { priceCents: 50000, published: true } })).statusCode, 200);
  assert.equal((await app.inject({ method: 'GET', url: '/api/partners/canyons-chalet' })).json().products[0].priceCents, 50000);
  assert.equal((await app.inject({ method: 'PATCH', url: `/api/partner/products/${hidden.json().id}`, headers, payload: { published: true } })).statusCode, 200);
  assert.equal((await app.inject({ method: 'DELETE', url: `/api/partner/products/${id}`, headers })).statusCode, 200);
  assert.equal((await app.inject({ method: 'GET', url: '/api/partners/canyons-chalet' })).json().products.length, 1);
  await app.close();
});

test('parceiro NÃO mexe em produto de outro parceiro nem escolhe o partner_id', async () => {
  const { app, ctx, db } = await fresh();
  const a = await partnerSession(app, ctx, db, 'canyons-chalet', 'a@example.com');
  const b = await partnerSession(app, ctx, db, 'campanario-chales', 'b@example.com');
  const id = (await app.inject({ method: 'POST', url: '/api/partner/products', headers: a.headers, payload: product() })).json().id;
  assert.equal((await app.inject({ method: 'PATCH', url: `/api/partner/products/${id}`, headers: b.headers, payload: { name: 'Invadido' } })).statusCode, 404);
  assert.equal((await app.inject({ method: 'DELETE', url: `/api/partner/products/${id}`, headers: b.headers })).statusCode, 404);
  const sneaky = await app.inject({ method: 'POST', url: '/api/partner/products', headers: b.headers, payload: { ...product(), partnerId: pid(db, 'canyons-chalet') } });
  assert.equal(sneaky.statusCode, 400, 'partnerId no corpo é rejeitado (strict)');
  assert.equal(db.prepare('SELECT name FROM partner_products WHERE id = ?').get(id).name, 'Chalé para casal');
  assert.equal((await app.inject({ method: 'GET', url: '/api/partner/products' })).statusCode, 401);
  await app.close();
});

test('validação de produto: tipo, preço negativo, atrativo inexistente, limite por parceiro', async () => {
  const { app, ctx, db } = await fresh();
  const { headers } = await partnerSession(app, ctx, db);
  const post = (p) => app.inject({ method: 'POST', url: '/api/partner/products', headers, payload: p });
  assert.equal((await post(product({ kind: 'drogas' }))).statusCode, 400);
  assert.equal((await post(product({ priceCents: -1 }))).statusCode, 400);
  assert.equal((await post(product({ attractionSlug: 'inexistente' }))).statusCode, 400);
  assert.equal((await post(product({ name: 'x' }))).statusCode, 400);
  assert.equal((await post(product({ attractionSlug: 'aparados-da-serra' }))).statusCode, 201);
  for (let i = 0; i < 49; i++) assert.equal((await post(product({ name: `Item ${i + 10}` }))).statusCode, 201);
  assert.equal((await post(product({ name: 'Um a mais' }))).statusCode, 409);
  await app.close();
});

test('página do atrativo: Cânion Fortaleza traz a Tirolesa como produto; produtos ligados e guias aparecem; Costão tem anfitrião', async () => {
  const { app, ctx, db } = await fresh();
  const { headers } = await partnerSession(app, ctx, db, 'guia-aparados-da-serra', 'guia@example.com');
  await app.inject({ method: 'POST', url: '/api/partner/products', headers, payload: product({ kind: 'passeio', name: 'Trilha guiada no Itaimbezinho', attractionSlug: 'aparados-da-serra', priceNote: 'por pessoa' }) });

  const fort = (await app.inject({ method: 'GET', url: '/api/attractions/canion-fortaleza' })).json();
  assert.equal(fort.tirolesa.slug, 'tirolesa-mais-alta-das-americas', 'a tirolesa é produto do Cânion Fortaleza');
  assert.equal(fort.tirolesa.priceCents, 15000);
  assert.ok(fort.guides.length > 0);
  assert.equal(fort.others.length, 5);
  const serra = (await app.inject({ method: 'GET', url: '/api/attractions/serra-geral' })).json();
  assert.equal(serra.tirolesa, null, 'o parque em si não vende a tirolesa');
  assert.ok(serra.highlights.includes('Cânion Fortaleza'));

  const ap = (await app.inject({ method: 'GET', url: '/api/attractions/aparados-da-serra' })).json();
  assert.equal(ap.tirolesa, null);
  assert.equal(ap.products[0].name, 'Trilha guiada no Itaimbezinho');
  assert.equal(ap.products[0].partner.slug, 'guia-aparados-da-serra');

  const costao = (await app.inject({ method: 'GET', url: '/api/attractions/costao-do-cambara' })).json();
  assert.equal(costao.hosts[0].slug, 'pousada-costao-do-cambara');
  assert.equal((await app.inject({ method: 'GET', url: '/api/attractions/nada' })).statusCode, 404);
  await app.close();
});

test('catálogo geral: Tirolesa como item, filtro por tipo, oculta parceiro despublicado', async () => {
  const { app, ctx, db } = await fresh();
  const a = await partnerSession(app, ctx, db, 'canyons-chalet', 'a@example.com');
  const b = await partnerSession(app, ctx, db, 'duperau-gastro-pub', 'b@example.com');
  await app.inject({ method: 'POST', url: '/api/partner/products', headers: a.headers, payload: product() });
  await app.inject({ method: 'POST', url: '/api/partner/products', headers: b.headers, payload: product({ kind: 'refeicao', name: 'Hambúrguer da casa', priceNote: '' }) });
  const all = (await app.inject({ method: 'GET', url: '/api/catalog' })).json();
  assert.equal(all.featured, undefined, 'não há mais um "destaque" à parte');
  assert.equal(all.items[0].href, '/tirolesa', 'a Tirolesa é o primeiro item do catálogo');
  assert.equal(all.items[0].attractionSlug, 'canion-fortaleza');
  assert.equal(all.items[0].buy, true);
  assert.equal(all.items.length, 3);
  assert.equal((await app.inject({ method: 'GET', url: '/api/catalog?kind=refeicao' })).json().items.length, 1, 'filtro exclui a tirolesa');
  assert.equal((await app.inject({ method: 'GET', url: '/api/catalog?kind=experiencia' })).json().items[0].href, '/tirolesa');
  db.prepare("UPDATE partners SET published = 0 WHERE slug = 'duperau-gastro-pub'").run();
  assert.equal((await app.inject({ method: 'GET', url: '/api/catalog' })).json().items.length, 2);
  await app.close();
});

test('admin gerencia produtos de qualquer parceiro e a ação fica na auditoria', async () => {
  const { app, ctx, db } = await fresh();
  const admin = await makeStaff(ctx);
  const s = await login(app, admin);
  const headers = { cookie: s.cookie, 'x-csrf-token': s.csrf };
  const p = pid(db, 'pousada-olhos-do-campo');
  const c = await app.inject({ method: 'POST', url: `/api/admin/partners/${p}/products`, headers, payload: product({ name: 'Suíte Campo' }) });
  assert.equal(c.statusCode, 201);
  assert.equal((await app.inject({ method: 'GET', url: `/api/admin/partners/${p}/products`, headers })).json().length, 1);
  assert.equal((await app.inject({ method: 'PATCH', url: `/api/admin/products/${c.json().id}`, headers, payload: { published: false } })).statusCode, 200);
  assert.equal((await app.inject({ method: 'GET', url: '/api/partners/pousada-olhos-do-campo' })).json().products.length, 0);
  assert.equal((await app.inject({ method: 'DELETE', url: `/api/admin/products/${c.json().id}`, headers })).statusCode, 200);
  assert.ok(db.prepare("SELECT 1 FROM audit_log WHERE action = 'product.delete'").get());
  assert.equal((await app.inject({ method: 'POST', url: '/api/admin/partners/9999/products', headers, payload: product() })).statusCode, 404);
  await app.close();
});

test('/api/site informa se a foto de fundo existe (sem erro 404 no navegador)', async () => {
  const { app } = await makeApp();
  const r = await app.inject({ method: 'GET', url: '/api/site' });
  assert.equal(r.statusCode, 200);
  assert.equal(typeof r.json().heroPhoto, 'boolean');
  await app.close();
});
