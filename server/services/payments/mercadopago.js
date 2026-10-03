// Integração Mercado Pago (Pix pela API de Pagamentos; cartão via Checkout Pro hospedado → o site
// nunca toca em dados de cartão, mantendo o escopo PCI mínimo).
//
// IMPORTANTE: este adaptador foi escrito contra a documentação pública, mas NÃO foi exercitado contra
// a API real neste repositório. Valide em modo de teste (credenciais TEST-) antes de ir ao ar.
import { createHmac } from 'node:crypto';
import { safeEqual } from '../../lib/crypto.js';

const API = 'https://api.mercadopago.com';

export function createMercadoPagoProvider({ accessToken, webhookSecret, baseUrl }, { fetchImpl = fetch } = {}) {
  async function mp(path, { method = 'GET', body, idempotencyKey } = {}) {
    const res = await fetchImpl(`${API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(`Mercado Pago ${res.status}: ${data.message || 'erro'}`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  return {
    name: 'mercadopago',

    async createCharge({ order, amountCents, buyer, description, expiresAt, method = 'pix' }) {
      const notification_url = `${baseUrl}/api/webhooks/mercadopago`;
      if (method === 'card') {
        const pref = await mp('/checkout/preferences', {
          method: 'POST',
          idempotencyKey: `pref-${order.code}`,
          body: {
            items: [{ title: description, quantity: 1, unit_price: amountCents / 100, currency_id: 'BRL' }],
            external_reference: order.code,
            notification_url,
            back_urls: { success: `${baseUrl}/pedido/${order.accessToken}`, failure: `${baseUrl}/pedido/${order.accessToken}`, pending: `${baseUrl}/pedido/${order.accessToken}` },
            auto_return: 'approved',
            expires: true,
            expiration_date_to: expiresAt.toISOString(),
            payment_methods: { excluded_payment_types: [{ id: 'ticket' }], installments: 3 },
          },
        });
        return { ref: null, pixCopyPaste: null, checkoutUrl: pref.init_point, prefId: pref.id };
      }
      const pay = await mp('/v1/payments', {
        method: 'POST',
        idempotencyKey: `pix-${order.code}`,
        body: {
          transaction_amount: amountCents / 100,
          description,
          payment_method_id: 'pix',
          external_reference: order.code,
          notification_url,
          date_of_expiration: expiresAt.toISOString().replace('Z', '-00:00'),
          payer: { email: buyer.email, first_name: buyer.name.split(' ')[0] },
        },
      });
      return {
        ref: String(pay.id),
        pixCopyPaste: pay.point_of_interaction?.transaction_data?.qr_code ?? null,
        checkoutUrl: null,
      };
    },

    async fetchPayment(ref) {
      const p = await mp(`/v1/payments/${encodeURIComponent(ref)}`);
      const map = { approved: 'approved', pending: 'pending', in_process: 'pending', authorized: 'pending', refunded: 'refunded', charged_back: 'refunded' };
      return {
        status: map[p.status] ?? 'failed',
        amountCents: Math.round(Number(p.transaction_amount) * 100),
        externalRef: p.external_reference ?? null,
        ref: String(p.id),
      };
    },

    async refund(ref) {
      await mp(`/v1/payments/${encodeURIComponent(ref)}/refunds`, { method: 'POST', body: {}, idempotencyKey: `refund-${ref}` });
      return { ok: true };
    },

    // Valida x-signature: HMAC-SHA256 de "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" com o segredo do webhook.
    verifyWebhook({ headers, query }) {
      const sig = headers['x-signature'];
      const requestId = headers['x-request-id'];
      const dataId = query['data.id'] ?? query.id;
      if (!sig || !requestId || !dataId) return { valid: false };
      const parts = Object.fromEntries(String(sig).split(',').map((kv) => kv.trim().split('=').map((s) => s.trim())));
      if (!parts.ts || !parts.v1) return { valid: false };
      // Rejeita notificações antigas (anti-replay): tolerância de 10 minutos.
      const tsMs = Number(parts.ts) > 1e12 ? Number(parts.ts) : Number(parts.ts) * 1000;
      if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > 10 * 60 * 1000) return { valid: false };
      const manifest = `id:${String(dataId).toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
      const expected = createHmac('sha256', webhookSecret).update(manifest).digest('hex');
      if (!safeEqual(expected, parts.v1)) return { valid: false };
      return { valid: true, eventId: `${requestId}:${dataId}`, paymentRef: String(dataId) };
    },
  };
}
