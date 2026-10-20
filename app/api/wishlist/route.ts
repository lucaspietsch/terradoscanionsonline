import { z } from "zod";
import { api, json, parseBody } from "@/lib/server/api";
import { prisma, hasDatabase } from "@/lib/db";
import { getSessionUser, HttpError } from "@/lib/server/auth";

export const GET = api(async () => {
  const user = await getSessionUser();
  if (!user || !hasDatabase) return json({ productIds: [] });
  const rows = await prisma.wishlistItem.findMany({ where: { userId: user.id }, select: { productId: true } });
  return json({ productIds: rows.map((r) => r.productId) });
});

/** Alterna (adiciona/remove) um produto da lista de desejos. */
export const POST = api(
  async (req) => {
    const user = await getSessionUser();
    if (!user) throw new HttpError(401, "Entre na sua conta para salvar favoritos.");
    if (!hasDatabase) throw new HttpError(503, "Indisponível no momento.");
    const { productId } = await parseBody(req, z.object({ productId: z.string().min(1).max(64) }));
    const key = { userId_productId: { userId: user.id, productId } };
    const existing = await prisma.wishlistItem.findUnique({ where: key });
    if (existing) await prisma.wishlistItem.delete({ where: key });
    else await prisma.wishlistItem.create({ data: { userId: user.id, productId } });
    return json({ saved: !existing });
  },
  { rate: { limit: 60, windowMs: 60_000 } },
);
