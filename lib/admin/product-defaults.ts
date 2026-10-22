import { BASE_FINISH_SLUGS } from "@/lib/catalog/seed-data";
interface Opt { id: string; name: string; slug?: string }

export interface ProductFormValues {
  id?: string;
  name: string; slug: string; categoryId: string; shortDescription: string; longDescription: string;
  priceCents: number; heightCm: number; widthCm: number; depthCm: number | null; round: boolean; weightGrams: number;
  hasDrainage: boolean; featured: boolean; active: boolean; badge: string | null; plants: string[]; sortOrder: number;
  stocks: Record<string, number>;
  /** acabamentos que o produto realmente tem (id do acabamento → "em breve" + foto) */
  options: Record<string, { comingSoon: boolean; imageUrl: string | null }>;
  images: { url: string; alt: string }[];
}

export const emptyProduct = (categoryId: string, finishes: Opt[]): ProductFormValues => ({
  name: "", slug: "", categoryId, shortDescription: "", longDescription: "", priceCents: 3500, heightCm: 12, widthCm: 12, depthCm: 12, round: true,
  weightGrams: 1000, hasDrainage: true, featured: true, active: true, badge: null, plants: [], sortOrder: 99,
  stocks: Object.fromEntries(finishes.map((f) => [f.id, 0])),
  options: Object.fromEntries(finishes.filter((f) => f.slug && BASE_FINISH_SLUGS.includes(f.slug)).map((f) => [f.id, { comingSoon: false, imageUrl: null }])),
  images: [],
});

