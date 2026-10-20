export interface FinishDTO {
  id: string;
  name: string;
  slug: string;
  hex: string;
}

export interface ProductImageDTO {
  url: string;
  alt: string;
  order: number;
}

export interface VariantDTO {
  id: string;
  finish: FinishDTO;
  stock: number;
  sku: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  imageAlt: string | null;
}

export interface ProductDTO {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  priceCents: number;
  heightCm: number;
  widthCm: number;
  depthCm: number | null;
  round: boolean;
  weightGrams: number;
  hasDrainage: boolean;
  featured: boolean;
  active: boolean;
  badge: string | null;
  plants: string[];
  sortOrder: number;
  createdAt: string;
  category: Pick<CategoryDTO, "id" | "name" | "slug">;
  images: ProductImageDTO[];
  variants: VariantDTO[];
}

export interface CartLineInput {
  productId: string;
  finishId: string;
  quantity: number;
}

export interface SiteSettings {
  freeShippingThresholdCents: number;
  originCep: string;
  whatsapp: string;
  instagram: string;
  announcement: string;
  pickupEnabled: boolean;
  pickupAddress: string;
  maxInstallments: number;
  contactEmail: string;
}

export interface TestimonialDTO {
  id: string;
  author: string;
  location: string | null;
  text: string;
}

export interface ProductCardDTO {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  heightCm: number;
  widthCm: number;
  depthCm: number | null;
  round: boolean;
  badge: string | null;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  categorySlug: string;
  categoryName: string;
  images: ProductImageDTO[];
  finishes: { id: string; slug: string; name: string; hex: string; stock: number }[];
  defaultFinishId: string | null;
  inStock: boolean;
}

export interface ResolvedLine {
  productId: string;
  productName: string;
  slug: string;
  finishId: string;
  finishName: string;
  variantId: string;
  unitPriceCents: number;
  quantity: number;
  stock: number;
  weightGrams: number;
  heightCm: number;
  widthCm: number;
  depthCm: number;
  imageUrl: string | null;
}
