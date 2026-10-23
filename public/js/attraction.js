import { $, ApiError, api, attractionArt, boot, clear, h, icon, partnerCard, productCard, reveal, showError, tirolesaFeature } from './common.js';
boot();
const root = $('#conteudo');
const slug = decodeURIComponent(location.pathname.split('/').filter(Boolean).pop() || '');

try {
  const a = await api(`/attractions/${encodeURIComponent(slug)}`);
  document.title = `${a.name} — Terra dos Cânions Online`;
  const hasProducts = Boolean(a.tirolesa) || a.products.length > 0;

  const hero = h('header', { class: 'page-hero', 'data-art': a.slug },
    h('div', { class: 'wrap' },
      h('nav', { class: 'crumbs', 'aria-label': 'Você está em' }, h('a', { href: '/' }, 'Início'), h('span', {}, '/'), h('a', { href: '/atrativos' }, 'Atrativos'), h('span', {}, '/'), h('span', {}, a.name)),
      h('span', { class: 'tag' }, a.kind), h('h1', {}, a.name), h('p', { class: 'lead' }, a.summary),
      h('div', { class: 'actions' },
        a.tirolesa ? h('a', { class: 'btn btn-primary', href: '/tirolesa' }, icon('ticket'), 'Comprar ingresso da tirolesa') : null,
        hasProducts ? h('a', { class: 'btn btn-glass', href: '#produtos' }, 'Ver produtos') : h('a', { class: 'btn btn-glass', href: '#guias' }, 'Quem pode te levar'))));

  const products = h('section', { id: 'produtos', 'aria-labelledby': 'prod-h' }, h('div', { class: 'wrap' },
    h('div', { class: 'section-head reveal' }, h('span', { class: 'kicker' }, 'Produtos'), h('h2', { id: 'prod-h' }, 'Experiências e produtos'),
      h('p', { class: 'lead' }, 'Experiências e serviços ligados a este atrativo. A tirolesa é comprada aqui mesmo; os demais itens você pede direto ao parceiro.')),
    a.tirolesa ? tirolesaFeature({ ...a.tirolesa }) : null,
    a.hosts.length ? h('div', { class: 'grid grid-3' }, a.hosts.map((p, i) => partnerCard({ ...p, plan: 'fundador' }, i))) : null,
    a.products.length ? h('div', { class: 'grid grid-3' }, a.products.map((p, i) => productCard(p, { i }))) : null,
    !hasProducts && !a.hosts.length ? h('div', { class: 'empty reveal' }, icon('sparkles'), h('h3', {}, 'Produtos em breve'),
      h('p', { class: 'muted' }, 'Os parceiros ainda estão cadastrando passeios e serviços para este atrativo. Enquanto isso, fale com um guia ou agência abaixo.')) : null));

  const details = h('section', { class: 'section-alt' }, h('div', { class: 'wrap two-col' },
    h('div', { class: 'reveal' }, h('h2', {}, 'Destaques'), h('div', { class: 'chips-row' }, a.highlights.map((x) => h('span', { class: 'pill' }, icon('check'), x)))),
    h('div', { class: 'card reveal' }, h('h3', {}, 'Dicas antes de ir'), h('ul', { class: 'info-list' }, a.tips.map((t) => h('li', {}, icon('info'), h('span', {}, t)))),
      h('p', { class: 'small muted' }, 'Horários e valores de entrada mudam: confirme com o gestor do atrativo.'))));

  const guides = h('section', { id: 'guias', 'aria-labelledby': 'g-h' }, h('div', { class: 'wrap' },
    h('div', { class: 'section-head reveal' }, h('span', { class: 'kicker' }, 'Quem pode te levar'), h('h2', { id: 'g-h' }, 'Guias e agências parceiras')),
    a.guides.length ? h('div', { class: 'grid grid-3' }, a.guides.map((p, i) => partnerCard({ ...p, plan: 'fundador' }, i))) : h('p', { class: 'muted' }, 'Em breve.')));

  const others = h('section', { class: 'section-sand' }, h('div', { class: 'wrap' },
    h('div', { class: 'section-head reveal' }, h('h2', {}, 'Outros atrativos')),
    h('div', { class: 'grid grid-3' }, a.others.map((o, i) => reveal(h('a', { class: 'card', href: `/atrativos/${o.slug}` }, attractionArt(o), h('span', { class: 'tag' }, o.kind), h('h3', {}, o.name), h('span', { class: 'link-arrow' }, 'Ver página', icon('arrow-right'))), i)))));

  clear(root).append(hero, products, details, guides, others);
} catch (e) {
  if (e instanceof ApiError && e.status === 404) clear(root).append(h('div', { class: 'wrap' }, h('div', { class: 'empty' }, h('h2', {}, 'Atrativo não encontrado'), h('a', { class: 'btn btn-dark', href: '/atrativos' }, 'Ver atrativos'))));
  else showError(root, e);
}
