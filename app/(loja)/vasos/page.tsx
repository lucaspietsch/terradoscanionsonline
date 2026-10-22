import type { Metadata } from "next";
import { CatalogBrowser, type CatalogState } from "@/components/shop/catalog-browser";
import { SIZE_BINS, type SortKey } from "@/lib/catalog/filter";
import { getCategories, getFinishes, getProductCards } from "@/lib/data/catalog";

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const SORTS: SortKey[] = ["relevancia", "menor-preco", "maior-preco", "novidades"];

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const categoria = first((await searchParams).categoria);
  const categories = await getCategories();
  const cat = categories.find((c) => c.slug === categoria);
  const title = cat ? `${cat.name} — vasos de cimento` : "Vasos de cimento";
  return {
    title,
    description: "Vasos de concreto feitos à mão a partir de R$ 24,90, em vários formatos e acabamentos. Frete grátis acima de R$ 160.",
    // filtros combinados não geram páginas indexáveis; só a categoria tem canonical própria
    alternates: { canonical: cat ? `/vasos?categoria=${cat.slug}` : "/vasos" },
  };
}

/** Dinâmica por causa dos filtros na URL: o servidor já devolve o HTML filtrado. */
export default async function CatalogPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [products, categories, finishes] = await Promise.all([getProductCards(), getCategories(), getFinishes()]);

  const ordem = first(sp.ordem) as SortKey;
  const initial: CatalogState = {
    categoria: categories.some((c) => c.slug === first(sp.categoria)) ? first(sp.categoria) : "",
    preco: first(sp.preco).split(",").map(Number).filter((n) => Number.isFinite(n) && n > 0),
    tamanho: SIZE_BINS.some((b) => b.value === first(sp.tamanho)) ? first(sp.tamanho) : "",
    acabamento: finishes.some((f) => f.slug === first(sp.acabamento)) ? first(sp.acabamento) : "",
    ordem: SORTS.includes(ordem) ? ordem : "relevancia",
  };
  const current = categories.find((c) => c.slug === initial.categoria);

  return (
    <div className="container py-12 md:py-16">
      <header className="mb-10 max-w-2xl">
        <p className="eyebrow">Coleção</p>
        <h1 className="h1-display mt-3 !text-5xl md:!text-6xl">{current ? current.name : "Vasos de cimento"}</h1>
        <p className="mt-4 text-lg text-secundario">Peças de concreto feitas à mão, em vários formatos e acabamentos.</p>
      </header>
      <div id="produtos">
        <CatalogBrowser products={products} categories={categories} finishes={finishes} initial={initial} />
      </div>
    </div>
  );
}
