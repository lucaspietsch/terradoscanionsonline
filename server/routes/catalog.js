import { attractions } from '../content/attractions.js';
import { PRODUCT_KINDS, partnerProductBody, partnerProductPatch } from '../schemas.js';
import { OrderError } from '../services/orders.js';

const MAX_PRODUCTS_PER_PARTNER = 50;
const COLS = {
  kind: 'kind', name: 'name', description: 'description', priceCents: 'price_cents', priceNote: 'price_note',
  attractionSlug: 'attraction_slug', published: 'published', sortOrder: 'sort_order',
};

const productPublic = (r) => ({
  id: r.id, kind: r.kind, name: r.name, description: r.description, priceCents: r.price_cents, priceNote: r.price_note,
  attractionSlug: r.attraction_slug, partner: r.partner_slug ? { slug: r.partner_slug, name: r.partner_name, category: r.partner_category, whatsapp: r.partner_whatsapp } : undefined,
});
const productAdmin = (r) => ({ ...productPublic(r), published: Boolean(r.published), sortOrder: r.sort_order, partnerId: r.partner_id });

const JOIN = `SELECT p.*, pa.slug AS partner_slug, pa.name AS partner_name, pa.category AS partner_category, pa.whatsapp AS partner_whatsapp
  FROM partner_products p JOIN partners pa ON pa.id = p.partner_id`;

export async function catalogRoutes(api, { db, audit, orders, rl }) {
  // ---------- Público ----------
  // Página de detalhe do atrativo: conteúdo + experiências (Tirolesa, quando for o caso) + produtos de parceiros ligados a ele.
  api.get('/attractions/:slug', async (req) => {
    const a = attractions.find((x) => x.slug === req.params.slug);
    if (!a) throw new OrderError('Atrativo não encontrado.', 'not_found', 404);
    const products = db.prepare(`${JOIN} WHERE p.attraction_slug = ? AND p.published = 1 AND pa.published = 1 ORDER BY p.sort_order, p.name`).all(a.slug).map(productPublic);
    const hosts = db.prepare('SELECT slug, name, category, tagline FROM partners WHERE attraction_slug = ? AND published = 1').all(a.slug);
    const tirolesa = a.slug === 'canion-fortaleza' ? orders.getProduct('tirolesa-mais-alta-das-americas') : null;
    const guides = db.prepare("SELECT slug, name, category, tagline, whatsapp FROM partners WHERE category IN ('guia','agencia') AND published = 1 ORDER BY sort_order, name LIMIT 6").all();
    const others = attractions.filter((x) => x.slug !== a.slug).map(({ slug, name, kind }) => ({ slug, name, kind }));
    return {
      ...a,
      tirolesa: tirolesa ? { slug: tirolesa.slug, name: tirolesa.name, summary: tirolesa.summary, priceCents: tirolesa.price_cents } : null,
      products, hosts, guides, others,
    };
  });

  // Catálogo geral ("página de produtos"): Tirolesa em destaque + tudo que os parceiros publicaram.
  api.get('/catalog', async (req) => {
    const kind = PRODUCT_KINDS.includes(req.query.kind) ? req.query.kind : null;
    const rows = db.prepare(`${JOIN} WHERE p.published = 1 AND pa.published = 1 ${kind ? 'AND p.kind = ?' : ''} ORDER BY pa.featured DESC, pa.sort_order, p.sort_order, p.name`).all(...(kind ? [kind] : []));
    // A Tirolesa é um produto como os outros (vendido aqui mesmo, no atrativo Cânion Fortaleza).
    const t = !kind || kind === 'experiencia' ? orders.getProduct('tirolesa-mais-alta-das-americas') : null;
    const own = t ? [{
      id: `ticket-${t.slug}`, kind: 'experiencia', name: t.name, description: t.summary, priceCents: t.price_cents, priceNote: 'por pessoa',
      attractionSlug: 'canion-fortaleza', href: '/tirolesa', buy: true,
    }] : [];
    return { items: [...own, ...rows.map(productPublic)] };
  });

  // ---------- CRUD (admin e parceiro dono) ----------
  const adminGuard = { preHandler: api.requireRole('admin') };
  const partnerGuard = { preHandler: api.requireRole('partner') };
  const actor = (req) => `user:${req.session.user.id}`;

  function insert(partnerId, b) {
    const n = db.prepare('SELECT COUNT(*) AS n FROM partner_products WHERE partner_id = ?').get(partnerId).n;
    if (n >= MAX_PRODUCTS_PER_PARTNER) throw new OrderError(`Limite de ${MAX_PRODUCTS_PER_PARTNER} produtos por parceiro.`, 'limit', 409);
    const r = db.prepare(
      'INSERT INTO partner_products (partner_id, kind, name, description, price_cents, price_note, attraction_slug, published, sort_order) VALUES (?,?,?,?,?,?,?,?,?)',
    ).run(partnerId, b.kind, b.name, b.description, b.priceCents, b.priceNote, b.attractionSlug, Number(b.published), b.sortOrder);
    return Number(r.lastInsertRowid);
  }
  function update(id, partnerId, body) {
    const keys = Object.keys(body).filter((k) => COLS[k]);
    if (!keys.length) return;
    const vals = keys.map((k) => (typeof body[k] === 'boolean' ? Number(body[k]) : body[k]));
    const r = db.prepare(`UPDATE partner_products SET ${keys.map((k) => `${COLS[k]} = ?`).join(', ')} WHERE id = ? AND partner_id = ?`).run(...vals, id, partnerId);
    if (r.changes !== 1) throw new OrderError('Produto não encontrado.', 'not_found', 404);
  }
  const remove = (id, partnerId) => {
    if (db.prepare('DELETE FROM partner_products WHERE id = ? AND partner_id = ?').run(id, partnerId).changes !== 1) throw new OrderError('Produto não encontrado.', 'not_found', 404);
  };
  const list = (partnerId) => db.prepare(`${JOIN} WHERE p.partner_id = ? ORDER BY p.sort_order, p.name`).all(partnerId).map(productAdmin);
  const idOf = (req) => { const n = Number(req.params.id); if (!Number.isInteger(n)) throw new OrderError('Produto não encontrado.', 'not_found', 404); return n; };

  // Parceiro: só enxerga e altera os PRÓPRIOS produtos (o partner_id vem da sessão, nunca da requisição).
  api.get('/partner/products', partnerGuard, async (req) => list(req.session.user.partnerId));
  api.post('/partner/products', { ...partnerGuard, config: rl(30, '10 minutes') }, async (req, reply) => {
    const id = insert(req.session.user.partnerId, partnerProductBody.parse(req.body));
    audit.write({ actor: actor(req), action: 'product.create', entity: 'partner_product', entityId: id });
    return reply.code(201).send({ id });
  });
  api.patch('/partner/products/:id', partnerGuard, async (req) => {
    update(idOf(req), req.session.user.partnerId, partnerProductPatch.parse(req.body));
    audit.write({ actor: actor(req), action: 'product.update', entity: 'partner_product', entityId: req.params.id });
    return { ok: true };
  });
  api.delete('/partner/products/:id', partnerGuard, async (req) => {
    remove(idOf(req), req.session.user.partnerId);
    audit.write({ actor: actor(req), action: 'product.delete', entity: 'partner_product', entityId: req.params.id });
    return { ok: true };
  });

  // Admin: qualquer parceiro.
  api.get('/admin/partners/:id/products', adminGuard, async (req) => list(Number(req.params.id)));
  api.post('/admin/partners/:id/products', adminGuard, async (req, reply) => {
    const pid = Number(req.params.id);
    if (!db.prepare('SELECT 1 FROM partners WHERE id = ?').get(pid)) throw new OrderError('Parceiro não encontrado.', 'not_found', 404);
    const id = insert(pid, partnerProductBody.parse(req.body));
    audit.write({ actor: actor(req), action: 'product.create', entity: 'partner_product', entityId: id });
    return reply.code(201).send({ id });
  });
  api.patch('/admin/products/:id', adminGuard, async (req) => {
    const id = idOf(req);
    const row = db.prepare('SELECT partner_id FROM partner_products WHERE id = ?').get(id);
    if (!row) throw new OrderError('Produto não encontrado.', 'not_found', 404);
    update(id, row.partner_id, partnerProductPatch.parse(req.body));
    audit.write({ actor: actor(req), action: 'product.update', entity: 'partner_product', entityId: id });
    return { ok: true };
  });
  api.delete('/admin/products/:id', adminGuard, async (req) => {
    const id = idOf(req);
    const row = db.prepare('SELECT partner_id FROM partner_products WHERE id = ?').get(id);
    if (!row) throw new OrderError('Produto não encontrado.', 'not_found', 404);
    remove(id, row.partner_id);
    audit.write({ actor: actor(req), action: 'product.delete', entity: 'partner_product', entityId: id });
    return { ok: true };
  });
}
