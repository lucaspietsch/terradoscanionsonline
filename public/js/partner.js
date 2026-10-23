import { $, ApiError, ATTRACTION_NAME, CATEGORY, KINDS, api, avatar, boot, clear, h, icon, productCard, share, showError, waLink } from './common.js';
import { heartButton } from './favorites.js';
boot();
const root = $('#conteudo');
const slug = decodeURIComponent(location.pathname.split('/').filter(Boolean).pop() || '');
const ATTR = ATTRACTION_NAME;

try {
  const p = await api(`/partners/${encodeURIComponent(slug)}`);
  document.title = `${p.name} — Terra dos Cânions Online`;
  const insta = p.instagram ? p.instagram.replace(/^@/, '') : '';
  const msg = `Olá! Vi o ${p.name} no Terra dos Cânions Online e gostaria de mais informações.`;
  const hasContact = Boolean(p.whatsapp || p.phone || p.website || insta);

  const hero = h('header', { class: 'page-hero', 'data-cat': p.category },
    h('div', { class: 'wrap' },
      h('nav', { class: 'crumbs', 'aria-label': 'Você está em' }, h('a', { href: '/' }, 'Início'), h('span', {}, '/'), h('a', { href: '/parceiros' }, 'Parceiros'), h('span', {}, '/'), h('span', {}, p.name)),
      h('div', { class: 'hero-row' }, avatar(p, true), h('div', {},
        h('div', { class: 'tags' }, h('span', { class: 'tag' }, CATEGORY[p.category]), p.plan === 'fundador' ? h('span', { class: 'tag' }, 'Parceiro fundador') : null),
        h('h1', {}, p.name))),
      p.tagline ? h('p', { class: 'lead' }, p.tagline) : null,
      h('div', { class: 'actions' },
        p.whatsapp ? h('a', { class: 'btn btn-wa', href: waLink(p.whatsapp, msg), target: '_blank', rel: 'noopener noreferrer' }, icon('chat'), 'Chamar no WhatsApp') : null,
        p.phone ? h('a', { class: 'btn btn-glass', href: `tel:+55${p.phone.replace(/^55/, '')}` }, icon('phone'), 'Ligar') : null,
        /^https:\/\//.test(p.website) ? h('a', { class: 'btn btn-glass', href: p.website, target: '_blank', rel: 'noopener noreferrer' }, icon('globe'), 'Site') : null,
        insta ? h('a', { class: 'btn btn-glass', href: `https://instagram.com/${encodeURIComponent(insta)}`, target: '_blank', rel: 'noopener noreferrer' }, icon('instagram'), 'Instagram') : null,
        h('button', { class: 'btn btn-glass share-btn', type: 'button', onclick: () => share({ title: p.name, text: p.tagline || '' }) }, icon('share'), 'Compartilhar')),
      h('div', { class: 'hero-fav' }, heartButton({ key: `p:${p.slug}`, type: 'Parceiro', name: p.name, sub: CATEGORY[p.category], href: `/parceiros/${p.slug}` }))));

  // ---- Produtos ----
  const kinds = [...new Set(p.products.map((x) => x.kind))];
  const grid = h('div', { class: 'grid grid-3', id: 'pgrid' });
  let current = 'todos';
  const draw = () => {
    clear(grid);
    const list = current === 'todos' ? p.products : p.products.filter((x) => x.kind === current);
    grid.append(...list.map((x, i) => productCard(x, { partner: p, i })));
  };
  const chips = kinds.length > 1 ? h('div', { class: 'filters', role: 'group', 'aria-label': 'Filtrar produtos' }, ['todos', ...kinds].map((k) => {
    const b = h('button', { class: 'chip', type: 'button', 'aria-pressed': String(k === current), onclick: () => {
      current = k; chips.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); draw();
    } }, k === 'todos' ? 'Todos' : KINDS[k][0], h('small', {}, String(k === 'todos' ? p.products.length : p.products.filter((x) => x.kind === k).length)));
    return b;
  })) : null;
  if (p.products.length) draw();

  const products = h('section', { id: 'produtos', 'aria-labelledby': 'pp-h' }, h('div', { class: 'wrap' },
    h('div', { class: 'section-head' }, h('span', { class: 'kicker' }, 'Produtos e serviços'), h('h2', { id: 'pp-h' }, `O que ${p.name} oferece`),
      p.products.length ? h('p', { class: 'lead' }, 'Valores de referência, sujeitos a confirmação com o parceiro. Peça informações e reservas direto pelo WhatsApp.') : null),
    chips,
    p.products.length ? grid : h('div', { class: 'empty' }, icon('sparkles'), h('h3', {}, 'Produtos em breve'),
      h('p', { class: 'muted' }, hasContact ? 'Este parceiro ainda está cadastrando seus produtos. Fale direto com ele pelos botões acima.' : 'Este parceiro ainda está preparando a página. Volte em breve!'),
      h('a', { class: 'btn btn-dark btn-small', href: '/parceiros' }, 'Ver outros parceiros'))));

  // ---- Sobre ----
  const about = h('section', { class: 'section-alt' }, h('div', { class: 'wrap two-col' },
    h('div', {}, h('h2', {}, 'Sobre'), p.description ? h('p', { class: 'lead' }, p.description) : h('p', { class: 'muted' }, 'O perfil completo deste parceiro estará disponível em breve.')),
    h('aside', { class: 'card sticky-side' }, h('h3', {}, 'Informações'), h('ul', { class: 'info-list' },
      p.address ? h('li', {}, icon('pin'), h('span', {}, p.address)) : null,
      p.attractionSlug ? h('li', {}, icon('mountain'), h('span', {}, 'Fica em: ', h('a', { href: `/atrativos/${p.attractionSlug}` }, ATTR[p.attractionSlug] || 'atrativo'))) : null,
      h('li', {}, icon('compass'), h('span', {}, 'Cambará do Sul — RS')),
      !p.address && !p.attractionSlug ? h('li', { class: 'muted' }, icon('info'), h('span', {}, 'Mais informações em breve.')) : null))));

  clear(root).append(hero, products, about);
} catch (e) {
  if (e instanceof ApiError && e.status === 404) clear(root).append(h('div', { class: 'wrap' }, h('div', { class: 'empty' }, h('h2', {}, 'Parceiro não encontrado'), h('a', { class: 'btn btn-dark', href: '/parceiros' }, 'Ver parceiros'))));
  else showError(root, e);
}
