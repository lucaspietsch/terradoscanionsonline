import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { formatBRL } from "@/lib/money";
import type { CategoryDTO, ProductCardDTO } from "@/types";

export function Categories({ categories, products }: { categories: CategoryDTO[]; products: ProductCardDTO[] }) {
  return (
    <section className="section-y" aria-labelledby="cat-title">
      <div className="container">
        <Reveal className="mb-12 max-w-xl">
          <p className="eyebrow">Coleção</p>
          <h2 id="cat-title" className="h2-section mt-3">Para cada canto da casa</h2>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((c, i) => {
            const prices = products.filter((p) => p.categorySlug === c.slug).map((p) => p.priceCents);
            const min = prices.length ? Math.min(...prices) : null;
            return (
              <Reveal key={c.id} delay={i * 0.08}>
                <Link href={`/vasos?categoria=${c.slug}#produtos`} className="group relative block aspect-[4/5] overflow-hidden rounded bg-pedra" data-dark>
                  {c.imageUrl && (
                    <Image src={c.imageUrl} alt={c.imageAlt ?? c.name} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-700 ease-out group-hover:scale-[1.03]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-sombra/80 via-sombra/10 to-transparent" aria-hidden />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-pedra">
                    <div>
                      <h3 className="font-serif text-2xl font-light !text-pedra">{c.name}</h3>
                      {min != null && <p className="mt-1 text-sm text-nevoa/85">a partir de {formatBRL(min).replace(",00", "")}</p>}
                    </div>
                    <ArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.5} aria-hidden />
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
