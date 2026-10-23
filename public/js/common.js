// Utilitários compartilhados. Nunca usamos innerHTML com dados: tudo é montado via DOM (h()) → sem XSS.
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const SVG_NS = 'http://www.w3.org/2000/svg';

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v === null || v === undefined) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const clear = (el) => { while (el.firstChild) el.firstChild.remove(); return el; };
export const brl = (cents) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ---------------- Ícones (traço, 24x24) ----------------
const ICONS = {
  'arrow-right': 'M5 12h14M13 6l6 6-6 6',
  'arrow-left': 'M19 12H5M11 6l-6 6 6 6',
  height: 'M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4',
  gauge: 'M12 14l4-4M3.3 17a10 10 0 1 1 17.4 0',
  timer: 'M10 2h4M12 14l3-3M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  cable: 'M3 6c5 0 6 12 18 12M3 5.5h.01M21 18.5h.01',
  mountain: 'M3 20l6-11 4 7 3-4 5 8z',
  pin: 'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  ticket: 'M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4zM13 5v14',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3v3h-3zM20 14v6h-3',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
  bed: 'M3 18V8M3 14h18v4M21 14v-3a3 3 0 0 0-3-3h-7v6M7 11.5h.01',
  utensils: 'M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 21V3c-2.5 1.5-3 5-3 8h3',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z',
  sparkles: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 17l.7 1.8 1.8.7-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z',
  briefcase: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16',
  bag: 'M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0',
  chat: 'M4 20l1.3-4A8 8 0 1 1 8 18.7z',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  instagram: 'M4 4h16v16H4zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM17 7.5h.01',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  check: 'M5 12l5 5 9-10',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01',
  users: 'M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 20v-1a4 4 0 0 0-3-3.9M16 4.1a3.5 3.5 0 0 1 0 6.8',
  waves: 'M3 8c2 0 2-2 4.5-2S10 8 12 8s2-2 4.5-2S19 8 21 8M3 14c2 0 2-2 4.5-2S10 14 12 14s2-2 4.5-2S19 14 21 14M3 20c2 0 2-2 4.5-2S10 20 12 20s2-2 4.5-2S19 20 21 20',
  tree: 'M12 3l5 8h-3l4 6H6l4-6H7zM12 17v4',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  heart: 'M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z',
};

export function icon(name, cls = 'ic') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', cls);
  svg.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', ICONS[name] || ICONS.info);
  svg.append(p);
  return svg;
}

export const CATEGORY = {
  atrativo: 'Atrativo', guia: 'Guia', agencia: 'Agência', hospedagem: 'Hospedagem', gastronomia: 'Gastronomia', servico: 'Serviço',
};
export const KINDS = {
  hospedagem: ['Hospedagem', 'bed'], passeio: ['Passeio', 'compass'], refeicao: ['Gastronomia', 'utensils'],
  experiencia: ['Experiência', 'sparkles'], servico: ['Serviço', 'briefcase'], produto: ['Produto', 'bag'],
};
export const ATTRACTION_ICON = {
  'aparados-da-serra': 'mountain', 'serra-geral': 'cable', 'parque-estadual-do-tainhas': 'tree', 'cascata-velha-ouro-verde': 'waves', 'costao-do-cambara': 'compass',
};

export const FACT_ICON = { 'Extensão': 'cable', 'Altura do chão': 'height', 'Altitude': 'mountain', 'Velocidade média': 'gauge', 'Duração da descida': 'timer', 'Cabos': 'users' };

// Cartão de destaque da Tirolesa (produto próprio, vendido no site).
export function tirolesaFeature(t, { i = 0 } = {}) {
  return reveal(h('article', { class: 'card feature' },
    h('div', { class: 'fart', 'aria-hidden': 'true' },
      ['far', 'mid', 'near', 'zip-static'].map((n) => h('img', { src: `/img/hero/${n}.svg`, alt: '', loading: 'lazy' }))),
    h('div', { class: 'fbody' },
      h('span', { class: 'kicker' }, 'Venda online'),
      h('h3', {}, t.name),
      h('p', {}, t.summary),
      h('div', { class: 'price' }, h('small', {}, 'a partir de'), h('b', {}, brl(t.priceCents)), h('small', {}, 'por pessoa')),
      h('div', { class: 'actions' }, h('a', { class: 'btn btn-primary', href: '/tirolesa' }, icon('ticket'), 'Comprar ingresso'), h('a', { class: 'btn btn-glass', href: '/atrativos/serra-geral' }, 'Sobre o local')))), i);
}

// ---------------- Datas ----------------
const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export function dayParts(day) {
  const d = new Date(`${day}T12:00:00Z`);
  return { wd: WD[d.getUTCDay()], d: d.getUTCDate(), mo: MO[d.getUTCMonth()], y: d.getUTCFullYear() };
}
export const fmtDay = (day) => { const p = dayParts(day); return `${p.wd}., ${p.d} de ${p.mo}. de ${p.y}`; };

// ---------------- API ----------------
export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || 'Erro inesperado');
    this.status = status;
    this.body = body || {};
  }
}

let csrfToken = null;
export const setCsrf = (t) => { csrfToken = t; };

export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const init = { method, headers: { Accept: 'application/json', ...headers }, credentials: 'same-origin' };
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  if (method !== 'GET' && csrfToken) init.headers['X-CSRF-Token'] = csrfToken;
  let res;
  try {
    res = await fetch(`/api${path}`, init);
  } catch {
    throw new ApiError(0, { message: 'Sem conexão. Verifique sua internet e tente de novo.' });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

// ---- Atribuição por placa/QR (guardada por 3 dias neste aparelho; nenhum dado pessoal) ----
const QR_KEY = 'tdc_qr';
export function captureQr() {
  try {
    const q = new URLSearchParams(location.search).get('q');
    if (q && /^[a-z0-9-]{3,30}$/i.test(q)) localStorage.setItem(QR_KEY, JSON.stringify({ q: q.toLowerCase(), t: Date.now() }));
  } catch { /* storage indisponível: segue sem atribuição */ }
}
export function currentQr() {
  try {
    const v = JSON.parse(localStorage.getItem(QR_KEY) || 'null');
    if (v && Date.now() - v.t < 3 * 86400000) return v.q;
  } catch { /* ignora */ }
  return null;
}

// ---------------- Componentes ----------------
export const waLink = (digits, text = '') => {
  const d = String(digits).replace(/\D/g, '');
  const full = d.length <= 11 ? `55${d}` : d;
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};
export const initials = (name) => name.replace(/[—–-].*$/, '').split(/\s+/).filter((w) => w.length > 2 || /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || name[0].toUpperCase();
export const reveal = (el, i = 0) => { el.classList.add('reveal'); el.style.setProperty('--d', `${Math.min(i, 8) * 0.06}s`); return el; };

export function avatar(p, large = false) {
  return h('div', { class: `avatar${large ? ' lg' : ''}`, 'data-cat': p.category, 'aria-hidden': 'true' }, initials(p.name));
}

export function partnerCard(p, i = 0) {
  const hasContact = Boolean(p.whatsapp || p.phone || p.website);
  return reveal(h('a', { class: 'card partner-card', href: `/parceiros/${p.slug}`, 'data-cat': p.category },
    h('div', { class: 'top' }, avatar(p), h('div', {}, h('h3', {}, p.name), h('div', { class: 'tags' }, h('span', { class: 'tag' }, CATEGORY[p.category]), p.plan === 'fundador' ? h('span', { class: 'tag tag-founder' }, 'Fundador') : null))),
    h('p', { class: 'muted' }, p.tagline || 'Perfil em preparação.'),
    h('div', { class: 'actions' }, h('span', { class: 'link-arrow' }, hasContact ? 'Ver produtos e contato' : 'Ver página', icon('arrow-right')))), i);
}

export function productCard(p, { partner = null, i = 0 } = {}) {
  const owner = partner || p.partner;
  const [kindLabel, kindIcon] = KINDS[p.kind] || KINDS.produto;
  const msg = `Olá! Vi "${p.name}" no Terra dos Cânions Online e gostaria de mais informações.`;
  return reveal(h('article', { class: 'card product', 'data-kind': p.kind },
    h('div', { class: 'pimg' }, icon(kindIcon)),
    h('div', { class: 'pbody' },
      h('div', {}, h('span', { class: 'tag' }, kindLabel)),
      h('h3', {}, p.name),
      p.description ? h('p', { class: 'muted small' }, p.description) : null,
      p.partner ? h('div', { class: 'by' }, 'por ', h('a', { href: `/parceiros/${p.partner.slug}` }, p.partner.name)) : null,
      h('div', { class: 'price' }, p.priceCents === null || p.priceCents === undefined
        ? h('b', {}, 'Consulte')
        : [h('small', {}, 'a partir de'), h('b', {}, brl(p.priceCents)), p.priceNote ? h('small', {}, p.priceNote) : null]),
      owner?.whatsapp
        ? h('a', { class: 'btn btn-wa btn-small', href: waLink(owner.whatsapp, msg), target: '_blank', rel: 'noopener noreferrer' }, icon('chat'), 'Pedir informações')
        : (owner?.slug ? h('a', { class: 'btn btn-dark btn-small', href: `/parceiros/${owner.slug}` }, 'Ver contatos do parceiro') : null))), i);
}

// Arte das capas de atrativos (silhueta de serra em SVG; sem imagens externas).
export function attractionArt(a) {
  const art = h('div', { class: 'art', 'data-art': a.slug });
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 400 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  const mk = (d, fill, op) => { const p = document.createElementNS(SVG_NS, 'path'); p.setAttribute('d', d); p.setAttribute('fill', fill); p.setAttribute('opacity', op); return p; };
  svg.append(mk('M0 100V58L50 36l60 34 55-40 60 38 70-46 60 44 45-28v64z', '#ffffff', '.22'), mk('M0 100V76l70-26 55 30 70-36 80 40 70-22 55 20v18z', '#0a1f17', '.55'));
  art.append(svg, icon(ATTRACTION_ICON[a.slug] || 'mountain'));
  return art;
}

// ---------------- Layout (cabeçalho/rodapé) ----------------
const NAV = [['/', 'Início'], ['/produtos', 'Produtos'], ['/atrativos', 'Atrativos'], ['/parceiros', 'Parceiros']];

export function renderLayout() {
  const path = location.pathname.replace(/\/$/, '') || '/';
  const links = NAV.map(([href, label]) => h('a', { href, 'aria-current': path === href || (href !== '/' && path.startsWith(href)) ? 'page' : null }, label));
  links.push(h('a', { href: '/tirolesa', class: 'cta' }, 'Comprar ingresso'));
  const nav = h('nav', { class: 'nav', id: 'nav', 'aria-label': 'Principal' }, links);
  const btn = h('button', { class: 'menu-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'nav', onclick: () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  } }, icon('grid'), 'Menu');
  const header = h('header', { class: 'site-header' }, h('div', { class: 'wrap' },
    h('a', { class: 'brand', href: '/' }, h('img', { src: '/img/favicon.svg', alt: '', width: 34, height: 34 }), 'Terra dos Cânions'),
    btn, nav));
  document.body.prepend(h('a', { class: 'skip', href: '#conteudo' }, 'Ir para o conteúdo'), header);

  const footer = h('footer', { class: 'site-footer' }, h('div', { class: 'wrap' },
    h('div', { class: 'footer-grid' },
      h('div', {}, h('h4', {}, 'Terra dos Cânions Online'), h('p', {}, 'O guia de Cambará do Sul (RS): atrativos, hospedagem, gastronomia e a Tirolesa Mais Alta das Américas.')),
      h('div', {}, h('h4', {}, 'Explore'), h('ul', {},
        h('li', {}, h('a', { href: '/tirolesa' }, 'Tirolesa — ingressos')),
        h('li', {}, h('a', { href: '/produtos' }, 'Produtos e serviços')),
        h('li', {}, h('a', { href: '/atrativos' }, 'Atrativos')),
        h('li', {}, h('a', { href: '/parceiros' }, 'Parceiros')))),
      h('div', {}, h('h4', {}, 'Emergência'), h('ul', {},
        h('li', {}, h('a', { href: 'tel:193' }, '193 — Bombeiros')),
        h('li', {}, h('a', { href: 'tel:192' }, '192 — SAMU')),
        h('li', {}, h('a', { href: 'tel:190' }, '190 — Polícia Militar')))),
      h('div', {}, h('h4', {}, 'Legal'), h('ul', {},
        h('li', {}, h('a', { href: '/privacidade' }, 'Política de privacidade')),
        h('li', {}, h('a', { href: '/termos' }, 'Termos de uso e compra'))))),
    h('p', { class: 'legal' }, 'Pagamentos processados por provedor certificado — não armazenamos dados de cartão. Este site não é um canal oficial do ICMBio ou da SEMA-RS.')));
  document.body.append(footer);
  return header;
}

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function setupMotion(header) {
  document.documentElement.classList.add('js');
  const hero = $('.hero');
  if (hero) document.body.dataset.hero = '';
  // Cabeçalho vira vidro ao rolar; camadas do herói se movem em ritmos diferentes (parallax suave).
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      header.classList.toggle('scrolled', y > 24);
      if (hero && !reduced() && y < 1200) document.documentElement.style.setProperty('--sy', `${y}px`);
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (reduced()) document.querySelectorAll('img.zip').forEach((i) => { i.src = '/img/hero/zip-static.svg'; });

  // Revela elementos .reveal quando chegam perto da área visível. Checagem por posição (não por observer):
  // funciona com saltos de rolagem (âncoras), impressão e elementos criados depois do carregamento.
  if (reduced()) { document.documentElement.classList.remove('js'); return; }
  const sweep = () => {
    const limit = window.innerHeight * 0.94;
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

export function showError(container, err) {
  const msg = err instanceof ApiError ? err.message : 'Algo deu errado. Tente novamente.';
  clear(container).append(h('div', { class: 'alert alert-error', role: 'alert' }, msg));
}

export function boot() {
  captureQr();
  const header = renderLayout();
  setupMotion(header);
}
