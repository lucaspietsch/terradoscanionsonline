import {
  blindIndex,
  normalizeCode,
  orderAccessToken,
  parseOrderAccessToken,
  parseTicketQr,
  randomCode,
  ticketQrPayload,
} from '../lib/crypto.js';
import { addMinutes, ageOn, isValidDay, localToday, slotStart } from '../lib/time.js';
import { PricingError, computeQuote } from './pricing.js';

export class OrderError extends Error {
  constructor(message, code = 'order_error', status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const BOOKING_CUTOFF_MINUTES = 60; // vendas online encerram 1h antes do horário

export function createOrderService({ db, config, pii, audit, payments, mailer, log }) {
  const keys = config.keys;

  // ---------- Catálogo / disponibilidade ----------
  const getProduct = (slug) => db.prepare('SELECT * FROM products WHERE slug = ? AND active = 1').get(slug);

  function availability(product, fromDay, toDay) {
    const today = localToday();
    const from = fromDay && fromDay > today ? fromDay : today;
    const rows = db
      .prepare(
        `SELECT id, day, time, capacity, reserved, status, note FROM slots
         WHERE product_id = ? AND day >= ? AND day <= ? ORDER BY day, time`,
      )
      .all(product.id, from, toDay);
    const now = new Date();
    return rows.map((s) => {
      const open = s.status === 'open' && addMinutes(now, BOOKING_CUTOFF_MINUTES) < slotStart(s.day, s.time);
      return { id: s.id, day: s.day, time: s.time, left: open ? Math.max(0, s.capacity - s.reserved) : 0, closed: !open, note: s.note };
    });
  }

  const findCoupon = (code) =>
    code ? db.prepare('SELECT * FROM coupons WHERE code = ?').get(String(code).trim().toUpperCase()) : null;
  const findQr = (code) =>
    code ? db.prepare('SELECT * FROM qr_codes WHERE code = ? AND active = 1').get(String(code).trim().toLowerCase()) : null;
  const groupRules = () => db.prepare('SELECT * FROM discount_rules WHERE active = 1').all();

  // Escolhe a melhor entre: cupom digitado, cupom da placa QR e regra de grupo.
  function quote(product, { qty, couponCode, qrCode }) {
    const qr = findQr(qrCode);
    const explicit = findCoupon(couponCode);
    if (couponCode && !explicit) throw new PricingError('Cupom inválido ou inativo.');
    const qrCoupon = qr?.coupon_id ? db.prepare('SELECT * FROM coupons WHERE id = ?').get(qr.coupon_id) : null;

    const attempts = [];
    let explicitError = null;
    const rules = groupRules();
    const base = { unitPriceCents: product.price_cents, qty, groupRules: rules };
    // Cupom digitado: erro explícito para o usuário se não puder ser usado.
    if (explicit) {
      try { attempts.push({ q: computeQuote({ ...base, coupon: explicit }), coupon: explicit }); } catch (e) { explicitError = e; }
    }
    // Cupom da placa QR: se não puder ser usado (esgotado/expirado), simplesmente ignora.
    if (qrCoupon) {
      try { attempts.push({ q: computeQuote({ ...base, coupon: qrCoupon }), coupon: qrCoupon }); } catch { /* ignorado */ }
    }
    if (explicitError && !attempts.length) throw explicitError;
    attempts.push({ q: computeQuote(base), coupon: null });
    attempts.sort((a, b) => a.q.totalCents - b.q.totalCents);
    const best = attempts[0];
    return { ...best.q, qr, partnerId: best.coupon?.partner_id ?? qr?.partner_id ?? null, explicitCouponError: explicitError?.message ?? null };
  }

  // ---------- Criação do pedido ----------
  function validateParticipants(product, slot, participants, qty) {
    if (!Array.isArray(participants) || participants.length !== qty) {
      throw new OrderError('Informe os dados de todos os participantes.', 'participants_mismatch');
    }
    let adults = 0;
    const out = participants.map((p, i) => {
      const label = `Participante ${i + 1}`;
      if (!isValidDay(p.birthDate) || p.birthDate > localToday()) throw new OrderError(`${label}: data de nascimento inválida.`, 'invalid_birth');
      const age = ageOn(p.birthDate, slot.day);
      if (age < product.min_age) throw new OrderError(`${label}: idade mínima de ${product.min_age} anos.`, 'age_too_low');
      if (!Number.isInteger(p.weightKg) || p.weightKg < product.min_weight_kg || p.weightKg > product.max_weight_kg) {
        throw new OrderError(`${label}: o peso deve estar entre ${product.min_weight_kg} e ${product.max_weight_kg} kg.`, 'weight_out_of_range');
      }
      const isMinor = age < product.minor_age;
      if (!isMinor) adults++;
      return { name: p.name.trim(), birthDate: p.birthDate, weightKg: p.weightKg, isMinor };
    });
    if (out.some((p) => p.isMinor) && adults === 0) {
      throw new OrderError('Menores de idade precisam estar acompanhados de ao menos um adulto responsável no mesmo pedido.', 'minor_needs_adult');
    }
    return out;
  }

  const uniqueOrderCode = () => {
    for (;;) {
      const c = randomCode(8);
      if (!db.prepare('SELECT 1 FROM orders WHERE code = ?').get(c)) return c;
    }
  };
  const uniqueTicketCode = () => {
    for (;;) {
      const c = randomCode(10);
      if (!db.prepare('SELECT 1 FROM tickets WHERE code = ?').get(c)) return c;
    }
  };

  const reserveSlot = (slotId, qty) =>
    db.prepare("UPDATE slots SET reserved = reserved + ? WHERE id = ? AND status = 'open' AND reserved + ? <= capacity").run(qty, slotId, qty).changes === 1;

  async function createOrder(input, { idempotencyKey } = {}) {
    const product = getProduct(input.productSlug);
    if (!product) throw new OrderError('Produto indisponível.', 'product_unavailable', 404);

    if (idempotencyKey) {
      const existing = db.prepare('SELECT * FROM orders WHERE idempotency_key = ?').get(idempotencyKey);
      if (existing) return view(existing);
    }
    if (input.qty > config.maxTicketsPerOrder) {
      throw new OrderError(`Máximo de ${config.maxTicketsPerOrder} ingressos por pedido. Para grupos maiores, fale com a gente.`, 'too_many');
    }
    if (!input.acceptedWaiver || !input.acceptedPrivacy) {
      throw new OrderError('É preciso aceitar o termo de responsabilidade e a política de privacidade.', 'consent_required');
    }

    const now = new Date();
    const code = uniqueOrderCode();
    const accessToken = orderAccessToken(keys.ticket, code);
    const expiresAt = addMinutes(now, config.orderHoldMinutes);

    let orderId;
    let q;
    try {
      orderId = db.transaction(() => {
        const slot = db.prepare('SELECT * FROM slots WHERE id = ? AND product_id = ?').get(input.slotId, product.id);
        if (!slot) throw new OrderError('Horário não encontrado.', 'slot_not_found', 404);
        if (addMinutes(now, BOOKING_CUTOFF_MINUTES) >= slotStart(slot.day, slot.time) || slot.status !== 'open') {
          throw new OrderError('Este horário não está mais disponível para venda online.', 'slot_closed', 409);
        }
        const people = validateParticipants(product, slot, input.participants, input.qty);

        q = quote(product, { qty: input.qty, couponCode: input.couponCode, qrCode: input.qrCode });

        if (!reserveSlot(slot.id, input.qty)) throw new OrderError('Poxa, as vagas deste horário acabaram. Escolha outro horário.', 'sold_out', 409);

        if (q.couponId) {
          const ok = db
            .prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ? AND (max_uses IS NULL OR used_count < max_uses)')
            .run(q.couponId).changes === 1;
          if (!ok) throw new OrderError('Este cupom acabou de esgotar.', 'coupon_exhausted', 409);
        }

        const res = db
          .prepare(
            `INSERT INTO orders (code, status, product_id, slot_id, qty, unit_price_cents, subtotal_cents, discount_cents, total_cents,
               discount_label, coupon_id, qr_id, partner_id, buyer_name_enc, buyer_email_enc, buyer_email_idx, buyer_phone_enc,
               waiver_version, consent_at, payment_provider, idempotency_key, expires_at)
             VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            code, product.id, slot.id, input.qty, q.unitPriceCents, q.subtotalCents, q.discountCents, q.totalCents,
            q.discountLabel, q.couponId, q.qr?.id ?? null, q.partnerId,
            pii.enc('orders.buyer_name', code, input.buyer.name.trim()),
            pii.enc('orders.buyer_email', code, input.buyer.email.trim().toLowerCase()),
            blindIndex(keys.blind, input.buyer.email),
            pii.enc('orders.buyer_phone', code, input.buyer.phone),
            product.waiver_version, now.toISOString(), payments.name, idempotencyKey ?? null, expiresAt.toISOString(),
          );
        const id = Number(res.lastInsertRowid);
        const insTicket = db.prepare(
          'INSERT INTO tickets (order_id, code, holder_name_enc, birth_date_enc, weight_kg, is_minor) VALUES (?,?,?,?,?,?)',
        );
        for (const p of people) {
          const tc = uniqueTicketCode();
          insTicket.run(id, tc, pii.enc('tickets.holder_name', tc, p.name), pii.enc('tickets.birth_date', tc, p.birthDate), p.weightKg, p.isMinor ? 1 : 0);
        }
        return id;
      })();
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' && idempotencyKey) {
        const existing = db.prepare('SELECT * FROM orders WHERE idempotency_key = ?').get(idempotencyKey);
        if (existing) return view(existing);
      }
      throw err;
    }

    audit.write({ actor: 'customer', action: 'order.created', entity: 'order', entityId: code, meta: { qty: input.qty, total: q.totalCents, qr: q.qr?.code ?? null } });
    let order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

    if (order.total_cents === 0) {
      settlePaid(order, { ref: `free_${code}`, amountCents: 0 });
      return view(db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId));
    }

    try {
      const charge = await payments.createCharge({
        order: { code, accessToken },
        amountCents: order.total_cents,
        buyer: { name: input.buyer.name.trim(), email: input.buyer.email.trim().toLowerCase() },
        description: `${product.name} (${input.qty}x)`,
        expiresAt,
        method: input.paymentMethod || 'pix',
      });
      db.prepare('UPDATE orders SET payment_ref = ?, pix_payload = ? WHERE id = ?').run(charge.ref, charge.pixCopyPaste, orderId);
      order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
      return { ...view(order), checkoutUrl: charge.checkoutUrl ?? null };
    } catch (err) {
      log.error({ err: err.message, order: code }, 'falha ao criar cobrança');
      release(order, 'cancelled', 'payment.charge_failed');
      throw new OrderError('Não foi possível iniciar o pagamento agora. Tente novamente em instantes.', 'payment_unavailable', 502);
    }
  }

  // ---------- Liberação de vagas ----------
  function release(order, newStatus, auditAction) {
    const changed = db.transaction(() => {
      const r = db.prepare("UPDATE orders SET status = ? WHERE id = ? AND status IN ('pending','paid')").run(newStatus, order.id);
      if (r.changes !== 1) return false;
      db.prepare('UPDATE slots SET reserved = MAX(0, reserved - ?) WHERE id = ?').run(order.qty, order.slot_id);
      if (order.coupon_id) db.prepare('UPDATE coupons SET used_count = MAX(0, used_count - 1) WHERE id = ?').run(order.coupon_id);
      db.prepare("UPDATE tickets SET status = 'cancelled' WHERE order_id = ? AND status <> 'used'").run(order.id);
      return true;
    })();
    if (changed) audit.write({ actor: 'system', action: auditAction, entity: 'order', entityId: order.code });
    return changed;
  }

  function expirePending(now = new Date()) {
    const rows = db.prepare("SELECT * FROM orders WHERE status = 'pending' AND expires_at < ?").all(now.toISOString());
    let n = 0;
    for (const o of rows) if (release(o, 'expired', 'order.expired')) n++;
    return n;
  }

  // ---------- Confirmação de pagamento ----------
  function settlePaid(order, { ref, amountCents }) {
    const outcome = db.transaction(() => {
      const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
      if (o.status === 'paid') return 'already';
      if (amountCents !== o.total_cents) return 'amount_mismatch';
      const stamp = new Date().toISOString();
      if (o.status === 'pending') {
        db.prepare("UPDATE orders SET status = 'paid', paid_at = ?, payment_ref = COALESCE(payment_ref, ?) WHERE id = ?").run(stamp, ref, o.id);
        return 'paid';
      }
      if (o.status === 'expired' && reserveSlot(o.slot_id, o.qty)) {
        db.prepare("UPDATE orders SET status = 'paid', paid_at = ?, payment_ref = COALESCE(payment_ref, ?) WHERE id = ?").run(stamp, ref, o.id);
        db.prepare("UPDATE tickets SET status = 'valid' WHERE order_id = ? AND status = 'cancelled'").run(o.id);
        return 'paid_late';
      }
      return 'needs_refund';
    })();

    if (outcome === 'paid' || outcome === 'paid_late') {
      audit.write({ actor: 'payment', action: `payment.${outcome}`, entity: 'order', entityId: order.code, meta: { ref } });
      notifyPaid(order.id).catch((e) => log.error({ err: e.message }, 'notifyPaid'));
    } else if (outcome === 'amount_mismatch') {
      audit.write({ actor: 'payment', action: 'payment.amount_mismatch', entity: 'order', entityId: order.code, meta: { ref, received: amountCents } });
      log.error({ order: order.code }, 'valor do pagamento difere do pedido: NÃO confirmado');
    } else if (outcome === 'needs_refund') {
      audit.write({ actor: 'payment', action: 'payment.late_no_capacity', entity: 'order', entityId: order.code, meta: { ref } });
      payments.refund(ref).catch((e) => log.error({ err: e.message, order: order.code }, 'ESTORNO PENDENTE: fazer manualmente'));
    }
    return outcome;
  }

  // Consulta o provedor (fonte da verdade) e confirma o pedido se aprovado.
  async function syncPayment(order, ref = order.payment_ref) {
    if (!ref) return order;
    const p = await payments.fetchPayment(ref);
    if (!p) return order;
    if (p.externalRef && p.externalRef !== order.code) {
      audit.write({ actor: 'payment', action: 'payment.reference_mismatch', entity: 'order', entityId: order.code, meta: { ref } });
      return order;
    }
    if (p.status === 'approved') settlePaid(order, { ref, amountCents: p.amountCents });
    return db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
  }

  async function handleWebhook({ headers, query }) {
    const v = payments.verifyWebhook({ headers, query });
    if (!v.valid) return { ok: false, reason: 'invalid_signature' };
    const seen = db.prepare('INSERT OR IGNORE INTO webhook_events (provider, event_id, received_at) VALUES (?,?,?)').run(payments.name, v.eventId, new Date().toISOString());
    if (seen.changes === 0) return { ok: true, duplicate: true };
    // Nunca confiamos no corpo da notificação: buscamos o pagamento direto no provedor.
    const p = await payments.fetchPayment(v.paymentRef);
    if (!p?.externalRef) return { ok: true, ignored: true };
    const order = db.prepare('SELECT * FROM orders WHERE code = ?').get(p.externalRef);
    if (!order) return { ok: true, ignored: true };
    if (p.status === 'approved') {
      db.prepare('UPDATE orders SET payment_ref = COALESCE(payment_ref, ?) WHERE id = ?').run(v.paymentRef, order.id);
      settlePaid(order, { ref: v.paymentRef, amountCents: p.amountCents });
    }
    return { ok: true };
  }

  async function notifyPaid(orderId) {
    const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!o) return;
    const slot = db.prepare('SELECT * FROM slots WHERE id = ?').get(o.slot_id);
    const link = `${config.baseUrl}/pedido/${orderAccessToken(keys.ticket, o.code)}`;
    await mailer.send({
      to: pii.dec('orders.buyer_email', o.code, o.buyer_email_enc),
      subject: `Seus ingressos da Tirolesa — pedido ${o.code}`,
      text: `Olá, ${pii.dec('orders.buyer_name', o.code, o.buyer_name_enc).split(' ')[0]}!\n\nPagamento confirmado. Seus ingressos para ${slot.day} às ${slot.time} estão aqui:\n${link}\n\nApresente o QR Code de cada participante na chegada. Guarde este e-mail.\n\nTerra dos Cânions Online`,
    });
  }

  // ---------- Visualização ----------
  function view(order) {
    const slot = db.prepare('SELECT day, time FROM slots WHERE id = ?').get(order.slot_id);
    const product = db.prepare('SELECT name, slug FROM products WHERE id = ?').get(order.product_id);
    const accessToken = orderAccessToken(keys.ticket, order.code);
    const tickets = db.prepare('SELECT * FROM tickets WHERE order_id = ? ORDER BY id').all(order.id).map((t) => ({
      code: t.code,
      holderName: pii.dec('tickets.holder_name', t.code, t.holder_name_enc),
      isMinor: Boolean(t.is_minor),
      status: t.status,
      qr: order.status === 'paid' ? ticketQrPayload(keys.ticket, t.code) : null,
    }));
    return {
      code: order.code,
      accessToken,
      status: order.status,
      product,
      day: slot.day,
      time: slot.time,
      qty: order.qty,
      subtotalCents: order.subtotal_cents,
      discountCents: order.discount_cents,
      discountLabel: order.discount_label,
      totalCents: order.total_cents,
      expiresAt: order.expires_at,
      pixCopyPaste: order.status === 'pending' ? order.pix_payload : null,
      tickets: order.status === 'paid' ? tickets : tickets.map((t) => ({ ...t, qr: null })),
    };
  }

  const orderByToken = (token) => {
    const code = parseOrderAccessToken(keys.ticket, token);
    return code ? db.prepare('SELECT * FROM orders WHERE code = ?').get(code) : null;
  };

  // ---------- Check-in ----------
  function checkin(rawInput, { userId, today = localToday(), force = false }) {
    const input = String(rawInput || '').trim();
    let code = null;
    if (/^TDC1\./i.test(input)) {
      code = parseTicketQr(keys.ticket, input);
      if (!code) return { result: 'invalid_signature' };
    } else {
      code = normalizeCode(input);
      if (code.length !== 10) return { result: 'not_found' };
    }
    const t = db.prepare('SELECT * FROM tickets WHERE code = ?').get(code);
    if (!t) return { result: 'not_found' };
    const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(t.order_id);
    const slot = db.prepare('SELECT day, time FROM slots WHERE id = ?').get(o.slot_id);
    const info = {
      holderName: pii.dec('tickets.holder_name', t.code, t.holder_name_enc),
      weightKg: t.weight_kg,
      isMinor: Boolean(t.is_minor),
      day: slot.day,
      time: slot.time,
      orderCode: o.code,
    };
    if (o.status !== 'paid') return { result: 'not_paid', ...info };
    if (t.status === 'cancelled') return { result: 'cancelled', ...info };
    if (t.status === 'used') return { result: 'already_used', usedAt: t.used_at, ...info };
    if (slot.day !== today && !force) return { result: 'wrong_day', ...info };
    const upd = db
      .prepare("UPDATE tickets SET status = 'used', used_at = ?, used_by = ? WHERE id = ? AND status = 'valid'")
      .run(new Date().toISOString(), userId, t.id);
    if (upd.changes !== 1) return { result: 'already_used', ...info };
    audit.write({ actor: `user:${userId}`, action: 'ticket.checkin', entity: 'ticket', entityId: t.code, meta: { force } });
    return { result: 'ok', ...info };
  }

  // ---------- Cancelamento / estorno (admin) ----------
  async function cancelAndRefund(order, { actor }) {
    if (!['pending', 'paid'].includes(order.status)) throw new OrderError('Pedido não pode ser cancelado neste estado.', 'bad_state', 409);
    const used = db.prepare("SELECT COUNT(*) AS n FROM tickets WHERE order_id = ? AND status = 'used'").get(order.id).n;
    if (used > 0) throw new OrderError('Há ingressos já utilizados neste pedido.', 'tickets_used', 409);
    const wasPaid = order.status === 'paid';
    if (wasPaid && order.payment_ref && !order.payment_ref.startsWith('free_')) {
      await payments.refund(order.payment_ref); // se falhar, lança antes de liberar as vagas
    }
    release(order, wasPaid ? 'refunded' : 'cancelled', wasPaid ? 'order.refunded' : 'order.cancelled');
    audit.write({ actor, action: 'order.cancel_requested', entity: 'order', entityId: order.code, meta: { wasPaid } });
  }

  // ---------- Retenção (LGPD) ----------
  function anonymizeOld(now = new Date()) {
    const cutoff = new Date(now.getTime() - config.retentionDays * 86400000).toISOString().slice(0, 10);
    const rows = db
      .prepare(
        `SELECT o.id, o.code FROM orders o JOIN slots s ON s.id = o.slot_id
         WHERE o.anonymized_at IS NULL AND s.day < ? AND o.status <> 'pending'`,
      )
      .all(cutoff);
    const R = pii.REDACTED;
    db.transaction(() => {
      for (const o of rows) {
        db.prepare(
          'UPDATE orders SET buyer_name_enc = ?, buyer_email_enc = ?, buyer_email_idx = ?, buyer_phone_enc = ?, anonymized_at = ? WHERE id = ?',
        ).run(R, R, `anon_${o.id}`, R, now.toISOString(), o.id);
        db.prepare('UPDATE tickets SET holder_name_enc = ?, birth_date_enc = ? WHERE order_id = ?').run(R, R, o.id);
      }
    })();
    if (rows.length) audit.write({ actor: 'system', action: 'retention.anonymized', meta: { orders: rows.length } });
    return rows.length;
  }

  return {
    getProduct, availability, quote, createOrder, view, orderByToken, syncPayment, handleWebhook,
    settlePaid, notifyPaid, expirePending, checkin, cancelAndRefund, anonymizeOld, release,
  };
}
