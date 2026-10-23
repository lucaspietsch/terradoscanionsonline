import {
  $, ApiError, ATTRACTION_NAME, api, attractionCard, boot, clear, h, heroLayers, icon, liveSlots, partnerCard, productCard, reveal, share, showError, tirolesaFeature,
} from './common.js';
import { heartButton } from './favorites.js';
boot();
const root = $('#conteudo');
const slug = decodeURIComponent(location.pathname.split('/').filter(Boolean).pop() || '');

const crumbs = (a) => h('nav', { class: 'crumbs', 'aria-label': 'Você está em' }, h('a', { href: '/' }, 'Início'), h('span', {}, '/'), h('a', { href: '/atrativos' }, 'Atrativos'), h('span', {}, '/'), h('span', {}, a.name));

try {
  const a = await api(`/attractions/${encodeURIComponent(slug)}`);
  document.title = `${a.name} — Terra dos Cânions Online`;
  const hasProducts = Boolean(a.tirolesa) || a.products.length > 0;
  const fav = heartButton({ key: `a:${a.slug}`, type: 'Atrativo', name: a.name, sub: a.kind, href: `/atrativos/${a.slug}` });
  const actions = h('div', { class: 'actions' },
    hasProducts ? h('a', { class: 'btn btn-primary', href: '#produtos' }, 'Ver produtos') : h('a', { class: 'btn btn-glass', href: '#guias' }, 'Quem pode te levar'),
    h('button', { class: 'btn btn-glass share-btn', type: 'button', onclick: () => share({ title: a.name, text: a.summary }) }, icon('share'), 'Compartilhar'));

  // O Cânion Fortaleza ganha um herói "de capa"; os demais usam o cabeçalho colorido.
  const hero = a.slug === 'canion-fortaleza'
    ? h('header', { class: 'hero compact', 'aria-labelledby': 'h1' }, ...heroLayers({ zip: true }),
      h('div', { class: 'wrap' }, crumbs(a), h('span', { class: 'tag' }, a.kind), h('h1', { id: 'h1' }, a.name), h('p', { class: 'lead' }, a.summary), actions))
    : h('header', { class: 'page-hero', 'data-art': a.slug }, h('div', { class: 'wrap' }, crumbs(a), h('span', { class: 'tag' }, a.kind), h('h1', {}, a.name), h('p', { class: 'lead' }, a.summary), actions));
  if (a.slug !== 'canion-fortaleza') hero.querySelector('.wrap').append(h('div', { class: 'hero-fav' }, fav));

  const products = h('section', { id: 'produtos', 'aria-labelledby': 'prod-h' }, h('div', { class: 'wrap' },
    h('div', { class: 'section-head reveal' }, h('span', { class: 'kicker' }, 'Produtos'), h('h2', { id: 'prod-h' }, 'Experiências e produtos'),
      h('p', { class: 'lead' }, 'Experiências e serviços ligados a este atrativo. O ingresso da tirolesa você compra aqui mesmo; os demais itens, peça direto ao parceiro.')),
    a.tirolesa ? tirolesaFeature({ ...a.tirolesa }) : null,
    a.tirolesa ? h('div', { class: 'reveal' }, liveSlots({ light: true })) : null,
    a.hosts.length ? h('div', { class: 'grid grid-3' }, a.hosts.map((p, i) => partnerCard({ ...p, plan: 'fundador' }, i))) : null,
    a.products.length ? h('div', { class: 'grid grid-3' }, a.products.map((p, i) => productCard(p, { i }))) : null,
    !hasProducts && !a.hosts.length ? h('div', { class: 'empty reveal' }, icon('sparkles'), h('h3', {}, 'Produtos em breve'),
      h('p', { class: 'muted' }, 'Os parceiros ainda estão cadastrando passeios e serviços para este atrativo. Enquanto isso, fale com um guia ou agência abaixo.')) : null));

  const details = h('section', { class: 'section-alt' }, h('div', { class: 'wrap two-col' },
    h('div', { class: 'reveal' }, h('h2', {}, 'Destaques'), h('div', { class: 'chips-row' }, a.highlights.map((x) => h('span', { class: 'pill' }, icon('check'), x))),
      a.slug === 'serra-geral' ? h('p', { class: 'lead' }, 'Conheça também o ', h('a', { href: '/atrativos/canion-fortaleza' }, 'Cânion Fortaleza'), ', um dos cartões-postais do parque.') : null),
    h('div', { class: 'card reveal' }, h('h3', {}, 'Dicas antes de ir'), h('ul', { class: 'info-list' }, a.tips.map((t) => h('li', {}, icon('info'), h('span', {}, t)))),
      h('p', { class: 'small muted' }, 'Horários e valores de entrada mudam: confirme com o gestor do atrativo.'))));

  const guides = h('section', { id: 'guias', 'aria-labelledby': 'g-h' }, h('div', { class: 'wrap' },
    h('div', { class: 'section-head reveal' }, h('span', { class: 'kicker' }, 'Quem pode te levar'), h('h2', { id: 'g-h' }, 'Guias e agências parceiras')),
    a.guides.length ? h('div', { class: 'grid grid-3' }, a.guides.map((p, i) => partnerCard({ ...p, plan: 'fundador' }, i))) : h('p', { class: 'muted' }, 'Em breve.')));

  const others = h('section', { class: 'section-sand' }, h('div', { class: 'wrap' },
    h('div', { class: 'section-head reveal' }, h('h2', {}, 'Outros atrativos')),
    h('div', { class: 'grid grid-3' }, a.others.map((o, i) => attractionCard({ ...o, summary: '' }, i)))));

  clear(root).append(hero, products, details, guides, others);
} catch (e) {
  if (e instanceof ApiError && e.status === 404) clear(root).append(h('div', { class: 'wrap' }, h('div', { class: 'empty' }, h('h2', {}, 'Atrativo não encontrado'), h('a', { class: 'btn btn-dark', href: '/atrativos' }, 'Ver atrativos'))));
  else showError(root, e);
}
void ATTRACTION_NAME; void reveal;
