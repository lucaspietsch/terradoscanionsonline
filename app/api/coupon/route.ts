import { api, json, parseBody } from "@/lib/server/api";
import { couponCheckSchema } from "@/lib/validators";
import { resolveCartLines } from "@/lib/data/catalog";
import { checkCoupon } from "@/lib/server/coupons";
import { HttpError } from "@/lib/server/auth";

export const POST = api(
  async (req) => {
    const { code, items } = await parseBody(req, couponCheckSchema);
    const { lines } = await resolveCartLines(items);
    const subtotal = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
    const result = await checkCoupon(code, subtotal);
    if (!result.ok) throw new HttpError(400, result.reason);
    return json({ code: result.code, discountCents: result.discountCents });
  },
  { rate: { limit: 20, windowMs: 60_000 } },
);
