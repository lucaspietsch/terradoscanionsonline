import { createMercadoPagoProvider } from './mercadopago.js';
import { createMockProvider } from './mock.js';

export function createPaymentProvider(config) {
  switch (config.payments.provider) {
    case 'mock':
      return createMockProvider();
    case 'mercadopago':
      return createMercadoPagoProvider({
        accessToken: config.payments.mpAccessToken,
        webhookSecret: config.payments.mpWebhookSecret,
        baseUrl: config.baseUrl,
      });
    default:
      throw new Error(`PAYMENT_PROVIDER desconhecido: ${config.payments.provider}`);
  }
}
