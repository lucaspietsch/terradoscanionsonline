/**
 * Fotos do Vaso Listrado Luxuoso a partir de assets/listrados/*.jpg: corta a faixa branca da direita e deixa quadrado.
 * As imagens ilustrativas das versões premium saem de scripts/process-listrado-cores.py.
 *
 *   node scripts/process-listrados.mjs
 */
import sharp from "sharp";
import path from "node:path";

const SRC = path.resolve("assets/listrados");
const OUT = path.resolve("public/images/products");

const square = (file, rect, out) =>
  sharp(path.join(SRC, file)).extract(rect).resize(1000, 1000, { kernel: "lanczos3" }).sharpen({ sigma: 0.8, m1: 0.6, m2: 1 }).webp({ quality: 86 }).toFile(path.join(OUT, out));

await square("par-listrado-ampulheta.jpg", { left: 0, top: 0, width: 985, height: 985 }, "listrado-1.webp");
await square("listrado-verde.jpg", { left: 14, top: 0, width: 1000, height: 1000 }, "listrado-2.webp");
await square("ampulheta-branca.jpg", { left: 0, top: 0, width: 985, height: 985 }, "listrado-3.webp");
console.log("ok");
