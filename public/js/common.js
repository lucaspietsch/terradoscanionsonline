// Utilitários e componentes compartilhados. Nunca usamos innerHTML com dados: tudo é montado via DOM (h()) → sem XSS.
import { ApiError } from './api.js';
import { brl, clear, h, icon, svgEl } from './dom.js';
import { favoritesButton, heartButton } from './favorites.js';
import { initSearchShortcuts, searchButton } from './search.js';
import {
  applyTheme, currentTheme, initDevice, initInstall, initMotion, registerServiceWorker, toggleTheme, watchCounters,
} from './ui.js';

export * from './dom.js';
export * from './api.js';
export { confetti, countUp, reduced, share, toast, watchCounters } from './ui.js';

export const CATEGORY = {
  atrativo: 'Atrativo', guia: 'Guia', agencia: 'Agência', hospedagem: 'Hospedagem', gastronomia: 'Gastronomia', servico: 'Serviço',
};
export const KINDS = {
  hospedagem: ['Hospedagem', 'bed'], passeio: ['Passeio', 'compass'], refeicao: ['Gastronomia', 'utensils'],
  experiencia: ['Experiência', 'sparkles'], servico: ['Serviço', 'briefcase'], produto: ['Produto', 'bag'],
};
export const ATTRACTION_ICON = {
  'aparados-da-serra': 'mountain', 'serra-geral': 'tree', 'canion-fortaleza': 'cable', 'parque-estadual-do-tainhas': 'tree', 'cascata-velha-ouro-verde': 'waves', 'costao-do-cambara': 'compass',
};
export const ATTRACTION_NAME = {
  'aparados-da-serra': 'Parque Nacional de Aparados da Serra', 'serra-geral': 'Parque Nacional da Serra Geral', 'canion-fortaleza': 'Cânion Fortaleza',
  'parque-estadual-do-tainhas': 'Parque Estadual do Tainhas', 'cascata-velha-ouro-verde': 'Cascata Velha — Ouro Verde', 'costao-do-cambara': 'Costão do Cambará',
};
export const FACT_ICON = { 'Extensão': 'cable', 'Altura do chão': 'height', 'Altitude': 'mountain', 'Velocidade média': 'gauge', 'Duração da descida': 'timer', 'Cabos': 'users' };

// ---------------- Datas ----------------
const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export function dayParts(day) {
  const d = new Date(`${day}T12:00:00Z`);
  return { wd: WD[d.getUTCDay()], d: d.getUTCDate(), mo: MO[d.getUTCMonth()], y: d.getUTCFullYear() };
}
export const fmtDay = (day) => { const p = dayParts(day); return `${p.wd}., ${p.d} de ${p.mo}. de ${p.y}`; };

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

// O coração fica FORA do <a> (botão dentro de link é HTML inválido), sobreposto por CSS.
const withHeart = (card, item, i) => reveal(h('div', { class: 'cardwrap' }, card, heartButton(item)), i);

export function partnerCard(p, i = 0) {
  const hasContact = Boolean(p.whatsapp || p.phone || p.website);
  return withHeart(h('a', { class: 'card partner-card', href: `/parceiros/${p.slug}`, 'data-cat': p.category },
    h('div', { class: 'top' }, avatar(p), h('div', {}, h('h3', {}, p.name), h('div', { class: 'tags' }, h('span', { class: 'tag' }, CATEGORY[p.category]), p.plan === 'fundador' ? h('span', { class: 'tag tag-founder' }, 'Fundador') : null))),
    h('p', { class: 'muted' }, p.tagline || 'Perfil em preparação.'),
    h('div', { class: 'actions' }, h('span', { class: 'link-arrow' }, hasContact ? 'Ver produtos e contato' : 'Ver página', icon('arrow-right')))),
  { key: `p:${p.slug}`, type: 'Parceiro', name: p.name, sub: CATEGORY[p.category], href: `/parceiros/${p.slug}` }, i);
}

// Arte das capas de atrativos (silhueta de serra em SVG; sem imagens externas).
export function attractionArt(a) {
  const art = h('div', { class: 'art', 'data-art': a.slug });
  const svg = svgEl('svg', { viewBox: '0 0 400 100', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
  svg.append(svgEl('path', { d: 'M0 100V58L50 36l60 34 55-40 60 38 70-46 60 44 45-28v64z', fill: '#ffffff', opacity: '.22' }), svgEl('path', { d: 'M0 100V76l70-26 55 30 70-36 80 40 70-22 55 20v18z', fill: '#0a1f17', opacity: '.55' }));
  art.append(svg, icon(ATTRACTION_ICON[a.slug] || 'mountain'));
  return art;
}

export function attractionCard(a, i = 0) {
  return withHeart(h('a', { class: 'card', href: `/atrativos/${a.slug}` },
    attractionArt(a), h('span', { class: 'tag' }, a.kind), h('h3', {}, a.name), h('p', { class: 'muted small' }, a.summary),
    a.highlights ? h('div', { class: 'tags' }, a.highlights.slice(0, 3).map((x) => h('span', { class: 'pill' }, x))) : null,
    h('span', { class: 'link-arrow' }, 'Ver página', icon('arrow-right'))),
  { key: `a:${a.slug}`, type: 'Atrativo', name: a.name, sub: a.kind, href: `/atrativos/${a.slug}` }, i);
}

// Produto de parceiro OU o ingresso da Tirolesa (p.href/p.buy: vendido aqui mesmo).
export function productCard(p, { partner = null, i = 0 } = {}) {
  const owner = partner || p.partner;
  const [kindLabel, kindIcon] = KINDS[p.kind] || KINDS.produto;
  const msg = `Olá! Vi "${p.name}" no Terra dos Cânions Online e gostaria de mais informações.`;
  const href = p.buy ? p.href : (owner?.slug ? `/parceiros/${owner.slug}` : '/produtos');
  const card = h('article', { class: 'card product', 'data-kind': p.kind },
    h('div', { class: 'pimg' }, icon(p.buy ? 'ticket' : kindIcon)),
    h('div', { class: 'pbody' },
      h('div', { class: 'tags' }, h('span', { class: 'tag' }, p.buy ? 'Ingresso online' : kindLabel), p.attractionSlug && !p.buy ? h('span', { class: 'tag' }, ATTRACTION_NAME[p.attractionSlug] || '') : null),
      h('h3', {}, p.name),
      p.description ? h('p', { class: 'muted small' }, p.description) : null,
      p.buy ? h('div', { class: 'by' }, 'em ', h('a', { href: `/atrativos/${p.attractionSlug}` }, ATTRACTION_NAME[p.attractionSlug])) : null,
      p.partner ? h('div', { class: 'by' }, 'por ', h('a', { href: `/parceiros/${p.partner.slug}` }, p.partner.name)) : null,
      h('div', { class: 'price' }, p.priceCents === null || p.priceCents === undefined
        ? h('b', {}, 'Consulte')
        : [h('small', {}, 'a partir de'), h('b', {}, brl(p.priceCents)), p.priceNote ? h('small', {}, p.priceNote) : null]),
      p.buy
        ? h('a', { class: 'btn btn-primary btn-small', href: p.href }, icon('ticket'), 'Comprar ingresso')
        : owner?.whatsapp
          ? h('a', { class: 'btn btn-wa btn-small', href: waLink(owner.whatsapp, msg), target: '_blank', rel: 'noopener noreferrer' }, icon('chat'), 'Pedir informações')
          : (owner?.slug ? h('a', { class: 'btn btn-dark btn-small', href: `/parceiros/${owner.slug}` }, 'Ver contatos do parceiro') : null)));
  const key = p.buy ? 'i:tirolesa' : `i:${p.id}`;
  return reveal(h('div', { class: 'cardwrap' }, card, heartButton({ key, type: 'Produto', name: p.name, sub: p.buy ? 'Ingresso online' : (owner ? owner.name : ''), href }, { className: 'on-image' })), i);
}

// Cartão grande do produto "Tirolesa" (usado na página do atrativo Cânion Fortaleza).
export function tirolesaFeature(t, { i = 0 } = {}) {
  return reveal(h('article', { class: 'card feature' },
    h('div', { class: 'fart', 'aria-hidden': 'true' },
      ['far', 'mid', 'near', 'zip-static'].map((n) => h('img', { src: `/img/hero/${n}.svg`, alt: '', loading: 'lazy' }))),
    h('div', { class: 'fbody' },
      h('span', { class: 'kicker' }, 'Produto · ingresso online'),
      h('h3', {}, t.name),
      h('p', {}, t.summary),
      h('div', { class: 'price' }, h('small', {}, 'a partir de'), h('b', {}, brl(t.priceCents)), h('small', {}, 'por pessoa')),
      h('div', { class: 'actions' }, h('a', { class: 'btn btn-primary', href: '/tirolesa' }, icon('ticket'), 'Ver datas e comprar')))), i);
}

// Camadas da ilustração do herói (escondidas automaticamente quando existe a foto de fundo).
export function heroLayers({ zip = false } = {}) {
  const layers = ['sky', 'far', 'mid', 'near'].concat(zip ? ['zip'] : []);
  return layers.map((n) => h('img', { class: `hero-layer ${n}`, src: `/img/hero/${n}.svg`, alt: '', width: 1600, height: 900 }));
}

// Próximos horários da Tirolesa, com atualização automática (disponibilidade "ao vivo").
export function liveSlots({ slug = 'tirolesa-mais-alta-das-americas', max = 3, light = false } = {}) {
  const dot = h('span', { class: 'live-dot' });
  const pills = h('span', { class: 'live-pills' });
  const box = h('div', { class: `live${light ? ' on-light' : ''}`, hidden: true }, h('span', { class: 'live-label' }, dot, 'Próximos horários · ao vivo'), pills);
  const localDay = (offset = 0) => { const d = new Date(Date.now() + offset * 86400000); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const label = (day) => { if (day === localDay(0)) return 'Hoje'; if (day === localDay(1)) return 'Amanhã'; const p = dayParts(day); return `${p.wd}., ${p.d}/${p.mo}`; };
  const load = async () => {
    try {
      const r = await api(`/products/${slug}/availability`);
      const next = r.slots.filter((x) => x.left > 0 && !x.closed).slice(0, max);
      clear(pills).append(...next.map((x) => h('a', { class: 'slot-pill', href: '/tirolesa' }, h('b', {}, `${label(x.day)} · ${x.time}`), h('small', {}, x.left <= 5 ? `só ${x.left} vagas` : `${x.left} vagas`))));
      box.hidden = next.length === 0;
    } catch { /* sem disponibilidade: o bloco fica oculto */ }
  };
  load();
  const timer = setInterval(() => { if (!box.isConnected) { clearInterval(timer); return; } load(); }, 45000);
  return box;
}

// ---------------- Layout (cabeçalho, barra inferior no celular e rodapé) ----------------
const NAV = [['/', 'Início'], ['/atrativos', 'Atrativos'], ['/produtos', 'Produtos'], ['/parceiros', 'Parceiros']];
const TABS = [['/', 'Início', 'home'], ['/atrativos', 'Atrativos', 'mountain'], ['/produtos', 'Produtos', 'bag'], ['/parceiros', 'Parceiros', 'users'], ['/tirolesa', 'Ingressos', 'ticket']];

export function renderLayout() {
  const path = location.pathname.replace(/\/$/, '') || '/';
  const current = (href) => (path === href || (href !== '/' && path.startsWith(`${href}/`)) ? 'page' : null);

  const links = NAV.map(([href, label]) => h('a', { href, 'aria-current': current(href) }, label));
  links.push(h('a', { href: '/tirolesa', class: 'cta-soft', 'aria-current': current('/tirolesa') }, icon('ticket'), 'Ingressos'));
  const nav = h('nav', { class: 'nav', id: 'nav', 'aria-label': 'Principal' }, links);
  const menuBtn = h('button', { class: 'menu-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'nav', onclick: () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  } }, icon('grid'), 'Menu');

  const themeBtn = h('button', { class: 'icon-btn', type: 'button', onclick: () => { applyIcon(toggleTheme()); } });
  const applyIcon = (t) => { clear(themeBtn).append(icon(t === 'dark' ? 'sun' : 'moon')); themeBtn.setAttribute('aria-label', t === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'); };
  applyTheme(currentTheme());
  applyIcon(currentTheme());
  const installBtn = h('button', { class: 'icon-btn install', type: 'button', hidden: true, 'aria-label': 'Instalar o app no celular' }, icon('download'));
  initInstall(installBtn);

  const header = h('header', { class: 'site-header' }, h('div', { class: 'wrap' },
    h('a', { class: 'brand', href: '/' }, h('img', { src: '/img/favicon.svg', alt: '', width: 34, height: 34 }), h('span', {}, 'Terra dos Cânions')),
    nav,
    h('div', { class: 'header-actions' }, searchButton(), favoritesButton(), themeBtn, installBtn, menuBtn)));
  document.body.prepend(h('a', { class: 'skip', href: '#conteudo' }, 'Ir para o conteúdo'), header);

  // Barra inferior: só aparece em celulares (CSS por html[data-device="mobile"]).
  document.body.append(h('nav', { class: 'tabbar', 'aria-label': 'Navegação rápida' },
    TABS.map(([href, label, ic]) => h('a', { href, 'aria-current': current(href), onclick: () => navigator.vibrate?.(8) }, icon(ic), h('span', {}, label)))));

  const footer = h('footer', { class: 'site-footer' }, h('div', { class: 'wrap' },
    h('div', { class: 'footer-grid' },
      h('div', {}, h('h4', {}, 'Terra dos Cânions Online'), h('p', {}, 'O guia de Cambará do Sul (RS): atrativos, hospedagem, gastronomia e experiências na Terra dos Cânions.')),
      h('div', {}, h('h4', {}, 'Explore'), h('ul', {},
        h('li', {}, h('a', { href: '/atrativos' }, 'Atrativos')),
        h('li', {}, h('a', { href: '/atrativos/canion-fortaleza' }, 'Cânion Fortaleza')),
        h('li', {}, h('a', { href: '/produtos' }, 'Produtos e serviços')),
        h('li', {}, h('a', { href: '/parceiros' }, 'Parceiros')),
        h('li', {}, h('a', { href: '/tirolesa' }, 'Ingressos da Tirolesa')))),
      h('div', {}, h('h4', {}, 'Emergência'), h('ul', {},
        h('li', {}, h('a', { href: 'tel:193' }, '193 — Bombeiros')),
        h('li', {}, h('a', { href: 'tel:192' }, '192 — SAMU')),
        h('li', {}, h('a', { href: 'tel:190' }, '190 — Polícia Militar')))),
      h('div', {}, h('h4', {}, 'Legal'), h('ul', {},
        h('li', {}, h('a', { href: '/privacidade' }, 'Política de privacidade')),
        h('li', {}, h('a', { href: '/termos' }, 'Termos de uso e compra'))))),
    h('p', { class: 'legal' }, 'Feito com carinho na Terra dos Cânions. Pagamentos processados por provedor certificado — não armazenamos dados de cartão. Este site não é um canal oficial do ICMBio ou da SEMA-RS.')));
  document.body.append(footer);
  return header;
}

export function showError(container, err) {
  const msg = err instanceof ApiError ? err.message : 'Algo deu errado. Tente novamente.';
  clear(container).append(h('div', { class: 'alert alert-error', role: 'alert' }, msg));
}

export function boot() {
  initDevice(); // 1º: reconhece celular/tablet/computador antes de montar qualquer coisa
  captureQr();
  const header = renderLayout();
  initMotion(header);
  initSearchShortcuts();
  registerServiceWorker();
  watchCounters();
}

