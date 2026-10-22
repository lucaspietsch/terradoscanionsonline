/**
 * Entrada da versão "arquivo único": o mesmo front-end da loja (componentes e CSS), renderizado no navegador com
 * roteamento por hash (#/vasos), catálogo estático embutido e "API" local (frete, busca) — tudo dentro de UM .html.
 */
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Link from "next/link";
import { installStaticApi } from "@/lib/static-api";
import { parseHash, useSearchParams } from "next/navigation";

import { SiteConfigProvider } from "@/components/site-config";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { CartPage } from "@/components/shop/cart-page";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { CatalogBrowser, type CatalogState } from "@/components/shop/catalog-browser";
import { ProductCard } from "@/components/shop/product-card";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductPurchase } from "@/components/shop/product-purchase";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

import { Hero } from "@/components/home/hero";
import { FeaturesMarquee } from "@/components/home/features-marquee";
import { Categories } from "@/components/home/categories";
import { FeaturedProducts } from "@/components/home/featured-products";
import { About } from "@/components/home/about";
import { BuildGarden } from "@/components/home/build-garden";
import { InstagramGallery } from "@/components/home/instagram-gallery";
import { FaqSection } from "@/components/home/faq";
import { PageShell } from "@/components/layout/page-shell";

import Sobre from "@/app/(loja)/sobre/page";
import Cuidados from "@/app/(loja)/cuidados/page";
import Trocas from "@/app/(loja)/trocas-e-devolucoes/page";
import Privacidade from "@/app/(loja)/privacidade/page";
import Termos from "@/app/(loja)/termos/page";

import { SIZE_BINS, type SortKey } from "@/lib/catalog/filter";
import { dimensionsLabel, toCard } from "@/lib/catalog/format";
import { staticCategories, staticFinishes, staticProducts } from "@/lib/catalog/static";
import { formatBRL } from "@/lib/money";
import { DEFAULT_FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/shipping";
import { instagramUrl, site, whatsappUrl } from "@/lib/site";
import type { SiteSettings } from "@/types";

installStaticApi();

const settings: SiteSettings = {
  freeShippingThresholdCents: DEFAULT_FREE_SHIPPING_THRESHOLD_CENTS,
  originCep: site.originCep,
  whatsapp: site.whatsapp,
  instagram: site.instagramHandle,
  announcement: "",
  pickupEnabled: true,
  pickupAddress: site.pickupAddress,
  maxInstallments: 3,
  contactEmail: site.email,
};
const thresholdLabel = formatBRL(settings.freeShippingThresholdCents).replace(",00", "");
const cards = staticProducts.map(toCard);

function Home() {
  return (
    <>
      <Hero />
      <FeaturesMarquee thresholdLabel={thresholdLabel} />
      <Categories categories={staticCategories} products={cards} />
      <FeaturedProducts products={cards} />
      <About />
      <BuildGarden products={cards} />
      <InstagramGallery handle={settings.instagram} />
      <FaqSection thresholdLabel={thresholdLabel} />
    </>
  );
}

const SORTS: SortKey[] = ["relevancia", "menor-preco", "maior-preco", "novidades"];

function Catalog() {
  const sp = useSearchParams();
  const initial: CatalogState = {
    categoria: staticCategories.some((c) => c.slug === sp.get("categoria")) ? sp.get("categoria")! : "",
    preco: (sp.get("preco") ?? "").split(",").map(Number).filter((n) => Number.isFinite(n) && n > 0),
    tamanho: SIZE_BINS.some((b) => b.value === sp.get("tamanho")) ? sp.get("tamanho")! : "",
    acabamento: staticFinishes.some((f) => f.slug === sp.get("acabamento")) ? sp.get("acabamento")! : "",
    ordem: SORTS.includes(sp.get("ordem") as SortKey) ? (sp.get("ordem") as SortKey) : "relevancia",
  };
  const current = staticCategories.find((c) => c.slug === initial.categoria);
  return (
    <div className="container py-12 md:py-16">
      <header className="mb-10 max-w-2xl">
        <p className="eyebrow">Coleção</p>
        <h1 className="h1-display mt-3 !text-5xl md:!text-6xl">{current ? current.name : "Vasos de cimento"}</h1>
        <p className="mt-4 text-lg text-secundario">Peças de concreto feitas à mão, em vários formatos e acabamentos.</p>
      </header>
      <div id="produtos">
        <CatalogBrowser key={sp.toString()} products={cards} categories={staticCategories} finishes={staticFinishes} initial={initial} />
      </div>
    </div>
  );
}

function ProductPage({ slug }: { slug: string }) {
  const product = staticProducts.find((p) => p.slug === slug);
  if (!product) return <NotFound />;
  const same = staticProducts.filter((p) => p.id !== product.id && p.category.slug === product.category.slug);
  const rest = staticProducts.filter((p) => p.id !== product.id && p.category.slug !== product.category.slug);
  const related = [...same, ...rest].slice(0, 3);
  return (
    <div className="container py-8 md:py-12">
      <nav aria-label="Você está em" className="mb-8 text-sm text-secundario">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-musgo">Início</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/vasos#produtos" className="hover:text-musgo">Vasos</Link></li>
          <li aria-hidden>/</li>
          <li><Link href={`/vasos?categoria=${product.category.slug}#produtos`} className="hover:text-musgo">{product.category.name}</Link></li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-sombra">{product.name}</li>
        </ol>
      </nav>
      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <ProductGallery key={product.slug} images={product.images} name={product.name} />
        <ProductPurchase key={product.slug} product={product} />
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
                <dd>{product.weightGrams > 0 ? `${(product.weightGrams / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg` : "A informar"}</dd>
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
                {product.plants.map((pl) => (<li key={pl} className="rounded-full border border-concreto bg-pedra px-3.5 py-1.5 text-sm text-sombra">{pl}</li>))}
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="cuidados">
            <AccordionTrigger>Cuidados com o concreto</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc space-y-1.5 pl-5 text-base text-sombra/85">
                <li>Limpe com pano úmido e sabão neutro; evite buchas abrasivas e ácidos.</li>
                <li>Em áreas externas, aplique impermeabilizante incolor à base de água.</li>
                <li>Use pratinho ou cachepô sobre móveis de madeira.</li>
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

      <section className="mt-24" aria-labelledby="combina">
        <p className="eyebrow">Combina com</p>
        <h2 id="combina" className="h2-section mt-3 mb-10">Para compor o canto</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6">
          {related.map((r) => (<ProductCard key={r.id} product={toCard(r)} />))}
        </div>
      </section>
    </div>
  );
}

function Contato() {
  return (
    <PageShell eyebrow="Contato" title="Vamos conversar" intro="Dúvidas sobre tamanhos, prazos ou encomendas? Fale com a gente pelo WhatsApp — é o canal mais rápido.">
      <p>
        <Button asChild size="lg"><a href={whatsappUrl("Olá! Vim pelo site da Cambará Ornamentais.", settings.whatsapp)} target="_blank" rel="noopener noreferrer">Chamar no WhatsApp</a></Button>
      </p>
      <p>Instagram: <a href={instagramUrl(settings.instagram)} target="_blank" rel="noopener noreferrer">@{settings.instagram}</a></p>
      <p>E-mail: <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a></p>
      {settings.pickupEnabled && <p>Retirada no local: {settings.pickupAddress} — combine o horário antes pelo WhatsApp.</p>}
    </PageShell>
  );
}

function Login() {
  return (
    <PageShell eyebrow="Minha conta" title="Conta indisponível" intro="Nesta versão do site não há login: faça seu pedido pelo carrinho, com o botão do WhatsApp.">
      <p><Button asChild><Link href="/vasos#produtos">Ver vasos</Link></Button></p>
    </PageShell>
  );
}

function NotFound() {
  return (
    <div className="container flex flex-col items-center py-28 text-center">
      <p className="eyebrow">Erro 404</p>
      <h1 className="mt-3 font-serif text-5xl font-light">Esta página não brotou por aqui</h1>
      <Button asChild size="lg" className="mt-8"><Link href="/">Ir para a página inicial</Link></Button>
    </div>
  );
}

const TITLES: Record<string, string> = {
  "/": "Cambará Ornamentais — Vasos de cimento feitos à mão",
  "/vasos": "Vasos de cimento | Cambará Ornamentais",
  "/carrinho": "Carrinho | Cambará Ornamentais",
  "/checkout": "Finalizar pedido | Cambará Ornamentais",
  "/sobre": "Sobre nós | Cambará Ornamentais",
  "/cuidados": "Cuidados com vasos de cimento | Cambará Ornamentais",
  "/contato": "Contato | Cambará Ornamentais",
};

function Route() {
  const { path } = parseHash();
  const clean = path.replace(/\/+$/, "") || "/";
  const m = /^\/vasos\/([^/]+)$/.exec(clean);
  if (m) return <ProductPage slug={m[1]} />;
  switch (clean) {
    case "/": return <Home />;
    case "/vasos": return <Catalog />;
    case "/carrinho": return <CartPage />;
    case "/checkout": return <CheckoutFlow />;
    case "/sobre": return <Sobre />;
    case "/cuidados": return <Cuidados />;
    case "/trocas-e-devolucoes": return <Trocas />;
    case "/privacidade": return <Privacidade />;
    case "/termos": return <Termos />;
    case "/contato": return <Contato />;
    case "/entrar":
    case "/cadastro": return <Login />;
    default: return <NotFound />;
  }
}

function App() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const go = () => {
      setTick((n) => n + 1);
      const frag = (window as unknown as { __pendingScroll?: string }).__pendingScroll;
      (window as unknown as { __pendingScroll?: string }).__pendingScroll = undefined;
      const { path } = parseHash();
      document.title = TITLES[path.replace(/\/+$/, "") || "/"] ?? (path.startsWith("/vasos/") ? `${staticProducts.find((p) => p.slug === path.split("/")[2])?.name ?? "Produto"} | Cambará Ornamentais` : "Cambará Ornamentais");
      const scroll = () => {
        const el = frag ? document.getElementById(frag) : null;
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        else window.scrollTo({ top: 0 });
      };
      setTimeout(scroll, 60);
      // menu/gaveta ainda fechando (trava a rolagem): tenta de novo depois da animação
      if (frag) setTimeout(scroll, 500);
    };
    window.addEventListener("hashchange", go);
    window.addEventListener("cb-nav", go);
    return () => { window.removeEventListener("hashchange", go); window.removeEventListener("cb-nav", go); };
  }, []);

  return (
    <SiteConfigProvider
      value={{
        freeShippingThresholdCents: settings.freeShippingThresholdCents,
        whatsapp: settings.whatsapp,
        instagram: settings.instagram,
        pickupEnabled: settings.pickupEnabled,
        pickupAddress: settings.pickupAddress,
        maxInstallments: settings.maxInstallments,
        mpPublicKey: "",
        checkoutEnabled: false,
        authEnabled: false,
      }}
    >
      <AnnouncementBar text={`Frete grátis em compras acima de ${thresholdLabel}`} />
      <Header />
      <main id="conteudo"><Route /></main>
      <Footer settings={settings} />
      <CartDrawer />
      <WhatsAppButton />
      <CookieBanner />
    </SiteConfigProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
