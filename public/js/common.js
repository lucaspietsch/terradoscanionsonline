// Utilitários compartilhados. Nunca usamos innerHTML com dados: tudo é montado via DOM (h()) → sem XSS.
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

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

const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export function dayParts(day) {
  const d = new Date(`${day}T12:00:00Z`);
  return { wd: WD[d.getUTCDay()], d: d.getUTCDate(), mo: MO[d.getUTCMonth()], y: d.getUTCFullYear() };
}
export const fmtDay = (day) => { const p = dayParts(day); return `${p.wd}., ${p.d} de ${p.mo}. de ${p.y}`; };

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

// ---- Layout (cabeçalho/rodapé) ----
const NAV = [
  ['/', 'Início'], ['/atrativos', 'Atrativos'], ['/parceiros', 'Parceiros'],
];
export function renderLayout() {
  const path = location.pathname.replace(/\/$/, '') || '/';
  const links = NAV.map(([href, label]) => h('a', { href, 'aria-current': path === href || (href !== '/' && path.startsWith(href)) ? 'page' : null }, label));
  links.push(h('a', { href: '/tirolesa', class: 'cta' }, 'Comprar ingresso'));
  const nav = h('nav', { class: 'nav', id: 'nav', 'aria-label': 'Principal' }, links);
  const btn = h('button', { class: 'menu-btn', 'aria-expanded': 'false', 'aria-controls': 'nav', onclick: () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  } }, 'Menu');
  const header = h('header', { class: 'site-header' }, h('div', { class: 'wrap' },
    h('a', { class: 'brand', href: '/' }, h('img', { src: '/img/favicon.svg', alt: '', width: 32, height: 32 }), 'Terra dos Cânions'),
    btn, nav));
  document.body.prepend(h('a', { class: 'skip', href: '#conteudo' }, 'Ir para o conteúdo'), header);

  const footer = h('footer', { class: 'site-footer' }, h('div', { class: 'wrap' },
    h('div', { class: 'footer-grid' },
      h('div', {}, h('h4', {}, 'Terra dos Cânions Online'), h('p', {}, 'O guia de Cambará do Sul (RS): atrativos, hospedagem, gastronomia e a Tirolesa Mais Alta das Américas.')),
      h('div', {}, h('h4', {}, 'Explore'), h('ul', {},
        h('li', {}, h('a', { href: '/tirolesa' }, 'Tirolesa — ingressos')),
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
}

export function showError(container, err) {
  const msg = err instanceof ApiError ? err.message : 'Algo deu errado. Tente novamente.';
  clear(container).append(h('div', { class: 'alert alert-error', role: 'alert' }, msg));
}

export const waLink = (digits, text = '') => {
  const d = String(digits).replace(/\D/g, '');
  const full = d.length <= 11 ? `55${d}` : d;
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};

export const CATEGORY = {
  atrativo: 'Atrativo', guia: 'Guia', agencia: 'Agência', hospedagem: 'Hospedagem', gastronomia: 'Gastronomia', servico: 'Serviço',
};

export function boot() {
  captureQr();
  renderLayout();
}
