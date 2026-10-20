/**
 * Gera favicon.ico, icon.png, apple-icon.png (símbolo claro sobre #232A21) e opengraph-image.png
 * (1200×630, símbolo sobre fundo Névoa) em /app, seguindo as convenções de metadata do Next.
 *
 *   npm run assets:brand
 */
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const APP = path.resolve("app");

const symbol = (stroke, leafA, leafB) => `
  <path d="M86.9 39.1 A38 38 0 1 0 86.9 92.9" fill="none" stroke="${stroke}" stroke-width="11" stroke-linecap="round"/>
  <path d="M46 113 L74 113" fill="none" stroke="${stroke}" stroke-width="5" stroke-linecap="round"/>
  <path d="M88 37 C 85 24, 91 12, 103 5 C 107 19, 101 31, 88 37 Z" fill="${leafA}"/>
  <path d="M86 37 C 75 30, 71 18, 73 7 C 85 13, 90 25, 86 37 Z" fill="${leafB}"/>`;

const light = symbol("#ECEAE5", "#8A9A7B", "#ECEAE5");
const dark = symbol("#2F3E2C", "#8A9A7B", "#2F3E2C");

function iconSvg(size) {
  const pad = size * 0.2;
  const s = (size - pad * 2) / 120;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#232A21"/>
    <g transform="translate(${pad} ${pad - size * 0.02}) scale(${s})">${light}</g></svg>`;
}
const png = (size) => sharp(Buffer.from(iconSvg(size))).png().toBuffer();

// ICO com PNGs embutidos (16, 32, 48)
async function ico(sizes) {
  const bufs = await Promise.all(sizes.map(png));
  const head = Buffer.alloc(6);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(sizes.length, 4);
  let offset = 6 + 16 * sizes.length;
  const dirs = bufs.map((b, i) => {
    const d = Buffer.alloc(16);
    d.writeUInt8(sizes[i] === 256 ? 0 : sizes[i], 0);
    d.writeUInt8(sizes[i] === 256 ? 0 : sizes[i], 1);
    d.writeUInt16LE(1, 4);
    d.writeUInt16LE(32, 6);
    d.writeUInt32LE(b.length, 8);
    d.writeUInt32LE(offset, 12);
    offset += b.length;
    return d;
  });
  return Buffer.concat([head, ...dirs, ...bufs]);
}

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#ECEAE5"/>
  <g transform="translate(450 70) scale(3.0)">${dark}</g>
  <text x="600" y="520" text-anchor="middle" font-family="Jost, Helvetica, Arial, sans-serif" font-weight="300" font-size="58" letter-spacing="3.5" fill="#2F3E2C">Cambará</text>
  <text x="600" y="570" text-anchor="middle" font-family="Jost, Helvetica, Arial, sans-serif" font-size="19" letter-spacing="10" fill="#5C6657">ORNAMENTAIS</text>
</svg>`;

await fs.writeFile(path.join(APP, "favicon.ico"), await ico([16, 32, 48]));
await fs.writeFile(path.join(APP, "icon.png"), await png(512));
await fs.writeFile(path.join(APP, "apple-icon.png"), await png(180));
await sharp(Buffer.from(og)).png().toFile(path.join(APP, "opengraph-image.png"));
await fs.writeFile(path.join(APP, "opengraph-image.alt.txt"), "Cambará Ornamentais — vasos de cimento feitos à mão");
console.log("ok: favicon.ico, icon.png, apple-icon.png, opengraph-image.png");
