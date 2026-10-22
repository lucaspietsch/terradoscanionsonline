/**
 * Popula categorias, acabamentos, os produtos (com estoque por acabamento) e configurações padrão.
 * Idempotente: pode rodar várias vezes (atualiza por slug).
 *
 *   npm run db:seed
 */
import "../scripts/load-env";
import { PrismaClient } from "@prisma/client";
import { REMOVED_CATEGORY_SLUGS, REMOVED_PRODUCT_SLUGS } from "../lib/catalog/removed";
import { BASE_FINISH_SLUGS, SEED_CATEGORIES, SEED_FINISHES, SEED_PRODUCTS } from "../lib/catalog/seed-data";

const prisma = new PrismaClient();

async function main() {
  // retira os exemplos antigos (só os slugs conhecidos — produtos criados no admin nunca são tocados)
  const del = await prisma.product.deleteMany({ where: { slug: { in: REMOVED_PRODUCT_SLUGS } } });
  const delCat = await prisma.category.deleteMany({ where: { slug: { in: REMOVED_CATEGORY_SLUGS }, products: { none: {} } } });
  if (del.count || delCat.count) console.log(`Removidos: ${del.count} produto(s) e ${delCat.count} categoria(s) de exemplo.`);

  const finishes = new Map<string, string>();
  for (const f of SEED_FINISHES) {
    const row = await prisma.finish.upsert({ where: { slug: f.slug }, create: { name: f.name, slug: f.slug, hex: f.hex, hex2: f.hex2 ?? null }, update: { name: f.name, hex: f.hex, hex2: f.hex2 ?? null } });
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
      const soon = p.comingSoonFinishes?.[finishSlug];
      if (!soon && !(p.finishes ?? BASE_FINISH_SLUGS).includes(finishSlug)) continue;
      await prisma.productVariant.upsert({
        where: { productId_finishId: { productId: product.id, finishId } },
        create: { productId: product.id, finishId, stock: soon ? 0 : p.stockPerFinish, sku: `${p.slug}-${finishSlug}`.toUpperCase(), comingSoon: Boolean(soon), imageUrl: soon?.url ?? p.finishImages?.[finishSlug] ?? null },
        // não sobrescreve estoque já ajustado pelo admin; "em breve" e foto seguem o catálogo
        update: soon ? { comingSoon: true, imageUrl: soon.url, stock: 0 } : { imageUrl: p.finishImages?.[finishSlug] ?? null },
      });
    }
    // opções "em breve" que saíram do catálogo (ex.: premium que virou produto próprio)
    await prisma.productVariant.deleteMany({
      where: { productId: product.id, comingSoon: true, finish: { slug: { notIn: Object.keys(p.comingSoonFinishes ?? {}) } } },
    });
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
