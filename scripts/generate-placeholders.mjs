/**
 * Gera ilustrações placeholder (WebP) para produtos, categorias, hero, sobre e galeria.
 * São provisórias: troque pelas fotos reais (mesmos nomes de arquivo, ou envie pelo admin).
 *
 *   npm run assets:placeholders
 */
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("public/images");

// ---------- utilidades ----------
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgbToHex = (r, g, b) => "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
const shade = (hex, amt) => {
  const [r, g, b] = hexToRgb(hex);
  return amt >= 0 ? rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt) : rgbToHex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
};
const f = (n) => Math.round(n * 10) / 10;

const FINISH = { natural: "#A8A59E", grafite: "#4B4F4A", areia: "#CDBFA6", branco: "#E6E3DB" };
const GREEN = { dark: "#2F3E2C", mid: "#46603F", sage: "#8A9A7B", light: "#A9B898", lime: "#7E9A5A" };

let uid = 0;
const nid = (p) => `${p}${++uid}`;

// ---------- vasos ----------
/**
 * Retorna { svg, mouth:{x,y,rx}, left, right, top }.
 * (cx, by) = centro da base; h/w/d em px.
 */
function vase(kind, cx, by, h, w, d, fillHex) {
  const g = nid("vg");
  const light = shade(fillHex, 0.22);
  const dark = shade(fillHex, -0.28);
  const defs = `<linearGradient id="${g}" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${shade(fillHex, 0.1)}"/><stop offset="0.28" stop-color="${light}"/><stop offset="0.62" stop-color="${fillHex}"/><stop offset="1" stop-color="${dark}"/></linearGradient>`;
  const inner = shade(fillHex, -0.55);
  const shadow = `<ellipse cx="${f(cx + w * 0.06)}" cy="${f(by + 3)}" rx="${f(w * 0.62)}" ry="${f(Math.max(6, w * 0.07))}" fill="#232A21" opacity="0.16"/>`;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const top = by - h;
  let body = "";
  let mouth;

  if (kind === "ball") {
    const rx = w / 2;
    const ry = h / 2;
    const ro = rx * 0.6;
    const cyo = top + h * 0.13;
    body = `<ellipse cx="${cx}" cy="${f(by - ry)}" rx="${f(rx)}" ry="${f(ry)}" fill="url(#${g})"/>
      <ellipse cx="${cx}" cy="${f(cyo)}" rx="${f(ro)}" ry="${f(ro * 0.24)}" fill="${shade(fillHex, 0.18)}"/>
      <ellipse cx="${cx}" cy="${f(cyo + 1.5)}" rx="${f(ro * 0.9)}" ry="${f(ro * 0.2)}" fill="${inner}"/>`;
    mouth = { x: cx, y: cyo + 2, rx: ro * 0.85 };
  } else if (kind === "cyl" || kind === "ripado" || kind === "cone" || kind === "tall") {
    const wt = w;
    const wb = kind === "cone" ? w * 0.6 : w;
    const ry = Math.max(7, wt * 0.11);
    const tl = cx - wt / 2;
    const tr = cx + wt / 2;
    const bl = cx - wb / 2;
    const br = cx + wb / 2;
    const bry = Math.max(5, wb * 0.09);
    body = `<path d="M${f(tl)} ${f(top)} L${f(bl)} ${f(by)} A${f(wb / 2)} ${f(bry)} 0 0 0 ${f(br)} ${f(by)} L${f(tr)} ${f(top)} Z" fill="url(#${g})"/>`;
    if (kind === "ripado") {
      let lines = "";
      for (let i = -4; i <= 4; i++) {
        const t = i / 5;
        const xt = cx + (wt / 2) * Math.sin(t * 1.35);
        const xb = cx + (wb / 2) * Math.sin(t * 1.35);
        const yb = by + bry * Math.cos(t * 1.35) - 1;
        const yt = top + ry * Math.cos(t * 1.35);
        lines += `<line x1="${f(xt)}" y1="${f(yt)}" x2="${f(xb)}" y2="${f(yb)}" stroke="${dark}" stroke-width="${f(Math.max(2, w * 0.018))}" opacity="0.42"/>`;
        lines += `<line x1="${f(xt + 3)}" y1="${f(yt)}" x2="${f(xb + 3)}" y2="${f(yb)}" stroke="#fff" stroke-width="1.5" opacity="0.16"/>`;
      }
      body += lines;
    }
    body += `<ellipse cx="${cx}" cy="${f(top)}" rx="${f(wt / 2)}" ry="${f(ry)}" fill="${shade(fillHex, 0.2)}"/>
      <ellipse cx="${cx}" cy="${f(top + 1.5)}" rx="${f(wt / 2 - wt * 0.07)}" ry="${f(ry * 0.78)}" fill="${inner}"/>`;
    mouth = { x: cx, y: top + 2, rx: wt / 2 - wt * 0.08 };
  } else if (kind === "bowl") {
    const wb = w * 0.5;
    const ry = Math.max(8, w * 0.1);
    body = `<path d="M${f(x0)} ${f(top)} Q${f(x0 + w * 0.02)} ${f(by + 2)} ${f(cx - wb / 2)} ${f(by)} L${f(cx + wb / 2)} ${f(by)} Q${f(x1 - w * 0.02)} ${f(by + 2)} ${f(x1)} ${f(top)} Z" fill="url(#${g})"/>
      <ellipse cx="${cx}" cy="${f(top)}" rx="${f(w / 2)}" ry="${f(ry)}" fill="${shade(fillHex, 0.2)}"/>
      <ellipse cx="${cx}" cy="${f(top + 2)}" rx="${f(w / 2 - w * 0.05)}" ry="${f(ry * 0.8)}" fill="${inner}"/>`;
    mouth = { x: cx, y: top + 3, rx: w / 2 - w * 0.06 };
  } else if (kind === "oval") {
    const ry = Math.max(7, w * 0.1);
    body = `<path d="M${f(cx - w * 0.36)} ${f(top)} C${f(x0 - w * 0.06)} ${f(top + h * 0.2)} ${f(x0 - w * 0.02)} ${f(by - h * 0.02)} ${f(cx - w * 0.18)} ${f(by)} L${f(cx + w * 0.18)} ${f(by)} C${f(x1 + w * 0.02)} ${f(by - h * 0.02)} ${f(x1 + w * 0.06)} ${f(top + h * 0.2)} ${f(cx + w * 0.36)} ${f(top)} Z" fill="url(#${g})"/>
      <ellipse cx="${cx}" cy="${f(top)}" rx="${f(w * 0.36)}" ry="${f(ry)}" fill="${shade(fillHex, 0.2)}"/>
      <ellipse cx="${cx}" cy="${f(top + 1.5)}" rx="${f(w * 0.3)}" ry="${f(ry * 0.78)}" fill="${inner}"/>`;
    mouth = { x: cx, y: top + 2, rx: w * 0.3 };
  } else if (kind === "box") {
    const dx = d * 0.32;
    const dy = d * 0.2;
    const ox = -dx / 2; // centraliza o conjunto
    const a0 = x0 + ox;
    const a1 = x1 + ox;
    const g2 = nid("vg");
    const wall = 0.1;
    body = `<linearGradient id="${g2}" x1="0" x2="1"><stop offset="0" stop-color="${dark}"/><stop offset="1" stop-color="${shade(fillHex, -0.4)}"/></linearGradient>
      <path d="M${f(a1)} ${f(top)} L${f(a1 + dx)} ${f(top - dy)} L${f(a1 + dx)} ${f(by - dy)} L${f(a1)} ${f(by)} Z" fill="url(#${g2})"/>
      <rect x="${f(a0)}" y="${f(top)}" width="${f(w)}" height="${f(h)}" fill="url(#${g})"/>
      <path d="M${f(a0)} ${f(top)} L${f(a0 + dx)} ${f(top - dy)} L${f(a1 + dx)} ${f(top - dy)} L${f(a1)} ${f(top)} Z" fill="${shade(fillHex, 0.2)}"/>
      <path d="M${f(a0 + w * wall)} ${f(top - dy * 0.02)} L${f(a0 + dx + w * wall * 0.9)} ${f(top - dy * 0.86)} L${f(a1 + dx - w * wall * 0.7)} ${f(top - dy * 0.86)} L${f(a1 - w * wall)} ${f(top - dy * 0.02)} Z" fill="${inner}"/>`;
    mouth = { x: cx + ox + dx / 2, y: top - dy * 0.35, rx: w * 0.4 };
    return { svg: `<defs>${defs}</defs>${shadow}${body}`, mouth, left: a0, right: a1 + dx, top: top - dy };
  }
  return { svg: `<defs>${defs}</defs>${shadow}${body}`, mouth, left: x0, right: x1, top };
}

// ---------- plantas ----------
function leaf(x, y, angle, len, wid, fill, stroke) {
  const vein = `<path d="M0 0 L0 ${f(-len * 0.86)}" stroke="${shade(fill, 0.28)}" stroke-width="${f(Math.max(0.8, wid * 0.07))}" fill="none" opacity="0.6"/>`;
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(angle)})"><path d="M0 0 C${f(wid)} ${f(-len * 0.25)} ${f(wid * 0.8)} ${f(-len * 0.8)} 0 ${f(-len)} C${f(-wid * 0.8)} ${f(-len * 0.8)} ${f(-wid)} ${f(-len * 0.25)} 0 0 Z" fill="${fill}" ${stroke ? `stroke="${stroke}" stroke-width="1"` : ""}/>${vein}</g>`;
}

function plant(kind, m, size, seed = 1) {
  const r = rng(seed);
  const { x, y } = m;
  let out = "";
  if (kind === "blades") {
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = -38 + (76 * i) / (n - 1) + (r() - 0.5) * 8;
      const len = size * (0.62 + r() * 0.38) * (1 - Math.abs(a) / 160);
      const col = i % 2 ? GREEN.mid : GREEN.dark;
      out += leaf(x + (r() - 0.5) * m.rx * 0.6, y, a, len, size * 0.075, col);
      // faixa clara nas bordas, característica da espada-de-são-jorge
      out += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})"><path d="M${f(size * 0.06)} ${f(-len * 0.3)} Q${f(size * 0.05)} ${f(-len * 0.7)} 0 ${f(-len * 0.98)}" stroke="${GREEN.lime}" stroke-width="1.6" fill="none" opacity="0.55"/></g>`;
    }
  } else if (kind === "rosette") {
    const n = 11;
    for (let layer = 0; layer < 2; layer++) {
      for (let i = 0; i < n; i++) {
        const a = -80 + (160 * i) / (n - 1) + (r() - 0.5) * 6;
        const len = size * (layer ? 0.55 : 0.8) * (0.9 + r() * 0.2);
        out += leaf(x + (a / 80) * m.rx * 0.25, y + 2, a * (layer ? 0.8 : 1), len, size * (layer ? 0.16 : 0.2), layer ? GREEN.sage : GREEN.light);
      }
    }
  } else if (kind === "arching") {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = -52 + (104 * i) / (n - 1);
      const len = size * (0.78 + r() * 0.25);
      const rad = (a * Math.PI) / 180;
      const ex = x + Math.sin(rad) * len * 0.8;
      const ey = y - Math.cos(rad) * len * 0.95;
      const cxq = x + Math.sin(rad) * len * 0.2;
      const cyq = y - len * 0.7;
      out += `<path d="M${f(x)} ${f(y)} Q${f(cxq)} ${f(cyq)} ${f(ex)} ${f(ey)}" stroke="${GREEN.dark}" stroke-width="${f(size * 0.018 + 1)}" fill="none"/>`;
      for (let k = 1; k <= 6; k++) {
        const t = k / 6.2;
        const px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * cxq + t * t * ex;
        const py = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * cyq + t * t * ey;
        const sz = size * 0.17 * (1.1 - t * 0.5);
        const side = k % 2 ? 1 : -1;
        out += `<ellipse cx="${f(px + side * sz * 0.55)}" cy="${f(py)}" rx="${f(sz * 0.55)}" ry="${f(sz * 0.26)}" transform="rotate(${f(side * 28 + a * 0.4)} ${f(px)} ${f(py)})" fill="${k % 2 ? GREEN.mid : GREEN.dark}"/>`;
      }
    }
  } else if (kind === "monstera" || kind === "calathea") {
    const n = 6;
    for (let i = 0; i < n; i++) {
      const a = -58 + (116 * i) / (n - 1) + (r() - 0.5) * 8;
      const len = size * (0.55 + r() * 0.45);
      const rad = (a * Math.PI) / 180;
      const ex = x + Math.sin(rad) * len;
      const ey = y - Math.cos(rad) * len;
      const ls = size * (0.26 + r() * 0.1);
      out += `<path d="M${f(x)} ${f(y)} L${f(ex)} ${f(ey)}" stroke="${GREEN.dark}" stroke-width="${f(size * 0.014 + 1)}"/>`;
      out += `<g transform="translate(${f(ex)} ${f(ey)}) rotate(${f(a * 0.7)})"><path d="M0 ${f(ls * 0.9)} C${f(-ls)} ${f(ls * 0.5)} ${f(-ls * 0.95)} ${f(-ls * 0.8)} 0 ${f(-ls * 0.95)} C${f(ls * 0.95)} ${f(-ls * 0.8)} ${f(ls)} ${f(ls * 0.5)} 0 ${f(ls * 0.9)} Z" fill="${i % 2 ? GREEN.mid : GREEN.dark}"/>
        <path d="M0 ${f(ls * 0.85)} L0 ${f(-ls * 0.8)}" stroke="${GREEN.light}" stroke-width="1.4" opacity="0.7"/>
        ${kind === "monstera" ? [-0.5, -0.1, 0.3].map((k) => `<path d="M${f(-ls * 0.45)} ${f(ls * k)} L${f(-ls * 0.98)} ${f(ls * (k - 0.12))}" stroke="#ECEAE5" stroke-width="${f(ls * 0.08)}"/><path d="M${f(ls * 0.45)} ${f(ls * k)} L${f(ls * 0.98)} ${f(ls * (k - 0.12))}" stroke="#ECEAE5" stroke-width="${f(ls * 0.08)}"/>`).join("") : [-0.55, -0.25, 0.05, 0.35].map((k) => `<path d="M0 ${f(ls * k)} L${f(-ls * 0.8)} ${f(ls * (k - 0.22))}" stroke="${GREEN.light}" stroke-width="${f(ls * 0.05)}" opacity="0.75"/><path d="M0 ${f(ls * k)} L${f(ls * 0.8)} ${f(ls * (k - 0.22))}" stroke="${GREEN.light}" stroke-width="${f(ls * 0.05)}" opacity="0.75"/>`).join("")}</g>`;
    }
  } else if (kind === "trailing") {
    for (let i = 0; i < 5; i++) {
      const side = i % 2 ? 1 : -1;
      const sx = x + side * m.rx * (0.2 + r() * 0.5);
      const len = size * (0.7 + r() * 0.6);
      const ex = sx + side * size * (0.25 + r() * 0.3);
      const ey = y + len;
      out += `<path d="M${f(x)} ${f(y)} Q${f(sx + side * size * 0.3)} ${f(y - size * 0.1)} ${f(sx + side * size * 0.15)} ${f(y + len * 0.3)} T${f(ex)} ${f(ey)}" stroke="${GREEN.dark}" stroke-width="2" fill="none"/>`;
      for (let k = 1; k <= 7; k++) {
        const t = k / 7;
        const px = x + (ex - x) * t * 0.9 + side * Math.sin(t * 3) * 8;
        const py = y + (ey - y) * t - size * 0.08 * (1 - t);
        out += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(size * 0.075)}" ry="${f(size * 0.06)}" transform="rotate(${f(side * 25 * (k % 2 ? 1 : -1))} ${f(px)} ${f(py)})" fill="${k % 3 ? GREEN.mid : GREEN.lime}"/>`;
      }
    }
    for (let i = 0; i < 9; i++) {
      const px = x + (r() - 0.5) * m.rx * 1.2;
      const py = y - r() * size * 0.35;
      out += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(size * 0.09)}" ry="${f(size * 0.07)}" fill="${i % 2 ? GREEN.mid : GREEN.lime}"/>`;
    }
  } else if (kind === "cactus") {
    const wd = size * 0.3;
    out += `<rect x="${f(x - wd / 2)}" y="${f(y - size)}" width="${f(wd)}" height="${f(size + 2)}" rx="${f(wd / 2)}" fill="${GREEN.mid}"/>`;
    for (let i = -1; i <= 1; i++) out += `<line x1="${f(x + i * wd * 0.28)}" y1="${f(y - size + wd * 0.4)}" x2="${f(x + i * wd * 0.28)}" y2="${f(y)}" stroke="${GREEN.dark}" stroke-width="1.4" opacity="0.45"/>`;
    out += `<path d="M${f(x + wd / 2 - 2)} ${f(y - size * 0.45)} h${f(wd * 0.5)} v${f(-size * 0.25)}" stroke="${GREEN.mid}" stroke-width="${f(wd * 0.42)}" stroke-linecap="round" fill="none"/>`;
    out += `<circle cx="${f(x + 1)}" cy="${f(y - size - 1)}" r="${f(wd * 0.16)}" fill="#C98A9B"/>`;
  } else if (kind === "bushy") {
    for (let i = 0; i < 38; i++) {
      const px = x + (r() - 0.5) * m.rx * 1.9;
      const py = y - r() * size * 0.85;
      const s = size * (0.09 + r() * 0.07);
      const col = [GREEN.mid, GREEN.lime, GREEN.dark, GREEN.sage][Math.floor(r() * 4)];
      out += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(s)}" ry="${f(s * 0.72)}" transform="rotate(${f((r() - 0.5) * 120)} ${f(px)} ${f(py)})" fill="${col}"/>`;
    }
  }
  return out;
}

// plant size factor relative to vase width (px)
const PLANT_K = { blades: 2.1, rosette: 0.55, arching: 1.7, monstera: 1.7, calathea: 1.5, trailing: 0.95, cactus: 1.05, bushy: 0.9 };

// ---------- cenário ----------
const DEFS = `<defs>
  <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4"/><feColorMatrix type="matrix" values="0 0 0 0 0.14  0 0 0 0 0.16  0 0 0 0 0.13  0 0 0 0.55 -0.12"/></filter>
  <radialGradient id="vig" cx="0.5" cy="0.45" r="0.8"><stop offset="0.6" stop-color="#232A21" stop-opacity="0"/><stop offset="1" stop-color="#232A21" stop-opacity="0.16"/></radialGradient>
  <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EFEDE8"/><stop offset="1" stop-color="#E3E0D9"/></linearGradient>
  <linearGradient id="wallWarm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EFEDE7"/><stop offset="1" stop-color="#DCD8CE"/></linearGradient>
  <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFCABF"/><stop offset="1" stop-color="#BDB8AC"/></linearGradient>
  <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C2A584"/><stop offset="1" stop-color="#A98A67"/></linearGradient>
  <linearGradient id="light" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.55"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
</defs>`;

function finish(w, h) {
  return `<rect width="${w}" height="${h}" fill="url(#vig)"/><rect width="${w}" height="${h}" filter="url(#grain)" opacity="0.5"/>`;
}

function windowSvg(x, y, w, h) {
  const mid = w / 2;
  return `<rect x="${x - 10}" y="${y - 10}" width="${w + 20}" height="${h + 20}" fill="#D9D5CC"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#F7F6F2"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#DDE6DA" opacity="0.5"/>
    <rect x="${x + mid - 4}" y="${y}" width="8" height="${h}" fill="#D9D5CC"/>
    <rect x="${x}" y="${y + h * 0.5 - 4}" width="${w}" height="8" fill="#D9D5CC"/>`;
}

function lightShaft(x, y, w, h, skew = 0.45) {
  return `<polygon points="${x},${y} ${x + w},${y} ${x + w + h * skew},${y + h} ${x + h * skew},${y + h}" fill="url(#light)" opacity="0.8"/>`;
}

function wallPlane(w, h, floorY) {
  return `<rect width="${w}" height="${h}" fill="url(#wall)"/><rect y="${floorY}" width="${w}" height="${h - floorY}" fill="url(#floor)"/><rect y="${floorY - 2}" width="${w}" height="3" fill="#232A21" opacity="0.07"/>`;
}

function shelfSvg(cx, y, w) {
  return `<rect x="${f(cx - w / 2)}" y="${f(y)}" width="${f(w)}" height="22" rx="2" fill="url(#wood)"/><rect x="${f(cx - w / 2)}" y="${f(y + 22)}" width="${f(w)}" height="14" fill="#232A21" opacity="0.07"/>`;
}

// spec do produto para gerar as imagens
const P = [
  { slug: "vaso-semente", kind: "ball", h: 12, w: 14, d: 14, plant: "cactus", finish: "natural" },
  { slug: "vaso-broto", kind: "cyl", h: 12, w: 12, d: 12, plant: "rosette", finish: "grafite" },
  { slug: "vaso-cuia", kind: "bowl", h: 8, w: 18, d: 18, plant: "rosette", finish: "areia" },
  { slug: "vaso-seixo", kind: "oval", h: 16, w: 20, d: 20, plant: "trailing", finish: "natural" },
  { slug: "vaso-ipe", kind: "cone", h: 20, w: 18, d: 18, plant: "arching", finish: "branco" },
  { slug: "vaso-ripado", kind: "ripado", h: 18, w: 18, d: 18, plant: "calathea", finish: "grafite" },
  { slug: "vaso-restinga", kind: "box", h: 14, w: 20, d: 20, plant: "rosette", finish: "areia" },
  { slug: "vaso-cambara", kind: "tall", h: 35, w: 22, d: 22, plant: "blades", finish: "natural" },
  { slug: "vaso-lua", kind: "ball", h: 28, w: 32, d: 32, plant: "monstera", finish: "branco" },
  { slug: "jardineira-mata", kind: "box", h: 15, w: 45, d: 18, plant: "bushy", finish: "grafite" },
];

function placeVase(spec, cx, by, s, opts = {}) {
  const fillHex = FINISH[opts.finish ?? spec.finish];
  const v = vase(spec.kind, cx, by, spec.h * s, spec.w * s, spec.d * s, fillHex);
  let svg = v.svg;
  if (opts.withPlant) {
    const k = PLANT_K[opts.plant ?? spec.plant];
    const size = spec.w * s * k * (opts.plantScale ?? 1);
    svg += plant(opts.plant ?? spec.plant, v.mouth, size, opts.seed ?? 3);
  }
  return { ...v, svg };
}

const wrap = (w, h, inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${DEFS}${inner}${finish(w, h)}</svg>`;

// ---------- tomadas de produto ----------
function shotEmpty(spec) {
  const W = 1000;
  const s = Math.min(520 / spec.h, 560 / (spec.w + (spec.kind === "box" ? spec.d * 0.3 : 0)));
  const floorY = 760;
  const v = placeVase(spec, 500, floorY, s);
  return wrap(W, W, `<rect width="${W}" height="${W}" fill="url(#wallWarm)"/>
    ${lightShaft(580, -40, 260, 900)}
    <rect y="${floorY}" width="${W}" height="${W - floorY}" fill="url(#floor)"/>
    <rect y="${floorY - 2}" width="${W}" height="3" fill="#232A21" opacity="0.06"/>${v.svg}`);
}

function shotPlant(spec, seed = 5) {
  const W = 1000;
  const k = PLANT_K[spec.plant];
  const wRef = spec.w + (spec.kind === "box" ? spec.d * 0.3 : 0);
  const s = Math.min(720 / (spec.h + k * spec.w), 640 / wRef, 40);
  const floorY = 800;
  const v = placeVase(spec, 500, floorY, s, { withPlant: true, seed });
  return wrap(W, W, `<rect width="${W}" height="${W}" fill="url(#wall)"/>
    ${lightShaft(60, -40, 300, 900)}
    <rect y="${floorY}" width="${W}" height="${W - floorY}" fill="url(#floor)"/>
    <rect y="${floorY - 2}" width="${W}" height="3" fill="#232A21" opacity="0.06"/>${v.svg}`);
}

function shotRoom(spec, seed = 9) {
  const W = 1000;
  const floorY = 720;
  const k = PLANT_K[spec.plant];
  const big = spec.h >= 25;
  const s = big ? Math.min(560 / (spec.h + k * spec.w), 14) : Math.min(260 / spec.w, 16);
  let inner = wallPlane(W, W, floorY);
  inner += windowSvg(560, 120, 300, 380);
  inner += lightShaft(560, 120, 300, 640, 0.6);
  // quadro
  inner += `<rect x="130" y="150" width="190" height="250" fill="#F6F5F2" stroke="#C9C5BD" stroke-width="6"/><path d="M175 365 C195 280 215 250 225 200 C235 250 255 280 275 365Z" fill="${GREEN.sage}" opacity="0.55"/>`;
  const wRef = spec.w + (spec.kind === "box" ? spec.d * 0.3 : 0);
  if (big) {
    
    inner += placeVase(spec, 420, floorY + 8, s, { withPlant: true, seed }).svg;
    inner += placeVase(P[0], 780, floorY + 70, 7, { withPlant: true, seed: 2 }).svg;
  } else {
    // aparador de madeira
    const topY = 560;
    inner += `<rect x="260" y="${topY}" width="520" height="22" fill="url(#wood)"/><rect x="280" y="${topY + 22}" width="14" height="${floorY - topY - 22 + 6}" fill="#A98A67"/><rect x="746" y="${topY + 22}" width="14" height="${floorY - topY - 22 + 6}" fill="#A98A67"/><rect x="260" y="${topY + 22}" width="520" height="10" fill="#232A21" opacity="0.08"/>`;
    inner += placeVase(spec, 520, topY, s, { withPlant: true, seed }).svg;
    inner += placeVase(P[1], 690, topY, 7.5, { withPlant: true, seed: 4 }).svg;
    inner += placeVase(P[2], 350, topY, 6, { withPlant: true, seed: 8 }).svg;
  }
  return wrap(W, W, inner);
}

function shotScale(spec, seed = 5) {
  const W = 1000;
  const floorY = 800;
  const k = PLANT_K[spec.plant];
  const wRef = spec.w + (spec.kind === "box" ? spec.d * 0.3 : 0);
  const s = Math.min(560 / spec.h, 420 / wRef, 34);
  const v = placeVase(spec, 430, floorY, s, { withPlant: spec.h < 22, plantScale: 0.7, seed });
  // régua vertical à direita
  const rx = Math.min(v.right + 90, 880);
  const cmMax = Math.min(60, Math.ceil(spec.h) + 2);
  let ruler = `<rect x="${rx}" y="${f(floorY - cmMax * s)}" width="64" height="${f(cmMax * s)}" fill="#F6F5F2" stroke="#C9C5BD"/>`;
  for (let cm = 0; cm <= cmMax; cm++) {
    const y = floorY - cm * s;
    const long = cm % 10 === 0;
    const mid = cm % 5 === 0;
    ruler += `<line x1="${rx}" y1="${f(y)}" x2="${rx + (long ? 34 : mid ? 24 : 14)}" y2="${f(y)}" stroke="#232A21" stroke-width="${long ? 2 : 1.2}"/>`;
    if (cm % 5 === 0 && cm > 0) ruler += `<text x="${rx + 40}" y="${f(y + 5)}" font-family="sans-serif" font-size="15" fill="#232A21">${cm}</text>`;
  }
  // linha de altura do vaso
  const hy = floorY - spec.h * s;
  ruler += `<line x1="${f(v.left - 30)}" y1="${f(hy)}" x2="${rx}" y2="${f(hy)}" stroke="#2F3E2C" stroke-width="1.5" stroke-dasharray="6 6"/>`;
  return wrap(W, W, `<rect width="${W}" height="${W}" fill="url(#wallWarm)"/>
    <rect y="${floorY}" width="${W}" height="${W - floorY}" fill="url(#floor)"/>
    <rect y="${floorY - 2}" width="${W}" height="3" fill="#232A21" opacity="0.06"/>${v.svg}${ruler}
    <text x="${rx}" y="${floorY + 44}" font-family="sans-serif" font-size="16" fill="#232A21" opacity="0.7">cm</text>`);
}

// ---------- cenas editoriais ----------
function heroScene() {
  const W = 1920;
  const H = 1080;
  const floorY = 860;
  let s = wallPlane(W, H, floorY);
  s = s.replace('fill="url(#wall)"', 'fill="url(#wallWarm)"');
  s += windowSvg(1180, 150, 420, 520);
  s += lightShaft(1180, 150, 420, 900, 0.85);
  s += lightShaft(1330, 150, 200, 900, 0.85);
  // vaso grande com plantão ao fundo
  s += `<ellipse cx="520" cy="${floorY + 14}" rx="190" ry="16" fill="#232A21" opacity="0.1"/>`;
  s += placeVase(P[7], 520, floorY + 8, 11, { withPlant: true, seed: 12, plantScale: 1.05 }).svg;
  s += placeVase(P[8], 1010, floorY + 10, 8.5, { withPlant: true, seed: 6, finish: "natural" }).svg;
  // aparador com peças menores
  s += `<rect x="1330" y="700" width="480" height="24" fill="url(#wood)"/><rect x="1350" y="724" width="16" height="${floorY - 724 + 4}" fill="#A98A67"/><rect x="1776" y="724" width="16" height="${floorY - 724 + 4}" fill="#A98A67"/>`;
  s += placeVase(P[4], 1440, 700, 9, { withPlant: true, seed: 3 }).svg;
  s += placeVase(P[0], 1580, 700, 8.5, { withPlant: true, seed: 22 }).svg;
  s += placeVase(P[2], 1710, 700, 6.5, { withPlant: true, seed: 7 }).svg;
  return wrap(W, H, s);
}

function categoryScene(slug) {
  const W = 900;
  const H = 1100;
  const floorY = 820;
  let s = wallPlane(W, H, floorY);
  const shelfY = 600;
  if (slug === "pequenos") {
    s += shelfSvg(450, shelfY, 760);
    s += placeVase(P[0], 220, shelfY, 12, { withPlant: true, seed: 3, plant: "cactus" }).svg;
    s += placeVase(P[1], 450, shelfY, 12.5, { withPlant: true, seed: 5 }).svg;
    s += placeVase(P[2], 690, shelfY, 9.5, { withPlant: true, seed: 8 }).svg;
  } else if (slug === "medios") {
    s += windowSvg(500, 110, 300, 360);
    s += lightShaft(500, 110, 300, 700, 0.6);
    s += `<rect x="220" y="${shelfY}" width="540" height="22" fill="url(#wood)"/><rect x="240" y="${shelfY + 22}" width="14" height="${floorY - shelfY - 16}" fill="#A98A67"/><rect x="726" y="${shelfY + 22}" width="14" height="${floorY - shelfY - 16}" fill="#A98A67"/>`;
    s += placeVase(P[4], 400, shelfY, 15, { withPlant: true, seed: 4 }).svg;
    s += placeVase(P[3], 620, shelfY, 8, { withPlant: true, seed: 9 }).svg;
  } else if (slug === "grandes") {
    s += lightShaft(80, -40, 260, 1000, 0.5);
    s += `<ellipse cx="450" cy="${floorY + 14}" rx="210" ry="16" fill="#232A21" opacity="0.1"/>`;
    s += placeVase(P[8], 450, floorY + 8, 8, { withPlant: true, seed: 6 }).svg;
    s += placeVase(P[7], 770, floorY + 6, 5.5, { withPlant: true, seed: 12 }).svg;
  } else {
    s += shelfSvg(450, shelfY, 780);
    s += placeVase(P[9], 450, shelfY, 12, { withPlant: true, seed: 11 }).svg;
  }
  return wrap(W, H, s);
}

function aboutScene(n) {
  const W = 1200;
  const H = 1500;
  let s = `<rect width="${W}" height="${H}" fill="url(#wallWarm)"/>`;
  if (n === 1) {
    // estante de secagem com peças curando
    for (let row = 0; row < 3; row++) {
      const y = 380 + row * 330;
      s += `<rect x="90" y="${y}" width="1020" height="26" fill="url(#wood)"/><rect x="90" y="${y + 26}" width="1020" height="12" fill="#232A21" opacity="0.08"/>`;
      const specs = [P[row * 2], P[row * 2 + 1], P[row * 2 + 2], P[(row * 2 + 3) % 10]];
      specs.forEach((sp, i) => {
        s += placeVase(sp, 260 + i * 240, y, 8 + (row % 2), { finish: ["natural", "grafite", "areia", "branco"][(i + row) % 4] }).svg;
      });
    }
    s += `<rect x="70" y="330" width="22" height="1000" fill="#A98A67"/><rect x="1108" y="330" width="22" height="1000" fill="#A98A67"/>`;
  } else {
    // bancada com moldes e peça em acabamento
    s += `<rect y="900" width="${W}" height="600" fill="url(#floor)"/><rect y="898" width="${W}" height="4" fill="#232A21" opacity="0.1"/>`;
    s += `<rect x="150" y="650" width="260" height="250" rx="6" fill="#B8B3A8"/><rect x="170" y="670" width="220" height="210" rx="4" fill="#9E998E"/>`;
    s += `<rect x="470" y="720" width="190" height="180" rx="6" fill="#B8B3A8"/><rect x="490" y="740" width="150" height="140" rx="4" fill="#9E998E"/>`;
    s += placeVase(P[7], 880, 900, 18, { withPlant: true, seed: 12 }).svg;
    s += lightShaft(0, -40, 380, 1400, 0.4);
  }
  return wrap(W, H, s);
}

function gallerySquare(n) {
  const W = 900;
  const floorY = 700;
  const idx = [[8, 3], [7, 1], [4, 5], [9, 2], [5, 6], [6, 8]][n - 1];
  let s = wallPlane(W, W, floorY);
  if (n % 2) s += windowSvg(560, 100, 240, 300) + lightShaft(560, 100, 240, 600, 0.6);
  const a = P[idx[0]];
  const b = P[idx[1]];
  if (a.h >= 25) s += placeVase(a, 360, floorY + 6, 6.5, { withPlant: true, seed: n * 3 }).svg;
  else {
    s += `<rect x="150" y="520" width="520" height="22" fill="url(#wood)"/>`;
    s += placeVase(a, 330, 520, 11, { withPlant: true, seed: n * 3 }).svg;
  }
  s += placeVase(b, 640, floorY + 40, 8, { withPlant: true, seed: n }).svg;
  return wrap(W, W, s);
}

// ---------- saída ----------
async function save(rel, svg) {
  const file = path.join(OUT, rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await sharp(Buffer.from(svg)).webp({ quality: 80 }).toFile(file);
}

const jobs = [];
for (const spec of P) {
  jobs.push(save(`products/${spec.slug}-1.webp`, shotEmpty(spec)));
  jobs.push(save(`products/${spec.slug}-2.webp`, shotPlant(spec)));
  jobs.push(save(`products/${spec.slug}-3.webp`, shotRoom(spec)));
  jobs.push(save(`products/${spec.slug}-4.webp`, shotScale(spec)));
}
jobs.push(save("hero.webp", heroScene()));
for (const c of ["pequenos", "medios", "grandes", "jardineiras"]) jobs.push(save(`categorias/${c}.webp`, categoryScene(c)));
jobs.push(save("sobre-1.webp", aboutScene(1)));
jobs.push(save("sobre-2.webp", aboutScene(2)));
for (let i = 1; i <= 6; i++) jobs.push(save(`galeria/${i}.webp`, gallerySquare(i)));
await Promise.all(jobs);
console.log(`ok: ${jobs.length} imagens em public/images`);
