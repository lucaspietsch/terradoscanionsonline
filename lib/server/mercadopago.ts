import "server-only";
import crypto from "node:crypto";
import { site } from "@/lib/site";

const API = "https://api.mercadopago.com";

export interface MpPayment {
  id: number;
  status: string;
  status_detail?: string;
  external_reference?: string;
  payment_method_id?: string;
  installments?: number;
  date_of_expiration?: string | null;
  transaction_amount?: number;
  point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string } };
  transaction_details?: { external_resource_url?: string };
}

function token() {
  const t = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!t) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
  return t;
}

/** Datas do MP precisam de offset (-03:00). */
function inMinutes(minutes: number) {
  return new Date(Date.now() + minutes * 60_000 - 3 * 3600_000).toISOString().replace("Z", "-03:00");
}

export interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  amountCents: number;
  payer: {
    email: string;
    firstName: string;
    lastName: string;
    cpf: string;
    address?: { zip: string; street: string; number: string; neighborhood: string; city: string; state: string };
  };
  method: "PIX" | "BOLETO" | "CREDIT_CARD";
  card?: { token: string; paymentMethodId: string; installments: number; issuerId?: string };
}

export async function createPayment(input: CreatePaymentInput): Promise<MpPayment> {
  const base = {
    transaction_amount: input.amountCents / 100,
    description: `Cambará Ornamentais — pedido ${input.orderNumber}`,
    external_reference: input.orderId,
    notification_url: `${site.url}/api/webhooks/mercadopago`,
    statement_descriptor: "CAMBARA ORNAMENT",
    payer: {
      email: input.payer.email,
      first_name: input.payer.firstName,
      last_name: input.payer.lastName,
      identification: { type: "CPF", number: input.payer.cpf },
    } as Record<string, unknown>,
  };

  let body: Record<string, unknown>;
  if (input.method === "PIX") {
    body = { ...base, payment_method_id: "pix", date_of_expiration: inMinutes(30) };
  } else if (input.method === "BOLETO") {
    const a = input.payer.address;
    body = {
      ...base,
      payment_method_id: "bolbradesco",
      date_of_expiration: inMinutes(3 * 24 * 60),
      payer: {
        ...base.payer,
        ...(a && {
          address: { zip_code: a.zip, street_name: a.street, street_number: a.number, neighborhood: a.neighborhood, city: a.city, federal_unit: a.state },
        }),
      },
    };
  } else {
    const c = input.card!;
    body = {
      ...base,
      token: c.token,
      payment_method_id: c.paymentMethodId,
      installments: c.installments,
      ...(c.issuerId && { issuer_id: Number(c.issuerId) || c.issuerId }),
    };
  }

  const res = await fetch(`${API}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `${input.orderId}:${input.method}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as MpPayment & { message?: string; cause?: unknown };
  if (!res.ok) {
    console.error("[mercadopago] erro ao criar pagamento", res.status, JSON.stringify(data));
    throw new Error(data.message ?? `Mercado Pago HTTP ${res.status}`);
  }
  return data;
}

export async function getPayment(id: string | number): Promise<MpPayment> {
  const res = await fetch(`${API}/v1/payments/${encodeURIComponent(String(id))}`, {
    headers: { Authorization: `Bearer ${token()}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Mercado Pago HTTP ${res.status}`);
  return (await res.json()) as MpPayment;
}

/**
 * Valida o header x-signature do webhook:
 *   manifest = "id:{data.id};request-id:{x-request-id};ts:{ts};"  → HMAC-SHA256 com a chave secreta do webhook.
 * https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
export function verifyWebhookSignature(opts: {
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string | null;
  secret: string | undefined;
}): boolean {
  const { signatureHeader, requestId, dataId, secret } = opts;
  if (!secret || !signatureHeader || !dataId) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const [k, ...v] = p.trim().split("=");
      return [k, v.join("=")];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;
  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifest = `id:${id};${requestId ? `request-id:${requestId};` : ""}ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
