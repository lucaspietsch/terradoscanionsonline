// Interface "viva": avisos (toast), confete, contadores, tema, detecção de aparelho, movimento e instalação (PWA).
import { api } from './api.js';
import { $, h, icon } from './dom.js';

export const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const safeStore = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage indisponível */ } },
};
export { safeStore };

// ---------------- Aparelho ----------------
// Reconhece celular, tablet e computador logo ao abrir (largura, tipo de entrada e user agent) e marca o <html>
// com data-device / data-input. O CSS usa isso para trocar de layout: barra inferior no celular, efeitos de mouse no computador.
export function detectDevice() {
  const w = window.innerWidth;
  const ua = navigator.userAgent || '';
  const phoneUA = /iPhone|iPod|Android.*Mobile|Windows Phone|Mobile/i.test(ua);
  const tabletUA = /iPad|Tablet|Android(?!.*Mobile)/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  if (w < 720 || (phoneUA && w < 960)) return 'mobile';
  if (tabletUA || (coarse && w < 1100)) return 'tablet';
  return 'desktop';
}
export function initDevice() {
  const root = document.documentElement;
  const set = () => {
    root.dataset.device = detectDevice();
    root.dataset.input = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ? 'mouse' : 'touch';
  };
  set();
  let t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(set, 120); });
  addEventListener('orientationchange', set);
}

// ---------------- Avisos ----------------
let toastBox;
export function toast(msg, { type = 'info', ms = 2800, ic = null } = {}) {
  toastBox ??= document.body.appendChild(h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' }));
  const t = h('div', { class: `toast toast-${type}` }, ic ? icon(ic) : null, h('span', {}, msg));
  toastBox.append(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 350); }, ms);
}

// ---------------- Confete (ingresso confirmado) ----------------
export function confetti({ count = 110, ms = 2600 } = {}) {
  if (reduced()) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const c = h('canvas', { class: 'confetti', 'aria-hidden': 'true' });
  document.body.append(c);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  const colors = ['#8c3a3a', '#c9a45c', '#4a7a5c', '#2f5d8a', '#ffffff', '#6b5b95'];
  const ps = Array.from({ length: count }, () => ({
    x: innerWidth / 2 + (Math.random() - .5) * 160, y: innerHeight * .35, vx: (Math.random() - .5) * 11, vy: -Math.random() * 12 - 3,
    s: Math.random() * 7 + 4, r: Math.random() * 6.28, vr: (Math.random() - .5) * .3, c: colors[Math.floor(Math.random() * colors.length)],
  }));
  const t0 = performance.now();
  (function frame(now) {
    const p = (now - t0) / ms;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const q of ps) {
      q.vy += .32; q.x += q.vx; q.y += q.vy; q.r += q.vr; q.vx *= .992;
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.r); ctx.globalAlpha = Math.max(0, 1 - p * p);
      ctx.fillStyle = q.c; ctx.fillRect(-q.s / 2, -q.s / 3, q.s, q.s * .66); ctx.restore();
    }
    if (p < 1) requestAnimationFrame(frame); else c.remove();
  })(t0);
}

// ---------------- Contadores animados ----------------
export function countUp(el, to, { ms = 1100, from = 0, fmt = (n) => String(Math.round(n)) } = {}) {
  if (reduced() || !Number.isFinite(to) || from === to) { el.textContent = fmt(to); return; }
  const t0 = performance.now();
  (function tick(now) {
    const p = Math.min(1, (now - t0) / ms);
    el.textContent = fmt(from + (to - from) * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}
// Anima quando o contador entra na tela: <span class="count" data-to="15">0</span>
export function watchCounters(root = document) {
  const pending = [...root.querySelectorAll('.count:not([data-done])')];
  if (!pending.length) return;
  const check = () => {
    for (const el of pending.splice(0).filter((e) => { const r = e.getBoundingClientRect(); if (r.top < innerHeight * .95 && r.bottom > 0) return true; pending.push(e); return false; })) {
      el.dataset.done = '1';
      countUp(el, Number(el.dataset.to));
    }
    if (!pending.length) removeEventListener('scroll', check);
  };
  addEventListener('scroll', check, { passive: true });
  check();
}

// ---------------- Compartilhar ----------------
export async function share({ title, text = '', url = location.href }) {
  try {
    if (navigator.share) { await navigator.share({ title, text, url }); return; }
    await navigator.clipboard.writeText(url);
    toast('Link copiado!', { type: 'ok', ic: 'check' });
  } catch (e) {
    if (e?.name !== 'AbortError') toast('Não foi possível compartilhar agora.', { type: 'error' });
  }
}

// ---------------- Tema claro/escuro ----------------
const THEME_KEY = 'tdc_theme';
export function currentTheme() {
  const v = safeStore.get(THEME_KEY);
  if (v === 'light' || v === 'dark') return v;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
export function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  $('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#0f1713' : '#12261d');
}
export function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  safeStore.set(THEME_KEY, next);
  applyTheme(next);
  return next;
}

// ---------------- Instalar como app (PWA) ----------------
export function initInstall(button) {
  let deferred = null;
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; button.hidden = false; });
  addEventListener('appinstalled', () => { button.hidden = true; toast('App instalado! 🎉', { type: 'ok' }); });
  button.addEventListener('click', async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice.catch(() => {});
    deferred = null; button.hidden = true;
  });
}
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

// ---------------- Movimento: progresso, parallax, glow, voltar ao topo, revelar ----------------
export function initMotion(header) {
  const root = document.documentElement;
  root.classList.add('js');
  const hero = $('.hero');
  if (hero) {
    document.body.dataset.hero = '';
    // Foto de fundo (public/img/hero/canyon.jpg): se o arquivo existir, entra no lugar da ilustração; se não, nada muda.
    api('/site').then((site) => {
      if (!site.heroPhoto) return;
      const photo = '/img/hero/canyon.jpg';
      const probe = new Image();
      probe.onload = () => { root.style.setProperty('--hero-photo', `url("${photo}")`); hero.classList.add('has-photo'); };
      probe.src = photo;
    }).catch(() => { /* sem foto: segue a ilustração */ });
  }

  const bar = h('div', { class: 'scroll-progress', 'aria-hidden': 'true' });
  const top = h('button', { class: 'to-top', type: 'button', 'aria-label': 'Voltar ao topo', hidden: true, onclick: () => scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' }) }, icon('arrow-up'));
  document.body.append(bar, top);

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY;
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      root.style.setProperty('--p', String(Math.min(1, y / max)));
      header.classList.toggle('scrolled', y > 24);
      top.hidden = y < 900;
      if (hero && !reduced() && y < 1200) root.style.setProperty('--sy', `${y}px`);
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (reduced()) document.querySelectorAll('img.zip').forEach((i) => { i.src = '/img/hero/zip-static.svg'; });

  // Efeitos de mouse (só com mouse de verdade e sem "reduzir movimento"): brilho que segue o cursor nos cartões e parallax no herói.
  if (!reduced()) {
    document.addEventListener('pointermove', (e) => {
      if (root.dataset.input !== 'mouse') return;
      const card = e.target.closest?.('.card');
      if (card) { const r = card.getBoundingClientRect(); card.style.setProperty('--mx', `${e.clientX - r.left}px`); card.style.setProperty('--my', `${e.clientY - r.top}px`); }
      if (hero) { root.style.setProperty('--px', String((e.clientX / innerWidth - .5) * 2)); root.style.setProperty('--py', String((e.clientY / innerHeight - .5) * 2)); }
    }, { passive: true });
  }

  // Revela elementos .reveal perto da área visível (por posição: funciona com âncoras, impressão e conteúdo criado depois).
  if (reduced()) { root.classList.remove('js'); return; }
  const sweep = () => {
    const limit = innerHeight * 0.94;
    document.querySelectorAll('.reveal:not(.in)').forEach((el) => { if (el.getBoundingClientRect().top < limit) el.classList.add('in'); });
  };
  let queued = false;
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; sweep(); }); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  addEventListener('load', queue);
  new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
  queue();
}
