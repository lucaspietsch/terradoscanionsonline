export type DiscountType = "PERCENT" | "FIXED";

export interface CouponRule {
  code: string;
  type: DiscountType;
  /** PERCENT: 1–100 · FIXED: centavos */
  value: number;
  active: boolean;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  maxUses?: number | null;
  usedCount: number;
  minSubtotalCents?: number | null;
}

export type CouponCheck =
  | { ok: true; discountCents: number }
  | { ok: false; reason: string };

export function evaluateCoupon(coupon: CouponRule, subtotalCents: number, now = new Date()): CouponCheck {
  if (!coupon.active) return { ok: false, reason: "Este cupom não está ativo." };
  if (coupon.startsAt && now < coupon.startsAt) return { ok: false, reason: "Este cupom ainda não começou." };
  if (coupon.expiresAt && now > coupon.expiresAt) return { ok: false, reason: "Este cupom expirou." };
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses)
    return { ok: false, reason: "Este cupom atingiu o limite de usos." };
  if (coupon.minSubtotalCents && subtotalCents < coupon.minSubtotalCents)
    return { ok: false, reason: "O subtotal não atinge o valor mínimo deste cupom." };

  const raw =
    coupon.type === "PERCENT" ? Math.floor((subtotalCents * coupon.value) / 100) : Math.round(coupon.value);
  // Nunca maior que o subtotal: o desconto não zera nem negativa o frete.
  return { ok: true, discountCents: Math.max(0, Math.min(raw, subtotalCents)) };
}

export interface Totals {
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
}

export function computeTotals(input: {
  lines: { unitPriceCents: number; quantity: number }[];
  shippingCents: number;
  discountCents: number;
}): Totals {
  const subtotalCents = input.lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  const discountCents = Math.min(Math.max(0, input.discountCents), subtotalCents);
  const shippingCents = Math.max(0, input.shippingCents);
  return {
    subtotalCents,
    shippingCents,
    discountCents,
    totalCents: subtotalCents - discountCents + shippingCents,
  };
}

export function formatOrderNumber(seq: number): string {
  return `CB-${String(seq).padStart(4, "0")}`;
}

export function parseOrderNumber(number: string): number | null {
  const m = /^CB-(\d{1,9})$/i.exec(number.trim());
  return m ? Number(m[1]) : null;
}
