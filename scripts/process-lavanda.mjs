/**
 * Prepara as fotos do Vaso de Concreto Lavanda (relevo 3D) a partir de assets/lavanda/*.avif, sem os moldes de silicone:
 *  - fotos com o molde num círculo (canto superior esquerdo): o círculo é apagado e preenchido com o fundo (difusão);
 *  - fotos com o molde ao lado do vaso: recorta só o vaso (e as cotas são deixadas de fora);
 *  - fotos em pé ganham fundo desfocado para virar quadradas.
 * As originais têm só 220 px: troque por fotos maiores quando tiver.
 *
 *   node scripts/process-lavanda.mjs
 */
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const SRC = path.resolve("assets/lavanda");
const OUT = path.resolve("public/images/products");
const SIZE = 1000;

async function load(name) {
  const { data, info } = await sharp(path.join(SRC, name)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: Buffer.from(data), w: info.width, h: info.height };
}

/** Apaga uma elipse e preenche por difusão (Laplace) a partir dos pixels ao redor — o fundo dessas fotos é desfocado. */
function inpaintEllipse(img, cx, cy, rx, ry) {
  const { data, w, h } = img;
  const inside = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) inside[y * w + x] = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 ? 1 : 0;
  const px = new Float32Array(w * h * 3);
  for (let i = 0; i < w * h * 3; i++) px[i] = data[i];
  // valor inicial: média do anel externo
  const sum = [0, 0, 0];
  let n = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = ((x - cx) / (rx + 6)) ** 2 + ((y - cy) / (ry + 6)) ** 2;
    if (!inside[y * w + x] && d <= 1) { for (let c = 0; c < 3; c++) sum[c] += px[(y * w + x) * 3 + c]; n++; }
  }
  for (let i = 0; i < w * h; i++) if (inside[i]) for (let c = 0; c < 3; c++) px[i * 3 + c] = sum[c] / n;
  for (let it = 0; it < 1500; it++) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!inside[i]) continue;
      for (let c = 0; c < 3; c++) {
        const l = px[(y * w + Math.max(0, x - 1)) * 3 + c], r = px[(y * w + Math.min(w - 1, x + 1)) * 3 + c];
        const u = px[(Math.max(0, y - 1) * w + x) * 3 + c], d = px[(Math.min(h - 1, y + 1) * w + x) * 3 + c];
        px[i * 3 + c] = (l + r + u + d) / 4;
      }
    }
  }
  const out = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h * 3; i++) out[i] = Math.max(0, Math.min(255, Math.round(px[i])));
  return { data: out, w, h };
}

const raw = (img) => sharp(img.data, { raw: { width: img.w, height: img.h, channels: 3 } });
const finish = (pipe) => pipe.sharpen({ sigma: 1.0, m1: 0.7, m2: 1.1 }).webp({ quality: 84 }).toBuffer();

/** Quadrado direto (foto já quadrada). */
const square = (img) => finish(raw(img).resize(SIZE, SIZE, { kernel: "lanczos3" }));

/** Recorte retrato → quadrado: recorte nítido sobre uma cópia desfocada dele mesmo. */
async function blurredSquare(img, [x, y, w, h]) {
  const crop = await raw(img).extract({ left: x, top: y, width: w, height: h }).png().toBuffer();
  const bg = await sharp(crop).resize(SIZE, SIZE, { fit: "cover" }).blur(28).modulate({ brightness: 1.04 }).toBuffer();
  const fg = await sharp(crop).resize({ height: SIZE, kernel: "lanczos3" }).sharpen({ sigma: 1.0 }).toBuffer();
  const meta = await sharp(fg).metadata();
  return sharp(bg).composite([{ input: fg, left: Math.round((SIZE - meta.width) / 2), top: 0 }]).sharpen({ sigma: 0.6 }).webp({ quality: 84 }).toBuffer();
}

const save = (name, buf) => fs.writeFile(path.join(OUT, name), buf);

// molde num círculo no canto superior esquerdo → apagado
await save("lavanda-1.webp", await square(inpaintEllipse(await load("ambiente-sofa.avif"), 39, 56, 34, 47)));
await save("lavanda-2.webp", await square(inpaintEllipse(await load("ambiente-mesa.avif"), 35, 50, 35, 48)));
await save("lavanda-3.webp", await square(inpaintEllipse(await load("caixa-presente.avif"), 38, 50, 34, 47)));
// molde ao lado do vaso (e cotas) → só o vaso
await save("lavanda-4.webp", await blurredSquare(await load("molde-e-medidas.avif"), [114, 36, 84, 130]));
await save("lavanda-5.webp", await blurredSquare(await load("com-molde-ao-lado.avif"), [104, 25, 116, 190]));
console.log("ok");
