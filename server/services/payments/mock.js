// Provedor de desenvolvimento/testes. NUNCA habilitado em produção (ver config.js).
import { randomToken } from '../../lib/crypto.js';

export function createMockProvider() {
  const payments = new Map(); // ref -> { status, amountCents, externalRef }
  return {
    name: 'mock',
    async createCharge({ order, amountCents }) {
      const ref = `mock_${randomToken(9)}`;
      payments.set(ref, { status: 'pending', amountCents, externalRef: order.code });
      return {
        ref,
        pixCopyPaste: `00020126MOCKPIX${order.code}5204000053039865802BR5909TERRACANI6009CAMBARA62070503***6304ABCD`,
        checkoutUrl: null,
      };
    },
    async fetchPayment(ref) {
      return payments.get(ref) ?? null;
    },
    async refund(ref) {
      const p = payments.get(ref);
      if (p) p.status = 'refunded';
      return { ok: true };
    },
    verifyWebhook() {
      return { valid: false };
    },
    // Apenas para o simulador de pagamento de desenvolvimento:
    _approve(ref) {
      const p = payments.get(ref);
      if (!p) return false;
      p.status = 'approved';
      return true;
    },
  };
}
