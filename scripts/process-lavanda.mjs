/**
 * Prepara as fotos do Vaso de Concreto Lavanda (relevo 3D) a partir de assets/lavanda/:
 *  - fotos com o molde pequeno num círculo (canto superior esquerdo): a logo da Cambará Ornamentais ocupa o lugar do molde;
 *  - fotos com o molde grande ao lado do vaso: corta o molde fora e fica só o vaso (com medidas, flores, mesa) em formato vertical.
 * O site mostra as fotos verticais inteiras e centralizadas (fundo desfocado nas laterais — ver ProductGallery).
 *
 *   node scripts/process-lavanda.mjs
 */
import sharp from "sharp";
import path from "node:path";

const SRC = path.resolve("assets/lavanda");
const OUT = path.resolve("public/images/products");
const H = 1000;

const finish = (pipe) => pipe.sharpen({ sigma: 1.0, m1: 0.7, m2: 1.1 }).webp({ quality: 84 }).toBuffer();
const save = async (name, buf) => sharp(buf).toFile(path.join(OUT, name));

/** Selo com a logo, no lugar do molde pequeno. Coordenadas na foto original de 500 px (ampliada 2x). */
function badge({ cx, cy, rx, ry }) {
  const s = 2;
  const symbol = `<path d="M86.9 39.1 A38 38 0 1 0 86.9 92.9" fill="none" stroke="#2F3E2C" stroke-width="11" stroke-linecap="round"/>
    <path d="M46 113 L74 113" fill="none" stroke="#2F3E2C" stroke-width="5" stroke-linecap="round"/>
    <path d="M88 37 C 85 24, 91 12, 103 5 C 107 19, 101 31, 88 37 Z" fill="#8A9A7B"/>
    <path d="M86 37 C 75 30, 71 18, 73 7 C 85 13, 90 25, 86 37 Z" fill="#2F3E2C"/>`;
  const k = 0.62; // tamanho do símbolo
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${500 * s}" height="${500 * s}" viewBox="0 0 500 500">
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#FBFAF7" stroke="#CFCBC2" stroke-width="1.2"/>
    <g transform="translate(${cx - 55 * k} ${cy - 70}) scale(${k})">${symbol}</g>
    <text x="${cx}" y="${cy + 30}" text-anchor="middle" font-family="Jost, Helvetica, Arial, sans-serif" font-weight="300" font-size="19" letter-spacing="0.6" fill="#2F3E2C">Cambará</text>
    <text x="${cx}" y="${cy + 46}" text-anchor="middle" font-family="Jost, Helvetica, Arial, sans-serif" font-size="6.6" letter-spacing="2.2" fill="#5C6657">ORNAMENTAIS</text>
  </svg>`;
}

async function withLogo(file, circle) {
  const base = await sharp(path.join(SRC, file)).removeAlpha().resize(1000, 1000, { kernel: "lanczos3" }).sharpen({ sigma: 1.0, m1: 0.7, m2: 1.1 }).png().toBuffer();
  return finish(sharp(base).composite([{ input: Buffer.from(badge(circle)) }]));
}

/** Recorte vertical (só o vaso) ampliado para 1000 px de altura. */
async function vertical(file, rect, { clean } = {}) {
  let img = sharp(path.join(SRC, file)).removeAlpha();
  if (clean) img = sharp(await img.composite(clean.map((c) => ({ input: { create: { width: c.w, height: c.h, channels: 3, background: c.color } }, left: c.x, top: c.y }))).png().toBuffer());
  const [left, top, width, height] = rect;
  return finish(img.extract({ left, top, width, height }).resize({ height: H, kernel: "lanczos3" }));
}

const CIRCLE = { cx: 65, cy: 70, rx: 56, ry: 64 };
await save("lavanda-1.webp", await withLogo("maos.webp", CIRCLE));
await save("lavanda-2.webp", await withLogo("jardim-ambiente.webp", CIRCLE));
// ponta da seta da medida do molde (9,1 cm) apagada com o fundo branco
await save("lavanda-3.webp", await vertical("molde-medidas-margaridas.webp", [238, 0, 262, 500], { clean: [{ x: 200, y: 150, w: 42, h: 14, color: { r: 255, g: 255, b: 255 } }, { x: 200, y: 250, w: 46, h: 220, color: { r: 255, g: 255, b: 255 } }] }));
// ícone de lupa do site de origem (canto superior direito) coberto com o fundo
await save("lavanda-4.webp", await vertical("molde-medidas-roxo.png", [262, 0, 260, 507], { clean: [{ x: 486, y: 0, w: 30, h: 28, color: { r: 244, g: 242, b: 240 } }] }));
await save("lavanda-5.webp", await vertical("mesa-renda.webp", [240, 0, 260, 500]));
console.log("ok");
