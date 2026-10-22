/**
 * Foto do Kit Floral + Lavanda: os dois vasos lado a lado (em escala real: Ø8,5 e Ø8,0 cm) sobre o fundo claro da loja.
 * Usa as fotos de fundo branco de assets/floral/luxo-medidas.png e assets/lavanda/molde-medidas-margaridas.webp
 * (o branco do papel vira o fundo por "multiply").
 *
 *   node scripts/process-kit-relevo.mjs
 */
import sharp from "sharp";
import path from "node:path";

const SIZE = 1000;
const OUT = path.resolve("public/images/products/kit-floral-lavanda.webp");

// [arquivo, recorte (esquerda, topo, largura, altura), largura do vaso na foto (px), largura real do vaso (cm)]
const PIECES = [
  ["assets/floral/luxo-medidas.png", { left: 22, top: 48, width: 220, height: 250 }, 156, 8.5],
  ["assets/lavanda/molde-medidas-margaridas.webp", { left: 244, top: 88, width: 196, height: 296 }, 188, 8],
];
const PX_PER_CM = 40;

const layers = [];
let x = 112;
for (const [file, rect, vasePx, cm] of PIECES) {
  const scale = (cm * PX_PER_CM) / vasePx;
  const input = await sharp(file).removeAlpha().extract(rect).resize({ width: Math.round(rect.width * scale), kernel: "lanczos3" }).sharpen({ sigma: 1 }).png().toBuffer();
  const m = await sharp(input).metadata();
  layers.push({ input, left: x, top: 800 - m.height, blend: "multiply" });
  x += m.width - 20;
}
const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><defs><linearGradient id="w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F0EEE9"/><stop offset="1" stop-color="#E1DDD3"/></linearGradient></defs><rect width="${SIZE}" height="${SIZE}" fill="url(#w)"/></svg>`);
await sharp(bg).composite(layers).webp({ quality: 84 }).toFile(OUT);
console.log("ok", x);
