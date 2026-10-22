"use client";
import { useCallback, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import { FinishDot } from "@/components/shop/finish-selector";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SIZE_BINS, filterAndSort, type SortKey } from "@/lib/catalog/filter";
import { formatBRL } from "@/lib/money";
import { replaceQuery } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import type { CategoryDTO, FinishDTO, ProductCardDTO } from "@/types";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "relevancia", label: "Relevância" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
  { value: "novidades", label: "Novidades" },
];

export interface CatalogState {
  categoria: string;
  preco: number[];
  tamanho: string;
  acabamento: string;
  ordem: SortKey;
}

export function CatalogBrowser({ products, categories, finishes, initial }: { products: ProductCardDTO[]; categories: CategoryDTO[]; finishes: FinishDTO[]; initial: CatalogState }) {
  // Estado inicial vem do servidor (a URL), então o HTML já traz a lista filtrada — bom para SEO e sem "flash".
  const [state, setState] = useState<CatalogState>(initial);

  // Atualiza a URL sem nova requisição ao servidor (o catálogo inteiro já está no cliente).
  const update = useCallback((patch: Record<string, string | number[] | null>) => {
    setState((prev) => {
      const next = { ...prev, ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, v ?? (k === "preco" ? [] : k === "ordem" ? "relevancia" : "")])) } as CatalogState;
      const q = new URLSearchParams();
      if (next.categoria) q.set("categoria", next.categoria);
      if (next.preco.length) q.set("preco", next.preco.join(","));
      if (next.tamanho) q.set("tamanho", next.tamanho);
      if (next.acabamento) q.set("acabamento", next.acabamento);
      if (next.ordem !== "relevancia") q.set("ordem", next.ordem);
      replaceQuery(q.toString());
      return next;
    });
  }, []);

  const prices = useMemo(() => [...new Set(products.map((p) => p.priceCents))].sort((a, b) => a - b), [products]);
  const list = useMemo(
    () => filterAndSort(products, { categoria: state.categoria || undefined, preco: state.preco, tamanho: state.tamanho || undefined, acabamento: state.acabamento || undefined, ordem: state.ordem }),
    [products, state],
  );
  const activeCount = (state.categoria ? 1 : 0) + state.preco.length + (state.tamanho ? 1 : 0) + (state.acabamento ? 1 : 0);
  const currentCategory = categories.find((c) => c.slug === state.categoria);

  const filters = (
    <div className="space-y-9">
      <FilterGroup title="Categoria">
        <RadioRow checked={!state.categoria} onClick={() => update({ categoria: null })} label="Todas" />
        {categories.map((c) => (
          <RadioRow key={c.id} checked={state.categoria === c.slug} onClick={() => update({ categoria: c.slug })} label={c.name} />
        ))}
      </FilterGroup>
      <FilterGroup title="Preço">
        {prices.map((p) => (
          <label key={p} className="flex cursor-pointer items-center gap-3 py-1.5 text-[0.9375rem]">
            <input
              type="checkbox"
              className="h-4 w-4 accent-musgo"
              checked={state.preco.includes(p)}
              onChange={(e) => update({ preco: e.target.checked ? [...state.preco, p] : state.preco.filter((x) => x !== p) })}
            />
            {formatBRL(p).replace(",00", "")}
          </label>
        ))}
      </FilterGroup>
      <FilterGroup title="Tamanho (altura)">
        <RadioRow checked={!state.tamanho} onClick={() => update({ tamanho: null })} label="Todos" />
        {SIZE_BINS.map((b) => (
          <RadioRow key={b.value} checked={state.tamanho === b.value} onClick={() => update({ tamanho: b.value })} label={b.label} />
        ))}
      </FilterGroup>
      <FilterGroup title="Acabamento">
        <RadioRow checked={!state.acabamento} onClick={() => update({ acabamento: null })} label="Todos" />
        {finishes.map((f) => (
          <RadioRow key={f.id} checked={state.acabamento === f.slug} onClick={() => update({ acabamento: f.slug })} label={f.name} adornment={<FinishDot hex={f.hex} />} />
        ))}
      </FilterGroup>
      {activeCount > 0 && (
        <button type="button" onClick={() => update({ categoria: null, preco: null, tamanho: null, acabamento: null })} className="text-sm text-secundario underline underline-offset-4 hover:text-musgo">
          Limpar filtros
        </button>
      )}
    </div>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-14">
      <aside className="hidden lg:block" aria-label="Filtros">
        {filters}
      </aside>

      <div>
        <div className="mb-8 flex items-center justify-between gap-4 border-b border-concreto pb-5">
          <p className="text-sm text-secundario" aria-live="polite">
            {currentCategory ? <span className="text-sombra">{currentCategory.name} · </span> : null}
            {list.length} {list.length === 1 ? "vaso" : "vasos"}
          </p>
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" size="sm" className="lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Filtros{activeCount ? ` (${activeCount})` : ""}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" aria-describedby="filters-desc">
                <div className="border-b border-concreto px-6 py-5">
                  <SheetTitle className="font-serif text-2xl font-light">Filtros</SheetTitle>
                  <SheetDescription id="filters-desc" className="sr-only">Filtrar vasos por categoria, preço, tamanho e acabamento.</SheetDescription>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-6">{filters}</div>
                <div className="border-t border-concreto px-6 py-4">
                  <SheetClose asChild>
                    <Button className="w-full">Ver {list.length} {list.length === 1 ? "vaso" : "vasos"}</Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
            <label className="flex items-center gap-2 text-sm text-secundario">
              <span className="sr-only sm:not-sr-only">Ordenar</span>
              <Select value={state.ordem} onChange={(e) => update({ ordem: e.target.value })} className="h-9 w-auto min-w-40 py-0 text-sm" aria-label="Ordenar por">
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </label>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-serif text-2xl font-light">Nenhum vaso com esses filtros</p>
            <Button variant="secondary" className="mt-6" onClick={() => update({ categoria: null, preco: null, tamanho: null, acabamento: null })}>
              <X className="h-4 w-4" aria-hidden /> Limpar filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 xl:grid-cols-3 xl:gap-x-6">
            {list.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 3} headingLevel="h2" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="eyebrow mb-3">{title}</legend>
      <div className="space-y-0.5">{children}</div>
    </fieldset>
  );
}

function RadioRow({ checked, onClick, label, adornment }: { checked: boolean; onClick: () => void; label: string; adornment?: React.ReactNode }) {
  return (
    <button type="button" role="radio" aria-checked={checked} onClick={onClick} className={cn("flex w-full items-center gap-3 py-1.5 text-left text-[0.9375rem] transition-colors", checked ? "text-musgo" : "text-sombra/80 hover:text-musgo")}>
      <span className={cn("flex h-4 w-4 items-center justify-center rounded-full border", checked ? "border-musgo" : "border-concreto")} aria-hidden>
        {checked && <span className="h-2 w-2 rounded-full bg-musgo" />}
      </span>
      {adornment}
      <span className={checked ? "font-normal" : ""}>{label}</span>
    </button>
  );
}
