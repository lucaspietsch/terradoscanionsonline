import { hasDatabase, prisma } from "@/lib/db";
import { staticCategories, staticFinishes, staticProducts } from "@/lib/catalog/static";
import { toCard } from "@/lib/catalog/format";
import type { CartLineInput, CategoryDTO, FinishDTO, ProductCardDTO, ProductDTO, ResolvedLine } from "@/types";

// ---------- Prisma ----------
const productInclude = {
  category: true,
  images: { orderBy: { order: "asc" as const } },
  variants: { include: { finish: true }, orderBy: { finish: { name: "asc" as const } } },
} as const;

type DbProduct = Awaited<ReturnType<typeof prisma.product.findFirstOrThrow<{ include: typeof productInclude }>>>;

function mapProduct(p: DbProduct): ProductDTO {
  return {
    id: p.id,
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
    featured: p.featured,
    active: p.active,
    badge: p.badge,
    plants: p.plants,
    sortOrder: p.sortOrder,
    createdAt: p.createdAt.toISOString(),
    category: { id: p.category.id, name: p.category.name, slug: p.category.slug },
    images: p.images.map((i) => ({ url: i.url, alt: i.alt, order: i.order })),
    variants: p.variants.map((v) => ({
      id: v.id,
      stock: v.stock,
      sku: v.sku,
      comingSoon: v.comingSoon,
      imageUrl: v.imageUrl,
      finish: { id: v.finish.id, name: v.finish.name, slug: v.finish.slug, hex: v.finish.hex, hex2: v.finish.hex2 },
    })),
  };
}

export async function getCategories(): Promise<CategoryDTO[]> {
  if (!hasDatabase) return staticCategories;
  const rows = await prisma.category.findMany({ orderBy: { order: "asc" } });
  return rows.map((c) => ({ id: c.id, name: c.name, slug: c.slug, imageUrl: c.imageUrl, imageAlt: c.imageAlt }));
}

export async function getFinishes(): Promise<FinishDTO[]> {
  if (!hasDatabase) return staticFinishes;
  return prisma.finish.findMany({ orderBy: { name: "asc" } });
}

export async function getProducts(opts: { includeInactive?: boolean } = {}): Promise<ProductDTO[]> {
  if (!hasDatabase) return staticProducts;
  const rows = await prisma.product.findMany({
    where: opts.includeInactive ? undefined : { active: true },
    include: productInclude,
    orderBy: { sortOrder: "asc" },
  });
  return rows.map(mapProduct);
}

export async function getProductCards(): Promise<ProductCardDTO[]> {
  return (await getProducts()).map(toCard);
}

export async function getProductBySlug(slug: string): Promise<ProductDTO | null> {
  if (!hasDatabase) return staticProducts.find((p) => p.slug === slug) ?? null;
  const row = await prisma.product.findFirst({ where: { slug, active: true }, include: productInclude });
  return row ? mapProduct(row) : null;
}

export async function getProductById(id: string): Promise<ProductDTO | null> {
  if (!hasDatabase) return staticProducts.find((p) => p.id === id) ?? null;
  const row = await prisma.product.findUnique({ where: { id }, include: productInclude });
  return row ? mapProduct(row) : null;
}

export async function getRelatedProducts(product: ProductDTO, count = 3): Promise<ProductDTO[]> {
  const all = (await getProducts()).filter((p) => p.id !== product.id);
  const same = all.filter((p) => p.category.slug === product.category.slug);
  const rest = all.filter((p) => p.category.slug !== product.category.slug);
  return [...same, ...rest].slice(0, count);
}

/**
 * Resolve as linhas do carrinho SEMPRE a partir do catálogo do servidor.
 * Preço, peso e medidas nunca vêm do cliente.
 */
export async function resolveCartLines(
  inputs: CartLineInput[],
): Promise<{ lines: ResolvedLine[]; problems: string[] }> {
  const products = await getProducts();
  const lines: ResolvedLine[] = [];
  const problems: string[] = [];

  // agrupa linhas repetidas do mesmo item
  const merged = new Map<string, CartLineInput>();
  for (const i of inputs) {
    const key = `${i.productId}|${i.finishId}`;
    const prev = merged.get(key);
    merged.set(key, prev ? { ...prev, quantity: prev.quantity + i.quantity } : { ...i });
  }

  for (const input of merged.values()) {
    const product = products.find((p) => p.id === input.productId);
    const variant = product?.variants.find((v) => v.finish.id === input.finishId);
    if (!product || !variant) {
      problems.push("Um dos itens do carrinho não está mais disponível.");
      continue;
    }
    if (variant.comingSoon) {
      problems.push(`${product.name} (${variant.finish.name}) ainda não está disponível — em breve.`);
    } else if (variant.stock < input.quantity) {
      problems.push(
        variant.stock > 0
          ? `${product.name} (${variant.finish.name}): só temos ${variant.stock} em estoque.`
          : `${product.name} (${variant.finish.name}) está esgotado.`,
      );
    }
    lines.push({
      productId: product.id,
      productName: product.name,
      slug: product.slug,
      finishId: variant.finish.id,
      finishName: variant.finish.name,
      variantId: variant.id,
      unitPriceCents: product.priceCents,
      quantity: input.quantity,
      stock: variant.stock,
      weightGrams: product.weightGrams,
      heightCm: product.heightCm,
      widthCm: product.widthCm,
      depthCm: product.depthCm ?? product.widthCm,
      imageUrl: product.images[0]?.url ?? null,
    });
  }
  return { lines, problems };
}
