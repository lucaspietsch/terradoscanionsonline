/**
 * Prepara as fotos dos Vasos de Concreto Redondos Luxuosos (assets/redondos/*.avif), sem moldes de silicone:
 *  - trio com suculentas: apaga o círculo "Silicone Mold" (preenchimento suave) e corta a legenda;
 *  - vaso na mão: apaga o círculo do molde (preenchimento suave do fundo) e corta a legenda;
 *  - ilustrações com as medidas (a foto original de medidas era só dos moldes).
 * Medidas (largura × altura): grande 10 × 6,2 · médio 8,6 × 5,5 · pequeno 7,7 × 5,3 cm.
 *
 *   node scripts/process-redondos.mjs
 */
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const SRC = path.resolve("assets/redondos");
const OUT = path.resolve("public/images/products");
const SIZE = 1000;
const save = (name, buf) => fs.writeFile(path.join(OUT, name), buf);
const webp = (pipe) => pipe.sharpen({ sigma: 0.9, m1: 0.6, m2: 1.0 }).webp({ quality: 84 }).toBuffer();

/** Recorte (qualquer proporção) → quadrado: recorte nítido sobre cópia desfocada dele mesmo. */
async function blurredSquare(input, rect) {
  const crop = await sharp(input).extract(rect).png().toBuffer();
  const bg = await sharp(crop).resize(SIZE, SIZE, { fit: "cover" }).blur(30).modulate({ brightness: 1.03 }).toBuffer();
  const fg = await sharp(crop).resize(SIZE, SIZE, { fit: "inside", kernel: "lanczos3" }).toBuffer();
  const m = await sharp(fg).metadata();
  return webp(sharp(bg).composite([{ input: fg, left: Math.round((SIZE - m.width) / 2), top: Math.round((SIZE - m.height) / 2) }]));
}

/** Apaga um círculo e o preenche por difusão (feito em baixa resolução: o fundo dessas fotos é desfocado). */
async function eraseCircle(input, cx, cy, r) {
  const base = await sharp(input).resize(SIZE, SIZE).removeAlpha().png().toBuffer();
  const K = 8, lw = SIZE / K;
  const { data: low } = await sharp(base).resize(lw, lw, { kernel: "lanczos3" }).raw().toBuffer({ resolveWithObject: true });
  const px = Float32Array.from(low);
  const inside = new Uint8Array(lw * lw);
  const [lx, ly, lr] = [cx / K, cy / K, r / K];
  let sum = [0, 0, 0], n = 0;
  for (let y = 0; y < lw; y++) for (let x = 0; x < lw; x++) {
    const d = Math.hypot(x - lx, y - ly);
    inside[y * lw + x] = d <= lr ? 1 : 0;
    if (d > lr && d <= lr + 3) { for (let c = 0; c < 3; c++) sum[c] += px[(y * lw + x) * 3 + c]; n++; }
  }
  for (let i = 0; i < lw * lw; i++) if (inside[i]) for (let c = 0; c < 3; c++) px[i * 3 + c] = sum[c] / n;
  for (let it = 0; it < 4000; it++)
    for (let y = 1; y < lw - 1; y++) for (let x = 1; x < lw - 1; x++) {
      const i = y * lw + x;
      if (!inside[i]) continue;
      for (let c = 0; c < 3; c++) px[i * 3 + c] = (px[(i - 1) * 3 + c] + px[(i + 1) * 3 + c] + px[(i - lw) * 3 + c] + px[(i + lw) * 3 + c]) / 4;
    }
  const lowFilled = Buffer.from(px.map((v) => Math.max(0, Math.min(255, Math.round(v)))));
  const filled = await sharp(lowFilled, { raw: { width: lw, height: lw, channels: 3 } }).resize(SIZE, SIZE, { kernel: "cubic" }).raw().toBuffer();
  const maskSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><rect width="100%" height="100%" fill="black"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="white"/></svg>`);
  const alpha = await sharp(maskSvg).blur(7).extractChannel(0).raw().toBuffer();
  const patch = await sharp(filled, { raw: { width: SIZE, height: SIZE, channels: 3 } }).joinChannel(alpha, { raw: { width: SIZE, height: SIZE, channels: 1 } }).png().toBuffer();
  return sharp(base).composite([{ input: patch }]).png().toBuffer();
}

// --- fotos ---
const succ = await eraseCircle(await fs.readFile(path.join(SRC, "trio-suculentas-com-molde.avif")), 802, 164, 176);
await save("redondo-trio-suculentas.webp", await webp(sharp(succ).extract({ left: 0, top: 0, width: SIZE, height: 940 }).extend({ top: 60, extendWith: "mirror" })));

const mao = await eraseCircle(await fs.readFile(path.join(SRC, "mao-com-molde.avif")), 836, 836, 176);
await save("redondo-mao.webp", await webp(sharp(mao).extract({ left: 0, top: 0, width: SIZE, height: 940 }).extend({ bottom: 60, extendWith: "mirror" })));

await save("redondo-trio-concreto.webp", await webp(sharp(path.join(SRC, "trio-concreto.avif")).resize(SIZE, SIZE, { kernel: "lanczos3" })));

// --- ilustrações com as medidas ---
const SIZES = { grande: { w: 10, h: 6.2 }, medio: { w: 8.6, h: 5.5 }, pequeno: { w: 7.7, h: 5.3 } };
const fmt = (n) => String(n).replace(".", ",");
let gid = 0;
function bowl(cx, by, w, h, scale) {
  const pw = w * scale, ph = h * scale, id = `g${++gid}`, rx = pw / 2, ry = ph / 2, ro = rx * 0.62;
  return {
    svg: `<defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="#F6F4EF"/><stop offset=".55" stop-color="#E6E3DB"/><stop offset="1" stop-color="#BDB9AF"/></linearGradient></defs>
      <ellipse cx="${cx + 10}" cy="${by + 4}" rx="${rx * 0.95}" ry="9" fill="#232A21" opacity=".16"/>
      <ellipse cx="${cx}" cy="${by - ry}" rx="${rx}" ry="${ry}" fill="url(#${id})"/>
      <ellipse cx="${cx}" cy="${by - ph + ph * 0.1}" rx="${ro}" ry="${ro * 0.24}" fill="#F2F0EA"/>
      <ellipse cx="${cx}" cy="${by - ph + ph * 0.1 + 2}" rx="${ro * 0.88}" ry="${ro * 0.19}" fill="#8F8B82"/>`,
    left: cx - rx, right: cx + rx, top: by - ph,
  };
}
const dim = (x1, y1, x2, y2, label, vertical) => {
  const tick = (x, y) => (vertical ? `<line x1="${x - 9}" y1="${y}" x2="${x + 9}" y2="${y}"/>` : `<line x1="${x}" y1="${y - 9}" x2="${x}" y2="${y + 9}"/>`);
  const tx = vertical ? x1 + 16 : (x1 + x2) / 2, ty = vertical ? (y1 + y2) / 2 + 8 : y1 + 34;
  return `<g stroke="#2F3E2C" stroke-width="2" fill="#2F3E2C"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>${tick(x1, y1)}${tick(x2, y2)}<text x="${tx}" y="${ty}" font-size="26" font-family="Helvetica, Arial, sans-serif" text-anchor="${vertical ? "start" : "middle"}" stroke="none">${label}</text></g>`;
};
const stage = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><defs><linearGradient id="w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EFEDE7"/><stop offset="1" stop-color="#DCD8CE"/></linearGradient><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFCABF"/><stop offset="1" stop-color="#BDB8AC"/></linearGradient></defs><rect width="${SIZE}" height="${SIZE}" fill="url(#w)"/><rect y="640" width="${SIZE}" height="360" fill="url(#f)"/><rect y="638" width="${SIZE}" height="3" fill="#232A21" opacity=".06"/>${inner}</svg>`;
const render = (svg) => sharp(Buffer.from(svg)).webp({ quality: 88 }).toBuffer();

for (const [key, { w, h }] of Object.entries(SIZES)) {
  const sc = 62, b = bowl(470, 600, w, h, sc);
  await save(`redondo-medidas-${key}.webp`, await render(stage(b.svg + dim(b.left, 650, b.right, 650, `${fmt(w)} cm`, false) + dim(b.right + 50, b.top, b.right + 50, 600, `${fmt(h)} cm`, true))));
}
{
  const sc = 28, gap = 66;
  const widths = [SIZES.pequeno, SIZES.medio, SIZES.grande].map((s2) => s2.w * sc);
  let x = (SIZE - (widths.reduce((a, v) => a + v, 0) + gap * 2)) / 2, inner = "";
  for (const k of ["pequeno", "medio", "grande"]) {
    const { w, h } = SIZES[k], pw = w * sc, b = bowl(x + pw / 2, 600, w, h, sc);
    inner += b.svg + dim(b.left, 650, b.right, 650, `${fmt(w)} cm`, false) + dim(b.right + 12, b.top, b.right + 12, 600, `${fmt(h)}`, true);
    x += pw + gap;
  }
  await save("redondo-medidas-kit.webp", await render(stage(inner)));
}
console.log("ok");
