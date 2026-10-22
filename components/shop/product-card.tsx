import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import { FinishDot } from "@/components/shop/finish-dot";
import { Price } from "@/components/shop/price";
import { dimensionsLabel } from "@/lib/catalog/format";
import type { ProductCardDTO } from "@/types";

/** Card de produto — componente sem estado (renderiza no servidor quando possível). */
export function ProductCard({ product, priority = false, headingLevel: Heading = "h3" }: { product: ProductCardDTO; priority?: boolean; headingLevel?: "h2" | "h3" }) {
  const [first, second] = product.images;

  return (
    <article className="group flex h-full flex-col">
      <Link href={`/vasos/${product.slug}`} className="relative block overflow-hidden rounded bg-pedra" aria-label={`Ver ${product.name}`}>
        <div className="relative aspect-[4/5] bg-[#e3e0d9]">
          {first && (
            <Image
              src={first.url}
              alt={first.alt}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 25vw, 50vw"
              className={`object-cover transition duration-700 ease-out group-hover:scale-[1.03] ${second ? "group-hover:opacity-0" : ""}`}
            />
          )}
          {second && (
            <Image src={second.url} alt={second.alt} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover opacity-0 transition duration-700 ease-out group-hover:scale-[1.03] group-hover:opacity-100" />
          )}
        </div>
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          <Badge tone="outline" className="bg-pedra/90 backdrop-blur-sm">Feito à mão</Badge>
          {product.badge && <Badge tone="dark">{product.badge}</Badge>}
        </div>
      </Link>

      <div className="mt-4 flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Heading className="font-serif text-lg font-light leading-snug">
            <Link href={`/vasos/${product.slug}`} className="hover:text-musgo">
              {product.name}
            </Link>
          </Heading>
          <ul className="mt-1.5 flex shrink-0 -space-x-1" aria-label="Acabamentos disponíveis">
            {product.finishes.filter((f) => !f.comingSoon).map((f) => (
              <li key={f.id}>
                <FinishDot hex={f.hex} hex2={f.hex2} className="h-3.5 w-3.5 ring-2 ring-nevoa" />
                <span className="sr-only">{f.name}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-0.5 text-sm text-secundario">{dimensionsLabel(product)}</p>
        {product.finishes.some((f) => f.comingSoon) && <p className="mt-0.5 text-xs text-secundario">+ {product.finishes.filter((f) => f.comingSoon).length} cores em breve</p>}
        <Price cents={product.priceCents} className="mt-2" />
        <div className="mt-4 flex-1" />
        <AddToCartButton product={product} />
      </div>
    </article>
  );
}
