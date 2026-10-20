import { z } from "zod";
import { api, json, parseBody } from "@/lib/server/api";
import { prisma, hasDatabase } from "@/lib/db";
import { getSessionUser, HttpError } from "@/lib/server/auth";
import { cartLineSchema } from "@/lib/validators";

/** Carrinho do usuário logado (sincroniza com o Zustand do navegador). */
export const GET = api(async () => {
  const user = await getSessionUser();
  if (!user || !hasDatabase) return json({ items: [] });
  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: { include: { variant: true } } },
  });
  return json({
    items: (cart?.items ?? []).map((i) => ({ productId: i.variant.productId, finishId: i.variant.finishId, quantity: i.quantity })),
  });
});

export const PUT = api(
  async (req) => {
    const user = await getSessionUser();
    if (!user) throw new HttpError(401, "Não autenticado.");
    if (!hasDatabase) return json({ ok: true });
    const { items } = await parseBody(req, z.object({ items: z.array(cartLineSchema).max(40) }));
    const variants = await prisma.productVariant.findMany({
      where: { OR: items.map((i) => ({ productId: i.productId, finishId: i.finishId })) },
      select: { id: true, productId: true, finishId: true },
    });
    const rows = items.flatMap((i) => {
      const v = variants.find((x) => x.productId === i.productId && x.finishId === i.finishId);
      return v ? [{ variantId: v.id, quantity: i.quantity }] : [];
    });
    await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      if (rows.length) await tx.cartItem.createMany({ data: rows.map((r) => ({ ...r, cartId: cart.id })) });
    });
    return json({ ok: true });
  },
  { rate: { limit: 60, windowMs: 60_000 } },
);
