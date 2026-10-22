/**
 * Gera UM ÚNICO arquivo HTML da loja (dist-single/cambara-ornamentais.html) que abre com duplo clique, sem servidor:
 * CSS, JavaScript (React), fontes e todas as imagens ficam embutidos. Navegação por #, carrinho salvo no navegador,
 * frete por CEP, filtros, busca e pedido pelo WhatsApp funcionam. Não há login, admin nem pagamento online.
 *
 *   npm run build:single
 */
import { build } from "esbuild";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const tmp = path.join(root, ".single-build");
const outDir = path.join(root, "dist-single");
const here = (p) => path.join(root, "scripts/single", p);
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

// 1) CSS (Tailwind, com as classes usadas por TODOS os componentes)
const css = path.join(tmp, "tw.css");
const tw = spawnSync("npx", ["tailwindcss", "-i", "app/globals.css", "-o", css, "--minify"], { cwd: root, stdio: "inherit" });
if (tw.status !== 0) process.exit(tw.status ?? 1);

// 2) JavaScript: o mesmo front-end, com substitutos para next/link, next/image, next/navigation, banco e Supabase
const alias = {
  "next/link": here("shim-link.tsx"),
  "next/image": here("shim-image.tsx"),
  "next/navigation": here("shim-navigation.ts"),
  "@/lib/url-state": here("shim-url-state.ts"),
  "@/lib/db": here("stub-db.ts"),
  "@/lib/supabase/client": here("stub-supabase.ts"),
  "server-only": here("stub-empty.ts"),
};
const aliasPlugin = {
  name: "alias-single",
  setup(b) {
    b.onResolve({ filter: /.*/ }, (args) => (alias[args.path] ? { path: alias[args.path] } : undefined));
  },
};
const js = await build({
  entryPoints: [here("entry.tsx")],
  bundle: true,
  write: false,
  minify: true,
  format: "iife",
  target: "es2019",
  jsx: "automatic",
  platform: "browser",
  legalComments: "none",
  plugins: [aliasPlugin],
  define: { "process.env.NODE_ENV": '"production"' },
  banner: { js: 'var process={env:{NODE_ENV:"production"}};' },
  logLevel: "warning",
});
const bundle = js.outputFiles[0].text;

// 3) imagens → WebP reduzido em base64
// (alguns caminhos são montados por template no código; por isso embutimos todas as imagens da pasta)
const paths = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".webp")) paths.push("/" + path.relative(path.join(root, "public"), p).split(path.sep).join("/"));
  }
})(path.join(root, "public/images"));
const imgs = {};
for (const p of paths) {
  const file = path.join(root, "public", p);
  if (!fs.existsSync(file)) continue;
  const width = p.includes("hero") ? 1400 : 720;
  const buf = await sharp(file).resize({ width, withoutEnlargement: true }).webp({ quality: 74 }).toBuffer();
  imgs[p] = `data:image/webp;base64,${buf.toString("base64")}`;
}

// 4) fontes (as mesmas do site: Fraunces e Jost) em base64
const font = (pkg, name) =>
  `@font-face{font-family:"${name}";font-style:normal;font-weight:100 900;font-display:swap;src:url(data:font/woff2;base64,${fs
    .readFileSync(path.join(root, `node_modules/@fontsource-variable/${pkg}/files/${pkg}-latin-wght-normal.woff2`))
    .toString("base64")}) format("woff2")}`;
const fonts = `${font("jost", "Jost")}${font("fraunces", "Fraunces")}:root{--font-jost:"Jost";--font-fraunces:"Fraunces"}`;

// 5) monta o HTML
const safe = (s) => s.replace(/<\/script/gi, "<\\/script");
const icon = `data:image/png;base64,${fs.readFileSync(path.join(root, "app/icon.png")).toString("base64")}`;
const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cambará Ornamentais — Vasos de cimento feitos à mão</title>
<meta name="description" content="Vasos de cimento artesanais feitos à mão. Peças únicas para trazer o jardim para dentro de casa.">
<meta name="theme-color" content="#ECEAE5">
<link rel="icon" href="${icon}">
<style>${fonts}${css && fs.readFileSync(css, "utf8")}</style>
</head>
<body>
<div id="root"></div>
<noscript>Este site precisa de JavaScript ativado para funcionar.</noscript>
<script>window.__IMG__=${safe(JSON.stringify(imgs))};</script>
<script>${safe(bundle)}</script>
</body>
</html>`;
const out = path.join(outDir, "cambara-ornamentais.html");
fs.writeFileSync(out, html);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\nPronto: ${path.relative(root, out)} (${(html.length / 1024 / 1024).toFixed(1)} MB, ${Object.keys(imgs).length} imagens)`);
