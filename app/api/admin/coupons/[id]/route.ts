import { api, json, parseBody } from "@/lib/server/api";
import { prisma } from "@/lib/db";
import { couponInputSchema } from "@/lib/validators";

export const PUT = api<{ params: Promise<{ id: string }> }>(
  async (req, { params }) => {
    const { id } = await params;
    const c = await parseBody(req, couponInputSchema);
    await prisma.coupon.update({
      where: { id },
      data: {
        code: c.code, type: c.type, value: c.value, active: c.active,
        startsAt: c.startsAt ? new Date(c.startsAt) : null,
        expiresAt: c.expiresAt ? new Date(c.expiresAt) : null,
        maxUses: c.maxUses ?? null,
        minSubtotalCents: c.minSubtotalCents ?? null,
      },
    });
    return json({ ok: true });
  },
  { admin: true },
);

export const DELETE = api<{ params: Promise<{ id: string }> }>(
  async (_req, { params }) => {
    const { id } = await params;
    await prisma.coupon.delete({ where: { id } });
    return json({ ok: true });
  },
  { admin: true },
);
