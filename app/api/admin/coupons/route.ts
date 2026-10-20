import { Prisma } from "@prisma/client";
import { api, json, parseBody } from "@/lib/server/api";
import { prisma } from "@/lib/db";
import { couponInputSchema } from "@/lib/validators";
import { HttpError } from "@/lib/server/auth";

export const GET = api(async () => json({ coupons: await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }) }), { admin: true });

export const POST = api(
  async (req) => {
    const c = await parseBody(req, couponInputSchema);
    try {
      const created = await prisma.coupon.create({
        data: {
          code: c.code, type: c.type, value: c.value, active: c.active,
          startsAt: c.startsAt ? new Date(c.startsAt) : null,
          expiresAt: c.expiresAt ? new Date(c.expiresAt) : null,
          maxUses: c.maxUses ?? null,
          minSubtotalCents: c.minSubtotalCents ?? null,
        },
      });
      return json({ coupon: created }, { status: 201 });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new HttpError(409, "Já existe um cupom com este código.");
      throw e;
    }
  },
  { admin: true },
);
