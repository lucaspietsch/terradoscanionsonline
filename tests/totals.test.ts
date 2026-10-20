import { describe, expect, it } from "vitest";
import { computeTotals, evaluateCoupon, formatOrderNumber, parseOrderNumber, type CouponRule } from "@/lib/totals";
import { formatBRL, parseBRLToCents } from "@/lib/money";
import { applyFreeShippingRule, DEFAULT_FREE_SHIPPING_THRESHOLD_CENTS as LIMIT } from "@/lib/shipping";

const coupon = (over: Partial<CouponRule> = {}): CouponRule => ({
  code: "BEMVINDO", type: "PERCENT", value: 10, active: true, usedCount: 0, ...over,
});

describe("cálculo de totais", () => {
  it("subtotal + frete - desconto", () => {
    const t = computeTotals({
      lines: [{ unitPriceCents: 3500, quantity: 2 }, { unitPriceCents: 8000, quantity: 1 }],
      shippingCents: 2400,
      discountCents: 1000,
    });
    expect(t).toEqual({ subtotalCents: 15000, shippingCents: 2400, discountCents: 1000, totalCents: 16400 });
  });
  it("desconto nunca passa do subtotal e valores negativos são ignorados", () => {
    const t = computeTotals({ lines: [{ unitPriceCents: 3500, quantity: 1 }], shippingCents: -50, discountCents: 99999 });
    expect(t).toMatchObject({ discountCents: 3500, shippingCents: 0, totalCents: 0 });
  });
  it("frete grátis considera o subtotal ANTES do cupom", () => {
    const subtotal = 16500;
    const d = evaluateCoupon(coupon({ value: 10 }), subtotal);
    expect(d.ok && d.discountCents).toBe(1650);
    const shipping = applyFreeShippingRule(
      [{ id: "pac", kind: "CARRIER", carrier: "Correios", name: "PAC", priceCents: 2400, days: 8, free: false }],
      subtotal, LIMIT,
    )[0];
    const t = computeTotals({ lines: [{ unitPriceCents: subtotal, quantity: 1 }], shippingCents: shipping.priceCents, discountCents: 1650 });
    expect(t.totalCents).toBe(14850); // subtotal pós-cupom (<160) mas frete já era grátis
  });
});

describe("cupons", () => {
  it("percentual e valor fixo", () => {
    expect(evaluateCoupon(coupon({ value: 15 }), 10000)).toEqual({ ok: true, discountCents: 1500 });
    expect(evaluateCoupon(coupon({ type: "FIXED", value: 2000 }), 10000)).toEqual({ ok: true, discountCents: 2000 });
    expect(evaluateCoupon(coupon({ type: "FIXED", value: 20000 }), 10000)).toEqual({ ok: true, discountCents: 10000 });
  });
  it("valida ativo, validade, usos e mínimo", () => {
    const now = new Date("2026-06-01T12:00:00Z");
    expect(evaluateCoupon(coupon({ active: false }), 1000, now).ok).toBe(false);
    expect(evaluateCoupon(coupon({ expiresAt: new Date("2026-05-01") }), 1000, now).ok).toBe(false);
    expect(evaluateCoupon(coupon({ startsAt: new Date("2026-07-01") }), 1000, now).ok).toBe(false);
    expect(evaluateCoupon(coupon({ maxUses: 5, usedCount: 5 }), 1000, now).ok).toBe(false);
    expect(evaluateCoupon(coupon({ minSubtotalCents: 5000 }), 4999, now).ok).toBe(false);
    expect(evaluateCoupon(coupon({ maxUses: 5, usedCount: 4, minSubtotalCents: 5000 }), 5000, now).ok).toBe(true);
  });
});

describe("dinheiro e numeração", () => {
  it("formata em BRL a partir de centavos", () => {
    expect(formatBRL(3500)).toBe("R$ 35,00");
    expect(formatBRL(16001)).toBe("R$ 160,01");
    expect(formatBRL(123456)).toBe("R$ 1.234,56");
  });
  it("converte texto para centavos", () => {
    expect(parseBRLToCents("35,00")).toBe(3500);
    expect(parseBRLToCents("1.234,56")).toBe(123456);
    expect(parseBRLToCents("19.9")).toBe(1990);
    expect(parseBRLToCents("")).toBe(0);
  });
  it("número do pedido CB-0001", () => {
    expect(formatOrderNumber(1)).toBe("CB-0001");
    expect(formatOrderNumber(12345)).toBe("CB-12345");
    expect(parseOrderNumber("cb-0042")).toBe(42);
    expect(parseOrderNumber("XX-1")).toBeNull();
  });
});
