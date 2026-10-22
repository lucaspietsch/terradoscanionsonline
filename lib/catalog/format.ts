import type { ProductCardDTO, ProductDTO } from "@/types";

const n = (v: number) => String(Number.isInteger(v) ? v : v.toString().replace(".", ","));

type Dim = Pick<ProductDTO, "heightCm" | "widthCm" | "depthCm" | "round">;

/** "12 × Ø14 cm" (redondo) ou "14 × 20 × 20 cm" (altura × largura × profundidade) */
export function dimensionsLabel(p: Dim): string {
  return p.round || p.depthCm == null
    ? `${n(p.heightCm)} × Ø${n(p.widthCm)} cm`
    : `${n(p.heightCm)} × ${n(p.widthCm)} × ${n(p.depthCm)} cm`;
}

export function toCard(p: ProductDTO): ProductCardDTO {
  const finishes = p.variants.map((v) => ({
    id: v.finish.id,
    slug: v.finish.slug,
    name: v.finish.name,
    hex: v.finish.hex,
    hex2: v.finish.hex2 ?? null,
    stock: v.stock,
    comingSoon: v.comingSoon,
  }));
  const firstInStock = finishes.find((f) => f.stock > 0 && !f.comingSoon);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    priceCents: p.priceCents,
    heightCm: p.heightCm,
    widthCm: p.widthCm,
    depthCm: p.depthCm,
    round: p.round,
    badge: p.badge,
    featured: p.featured,
    sortOrder: p.sortOrder,
    createdAt: p.createdAt,
    categorySlug: p.category.slug,
    categoryName: p.category.name,
    images: p.images.slice(0, 2),
    finishes,
    defaultFinishId: (firstInStock ?? finishes.find((f) => !f.comingSoon) ?? finishes[0])?.id ?? null,
    inStock: Boolean(firstInStock),
  };
}
