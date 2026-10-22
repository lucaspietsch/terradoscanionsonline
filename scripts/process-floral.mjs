/**
 * Prepara as fotos do Vaso de Concreto Floral (relevo 3D) a partir de assets/floral/*.avif:
 *  - foto "com molde e medidas": recorta fora o molde roxo e apaga as cotas, mantendo só o vaso;
 *  - demais fotos: apenas ampliação (as originais têm 220 px — troque por fotos maiores quando tiver).
 *
 *   node scripts/process-floral.mjs
 */
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const SRC = path.resolve("assets/floral");
const OUT = path.resolve("public/images/products");
const SIZE = 1000;

const toSquare = (buf) => sharp(buf).resize(SIZE, SIZE, { kernel: "lanczos3" }).sharpen({ sigma: 1.0, m1: 0.7, m2: 1.1 }).webp({ quality: 84 }).toBuffer();

// fotos prontas
for (const [file, out] of [["ambiente-banheiro.avif", "floral-1.webp"], ["caixa-presente.avif", "floral-2.webp"]]) {
  await fs.writeFile(path.join(OUT, out), await toSquare(await fs.readFile(path.join(SRC, file))));
}

// foto com molde + cotas: só o vaso branco (lado direito), cotas apagadas
{
  const { data, info } = await sharp(path.join(SRC, "branco-com-molde-e-medidas.avif")).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const paint = (x, y, w, h) => {
    for (let r = y; r < y + h; r++) for (let c = x; c < x + w; c++) data.fill(255, (r * W + c) * 3, (r * W + c) * 3 + 3);
  };
  paint(112, 36, 108, 26); // cota de largura ("8.5 cm / 3.35 in")
  paint(205, 66, 15, 104); // cota de altura ("8.0 cm / 3.15 in")
  const crop = await sharp(data, { raw: { width: W, height: info.height, channels: 3 } })
    .extract({ left: 112, top: 34, width: 108, height: 136 }).resize({ height: 820, kernel: "lanczos3" }).sharpen({ sigma: 1.0 }).png().toBuffer();
  // multiplica sobre o fundo claro da loja: o branco do papel vira o fundo, o vaso mantém a sombra
  const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><defs><linearGradient id="w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F0EEE9"/><stop offset="1" stop-color="#E1DDD3"/></linearGradient></defs><rect width="${SIZE}" height="${SIZE}" fill="url(#w)"/></svg>`);
  const meta = await sharp(crop).metadata();
  const out = await sharp(bg).composite([{ input: crop, left: Math.round((SIZE - meta.width) / 2), top: Math.round((SIZE - meta.height) / 2), blend: "multiply" }]).webp({ quality: 84 }).toBuffer();
  await fs.writeFile(path.join(OUT, "floral-3.webp"), out);
}
console.log("ok");
