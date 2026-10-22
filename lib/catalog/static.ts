/** Catálogo estático (sem banco): usado no modo demonstração, no seed e na versão estática do site. Sem dependência de Prisma. */
import { BASE_FINISH_SLUGS, SEED_CATEGORIES, SEED_FINISHES, SEED_PRODUCTS } from "@/lib/catalog/seed-data";
import type { CategoryDTO, FinishDTO, ProductDTO } from "@/types";

export const staticFinishes: FinishDTO[] = SEED_FINISHES.map((f) => ({ id: f.slug, ...f }));
export const staticCategories: CategoryDTO[] = SEED_CATEGORIES.map((c) => ({
  id: c.slug,
  name: c.name,
  slug: c.slug,
  imageUrl: c.imageUrl,
  imageAlt: c.imageAlt,
}));

export const staticProducts: ProductDTO[] = SEED_PRODUCTS.map((p) => {
  const cat = staticCategories.find((c) => c.slug === p.category)!;
  return {
    id: p.slug,
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription,
    longDescription: p.longDescription,
    priceCents: p.priceCents,
    heightCm: p.heightCm,
    widthCm: p.widthCm,
    depthCm: p.depthCm,
    round: p.round,
    weightGrams: p.weightGrams,
    hasDrainage: p.hasDrainage,
    featured: true,
    active: true,
    badge: p.badge,
    plants: p.plants,
    sortOrder: p.sortOrder,
    createdAt: new Date(2025, 0, p.sortOrder).toISOString(),
    category: { id: cat.id, name: cat.name, slug: cat.slug },
    images: p.images.map((i, order) => ({ ...i, order })),
    variants: (p.finishes ?? BASE_FINISH_SLUGS).flatMap((slug) => staticFinishes.filter((f) => f.slug === slug)).map((finish) => ({
      id: `${p.slug}:${finish.slug}`,
      finish,
      stock: p.stockPerFinish,
      sku: `${p.slug}-${finish.slug}`.toUpperCase(),
    })),
  };
});

