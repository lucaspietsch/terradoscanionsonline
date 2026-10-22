/**
 * Fotos da linha Aromaterapia (Ripples) a partir de assets/aromaterapia/*.jpg — as mesmas 3 fotos em todos os produtos da linha:
 *  - tira as faixas brancas das bordas e deixa cada foto quadrada;
 *  - a foto horizontal (trio na tábua) ganha o próprio fundo desfocado em cima e embaixo para caber inteira.
 *
 *   node scripts/process-aromaterapia.mjs
 */
import sharp from "sharp";
import path from "node:path";

const SRC = path.resolve("assets/aromaterapia");
const OUT = path.resolve("public/images/products");
const SIZE = 1000;
const finish = (p) => p.sharpen({ sigma: 0.8, m1: 0.6, m2: 1 }).webp({ quality: 86 });

/** Recorte quadrado direto. */
const square = (file, rect) => finish(sharp(path.join(SRC, file)).extract(rect).resize(SIZE, SIZE, { kernel: "lanczos3" })).toBuffer();

/** Foto horizontal → quadrada sem cortar: nítida no centro sobre uma cópia desfocada dela mesma. */
async function blurredSquare(file, rect) {
  const input = await sharp(path.join(SRC, file)).extract(rect).toBuffer();
  const bg = await sharp(input).resize(SIZE, SIZE, { fit: "cover" }).blur(28).toBuffer();
  const sharpFg = await sharp(input).resize({ width: SIZE, kernel: "lanczos3" }).toBuffer();
  const m = await sharp(sharpFg).metadata();
  // bordas de cima e de baixo esmaecidas, para não aparecer a emenda com o fundo desfocado
  const fade = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${m.width}" height="${m.height}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-opacity="0"/><stop offset="0.08" stop-opacity="1"/><stop offset="0.92" stop-opacity="1"/><stop offset="1" stop-opacity="0"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
  const fg = await sharp(sharpFg).ensureAlpha().composite([{ input: fade, blend: "dest-in" }]).png().toBuffer();
  return finish(sharp(bg).composite([{ input: fg, left: 0, top: Math.round((SIZE - m.height) / 2) }])).toBuffer();
}

const write = async (name, buf) => sharp(buf).toFile(path.join(OUT, name));
await write("aromaterapia-1.webp", await blurredSquare("trio-branco-tabua.jpg", { left: 0, top: 0, width: 1024, height: 686 }));
await write("aromaterapia-2.webp", await square("trio-areia.jpg", { left: 15, top: 0, width: 993, height: 993 }));
await write("aromaterapia-3.webp", await square("trio-grafite-mao.jpg", { left: 3, top: 0, width: 990, height: 990 }));
// miniatura da categoria
await sharp(await square("trio-areia.jpg", { left: 15, top: 0, width: 993, height: 993 })).toFile(path.resolve("public/images/categorias/aromaterapia.webp"));
console.log("ok");
