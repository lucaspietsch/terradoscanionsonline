import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/server/auth";
import type { ProductInput } from "@/lib/validators";

/** Cria (id = null) ou atualiza um produto com imagens e estoque por acabamento. */
export async function saveProduct(id: string | null, input: ProductInput): Promise<string> {
  const { variants, images, ...fields } = input;
  const finishes = await prisma.finish.findMany({ where: { id: { in: variants.map((v) => v.finishId) } } });

  try {
    return await prisma.$transaction(async (tx) => {
      const product = id
        ? await tx.product.update({ where: { id }, data: fields })
        : await tx.product.create({ data: fields });

      await tx.productImage.deleteMany({ where: { productId: product.id } });
      if (images.length) {
        await tx.productImage.createMany({ data: images.map((i, order) => ({ productId: product.id, url: i.url, alt: i.alt, order })) });
      }

      const keep: string[] = [];
      for (const v of variants) {
        const finish = finishes.find((f) => f.id === v.finishId);
        if (!finish) continue;
        keep.push(v.finishId);
        await tx.productVariant.upsert({
          where: { productId_finishId: { productId: product.id, finishId: v.finishId } },
          create: { productId: product.id, finishId: v.finishId, stock: v.stock, sku: `${product.slug}-${finish.slug}`.toUpperCase() },
          update: { stock: v.stock },
        });
      }
      await tx.productVariant.deleteMany({ where: { productId: product.id, finishId: { notIn: keep } } });
      return product.id;
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new HttpError(409, "Já existe um produto com este slug.");
    }
    throw e;
  }
}
