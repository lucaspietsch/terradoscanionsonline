/**
 * Teste de integração do fluxo de pedidos contra um PostgreSQL real.
 * Só roda com TEST_DATABASE_URL apontando para um banco já com `prisma db push` + `npm run db:seed`:
 *
 *   TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cambara_test npm test
 *
 * O Mercado Pago e o Resend são simulados; nenhuma chamada externa acontece.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const url = process.env.TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;

const sendMail = vi.fn(async () => true);
const createPayment = vi.fn();

vi.mock("@/lib/server/mail", async (orig) => ({ ...(await orig<typeof import("@/lib/server/mail")>()), sendMail }));
vi.mock("@/lib/server/mercadopago", async (orig) => ({ ...(await orig<typeof import("@/lib/server/mercadopago")>()), createPayment }));

type Orders = typeof import("@/lib/server/orders");
let orders: Orders;
let prisma: typeof import("@/lib/db").prisma;
let ids: { cambara: string; semente: string; natural: string; grafite: string };

const customer = { name: "Maria da Silva", email: "maria@example.com", cpf: "52998224725", phone: "41999998888" };
const address = { cep: "80010000", street: "Rua das Flores", number: "100", complement: "", neighborhood: "Centro", city: "Curitiba", state: "PR" };
const pix = { method: "PIX" as const };

let seq = 1000;
function mpPending(id = ++seq) {
  return { id, status: "pending", date_of_expiration: new Date(Date.now() + 30 * 60_000).toISOString(), point_of_interaction: { transaction_data: { qr_code: "000201pix", qr_code_base64: "QUJD" } } };
}

async function checkout(over: Record<string, unknown> = {}) {
  return orders.createOrderAndPay(
    {
      customer, address,
      items: [{ productId: ids.cambara, finishId: ids.natural, quantity: 1 }],
      shippingOptionId: "table:pac",
      couponCode: "",
      payment: pix,
      ...over,
    } as Parameters<Orders["createOrderAndPay"]>[0],
    null,
  );
}

suite("fluxo de pedidos (PostgreSQL)", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    process.env.DIRECT_URL = url;
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-token";
    orders = await import("@/lib/server/orders");
    prisma = (await import("@/lib/db")).prisma;
    const [natural, grafite, category] = await Promise.all([
      prisma.finish.findUniqueOrThrow({ where: { slug: "cimento-natural" } }),
      prisma.finish.findUniqueOrThrow({ where: { slug: "grafite" } }),
      prisma.category.findFirstOrThrow(),
    ]);
    // produto de teste próprio (R$ 80,00): os testes não dependem do catálogo real
    await prisma.product.deleteMany({ where: { slug: "produto-teste-80" } });
    const fixture = await prisma.product.create({
      data: {
        name: "Produto de teste", slug: "produto-teste-80", shortDescription: "x", longDescription: "x", priceCents: 8000,
        heightCm: 35, widthCm: 22, depthCm: 22, weightGrams: 7500, categoryId: category.id,
        variants: { create: [{ finishId: natural.id, stock: 10, sku: "TESTE-80-NAT" }, { finishId: grafite.id, stock: 10, sku: "TESTE-80-GRA" }] },
      },
    });
    ids = { cambara: fixture.id, semente: fixture.id, natural: natural.id, grafite: grafite.id };
  });

  beforeEach(async () => {
    sendMail.mockClear();
    createPayment.mockReset();
    seq = 1000;
    createPayment.mockImplementation(async () => mpPending());
    await prisma.paymentEvent.deleteMany();
    await prisma.order.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.productVariant.updateMany({ data: { stock: 10 } });
    await prisma.setting.upsert({ where: { key: "free_shipping_threshold" }, create: { key: "free_shipping_threshold", value: "16000" }, update: { value: "16000" } });
  });

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { slug: "produto-teste-80" } });
    await prisma.$disconnect();
  });

  it("subtotal abaixo/igual a R$ 160: cobra frete; total = subtotal + frete (calculado no servidor)", async () => {
    // 2 × R$ 80 = R$ 160,00 exatos → NÃO é frete grátis
    const r = await checkout({ items: [{ productId: ids.cambara, finishId: ids.natural, quantity: 2 }] });
    const o = await prisma.order.findFirstOrThrow({ include: { items: true } });
    expect(o.subtotalCents).toBe(16000);
    expect(o.shippingCents).toBeGreaterThan(0);
    expect(o.totalCents).toBe(16000 + o.shippingCents);
    expect(r.orderNumber).toMatch(/^CB-\d{4}$/);
    expect(r.status).toBe("AWAITING_PAYMENT");
    expect(createPayment).toHaveBeenCalledWith(expect.objectContaining({ amountCents: o.totalCents, method: "PIX" }));
  });

  it("subtotal acima de R$ 160: a opção econômica sai grátis", async () => {
    await checkout({ items: [{ productId: ids.cambara, finishId: ids.natural, quantity: 3 }] }); // R$ 240
    const o = await prisma.order.findFirstOrThrow();
    expect(o.subtotalCents).toBe(24000);
    expect(o.shippingCents).toBe(0);
    expect(o.totalCents).toBe(24000);
  });

  it("opções de frete inexistentes/adulteradas são rejeitadas", async () => {
    await expect(checkout({ shippingOptionId: "table:gratis-hacker" })).rejects.toMatchObject({ status: 409 });
    expect(await prisma.order.count()).toBe(0);
  });

  it("retirada no local custa R$ 0", async () => {
    await checkout({ shippingOptionId: "pickup" });
    const o = await prisma.order.findFirstOrThrow();
    expect(o.deliveryMethod).toBe("PICKUP");
    expect(o.shippingCents).toBe(0);
  });

  it("estoque insuficiente bloqueia o pedido", async () => {
    await prisma.productVariant.updateMany({ where: { productId: ids.cambara, finishId: ids.natural }, data: { stock: 1 } });
    await expect(checkout({ items: [{ productId: ids.cambara, finishId: ids.natural, quantity: 2 }] })).rejects.toMatchObject({ status: 409 });
    expect(await prisma.order.count()).toBe(0);
  });

  it("cupom percentual é aplicado no servidor e conta o uso; frete grátis usa o subtotal ANTES do desconto", async () => {
    await prisma.coupon.create({ data: { code: "VERDE10", type: "PERCENT", value: 10, maxUses: 5 } });
    await checkout({ items: [{ productId: ids.cambara, finishId: ids.natural, quantity: 3 }], couponCode: "verde10" });
    const o = await prisma.order.findFirstOrThrow();
    expect(o.discountCents).toBe(2400);
    expect(o.shippingCents).toBe(0); // subtotal 240 > 160, mesmo após o cupom
    expect(o.totalCents).toBe(24000 - 2400);
    expect((await prisma.coupon.findUniqueOrThrow({ where: { code: "VERDE10" } })).usedCount).toBe(1);
  });

  it("cupom esgotado/expirado é recusado", async () => {
    await prisma.coupon.create({ data: { code: "ULTIMO", type: "FIXED", value: 1000, maxUses: 1, usedCount: 1 } });
    await expect(checkout({ couponCode: "ULTIMO" })).rejects.toMatchObject({ status: 400 });
    await prisma.coupon.create({ data: { code: "VELHO", type: "FIXED", value: 1000, expiresAt: new Date("2020-01-01") } });
    await expect(checkout({ couponCode: "VELHO" })).rejects.toMatchObject({ status: 400 });
  });

  it("falha no Mercado Pago cancela o pedido e devolve o uso do cupom", async () => {
    await prisma.coupon.create({ data: { code: "VERDE10", type: "PERCENT", value: 10 } });
    createPayment.mockRejectedValueOnce(new Error("MP fora do ar"));
    await expect(checkout({ couponCode: "VERDE10" })).rejects.toMatchObject({ status: 502 });
    expect((await prisma.order.findFirstOrThrow()).status).toBe("CANCELLED");
    expect((await prisma.coupon.findUniqueOrThrow({ where: { code: "VERDE10" } })).usedCount).toBe(0);
  });

  it("webhook aprovado: marca como pago, baixa o estoque UMA vez (idempotente) e envia e-mail", async () => {
    await checkout({ items: [{ productId: ids.cambara, finishId: ids.natural, quantity: 2 }] });
    const order = await prisma.order.findFirstOrThrow();
    const stock = async () => (await prisma.productVariant.findFirstOrThrow({ where: { productId: ids.cambara, finishId: ids.natural } })).stock;
    expect(await stock()).toBe(10); // ainda não baixou

    await orders.applyPaymentStatus(order.id, "approved", "1001", "1001:approved");
    await orders.applyPaymentStatus(order.id, "approved", "1001", "1001:approved"); // reentrega do webhook
    await orders.applyPaymentStatus(order.id, "approved", "1001", "1001:approved");

    const after = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(after.status).toBe("PAID");
    expect(after.stockDeducted).toBe(true);
    expect(after.paidAt).not.toBeNull();
    expect(await stock()).toBe(8);
    expect(sendMail.mock.calls.filter((c) => (c as unknown[])[0] && JSON.stringify(c).includes("Pagamento aprovado"))).toHaveLength(1);
  });

  it("webhook recusado em pedido aguardando: cancela e libera o cupom", async () => {
    await prisma.coupon.create({ data: { code: "VERDE10", type: "PERCENT", value: 10 } });
    await checkout({ couponCode: "VERDE10" });
    const order = await prisma.order.findFirstOrThrow();
    await orders.applyPaymentStatus(order.id, "rejected", "1001", "1001:rejected");
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("CANCELLED");
    expect((await prisma.coupon.findUniqueOrThrow({ where: { code: "VERDE10" } })).usedCount).toBe(0);
  });

  it("cartão aprovado na hora já confirma o pedido", async () => {
    createPayment.mockResolvedValueOnce({ id: 2002, status: "approved", status_detail: "accredited" });
    const r = await checkout({ payment: { method: "CREDIT_CARD", token: "tok_12345678", paymentMethodId: "visa", installments: 3 } });
    expect(r.status).toBe("PAID");
    expect(createPayment).toHaveBeenCalledWith(expect.objectContaining({ card: expect.objectContaining({ installments: 3 }) }));
  });

  it("parcelas: o schema rejeita >3x e o serviço nunca envia mais que o máximo configurado", async () => {
    const { checkoutSchema } = await import("@/lib/validators");
    const base = { customer, address, items: [{ productId: "a", finishId: "b", quantity: 1 }], shippingOptionId: "pickup", couponCode: "" };
    expect(checkoutSchema.safeParse({ ...base, payment: { method: "CREDIT_CARD", token: "tok_12345678", paymentMethodId: "visa", installments: 12 } }).success).toBe(false);

    createPayment.mockResolvedValueOnce({ id: 3003, status: "pending" });
    await checkout({ payment: { method: "CREDIT_CARD", token: "tok_12345678", paymentMethodId: "visa", installments: 12 } });
    expect(createPayment).toHaveBeenCalledWith(expect.objectContaining({ card: expect.objectContaining({ installments: 3 }) }));
  });

  it("admin: enviado exige rastreio; ao enviar com código dispara e-mail; cancelar devolve estoque", async () => {
    await checkout();
    const order = await prisma.order.findFirstOrThrow();
    await orders.applyPaymentStatus(order.id, "approved", "1001", "1001:approved");
    sendMail.mockClear();

    await expect(orders.adminUpdateOrder(order.id, { status: "SHIPPED" })).rejects.toMatchObject({ status: 400 });
    await orders.adminUpdateOrder(order.id, { status: "SHIPPED", trackingCode: "AA123456789BR" });
    expect(JSON.stringify(sendMail.mock.calls)).toContain("AA123456789BR");

    const stockBefore = (await prisma.productVariant.findFirstOrThrow({ where: { productId: ids.cambara, finishId: ids.natural } })).stock;
    await orders.adminUpdateOrder(order.id, { status: "CANCELLED" });
    const stockAfter = (await prisma.productVariant.findFirstOrThrow({ where: { productId: ids.cambara, finishId: ids.natural } })).stock;
    expect(stockAfter).toBe(stockBefore + 1);
  });

  it("numeração sequencial legível CB-0001…", async () => {
    await checkout();
    await checkout();
    const list = await prisma.order.findMany({ orderBy: { seq: "asc" } });
    expect(list[1].seq).toBe(list[0].seq + 1);
  });
});
