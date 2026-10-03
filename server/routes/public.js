import QRCode from 'qrcode';
import { z } from 'zod';
import { blindIndex, normalizeCode } from '../lib/crypto.js';
import { isValidDay, localToday } from '../lib/time.js';
import { attractions } from '../content/attractions.js';
import { tirolesaContent } from '../content/tirolesa.js';
import { OrderError } from '../services/orders.js';
import { orderBody, quoteBody, resendBody } from '../schemas.js';

const partnerPublic = (p) => ({
  slug: p.slug, name: p.name, category: p.category, tagline: p.tagline, description: p.description,
  whatsapp: p.whatsapp, phone: p.phone, website: p.website, instagram: p.instagram, address: p.address,
  featured: Boolean(p.featured), plan: p.plan,
});

export async function publicRoutes(api, { db, config, orders, payments, rl, audit }) {
  api.get('/health', async () => ({ ok: true }));

  api.get('/attractions', async () => attractions);

  // ---- Produto ----
  api.get('/products/:slug', async (req) => {
    const product = orders.getProduct(req.params.slug);
    if (!product) throw new OrderError('Produto não encontrado.', 'not_found', 404);
    const rules = db.prepare('SELECT label, min_qty, percent FROM discount_rules WHERE active = 1 ORDER BY min_qty').all();
    return {
      slug: product.slug,
      name: product.name,
      summary: product.summary,
      priceCents: product.price_cents,
      rules: { minWeightKg: product.min_weight_kg, maxWeightKg: product.max_weight_kg, minAge: product.min_age, minorAge: product.minor_age },
      maxPerOrder: config.maxTicketsPerOrder,
      groupDiscounts: rules.map((r) => ({ label: r.label, minQty: r.min_qty, percent: r.percent })),
      holdMinutes: config.orderHoldMinutes,
      paymentMethods: payments.name === 'mock' ? ['pix'] : ['pix', 'card'],
      mockPayments: payments.name === 'mock',
      ...tirolesaContent,
      waiver: { version: product.waiver_version, text: tirolesaContent.waiver.text },
    };
  });

  const availQuery = z.object({ from: z.string().optional(), to: z.string().optional() });
  api.get('/products/:slug/availability', { config: rl(120, '1 minute') }, async (req) => {
    const product = orders.getProduct(req.params.slug);
    if (!product) throw new OrderError('Produto não encontrado.', 'not_found', 404);
    const q = availQuery.parse(req.query);
    const today = localToday();
    const from = q.from && isValidDay(q.from) ? q.from : today;
    const horizon = new Date(Date.parse(`${from}T00:00:00Z`) + 120 * 86400000).toISOString().slice(0, 10);
    const to = q.to && isValidDay(q.to) && q.to < horizon ? q.to : horizon;
    return { slots: orders.availability(product, from, to) };
  });

  api.post('/products/:slug/quote', { config: rl(60, '1 minute') }, async (req) => {
    const product = orders.getProduct(req.params.slug);
    if (!product) throw new OrderError('Produto não encontrado.', 'not_found', 404);
    const body = quoteBody.parse(req.body);
    const q = orders.quote(product, { qty: body.qty, couponCode: body.coupon, qrCode: body.qr });
    return {
      unitPriceCents: q.unitPriceCents, qty: q.qty, subtotalCents: q.subtotalCents,
      discountCents: q.discountCents, totalCents: q.totalCents, discountLabel: q.discountLabel,
    };
  });

  // ---- Pedidos ----
  api.post('/orders', { config: rl(8, '10 minutes') }, async (req, reply) => {
    const body = orderBody.parse(req.body);
    const key = req.headers['idempotency-key'];
    if (key !== undefined && !/^[A-Za-z0-9_-]{16,64}$/.test(String(key))) throw new OrderError('Idempotency-Key inválida.', 'bad_key');
    const result = await orders.createOrder(
      { productSlug: 'tirolesa-mais-alta-das-americas', ...body, couponCode: body.coupon, qrCode: body.qr },
      { idempotencyKey: key ? String(key) : undefined },
    );
    return reply.code(201).send(result);
  });

  const lastSync = new Map();
  api.get('/orders/:token', { config: rl(120, '1 minute') }, async (req) => {
    let order = orders.orderByToken(req.params.token);
    if (!order) throw new OrderError('Pedido não encontrado.', 'not_found', 404);
    if (['pending', 'expired'].includes(order.status) && order.payment_ref) {
      const last = lastSync.get(order.code) ?? 0;
      if (Date.now() - last > 4000) {
        lastSync.set(order.code, Date.now());
        if (lastSync.size > 5000) lastSync.clear();
        try { order = await orders.syncPayment(order); } catch (e) { req.log.warn({ err: e.message }, 'sync de pagamento falhou'); }
      }
    }
    return orders.view(order);
  });

  api.get('/orders/:token/tickets/:code/qr.svg', { config: rl(120, '1 minute') }, async (req, reply) => {
    const order = orders.orderByToken(req.params.token);
    if (!order || order.status !== 'paid') throw new OrderError('Ingresso indisponível.', 'not_found', 404);
    const view = orders.view(order);
    const ticket = view.tickets.find((t) => t.code === normalizeCode(req.params.code));
    if (!ticket?.qr) throw new OrderError('Ingresso indisponível.', 'not_found', 404);
    const svg = await QRCode.toString(ticket.qr, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#10261b', light: '#ffffff' } });
    return reply.type('image/svg+xml').send(svg);
  });

  // Reenvio do link do pedido: resposta sempre igual (não revela se o pedido/e-mail existe).
  api.post('/orders/resend', { config: rl(5, '1 hour') }, async (req, reply) => {
    const body = resendBody.parse(req.body);
    const code = normalizeCode(body.orderCode);
    const o = db.prepare('SELECT * FROM orders WHERE code = ?').get(code);
    if (o) {
      if (o.buyer_email_idx === blindIndex(config.keys.blind, body.email) && o.status === 'paid') {
        orders.notifyPaid(o.id).catch(() => {});
      }
    }
    return reply.code(202).send({ ok: true, message: 'Se os dados conferirem, enviaremos o link para o e-mail do pedido.' });
  });

  // ---- Parceiros ----
  api.get('/partners', async () => {
    const rows = db.prepare('SELECT * FROM partners WHERE published = 1 ORDER BY featured DESC, sort_order, name').all();
    return rows.map(partnerPublic);
  });
  api.get('/partners/:slug', async (req) => {
    const p = db.prepare('SELECT * FROM partners WHERE slug = ? AND published = 1').get(req.params.slug);
    if (!p) throw new OrderError('Parceiro não encontrado.', 'not_found', 404);
    return partnerPublic(p);
  });

  // ---- Webhook de pagamento ----
  api.post('/webhooks/mercadopago', { config: rl(120, '1 minute') }, async (req, reply) => {
    const r = await orders.handleWebhook({ headers: req.headers, query: req.query });
    if (!r.ok) return reply.code(401).send({ error: 'invalid_signature' });
    return { ok: true };
  });

  // ---- Simulador de pagamento (SOMENTE desenvolvimento) ----
  if (payments.name === 'mock' && !config.production) {
    api.post('/dev/pay/:token', async (req) => {
      const order = orders.orderByToken(req.params.token);
      if (!order?.payment_ref) throw new OrderError('Pedido não encontrado.', 'not_found', 404);
      payments._approve(order.payment_ref);
      await orders.syncPayment(order);
      return { ok: true };
    });
  }
  void audit;
}

// Redirecionamento curto das placas: /q/<codigo>. Conta o acesso (sem IP/UA) e leva ao destino.
publicRoutes.redirects = async (app, { db, rl }) => {
  app.get('/q/:code', { config: rl(120, '1 minute') }, async (req, reply) => {
    const qr = db.prepare('SELECT * FROM qr_codes WHERE code = ? AND active = 1').get(String(req.params.code).toLowerCase());
    if (!qr) return reply.redirect('/', 302);
    const day = new Date().toISOString().slice(0, 10);
    db.transaction(() => {
      db.prepare('UPDATE qr_codes SET scans = scans + 1 WHERE id = ?').run(qr.id);
      db.prepare('INSERT INTO qr_scans_daily (qr_id, day, count) VALUES (?,?,1) ON CONFLICT(qr_id, day) DO UPDATE SET count = count + 1').run(qr.id, day);
    })();
    const sep = qr.target.includes('?') ? '&' : '?';
    return reply.header('Cache-Control', 'no-store').redirect(`${qr.target}${sep}q=${encodeURIComponent(qr.code)}`, 302);
  });
};
