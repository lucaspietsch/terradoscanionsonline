import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProductCard } from "@/components/shop/product-card";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductPurchase } from "@/components/shop/product-purchase";
import { dimensionsLabel, toCard } from "@/lib/catalog/format";
import { getProductBySlug, getProducts, getRelatedProducts } from "@/lib/data/catalog";
import { getSettings } from "@/lib/data/settings";
import { formatBRL } from "@/lib/money";
import { site } from "@/lib/site";

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    return (await getProducts()).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return {};
  const title = `${p.name} — vaso de cimento feito à mão`;
  const description = `${p.shortDescription} ${formatBRL(p.priceCents)} + frete. ${dimensionsLabel(p)}.`;
  return {
    title,
    description,
    alternates: { canonical: `/vasos/${p.slug}` },
    openGraph: { title, description, type: "website", images: p.images[0] ? [{ url: p.images[0].url, alt: p.images[0].alt }] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, settings] = await Promise.all([getRelatedProducts(product, 3), getSettings()]);
  const inStock = product.variants.some((v) => v.stock > 0);
  const abs = (u: string) => (u.startsWith("http") ? u : `${site.url}${u}`);

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.longDescription,
    image: product.images.map((i) => abs(i.url)),
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: site.name },
    category: product.category.name,
    material: "Cimento",
    offers: {
      "@type": "Offer",
      url: `${site.url}/vasos/${product.slug}`,
      priceCurrency: "BRL",
      price: (product.priceCents / 100).toFixed(2),
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: site.name },
    },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: site.url },
      { "@type": "ListItem", position: 2, name: "Vasos", item: `${site.url}/vasos` },
      { "@type": "ListItem", position: 3, name: product.name, item: `${site.url}/vasos/${product.slug}` },
    ],
  };

  const thresholdLabel = formatBRL(settings.freeShippingThresholdCents).replace(",00", "");

  return (
    <div className="container py-8 md:py-12">
      <nav aria-label="Você está em" className="mb-8 text-sm text-secundario">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-musgo">Início</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/vasos" className="hover:text-musgo">Vasos</Link></li>
          <li aria-hidden>/</li>
          <li><Link href={`/vasos?categoria=${product.category.slug}`} className="hover:text-musgo">{product.category.name}</Link></li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-sombra">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <ProductGallery images={product.images} name={product.name} />
        <ProductPurchase product={product} />
      </div>

      <section className="mx-auto mt-20 max-w-3xl" aria-labelledby="detalhes">
        <h2 id="detalhes" className="sr-only">Detalhes do produto</h2>
        <Accordion type="multiple" defaultValue={["desc"]} className="border-t border-concreto">
          <AccordionItem value="desc">
            <AccordionTrigger>Descrição</AccordionTrigger>
            <AccordionContent><p className="text-base leading-relaxed text-sombra/85">{product.longDescription}</p></AccordionContent>
          </AccordionItem>
          <AccordionItem value="medidas">
            <AccordionTrigger>Medidas e peso</AccordionTrigger>
            <AccordionContent>
              <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 text-base text-sombra/85">
                <dt className="text-secundario">{product.round ? "Altura × diâmetro" : "Altura × largura × profundidade"}</dt>
                <dd>{dimensionsLabel(product)}</dd>
                <dt className="text-secundario">Peso aproximado</dt>
                <dd>{(product.weightGrams / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg</dd>
                <dt className="text-secundario">Furo de drenagem</dt>
                <dd>{product.hasDrainage ? "Sim" : "Não"}</dd>
              </dl>
              <p className="mt-3 text-sm">Medidas aproximadas — por serem feitas à mão, podem variar alguns milímetros.</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="plantas">
            <AccordionTrigger>Plantas indicadas</AccordionTrigger>
            <AccordionContent>
              <ul className="flex flex-wrap gap-2">
                {product.plants.map((pl) => (
                  <li key={pl} className="rounded-full border border-concreto bg-pedra px-3.5 py-1.5 text-sm text-sombra">{pl}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="cuidados">
            <AccordionTrigger>Cuidados com o concreto</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc space-y-1.5 pl-5 text-base text-sombra/85">
                <li>Limpe com pano úmido e sabão neutro; evite buchas abrasivas e ácidos.</li>
                <li>Em áreas externas, aplique impermeabilizante incolor à base de água.</li>
                <li>Use pratinho ou cachepô sobre móveis de madeira: a água de drenagem pode manchá-los.</li>
                <li>Manchas claras (eflorescência) e pequenas variações de tom são naturais do cimento.</li>
              </ul>
              <Link href="/cuidados" className="mt-3 inline-block text-musgo underline underline-offset-4">Guia completo de cuidados</Link>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="entrega">
            <AccordionTrigger>Entrega e trocas</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc space-y-1.5 pl-5 text-base text-sombra/85">
                <li>Todos os preços são + frete; compras com subtotal acima de {thresholdLabel} têm a opção de frete mais econômica grátis.</li>
                <li>Embalagem reforçada para o transporte. Você também pode retirar no local sem custo.</li>
                <li>7 dias para desistir da compra e troca em caso de dano no transporte.</li>
              </ul>
              <Link href="/trocas-e-devolucoes" className="mt-3 inline-block text-musgo underline underline-offset-4">Trocas e devoluções</Link>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {related.length > 0 && (
        <section className="mt-24" aria-labelledby="combina">
          <p className="eyebrow">Combina com</p>
          <h2 id="combina" className="h2-section mt-3 mb-10">Para compor o canto</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6">
            {related.map((r) => (
              <ProductCard key={r.id} product={toCard(r)} />
            ))}
          </div>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
    </div>
  );
}
