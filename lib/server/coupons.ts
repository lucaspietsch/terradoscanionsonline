import "server-only";
import { prisma, hasDatabase } from "@/lib/db";
import { evaluateCoupon, type CouponCheck } from "@/lib/totals";

export const normalizeCouponCode = (c: string) => c.trim().toUpperCase().replace(/\s+/g, "");

export async function checkCoupon(
  code: string,
  subtotalCents: number,
): Promise<(CouponCheck & { couponId?: string; code?: string }) | { ok: false; reason: string }> {
  if (!hasDatabase) return { ok: false, reason: "Cupom inválido." };
  const c = await prisma.coupon.findUnique({ where: { code: normalizeCouponCode(code) } });
  if (!c) return { ok: false, reason: "Cupom inválido." };
  const result = evaluateCoupon(
    {
      code: c.code,
      type: c.type,
      value: c.value,
      active: c.active,
      startsAt: c.startsAt,
      expiresAt: c.expiresAt,
      maxUses: c.maxUses,
      usedCount: c.usedCount,
      minSubtotalCents: c.minSubtotalCents,
    },
    subtotalCents,
  );
  return result.ok ? { ...result, couponId: c.id, code: c.code } : result;
}
