/**
 * Popula categorias, acabamentos, os 10 produtos (com estoque por acabamento) e configurações padrão.
 * Idempotente: pode rodar várias vezes (atualiza por slug).
 *
 *   npm run db:seed
 */
import "../scripts/load-env";
import { PrismaClient } from "@prisma/client";
import { BASE_FINISH_SLUGS, SEED_CATEGORIES, SEED_FINISHES, SEED_PRODUCTS } from "../lib/catalog/seed-data";

const prisma = new PrismaClient();

async function main() {
  const finishes = new Map<string, string>();
  for (const f of SEED_FINISHES) {
    const row = await prisma.finish.upsert({ where: { slug: f.slug }, create: f, update: { name: f.name, hex: f.hex } });
    finishes.set(f.slug, row.id);
  }

  const categories = new Map<string, string>();
  for (const c of SEED_CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      create: { name: c.name, slug: c.slug, imageUrl: c.imageUrl, imageAlt: c.imageAlt, order: c.order },
      update: { name: c.name, imageUrl: c.imageUrl, imageAlt: c.imageAlt, order: c.order },
    });
    categories.set(c.slug, row.id);
  }

  for (const p of SEED_PRODUCTS) {
    const data = {
      name: p.name,
      shortDescription: p.shortDescription,
      longDescription: p.longDescription,
      priceCents: p.priceCents,
      heightCm: p.heightCm,
      widthCm: p.widthCm,
      depthCm: p.depthCm,
      round: p.round,
      weightGrams: p.weightGrams,
      hasDrainage: p.hasDrainage,
      badge: p.badge,
      plants: p.plants,
      sortOrder: p.sortOrder,
      categoryId: categories.get(p.category)!,
    };
    const product = await prisma.product.upsert({ where: { slug: p.slug }, create: { slug: p.slug, ...data }, update: data });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: p.images.map((img, order) => ({ productId: product.id, url: img.url, alt: img.alt, order })),
    });

    for (const [finishSlug, finishId] of finishes) {
      if (!(p.finishes ?? BASE_FINISH_SLUGS).includes(finishSlug)) continue;
      await prisma.productVariant.upsert({
        where: { productId_finishId: { productId: product.id, finishId } },
        create: { productId: product.id, finishId, stock: p.stockPerFinish, sku: `${p.slug}-${finishSlug}`.toUpperCase() },
        update: {}, // não sobrescreve estoque já ajustado pelo admin
      });
    }
  }

  const defaults: Record<string, string> = {
    free_shipping_threshold: "16000",
    pickup_enabled: "true",
    max_installments: "3",
    announcement: "",
  };
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.setting.upsert({ where: { key }, create: { key, value }, update: {} });
  }

  console.log(`Seed ok: ${SEED_PRODUCTS.length} produtos, ${SEED_FINISHES.length} acabamentos, ${SEED_CATEGORIES.length} categorias.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
