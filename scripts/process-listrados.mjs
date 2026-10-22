/**
 * Fotos do vaso Listrado Luxuoso, a partir de assets/listrados/*.avif, sem moldes:
 *  - fotos com o molde ao lado: recorta só o vaso, tira o fundo escuro e põe sobre o fundo claro da loja;
 *  - foto "com medidas": mesma imagem com as cotas (que estavam escritas nos moldes);
 *  - fotos em pé: ganham fundo desfocado para ficarem quadradas.
 * Medidas: 12,7 × Ø10,4 cm. As originais têm só 220 px.
 *
 *   node scripts/process-listrados.mjs
 */
import sharp from "sharp";
import path from "node:path";
import { SIZE, crop, cutoutShot, load as loadFrom, matteByBrightness, save } from "./lib/photos.mjs";

const SRC = path.resolve("assets/listrados");
const OUT = path.resolve("public/images/products");
const load = (n) => loadFrom(SRC, n);

/** Foto em pé → quadrada, sem cortar nada: nítida no centro sobre cópia desfocada. */
async function blurredSquare(name) {
  const input = path.join(SRC, name);
  const bg = await sharp(input).resize(SIZE, SIZE, { fit: "cover" }).blur(30).modulate({ brightness: 1.03 }).toBuffer();
  const fg = await sharp(input).resize({ height: SIZE, kernel: "lanczos3" }).sharpen({ sigma: 1.0, m1: 0.7, m2: 1.1 }).toBuffer();
  const m = await sharp(fg).metadata();
  return sharp(bg).composite([{ input: fg, left: Math.round((SIZE - m.width) / 2), top: 0 }]).webp({ quality: 84 }).toBuffer();
}

// --- fotos em pé (sem molde) ---
await save(path.join(OUT, "listrado-cinza.webp"), await blurredSquare("listrado-cinza.avif"));

// --- vasos recortados (lado direito das fotos de molde) ---
const listrado = crop(await load("listrado-com-molde.avif"), 90, 52, 72, 100);
const mLis = matteByBrightness(listrado, 110, 3);
await save(path.join(OUT, "listrado-branco-1.webp"), await cutoutShot(listrado, mLis, 470));
await save(path.join(OUT, "listrado-branco-2.webp"), await cutoutShot(listrado, mLis, 470, { hText: "12,7 cm", wText: "10,4 cm" }));
console.log("ok");
