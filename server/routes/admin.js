import QRCode from 'qrcode';
import { blindIndex, normalizeCode } from '../lib/crypto.js';
import { isValidDay, localToday } from '../lib/time.js';
import { OrderError } from '../services/orders.js';
import {
  couponBody, couponPatch, orderListQuery, partnerBody, partnerPatch, productPatch, qrBody, qrPatch,
  ruleBody, slotPatch, slotsBulkBody, userBody,
} from '../schemas.js';
import { AuthError } from '../auth.js';

const PRODUCT_SLUG = 'tirolesa-mais-alta-das-americas';

// UPDATE dinâmico seguro: só colunas da lista branca, sempre com parâmetros.
function updateRow(db, table, id, body, map) {
  const keys = Object.keys(body).filter((k) => map[k] !== undefined);
  if (!keys.length) return;
  const vals = keys.map((k) => (typeof body[k] === 'boolean' ? Number(body[k]) : body[k]));
  db.prepare(`UPDATE ${table} SET ${keys.map((k) => `${map[k]} = ?`).join(', ')} WHERE id = ?`).run(...vals, id);
}

const mask = (email) => email.replace(/^(.).*(@.*)$/, '$1•••$2');

export async function adminRoutes(api, { db, config, pii, audit, auth, orders, rl }) {
  const guard = { preHandler: api.requireRole('admin') };
  const actor = (req) => `user:${req.session.user.id}`;
  const log = (req, action, entity, entityId, meta) => audit.write({ actor: actor(req), action, entity, entityId, meta });
  const conflict = (e) => {
    if (e.code?.startsWith('SQLITE_CONSTRAINT')) throw new OrderError('Registro duplicado ou inválido.', 'conflict', 409);
    throw e;
  };

  // ---------- Painel ----------
  api.get('/admin/stats', guard, async () => {
    const today = localToday();
    const paid = "o.status = 'paid'";
    const sum = (where, ...args) => db.prepare(`SELECT COUNT(*) AS orders, COALESCE(SUM(o.qty),0) AS tickets, COALESCE(SUM(o.total_cents),0) AS revenue FROM orders o WHERE ${paid} AND ${where}`).get(...args);
    const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
    return {
      today: sum("date(o.paid_at, '-3 hours') = ?", today),
      last30: sum('o.paid_at >= ?', since30),
      total: sum('1=1'),
      pending: db.prepare("SELECT COUNT(*) AS n FROM orders WHERE status = 'pending'").get().n,
      byQr: db.prepare(
        `SELECT q.code, q.label, q.location, q.scans,
           (SELECT COUNT(*) FROM orders o WHERE o.qr_id = q.id AND o.status = 'paid') AS orders,
           (SELECT COALESCE(SUM(o.total_cents),0) FROM orders o WHERE o.qr_id = q.id AND o.status = 'paid') AS revenue
         FROM qr_codes q ORDER BY q.scans DESC`).all(),
      byPartner: db.prepare(
        `SELECT p.name, COUNT(o.id) AS orders, COALESCE(SUM(o.qty),0) AS tickets, COALESCE(SUM(o.total_cents),0) AS revenue
         FROM partners p JOIN orders o ON o.partner_id = p.id AND o.status = 'paid' GROUP BY p.id ORDER BY revenue DESC`).all(),
      upcoming: db.prepare(
        `SELECT day, SUM(capacity) AS capacity, SUM(reserved) AS reserved FROM slots
         WHERE day >= ? AND day <= date(?, '+7 days') AND status = 'open' GROUP BY day ORDER BY day`).all(today, today),
      revenueByDay: db.prepare(
        `SELECT date(o.paid_at, '-3 hours') AS day, SUM(o.total_cents) AS revenue, SUM(o.qty) AS tickets FROM orders o
         WHERE ${paid} AND o.paid_at >= ? GROUP BY day ORDER BY day`).all(since30),
    };
  });

  // ---------- Pedidos ----------
  api.get('/admin/orders', guard, async (req) => {
    const q = orderListQuery.parse(req.query);
    const where = [];
    const args = [];
    if (q.status) { where.push('o.status = ?'); args.push(q.status); }
    if (q.day) { where.push('s.day = ?'); args.push(q.day); }
    if (q.q) {
      if (q.q.includes('@')) { where.push('o.buyer_email_idx = ?'); args.push(blindIndex(config.keys.blind, q.q)); }
      else { where.push('o.code = ?'); args.push(normalizeCode(q.q)); }
    }
    const rows = db.prepare(
      `SELECT o.*, s.day, s.time FROM orders o JOIN slots s ON s.id = o.slot_id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY o.id DESC LIMIT ?`,
    ).all(...args, q.limit);
    return rows.map((o) => ({
      code: o.code, status: o.status, day: o.day, time: o.time, qty: o.qty, totalCents: o.total_cents,
      discountLabel: o.discount_label, createdAt: o.created_at, paidAt: o.paid_at,
      buyer: o.anonymized_at ? '(anonimizado)' : pii.dec('orders.buyer_name', o.code, o.buyer_name_enc),
      email: o.anonymized_at ? '' : mask(pii.dec('orders.buyer_email', o.code, o.buyer_email_enc)),
    }));
  });

  api.get('/admin/orders/:code', guard, async (req) => {
    const o = db.prepare('SELECT * FROM orders WHERE code = ?').get(normalizeCode(req.params.code));
    if (!o) throw new OrderError('Pedido não encontrado.', 'not_found', 404);
    log(req, 'pii.view', 'order', o.code); // acesso a dados pessoais fica registrado
    const v = orders.view(o);
    return {
      ...v,
      buyer: {
        name: pii.dec('orders.buyer_name', o.code, o.buyer_name_enc),
        email: pii.dec('orders.buyer_email', o.code, o.buyer_email_enc),
        phone: pii.dec('orders.buyer_phone', o.code, o.buyer_phone_enc),
      },
      paymentRef: o.payment_ref, paidAt: o.paid_at, consentAt: o.consent_at, waiverVersion: o.waiver_version,
      tickets: db.prepare('SELECT * FROM tickets WHERE order_id = ? ORDER BY id').all(o.id).map((t) => ({
        code: t.code, holderName: pii.dec('tickets.holder_name', t.code, t.holder_name_enc), weightKg: t.weight_kg,
        isMinor: Boolean(t.is_minor), status: t.status, usedAt: t.used_at,
      })),
    };
  });

  api.post('/admin/orders/:code/cancel', { ...guard, config: rl(30, '1 minute') }, async (req) => {
    const o = db.prepare('SELECT * FROM orders WHERE code = ?').get(normalizeCode(req.params.code));
    if (!o) throw new OrderError('Pedido não encontrado.', 'not_found', 404);
    await orders.cancelAndRefund(o, { actor: actor(req) });
    return { ok: true };
  });

  api.post('/admin/orders/:code/resend', guard, async (req) => {
    const o = db.prepare("SELECT * FROM orders WHERE code = ? AND status = 'paid'").get(normalizeCode(req.params.code));
    if (!o) throw new OrderError('Pedido pago não encontrado.', 'not_found', 404);
    const sent = await orders.notifyPaid(o.id).then(() => true).catch(() => false);
    return { ok: sent };
  });

  // ---------- Produto ----------
  api.get('/admin/product', guard, async () => {
    const p = db.prepare('SELECT * FROM products WHERE slug = ?').get(PRODUCT_SLUG);
    return p && {
      slug: p.slug, name: p.name, summary: p.summary, priceCents: p.price_cents, minWeightKg: p.min_weight_kg,
      maxWeightKg: p.max_weight_kg, minAge: p.min_age, active: Boolean(p.active), waiverVersion: p.waiver_version,
    };
  });
  api.patch('/admin/product', guard, async (req) => {
    const b = productPatch.parse(req.body);
    updateRow(db, 'products', db.prepare('SELECT id FROM products WHERE slug = ?').get(PRODUCT_SLUG).id, b, {
      name: 'name', summary: 'summary', priceCents: 'price_cents', minWeightKg: 'min_weight_kg',
      maxWeightKg: 'max_weight_kg', minAge: 'min_age', active: 'active',
    });
    log(req, 'product.update', 'product', PRODUCT_SLUG, b);
    return { ok: true };
  });

  // ---------- Horários ----------
  api.get('/admin/slots', guard, async (req) => {
    const from = isValidDay(req.query.from) ? req.query.from : localToday();
    const to = isValidDay(req.query.to) ? req.query.to : new Date(Date.parse(`${from}T00:00:00Z`) + 14 * 86400000).toISOString().slice(0, 10);
    return db.prepare(
      `SELECT s.id, s.day, s.time, s.capacity, s.reserved, s.status, s.note FROM slots s
       JOIN products p ON p.id = s.product_id WHERE p.slug = ? AND s.day BETWEEN ? AND ? ORDER BY s.day, s.time`,
    ).all(PRODUCT_SLUG, from, to);
  });

  api.post('/admin/slots/bulk', guard, async (req) => {
    const b = slotsBulkBody.parse(req.body);
    if (!isValidDay(b.from) || !isValidDay(b.to) || b.to < b.from) throw new OrderError('Período inválido.', 'bad_range');
    const span = (Date.parse(`${b.to}T00:00:00Z`) - Date.parse(`${b.from}T00:00:00Z`)) / 86400000;
    if (span > 370) throw new OrderError('Período máximo: 1 ano.', 'bad_range');
    const pid = db.prepare('SELECT id FROM products WHERE slug = ?').get(PRODUCT_SLUG).id;
    const ins = db.prepare('INSERT OR IGNORE INTO slots (product_id, day, time, capacity) VALUES (?,?,?,?)');
    let created = 0;
    db.transaction(() => {
      for (let i = 0; i <= span; i++) {
        const d = new Date(Date.parse(`${b.from}T00:00:00Z`) + i * 86400000);
        if (!b.weekdays.includes(d.getUTCDay())) continue;
        for (const t of b.times) created += ins.run(pid, d.toISOString().slice(0, 10), t, b.capacity).changes;
      }
    })();
    log(req, 'slots.bulk_create', 'product', PRODUCT_SLUG, { from: b.from, to: b.to, created });
    return { created };
  });

  api.patch('/admin/slots/:id', guard, async (req) => {
    const id = Number(req.params.id);
    const b = slotPatch.parse(req.body);
    const s = db.prepare('SELECT * FROM slots WHERE id = ?').get(id);
    if (!s) throw new OrderError('Horário não encontrado.', 'not_found', 404);
    if (b.capacity !== undefined && b.capacity < s.reserved) {
      throw new OrderError(`Já há ${s.reserved} vagas vendidas neste horário; a capacidade não pode ser menor.`, 'capacity_below_reserved', 409);
    }
    updateRow(db, 'slots', id, b, { capacity: 'capacity', status: 'status', note: 'note' });
    log(req, 'slot.update', 'slot', id, b);
    return { ok: true };
  });

  // ---------- Cupons e regras ----------
  api.get('/admin/coupons', guard, async () => db.prepare('SELECT * FROM coupons ORDER BY id DESC').all());
  api.post('/admin/coupons', guard, async (req, reply) => {
    const b = couponBody.parse(req.body);
    try {
      const r = db.prepare(
        'INSERT INTO coupons (code, label, kind, value, min_qty, max_uses, valid_from, valid_until, partner_id, active) VALUES (?,?,?,?,?,?,?,?,?,?)',
      ).run(b.code, b.label, b.kind, b.value, b.minQty, b.maxUses, b.validFrom, b.validUntil, b.partnerId, Number(b.active));
      log(req, 'coupon.create', 'coupon', b.code);
      return reply.code(201).send({ id: Number(r.lastInsertRowid) });
    } catch (e) { return conflict(e); }
  });
  api.patch('/admin/coupons/:id', guard, async (req) => {
    const b = couponPatch.parse(req.body);
    updateRow(db, 'coupons', Number(req.params.id), b, { label: 'label', active: 'active', maxUses: 'max_uses', validUntil: 'valid_until' });
    log(req, 'coupon.update', 'coupon', req.params.id, b);
    return { ok: true };
  });

  api.get('/admin/rules', guard, async () => db.prepare('SELECT * FROM discount_rules ORDER BY min_qty').all());
  api.post('/admin/rules', guard, async (req, reply) => {
    const b = ruleBody.parse(req.body);
    const r = db.prepare('INSERT INTO discount_rules (label, min_qty, percent, active) VALUES (?,?,?,?)').run(b.label, b.minQty, b.percent, Number(b.active));
    log(req, 'rule.create', 'rule', Number(r.lastInsertRowid), b);
    return reply.code(201).send({ id: Number(r.lastInsertRowid) });
  });
  api.delete('/admin/rules/:id', guard, async (req) => {
    db.prepare('DELETE FROM discount_rules WHERE id = ?').run(Number(req.params.id));
    log(req, 'rule.delete', 'rule', req.params.id);
    return { ok: true };
  });

  // ---------- Placas com QR Code ----------
  api.get('/admin/qr', guard, async () =>
    db.prepare(
      `SELECT q.*, c.code AS coupon_code, p.name AS partner_name FROM qr_codes q
       LEFT JOIN coupons c ON c.id = q.coupon_id LEFT JOIN partners p ON p.id = q.partner_id ORDER BY q.id DESC`,
    ).all().map((q) => ({ ...q, url: `${config.baseUrl}/q/${q.code}` })));

  api.post('/admin/qr', guard, async (req, reply) => {
    const b = qrBody.parse(req.body);
    try {
      const r = db.prepare('INSERT INTO qr_codes (code, label, location, target, coupon_id, partner_id, active) VALUES (?,?,?,?,?,?,?)')
        .run(b.code, b.label, b.location, b.target, b.couponId, b.partnerId, Number(b.active));
      log(req, 'qr.create', 'qr', b.code);
      return reply.code(201).send({ id: Number(r.lastInsertRowid), url: `${config.baseUrl}/q/${b.code}` });
    } catch (e) { return conflict(e); }
  });
  api.patch('/admin/qr/:id', guard, async (req) => {
    const b = qrPatch.parse(req.body);
    updateRow(db, 'qr_codes', Number(req.params.id), b, { label: 'label', location: 'location', couponId: 'coupon_id', partnerId: 'partner_id', active: 'active' });
    log(req, 'qr.update', 'qr', req.params.id, b);
    return { ok: true };
  });

  // Imagem para impressão: nível de correção H (suporta sujeira/desgaste na placa) e margem de 4 módulos.
  api.get('/admin/qr/:id/image.:ext', guard, async (req, reply) => {
    const q = db.prepare('SELECT code FROM qr_codes WHERE id = ?').get(Number(req.params.id));
    if (!q) throw new OrderError('Placa não encontrada.', 'not_found', 404);
    const url = `${config.baseUrl}/q/${q.code}`;
    if (req.params.ext === 'svg') {
      return reply.type('image/svg+xml').send(await QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'H', margin: 4 }));
    }
    if (req.params.ext === 'png') {
      const width = Math.min(Math.max(Number(req.query.size) || 1200, 200), 4000);
      return reply.type('image/png').send(await QRCode.toBuffer(url, { errorCorrectionLevel: 'H', margin: 4, width }));
    }
    throw new OrderError('Formato inválido.', 'bad_format', 400);
  });

  // ---------- Parceiros ----------
  const partnerMap = {
    name: 'name', category: 'category', plan: 'plan', freeUntil: 'free_until', featured: 'featured', published: 'published',
    sortOrder: 'sort_order', tagline: 'tagline', description: 'description', whatsapp: 'whatsapp', phone: 'phone',
    website: 'website', instagram: 'instagram', address: 'address',
  };
  api.get('/admin/partners', guard, async () => db.prepare('SELECT * FROM partners ORDER BY sort_order, name').all());
  api.post('/admin/partners', guard, async (req, reply) => {
    const b = partnerBody.parse(req.body);
    try {
      const cols = ['slug', ...Object.keys(partnerMap)];
      const colName = (k) => (k === 'slug' ? 'slug' : partnerMap[k]);
      const r = db.prepare(`INSERT INTO partners (${cols.map(colName).join(',')}) VALUES (${cols.map(() => '?').join(',')})`)
        .run(...cols.map((k) => (typeof b[k] === 'boolean' ? Number(b[k]) : b[k])));
      log(req, 'partner.create', 'partner', b.slug);
      return reply.code(201).send({ id: Number(r.lastInsertRowid) });
    } catch (e) { return conflict(e); }
  });
  api.patch('/admin/partners/:id', guard, async (req) => {
    const b = partnerPatch.parse(req.body);
    updateRow(db, 'partners', Number(req.params.id), b, partnerMap);
    log(req, 'partner.update', 'partner', req.params.id, { fields: Object.keys(b) });
    return { ok: true };
  });

  // ---------- Usuários ----------
  api.get('/admin/users', guard, async () =>
    db.prepare('SELECT id, email, name, role, partner_id, totp_enabled, disabled, locked_until FROM users ORDER BY id').all());
  api.post('/admin/users', { ...guard, config: rl(10, '10 minutes') }, async (req, reply) => {
    const b = userBody.parse(req.body);
    try {
      const id = await auth.createUser({ ...b });
      log(req, 'user.create', 'user', id, { role: b.role });
      return reply.code(201).send({ id });
    } catch (e) {
      if (e instanceof AuthError) throw e;
      return conflict(e);
    }
  });
  api.post('/admin/users/:id/disable', guard, async (req) => {
    const id = Number(req.params.id);
    if (id === req.session.user.id) throw new OrderError('Você não pode desativar a si mesmo.', 'self', 409);
    db.prepare('UPDATE users SET disabled = 1 WHERE id = ?').run(id);
    auth.destroyAllSessions(id);
    log(req, 'user.disable', 'user', id);
    return { ok: true };
  });

  // ---------- Auditoria ----------
  api.get('/admin/audit', guard, async () => db.prepare('SELECT id, ts, actor, action, entity, entity_id, meta FROM audit_log ORDER BY id DESC LIMIT 200').all());
  api.get('/admin/audit/verify', guard, async () => audit.verify());
}
