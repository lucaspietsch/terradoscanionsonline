import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/server/auth";
import { resolveCartLines } from "@/lib/data/catalog";
import { getSettings } from "@/lib/data/settings";
import { quoteShipping } from "@/lib/server/quote";
import { checkCoupon } from "@/lib/server/coupons";
import { createPayment, type MpPayment } from "@/lib/server/mercadopago";
import { mails, sendMail, type MailOrder } from "@/lib/server/mail";
import { computeTotals, formatOrderNumber } from "@/lib/totals";
import { PICKUP_OPTION_ID } from "@/lib/shipping";
import type { CheckoutInput } from "@/lib/validators";
import type { SessionUser } from "@/lib/server/auth";

const orderInclude = { items: true } satisfies Prisma.OrderInclude;
type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export function toMailOrder(o: OrderWithItems): MailOrder {
  return {
    number: formatOrderNumber(o.seq),
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    totalCents: o.totalCents,
    subtotalCents: o.subtotalCents,
    shippingCents: o.shippingCents,
    discountCents: o.discountCents,
    accessToken: o.accessToken,
    trackingCode: o.trackingCode,
    deliveryMethod: o.deliveryMethod,
    pixExpiresAt: o.pixExpiresAt,
    boletoUrl: o.boletoUrl,
    items: o.items.map((i) => ({ productName: i.productName, finishName: i.finishName, quantity: i.quantity, unitPriceCents: i.unitPriceCents })),
  };
}

// ---------- estoque ----------
async function deductStock(tx: Prisma.TransactionClient, order: OrderWithItems) {
  if (order.stockDeducted) return;
  for (const item of order.items) {
    if (!item.variantId) continue;
    // GREATEST evita estoque negativo numa corrida entre duas compras da última peça.
    await tx.$executeRaw`UPDATE "ProductVariant" SET stock = GREATEST(stock - ${item.quantity}, 0) WHERE id = ${item.variantId}`;
  }
  await tx.order.update({ where: { id: order.id }, data: { stockDeducted: true } });
}

async function restoreStock(tx: Prisma.TransactionClient, order: OrderWithItems) {
  if (!order.stockDeducted) return;
  for (const item of order.items) {
    if (!item.variantId) continue;
    await tx.productVariant.updateMany({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
  }
  await tx.order.update({ where: { id: order.id }, data: { stockDeducted: false } });
}

async function releaseCoupon(tx: Prisma.TransactionClient, order: { couponId: string | null }) {
  if (!order.couponId) return;
  await tx.coupon.updateMany({ where: { id: order.couponId, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
}

// ---------- criação ----------
export interface CheckoutResult {
  orderNumber: string;
  accessToken: string;
  status: string;
  totalCents: number;
  payment: {
    method: "PIX" | "CREDIT_CARD" | "BOLETO";
    status: string;
    statusDetail?: string;
    pix?: { qrCode: string; qrCodeBase64: string; expiresAt: string | null };
    boletoUrl?: string;
  };
}

/**
 * Tudo que importa é recalculado aqui: itens (preço/estoque), frete (nova cotação), cupom e total.
 * O front só envia IDs, quantidades e a opção de frete escolhida.
 */
export async function createOrderAndPay(input: CheckoutInput, user: SessionUser | null): Promise<CheckoutResult> {
  const settings = await getSettings();
  const { lines, problems } = await resolveCartLines(input.items);
  if (problems.length) throw new HttpError(409, problems[0], { problems });
  if (!lines.length) throw new HttpError(400, "Seu carrinho está vazio.");

  const quote = await quoteShipping(input.address.cep, lines, settings);
  const option = quote.options.find((o) => o.id === input.shippingOptionId);
  if (!option) throw new HttpError(409, "A opção de frete escolhida não está mais disponível. Escolha novamente.");

  let discountCents = 0;
  let couponId: string | undefined;
  let couponCode: string | undefined;
  if (input.couponCode) {
    const c = await checkCoupon(input.couponCode, quote.subtotalCents);
    if (!c.ok) throw new HttpError(400, c.reason);
    discountCents = c.discountCents;
    couponId = "couponId" in c ? c.couponId : undefined;
    couponCode = "code" in c ? c.code : undefined;
  }

  const totals = computeTotals({ lines, shippingCents: option.priceCents, discountCents });
  if (totals.totalCents < 500) throw new HttpError(400, "O valor mínimo para pagamento é R$ 5,00.");

  const order = await prisma.$transaction(async (tx) => {
    if (couponId) {
      // incremento condicional: duas compras simultâneas não estouram maxUses
      const coupon = await tx.coupon.findUnique({ where: { id: couponId } });
      const updated = await tx.coupon.updateMany({
        where: { id: couponId, ...(coupon?.maxUses != null ? { usedCount: { lt: coupon.maxUses } } : {}) },
        data: { usedCount: { increment: 1 } },
      });
      if (updated.count === 0) throw new HttpError(400, "Este cupom atingiu o limite de usos.");
    }
    return tx.order.create({
      data: {
        userId: user?.id ?? null,
        guestEmail: user ? null : input.customer.email,
        customerName: input.customer.name,
        customerEmail: input.customer.email,
        customerPhone: input.customer.phone,
        customerCpf: input.customer.cpf,
        subtotalCents: totals.subtotalCents,
        shippingCents: totals.shippingCents,
        discountCents: totals.discountCents,
        totalCents: totals.totalCents,
        deliveryMethod: option.id === PICKUP_OPTION_ID ? "PICKUP" : "SHIPPING",
        shippingService: `${option.carrier} ${option.name}`.trim(),
        shippingDays: option.days || null,
        couponId,
        couponCode,
        paymentMethod: input.payment.method,
        installments: input.payment.method === "CREDIT_CARD" ? input.payment.installments : null,
        shippingAddress: { ...input.address, complement: input.address.complement || null },
        items: {
          create: lines.map((l) => ({
            variantId: l.variantId,
            productName: l.productName,
            finishName: l.finishName,
            unitPriceCents: l.unitPriceCents,
            quantity: l.quantity,
            imageUrl: l.imageUrl,
          })),
        },
      },
      include: orderInclude,
    });
  });

  const number = formatOrderNumber(order.seq);
  const [first, ...rest] = input.customer.name.split(/\s+/);

  let payment: MpPayment;
  try {
    payment = await createPayment({
      orderId: order.id,
      orderNumber: number,
      amountCents: order.totalCents,
      method: input.payment.method,
      payer: {
        email: input.customer.email,
        firstName: first,
        lastName: rest.join(" ") || first,
        cpf: input.customer.cpf,
        address: {
          zip: input.address.cep,
          street: input.address.street,
          number: input.address.number,
          neighborhood: input.address.neighborhood,
          city: input.address.city,
          state: input.address.state,
        },
      },
      card:
        input.payment.method === "CREDIT_CARD"
          ? {
              token: input.payment.token,
              paymentMethodId: input.payment.paymentMethodId,
              installments: Math.min(input.payment.installments, settings.maxInstallments),
              issuerId: input.payment.issuerId,
            }
          : undefined,
    });
  } catch (err) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED", paymentStatus: "error" } });
      await releaseCoupon(tx, order);
    });
    console.error(`[checkout] pagamento falhou no pedido ${number}`, err);
    throw new HttpError(502, "Não foi possível processar o pagamento agora. Tente novamente ou escolha outra forma de pagamento.");
  }

  const td = payment.point_of_interaction?.transaction_data;
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentId: String(payment.id),
      paymentStatus: payment.status,
      pixQrCode: td?.qr_code ?? null,
      pixQrCodeBase64: td?.qr_code_base64 ?? null,
      pixExpiresAt: input.payment.method === "PIX" && payment.date_of_expiration ? new Date(payment.date_of_expiration) : null,
      boletoUrl: payment.transaction_details?.external_resource_url ?? td?.ticket_url ?? null,
    },
    include: orderInclude,
  });

  // cartão aprovado na hora: não espera o webhook para confirmar
  let finalOrder = updated;
  if (payment.status === "approved") {
    finalOrder = (await applyPaymentStatus(order.id, payment.status, String(payment.id), `${payment.id}:${payment.status}`)) ?? updated;
  } else if (["rejected", "cancelled"].includes(payment.status)) {
    finalOrder = (await applyPaymentStatus(order.id, payment.status, String(payment.id), `${payment.id}:${payment.status}`)) ?? updated;
  } else {
    void sendMail({ to: order.customerEmail, ...mails.orderCreated(toMailOrder(updated)) });
  }

  return {
    orderNumber: number,
    accessToken: order.accessToken,
    status: finalOrder.status,
    totalCents: finalOrder.totalCents,
    payment: {
      method: input.payment.method,
      status: payment.status,
      statusDetail: payment.status_detail,
      pix: td?.qr_code
        ? { qrCode: td.qr_code, qrCodeBase64: td.qr_code_base64 ?? "", expiresAt: updated.pixExpiresAt?.toISOString() ?? null }
        : undefined,
      boletoUrl: updated.boletoUrl ?? undefined,
    },
  };
}

// ---------- webhook / transições ----------
/**
 * Aplica o status do pagamento ao pedido de forma IDEMPOTENTE:
 * o par (pagamento:status) é gravado em PaymentEvent (unique) na mesma transação; reentregas do webhook viram no-op.
 */
export async function applyPaymentStatus(
  orderId: string,
  mpStatus: string,
  paymentId: string,
  eventKey: string,
): Promise<OrderWithItems | null> {
  let becamePaid = false;

  const result = await prisma.$transaction(async (tx) => {
      // skipDuplicates → INSERT ... ON CONFLICT DO NOTHING: reentregas do webhook viram no-op sem erro/ruído.
      // Se duas entregas chegarem juntas, a segunda espera a primeira commitar e então pula.
      const claimed = await tx.paymentEvent.createMany({ data: [{ externalId: eventKey }], skipDuplicates: true });
      if (claimed.count === 0) return null; // já processado

      const order = await tx.order.findUnique({ where: { id: orderId }, include: orderInclude });
      if (!order) return null;

      await tx.order.update({ where: { id: order.id }, data: { paymentId, paymentStatus: mpStatus } });

      if (mpStatus === "approved" && (order.status === "AWAITING_PAYMENT" || order.status === "CANCELLED")) {
        await tx.order.update({ where: { id: order.id }, data: { status: "PAID", paidAt: new Date() } });
        if (order.status === "CANCELLED") {
          // pagamento aprovado depois de expirar/cancelar: reabre o uso do cupom
          if (order.couponId) await tx.coupon.update({ where: { id: order.couponId }, data: { usedCount: { increment: 1 } } });
        }
        await deductStock(tx, order);
        becamePaid = true;
      } else if (["rejected", "cancelled"].includes(mpStatus) && order.status === "AWAITING_PAYMENT") {
        await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
        await releaseCoupon(tx, order);
      } else if (["refunded", "charged_back"].includes(mpStatus) && ["PAID", "IN_PRODUCTION"].includes(order.status)) {
        await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
        await restoreStock(tx, order);
        await releaseCoupon(tx, order);
      }
      return tx.order.findUnique({ where: { id: order.id }, include: orderInclude });
    });

  if (result && becamePaid) {
    await sendMail({ to: result.customerEmail, ...mails.paymentApproved(toMailOrder(result)) });
  }
  return result;
}

// ---------- admin ----------
export async function adminUpdateOrder(
  id: string,
  patch: { status?: OrderWithItems["status"]; trackingCode?: string | null },
) {
  const current = await prisma.order.findUnique({ where: { id }, include: orderInclude });
  if (!current) throw new HttpError(404, "Pedido não encontrado.");

  const nextStatus = patch.status ?? current.status;
  const nextTracking = patch.trackingCode === undefined ? current.trackingCode : patch.trackingCode || null;

  if (nextStatus === "SHIPPED" && current.deliveryMethod === "SHIPPING" && !nextTracking) {
    throw new HttpError(400, "Informe o código de rastreio para marcar como enviado.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const data: Prisma.OrderUpdateInput = { trackingCode: nextTracking };
    if (nextStatus !== current.status) {
      data.status = nextStatus;
      if (nextStatus === "PAID" && !current.paidAt) data.paidAt = new Date();
    }
    await tx.order.update({ where: { id }, data });

    const wasLive = ["PAID", "IN_PRODUCTION", "SHIPPED", "DELIVERED"].includes(current.status);
    const isLive = ["PAID", "IN_PRODUCTION", "SHIPPED", "DELIVERED"].includes(nextStatus);
    if (!wasLive && isLive) await deductStock(tx, current);
    if (wasLive && nextStatus === "CANCELLED") {
      await restoreStock(tx, current);
      await releaseCoupon(tx, current);
    }
    return tx.order.findUniqueOrThrow({ where: { id }, include: orderInclude });
  });

  const justShipped = updated.status === "SHIPPED" && (current.status !== "SHIPPED" || current.trackingCode !== updated.trackingCode);
  if (justShipped) await sendMail({ to: updated.customerEmail, ...mails.orderShipped(toMailOrder(updated)) });
  if (updated.status === "PAID" && current.status !== "PAID" && !current.paidAt) {
    await sendMail({ to: updated.customerEmail, ...mails.paymentApproved(toMailOrder(updated)) });
  }
  return updated;
}
