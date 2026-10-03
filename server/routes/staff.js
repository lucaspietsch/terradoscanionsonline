import { checkinBody, partnerSelfPatch } from '../schemas.js';
import { localToday } from '../lib/time.js';

// Rotas de equipe operacional (check-in na tirolesa) e do painel do parceiro.
export async function staffRoutes(api, { db, orders, audit, rl }) {
  api.post('/checkin', { preHandler: api.requireRole('admin', 'checkin'), config: rl(120, '1 minute') }, async (req) => {
    const body = checkinBody.parse(req.body);
    // `force` (liberar ingresso de outro dia) é prerrogativa do administrador.
    const force = body.force === true && req.session.user.role === 'admin';
    return orders.checkin(body.code, { userId: req.session.user.id, force });
  });

  api.get('/checkin/today', { preHandler: api.requireRole('admin', 'checkin') }, async () => {
    const today = localToday();
    const rows = db
      .prepare(
        `SELECT s.time, s.capacity,
           COUNT(t.id) AS expected,
           SUM(CASE WHEN t.status = 'used' THEN 1 ELSE 0 END) AS arrived
         FROM slots s
         LEFT JOIN orders o ON o.slot_id = s.id AND o.status = 'paid'
         LEFT JOIN tickets t ON t.order_id = o.id AND t.status IN ('valid','used')
         WHERE s.day = ? GROUP BY s.id ORDER BY s.time`,
      )
      .all(today);
    return { day: today, slots: rows.map((r) => ({ time: r.time, capacity: r.capacity, expected: r.expected, arrived: r.arrived ?? 0 })) };
  });

  // ---- Painel do parceiro ----
  const guard = api.requireRole('partner');

  api.get('/partner/me', { preHandler: guard }, async (req) => {
    const pid = req.session.user.partnerId;
    const partner = db.prepare('SELECT * FROM partners WHERE id = ?').get(pid);
    const stats = db
      .prepare(
        `SELECT COUNT(*) AS orders, COALESCE(SUM(qty),0) AS tickets, COALESCE(SUM(total_cents),0) AS revenue
         FROM orders WHERE partner_id = ? AND status = 'paid'`,
      )
      .get(pid);
    const coupons = db.prepare('SELECT code, label, kind, value, used_count, max_uses, active FROM coupons WHERE partner_id = ?').all(pid);
    const qrs = db.prepare('SELECT code, label, location, scans FROM qr_codes WHERE partner_id = ?').all(pid);
    return {
      partner: {
        name: partner.name, category: partner.category, plan: partner.plan, freeUntil: partner.free_until,
        tagline: partner.tagline, description: partner.description, whatsapp: partner.whatsapp, phone: partner.phone,
        website: partner.website, instagram: partner.instagram, address: partner.address, published: Boolean(partner.published),
      },
      // O parceiro enxerga apenas números agregados das vendas atribuídas a ele — nunca dados de clientes.
      stats: { paidOrders: stats.orders, tickets: stats.tickets, revenueCents: stats.revenue },
      coupons, qrs,
    };
  });

  api.patch('/partner/me', { preHandler: guard }, async (req) => {
    const pid = req.session.user.partnerId;
    const body = partnerSelfPatch.parse(req.body);
    const cols = { tagline: 'tagline', description: 'description', whatsapp: 'whatsapp', phone: 'phone', website: 'website', instagram: 'instagram', address: 'address' };
    const sets = Object.keys(body).filter((k) => cols[k]);
    if (sets.length) {
      db.prepare(`UPDATE partners SET ${sets.map((k) => `${cols[k]} = ?`).join(', ')} WHERE id = ?`).run(...sets.map((k) => body[k]), pid);
      audit.write({ actor: `user:${req.session.user.id}`, action: 'partner.self_update', entity: 'partner', entityId: pid, meta: { fields: sets } });
    }
    return { ok: true };
  });
}
