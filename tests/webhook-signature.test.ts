import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyWebhookSignature } from "@/lib/server/mercadopago";

const secret = "whsec_test_123";
const sign = (dataId: string, requestId: string, ts: string, key = secret) =>
  crypto.createHmac("sha256", key).update(`id:${dataId};request-id:${requestId};ts:${ts};`).digest("hex");

describe("assinatura do webhook do Mercado Pago", () => {
  const ts = "1710000000";
  it("aceita assinatura válida", () => {
    expect(verifyWebhookSignature({ signatureHeader: `ts=${ts},v1=${sign("123456", "req-1", ts)}`, requestId: "req-1", dataId: "123456", secret })).toBe(true);
  });
  it("rejeita segredo errado, id adulterado e header ausente", () => {
    expect(verifyWebhookSignature({ signatureHeader: `ts=${ts},v1=${sign("123456", "req-1", ts, "outro")}`, requestId: "req-1", dataId: "123456", secret })).toBe(false);
    expect(verifyWebhookSignature({ signatureHeader: `ts=${ts},v1=${sign("123456", "req-1", ts)}`, requestId: "req-1", dataId: "999999", secret })).toBe(false);
    expect(verifyWebhookSignature({ signatureHeader: null, requestId: "req-1", dataId: "123456", secret })).toBe(false);
    expect(verifyWebhookSignature({ signatureHeader: `ts=${ts},v1=${sign("123456", "req-1", ts)}`, requestId: "req-1", dataId: "123456", secret: undefined })).toBe(false);
  });
});
