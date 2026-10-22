import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { ProductCard } from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";
import type { ProductCardDTO } from "@/types";

export function FeaturedProducts({ products }: { products: ProductCardDTO[] }) {
  return (
    <section className="pb-20 md:pb-28" aria-labelledby="feat-title">
      <div className="container">
        <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="eyebrow">Em destaque</p>
            <h2 id="feat-title" className="h2-section mt-3">Vasos feitos um a um</h2>
          </div>
          <Button asChild variant="secondary">
            <Link href="/vasos#produtos">Ver todos</Link>
          </Button>
        </Reveal>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
          {products.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 0.06}>
              <ProductCard product={p} priority={i < 4} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
