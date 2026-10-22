/**
 * Prepara as fotos do Vaso Floral Luxo - Relevo em 3D a partir de assets/floral/luxo-*.png:
 *  - ambiente-banheiro e caixa-presente: recorte quadrado + ampliação;
 *  - medidas: recorta só o vaso (sem cotas em inglês) sobre o fundo da loja.
 * As cores "em breve" (ilustrativas) saem de scripts/process-floral-cores.py.
 *
 *   node scripts/process-floral.mjs
 */
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const SRC = path.resolve("assets/floral");
const OUT = path.resolve("public/images/products");
const SIZE = 1000;

const enlarge = (img) => img.resize(SIZE, SIZE, { kernel: "lanczos3" }).sharpen({ sigma: 1.0, m1: 0.7, m2: 1.1 }).webp({ quality: 84 }).toBuffer();

await fs.writeFile(path.join(OUT, "floral-luxo-1.webp"), await enlarge(sharp(path.join(SRC, "luxo-ambiente-banheiro.png")).extract({ left: 5, top: 0, width: 516, height: 516 })));
await fs.writeFile(path.join(OUT, "floral-luxo-2.webp"), await enlarge(sharp(path.join(SRC, "luxo-caixa-presente.png")).extract({ left: 0, top: 0, width: 509, height: 509 })));

// foto com cotas: só o vaso, multiplicado sobre o fundo claro da loja (o branco do papel vira o fundo)
{
  const crop = await sharp(path.join(SRC, "luxo-medidas.png")).removeAlpha().extract({ left: 22, top: 48, width: 220, height: 250 })
    .resize({ height: 860, kernel: "lanczos3" }).sharpen({ sigma: 1.0 }).png().toBuffer();
  const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><defs><linearGradient id="w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F0EEE9"/><stop offset="1" stop-color="#E1DDD3"/></linearGradient></defs><rect width="${SIZE}" height="${SIZE}" fill="url(#w)"/></svg>`);
  const meta = await sharp(crop).metadata();
  const out = await sharp(bg).composite([{ input: crop, left: Math.round((SIZE - meta.width) / 2), top: Math.round((SIZE - meta.height) / 2), blend: "multiply" }]).webp({ quality: 84 }).toBuffer();
  await fs.writeFile(path.join(OUT, "floral-luxo-3.webp"), out);
}
console.log("ok");
