"use client";
import Image from "next/image";
import { Plus } from "lucide-react";
import { Fragment } from "react";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { FreeShippingBar } from "@/components/shop/free-shipping-bar";
import { useSiteConfig } from "@/components/site-config";
import { COMBOS } from "@/lib/combos";
import { useCart } from "@/lib/cart-store";
import { toCartItem } from "@/lib/cart-helpers";
import { formatBRL } from "@/lib/money";
import type { ProductCardDTO } from "@/types";

export function BuildGarden({ products }: { products: ProductCardDTO[] }) {
  const addMany = useCart((s) => s.addMany);
  const { freeShippingThresholdCents } = useSiteConfig();

  const combos = COMBOS.map((c) => {
    const items = c.slugs.map((s) => products.find((p) => p.slug === s)).filter((p): p is ProductCardDTO => Boolean(p));
    return { ...c, items, total: items.reduce((n, p) => n + p.priceCents, 0), complete: items.length === c.slugs.length };
  }).filter((c) => c.complete);

  if (!combos.length) return null;

  return (
    <section className="section-y" aria-labelledby="garden-title">
      <div className="container">
        <Reveal className="mb-12 max-w-xl">
          <p className="eyebrow">Combinações</p>
          <h2 id="garden-title" className="h2-section mt-3">Monte seu jardim</h2>
          <p className="mt-4 text-secundario">Sugestões que funcionam bem juntas. Passou de {formatBRL(freeShippingThresholdCents).replace(",00", "")}, o frete é por nossa conta.</p>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-2">
          {combos.map((c, i) => (
            <Reveal key={c.id} delay={(i % 2) * 0.08}>
              <article className="flex h-full flex-col rounded border border-concreto bg-pedra p-6 md:p-8">
                <div className="flex items-center gap-2">
                  {c.items.map((p, idx) => (
                    <Fragment key={p.id}>
                      {idx > 0 && <Plus className="h-4 w-4 shrink-0 text-salvia" strokeWidth={1.5} aria-hidden />}
                      <div className="relative aspect-square w-full max-w-[110px] overflow-hidden rounded bg-nevoa">
                        {p.images[0] && <Image src={p.images[0].url} alt={p.images[0].alt} fill sizes="110px" className="object-cover" />}
                      </div>
                    </Fragment>
                  ))}
                </div>
                <h3 className="mt-6 font-serif text-2xl font-light">{c.name}</h3>
                <p className="mt-1 text-sm text-secundario">{c.items.map((p) => p.name).join(" + ")}</p>
                <p className="mt-3 text-[0.9375rem] text-secundario">{c.description}</p>
                <p className="mt-5 flex items-baseline gap-2">
                  <span className="font-serif text-3xl font-light">{formatBRL(c.total)}</span>
                  <span className="text-xs uppercase tracking-[0.18em] text-secundario">+ frete</span>
                </p>
                <FreeShippingBar className="mt-4 !bg-nevoa" subtotalCents={c.total} thresholdCents={freeShippingThresholdCents} />
                <Button
                  className="mt-6 w-full sm:w-auto sm:self-start"
                  onClick={() =>
                    addMany(
                      c.items.flatMap((p) => {
                        const f = p.finishes.find((x) => x.id === p.defaultFinishId);
                        return f && f.stock > 0 ? [{ ...toCartItem(p, f), quantity: 1 }] : [];
                      }),
                    )
                  }
                  disabled={c.items.some((p) => !p.inStock)}
                >
                  Adicionar conjunto ao carrinho
                </Button>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
