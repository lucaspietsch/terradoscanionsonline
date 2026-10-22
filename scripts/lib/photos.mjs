/** Funções compartilhadas dos scripts de tratamento de fotos de produtos (recorte de fundo, composição, medidas). */
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

export const SIZE = 1000;

export async function load(dir, name) {
  const { data, info } = await sharp(path.join(dir, name)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

/** Recorte retangular de um buffer RGB. */
export function crop(img, x, y, w, h) {
  const out = Buffer.alloc(w * h * 3);
  for (let r = 0; r < h; r++) img.data.copy(out, r * w * 3, ((y + r) * img.w + x) * 3, ((y + r) * img.w + x + w) * 3);
  return { data: out, w, h };
}

/** Fundo = pixels escuros conectados à borda. Retorna máscara 255 = vaso. */
export function matteDarkBackground(img, thr = 52) {
  const { data, w, h } = img;
  const lum = (i) => 0.299 * data[i * 3] + 0.587 * data[i * 3 + 1] + 0.114 * data[i * 3 + 2];
  const bg = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    const i = y * w + x;
    if (!bg[i] && lum(i) < thr) {
      bg[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < w; x++) (push(x, 0), push(x, h - 1));
  for (let y = 0; y < h; y++) (push(0, y), push(w - 1, y));
  while (stack.length) {
    const i = stack.pop();
    const x = i % w;
    const y = (i / w) | 0;
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }
  let mask = Buffer.alloc(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = bg[i] ? 0 : 255;
  // abertura morfológica: 2× erosão + 1× dilatação remove ruído de compressão e o halo escuro da borda
  const morph = (m, grow) => {
    const o = Buffer.alloc(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const at = (xx, yy) => (xx < 0 || yy < 0 || xx >= w || yy >= h ? 0 : m[yy * w + xx]);
        const n = [at(x, y), at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)];
        o[y * w + x] = grow ? (n.some((v) => v) ? 255 : 0) : n.every((v) => v) ? 255 : 0;
      }
    return o;
  };
  mask = morph(morph(mask, false), false);
  mask = morph(mask, true);
  return mask;
}

const wallSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <defs>
    <linearGradient id="w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EFEDE7"/><stop offset="1" stop-color="#DCD8CE"/></linearGradient>
    <linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFCABF"/><stop offset="1" stop-color="#BDB8AC"/></linearGradient>
    <linearGradient id="l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#w)"/>
  <polygon points="580,-40 840,-40 1240,900 980,900" fill="url(#l)"/>
  <rect y="780" width="${SIZE}" height="220" fill="url(#f)"/>
  <rect y="778" width="${SIZE}" height="3" fill="#232A21" opacity=".06"/>
</svg>`;

/** Vaso recortado (RGB + máscara) sobre o fundo da loja. `heightPx` = altura do vaso na imagem final. */
export async function cutoutShot(img, mask, heightPx, annotate) {
  // área útil do vaso
  let x0 = img.w, x1 = 0, y0 = img.h, y1 = 0;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (mask[y * img.w + x]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const rgb = crop(img, x0, y0, cw, ch);
  const m = Buffer.alloc(cw * ch);
  for (let r = 0; r < ch; r++) mask.copy(m, r * cw, (y0 + r) * img.w + x0, (y0 + r) * img.w + x0 + cw);

  const scale = heightPx / ch;
  const tw = Math.round(cw * scale), th = Math.round(ch * scale);
  const color = await sharp(rgb.data, { raw: { width: cw, height: ch, channels: 3 } })
    .resize(tw, th, { kernel: "lanczos3" }).sharpen({ sigma: 1.1, m1: 0.8, m2: 1.2 }).modulate({ brightness: 1.12 }).raw().toBuffer();
  // máscara ampliada, levemente suavizada e contraída para tirar o halo escuro da borda
  const alpha = await sharp(m, { raw: { width: cw, height: ch, channels: 1 } })
    .resize(tw, th, { kernel: "lanczos3" }).blur(5).linear(3, -255 * 1.6).extractChannel(0).raw().toBuffer();
  const rgba = await sharp(color, { raw: { width: tw, height: th, channels: 3 } }).joinChannel(alpha, { raw: { width: tw, height: th, channels: 1 } }).png().toBuffer();

  const left = Math.round((SIZE - tw) / 2) - (annotate ? 40 : 0);
  const top = 770 - th;
  const shadow = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><ellipse cx="${left + tw / 2 + 14}" cy="776" rx="${tw * 0.62}" ry="16" fill="#232A21" opacity=".18"/></svg>`);
  let overlay = "";
  if (annotate) {
    const { hText, wText } = annotate;
    const rx = left + tw + 70, bx0 = left, bx1 = left + tw, by = 770 + 52;
    overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" font-family="Helvetica, Arial, sans-serif" fill="#2F3E2C" stroke="#2F3E2C">
      <line x1="${rx}" y1="${top}" x2="${rx}" y2="770" stroke-width="2"/>
      <line x1="${rx - 12}" y1="${top}" x2="${rx + 12}" y2="${top}" stroke-width="2"/><line x1="${rx - 12}" y1="770" x2="${rx + 12}" y2="770" stroke-width="2"/>
      <text x="${rx + 24}" y="${(top + 770) / 2 + 9}" font-size="30" stroke="none">${hText}</text>
      <line x1="${bx0}" y1="${by}" x2="${bx1}" y2="${by}" stroke-width="2"/>
      <line x1="${bx0}" y1="${by - 12}" x2="${bx0}" y2="${by + 12}" stroke-width="2"/><line x1="${bx1}" y1="${by - 12}" x2="${bx1}" y2="${by + 12}" stroke-width="2"/>
      <text x="${(bx0 + bx1) / 2}" y="${by + 44}" font-size="30" text-anchor="middle" stroke="none">${wText}</text></svg>`;
  }
  const comps = [{ input: shadow }, { input: rgba, left, top }];
  if (overlay) comps.push({ input: Buffer.from(overlay) });
  return sharp(Buffer.from(wallSvg)).composite(comps).webp({ quality: 84 }).toBuffer();
}

/** Foto já pronta (fundo claro): recorta, deixa quadrada espelhando as bordas e amplia. */
export async function squareShot(img, rect, out, { keepAspect = false } = {}) {
  const c = crop(img, ...rect);
  let pipe = sharp(c.data, { raw: { width: c.w, height: c.h, channels: 3 } });
  if (c.w !== c.h) {
    const side = Math.max(c.w, c.h);
    const dx = side - c.w, dy = side - c.h;
    pipe = pipe.extend({ top: Math.floor(dy / 2), bottom: Math.ceil(dy / 2), left: Math.floor(dx / 2), right: Math.ceil(dx / 2), extendWith: "mirror" });
  }
  return pipe.resize(SIZE, SIZE, { kernel: "lanczos3" }).sharpen({ sigma: 1.0, m1: 0.7, m2: 1.1 }).modulate({ saturation: 1.0 }).webp({ quality: 84 }).toBuffer();
}

export async function save(rel, buf) {
  await fs.mkdir(path.dirname(rel), { recursive: true });
  await fs.writeFile(rel, buf);
}


/**
 * Máscara por brilho para vasos CLAROS com sombras/ranhuras escuras sobre fundo escuro:
 * "brilhante" = lum > T; fecha buracos pequenos (dilata k, erode k) e o fundo é o que o flood-fill alcança a partir da borda.
 */
export function matteByBrightness(img, T = 100, k = 4) {
  const { data, w, h } = img;
  const bright = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) bright[i] = 0.299 * data[i * 3] + 0.587 * data[i * 3 + 1] + 0.114 * data[i * 3 + 2] > T ? 1 : 0;
  const morph = (src, grow) => {
    const out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let hit = grow ? 0 : 1;
        for (let dy = -1; dy <= 1 && (grow ? !hit : hit); dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx, yy = y + dy;
            const v = xx < 0 || yy < 0 || xx >= w || yy >= h ? 0 : src[yy * w + xx];
            if (grow ? v : !v) { hit = grow ? 1 : 0; break; }
          }
        out[y * w + x] = hit;
      }
    return out;
  };
  let closed = bright;
  for (let i = 0; i < k; i++) closed = morph(closed, true);
  for (let i = 0; i < k; i++) closed = morph(closed, false);
  const bg = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    const i = y * w + x;
    if (!bg[i] && !closed[i]) { bg[i] = 1; stack.push(i); }
  };
  for (let x = 0; x < w; x++) (push(x, 0), push(x, h - 1));
  for (let y = 0; y < h; y++) (push(0, y), push(w - 1, y));
  while (stack.length) {
    const i = stack.pop(), x = i % w, y = (i / w) | 0;
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }
  const mask = Buffer.alloc(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = bg[i] ? 0 : 255;
  return mask;
}
