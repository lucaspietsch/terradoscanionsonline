import type { ProductCardDTO } from "@/types";

export type SortKey = "relevancia" | "menor-preco" | "maior-preco" | "novidades";

export interface CatalogFilters {
  categoria?: string;
  preco?: number[]; // centavos
  tamanho?: string; // "pequeno" | "medio" | "grande"
  acabamento?: string; // slug
  ordem?: SortKey;
  q?: string;
}

export const SIZE_BINS = [
  { value: "ate-15", label: "Até 15 cm de altura", test: (h: number) => h <= 15 },
  { value: "16-25", label: "16 a 25 cm", test: (h: number) => h > 15 && h <= 25 },
  { value: "acima-25", label: "Acima de 25 cm", test: (h: number) => h > 25 },
] as const;

export const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function filterAndSort(products: ProductCardDTO[], f: CatalogFilters): ProductCardDTO[] {
  let list = products.filter((p) => {
    if (f.categoria && p.categorySlug !== f.categoria) return false;
    if (f.preco?.length && !f.preco.includes(p.priceCents)) return false;
    if (f.tamanho) {
      const bin = SIZE_BINS.find((b) => b.value === f.tamanho);
      if (bin && !bin.test(p.heightCm)) return false;
    }
    if (f.acabamento && !p.finishes.some((x) => x.slug === f.acabamento)) return false;
    if (f.q) {
      const q = norm(f.q);
      if (!norm(`${p.name} ${p.categoryName}`).includes(q)) return false;
    }
    return true;
  });

  switch (f.ordem) {
    case "menor-preco":
      list = [...list].sort((a, b) => a.priceCents - b.priceCents || a.sortOrder - b.sortOrder);
      break;
    case "maior-preco":
      list = [...list].sort((a, b) => b.priceCents - a.priceCents || a.sortOrder - b.sortOrder);
      break;
    case "novidades":
      list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.sortOrder - b.sortOrder);
      break;
    default:
      list = [...list].sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return list;
}
