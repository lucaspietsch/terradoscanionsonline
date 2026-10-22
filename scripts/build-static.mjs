/**
 * Gera a VERSÃO ESTÁTICA do site em ./dist-static (HTML + JS + CSS + imagens), para hospedar em qualquer lugar
 * (Netlify, GitHub Pages, Vercel, Hostinger, bucket S3…). Não precisa de servidor nem de banco.
 *
 *   npm run build:static
 *   NEXT_PUBLIC_APP_URL=https://www.seudominio.com.br NEXT_PUBLIC_ORIGIN_CEP=95000000 npm run build:static
 *
 * Funciona: catálogo, filtros, páginas de produto, carrinho, cálculo de frete (tabela por região), regra de frete grátis,
 * pedido pelo WhatsApp, páginas institucionais. NÃO existe nesta versão: login, painel admin, pedidos salvos, pagamento online,
 * newsletter e formulário de contato (usam o WhatsApp).
 * O site deve ficar na RAIZ do domínio (ex.: https://seudominio.com.br/), não em subpasta.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const tmp = path.join(root, ".static-build");
const dist = path.join(root, "dist-static");

fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });

// 1) copia o projeto (sem node_modules/.next/.git/saídas)
const skip = new Set(["node_modules", ".next", ".git", ".static-build", "dist-static", "out", "assets", "tests", "package-lock.json"]);
for (const entry of fs.readdirSync(root)) {
  if (skip.has(entry)) continue;
  fs.cpSync(path.join(root, entry), path.join(tmp, entry), { recursive: true });
}
fs.symlinkSync(path.join(root, "node_modules"), path.join(tmp, "node_modules"), "junction");

// 2) remove o que depende de servidor
for (const p of ["middleware.ts", "app/admin", "app/api", "app/auth", "app/(loja)/conta", "app/(loja)/pedido"]) {
  fs.rmSync(path.join(tmp, p), { recursive: true, force: true });
}

// rotas de metadados (manifest/robots/sitemap) precisam ser marcadas como estáticas
for (const f of ["app/manifest.ts", "app/robots.ts", "app/sitemap.ts"]) {
  const fp = path.join(tmp, f);
  const txt = fs.readFileSync(fp, "utf8").replace(/export const revalidate = \d+;\n/, "");
  fs.writeFileSync(fp, txt + '\nexport const dynamic = "force-static";\n');
}

// 3) configuração de exportação estática
fs.writeFileSync(
  path.join(tmp, "next.config.mjs"),
  `/** @type {import('next').NextConfig} */
export default { output: "export", trailingSlash: true, images: { unoptimized: true }, poweredByHeader: false, reactStrictMode: true };
`,
);

// 4) catálogo: filtros lidos da URL no navegador (a página não pode depender de searchParams no servidor)
fs.writeFileSync(
  path.join(tmp, "components/shop/static-catalog.tsx"),
  `"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CatalogBrowser, type CatalogState } from "@/components/shop/catalog-browser";
import { SIZE_BINS, type SortKey } from "@/lib/catalog/filter";
import type { CategoryDTO, FinishDTO, ProductCardDTO } from "@/types";

const SORTS: SortKey[] = ["relevancia", "menor-preco", "maior-preco", "novidades"];
type Props = { products: ProductCardDTO[]; categories: CategoryDTO[]; finishes: FinishDTO[] };
const EMPTY: CatalogState = { categoria: "", preco: [], tamanho: "", acabamento: "", ordem: "relevancia" };

function FromUrl(props: Props) {
  const sp = useSearchParams();
  const initial: CatalogState = {
    categoria: props.categories.some((c) => c.slug === sp.get("categoria")) ? sp.get("categoria")! : "",
    preco: (sp.get("preco") ?? "").split(",").map(Number).filter((n) => Number.isFinite(n) && n > 0),
    tamanho: SIZE_BINS.some((b) => b.value === sp.get("tamanho")) ? sp.get("tamanho")! : "",
    acabamento: props.finishes.some((f) => f.slug === sp.get("acabamento")) ? sp.get("acabamento")! : "",
    ordem: SORTS.includes(sp.get("ordem") as SortKey) ? (sp.get("ordem") as SortKey) : "relevancia",
  };
  return <CatalogBrowser key={JSON.stringify(initial)} {...props} initial={initial} />;
}

export function StaticCatalog(props: Props) {
  return (
    <Suspense fallback={<CatalogBrowser {...props} initial={EMPTY} />}>
      <FromUrl {...props} />
    </Suspense>
  );
}
`,
);
fs.writeFileSync(
  path.join(tmp, "app/(loja)/vasos/page.tsx"),
  `import type { Metadata } from "next";
import { StaticCatalog } from "@/components/shop/static-catalog";
import { getCategories, getFinishes, getProductCards } from "@/lib/data/catalog";

export const metadata: Metadata = {
  title: "Vasos de cimento",
  description: "Vasos de concreto feitos à mão a partir de R$ 24,90. Frete grátis acima de R$ 160.",
  alternates: { canonical: "/vasos/" },
};

export default async function CatalogPage() {
  const [products, categories, finishes] = await Promise.all([getProductCards(), getCategories(), getFinishes()]);
  return (
    <div className="container py-12 md:py-16">
      <header className="mb-10 max-w-2xl">
        <p className="eyebrow">Coleção</p>
        <h1 className="h1-display mt-3 !text-5xl md:!text-6xl">Vasos de cimento</h1>
        <p className="mt-4 text-lg text-secundario">Peças de concreto feitas à mão, em vários formatos e acabamentos.</p>
      </header>
      <div id="produtos">
        <StaticCatalog products={products} categories={categories} finishes={finishes} />
      </div>
    </div>
  );
}
`,
);

// 5) liga a "API" do navegador no layout da loja
const layoutPath = path.join(tmp, "app/(loja)/layout.tsx");
let layout = fs.readFileSync(layoutPath, "utf8");
layout = layout.replace('import { SiteConfigProvider } from "@/components/site-config";', 'import { SiteConfigProvider } from "@/components/site-config";\nimport { StaticApiShim } from "@/components/static-api-shim";');
layout = layout.replace("<AnnouncementBar text={announcement} />", "<StaticApiShim />\n        <AnnouncementBar text={announcement} />");
fs.writeFileSync(layoutPath, layout);

// 6) build com ambiente limpo (modo demonstração: sem banco/Supabase/Mercado Pago)
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1" };
for (const k of ["DATABASE_URL", "DIRECT_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "MERCADOPAGO_ACCESS_TOKEN", "NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY"]) delete env[k];
const r = spawnSync("npx", ["next", "build"], { cwd: tmp, env, stdio: "inherit" });
if (r.status !== 0) process.exit(r.status ?? 1);

// 7) resultado
fs.rmSync(dist, { recursive: true, force: true });
fs.cpSync(path.join(tmp, "out"), dist, { recursive: true });
fs.cpSync(path.join(root, "scripts/static-extras"), dist, { recursive: true });
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\nPronto: ${path.relative(root, dist)}/ (abra index.html servindo a pasta na RAIZ de um domínio).`);
