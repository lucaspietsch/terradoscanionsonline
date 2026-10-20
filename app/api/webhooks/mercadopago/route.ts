import { NextResponse } from "next/server";
import { api } from "@/lib/server/api";
import { getPayment, verifyWebhookSignature } from "@/lib/server/mercadopago";
import { applyPaymentStatus } from "@/lib/server/orders";
import { prisma } from "@/lib/db";

/**
 * Webhook do Mercado Pago.
 *  1. valida a assinatura (x-signature) — sem segredo válido: 401;
 *  2. NÃO confia no corpo: busca o pagamento na API do MP;
 *  3. aplica o status de forma idempotente (PaymentEvent único por pagamento+status).
 */
export const POST = api(
  async (req) => {
    const url = new URL(req.url);
    const bodyText = await req.text();
    let body: { type?: string; action?: string; data?: { id?: string | number } } = {};
    try {
      body = JSON.parse(bodyText || "{}");
    } catch {
      /* corpo opcional */
    }
    const dataId = url.searchParams.get("data.id") ?? (body.data?.id != null ? String(body.data.id) : null);

    const valid = verifyWebhookSignature({
      signatureHeader: req.headers.get("x-signature"),
      requestId: req.headers.get("x-request-id"),
      dataId,
      secret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
    });
    if (!valid) return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });

    const type = url.searchParams.get("type") ?? body.type;
    if (type !== "payment" || !dataId) return NextResponse.json({ ok: true, ignored: true });

    const payment = await getPayment(dataId);
    const orderId = payment.external_reference;
    if (!orderId) return NextResponse.json({ ok: true, ignored: true });

    const exists = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, totalCents: true } });
    if (!exists) return NextResponse.json({ ok: true, ignored: true });
    // sanidade: o valor pago precisa bater com o pedido calculado no servidor
    if (payment.status === "approved" && payment.transaction_amount != null && Math.round(payment.transaction_amount * 100) < exists.totalCents) {
      console.error(`[webhook] valor divergente no pedido ${orderId}: pago ${payment.transaction_amount}, esperado ${exists.totalCents / 100}`);
      return NextResponse.json({ error: "Valor divergente." }, { status: 422 });
    }

    await applyPaymentStatus(orderId, payment.status, String(payment.id), `${payment.id}:${payment.status}`);
    return NextResponse.json({ ok: true });
  },
  { skipOriginCheck: true },
);
