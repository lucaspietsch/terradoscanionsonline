import { $, api, boot, CATEGORY, clear, h, showError, waLink } from './common.js';
boot();
const grid = $('#partners');
const filters = $('#filters');
let all = [];
let current = 'todos';

function card(p) {
  const hasContact = Boolean(p.whatsapp || p.phone || p.website);
  return h('article', { class: 'card partner-card' },
    h('div', {}, h('span', { class: 'tag' }, CATEGORY[p.category]), ' ', p.plan === 'fundador' ? h('span', { class: 'tag tag-founder' }, 'Parceiro fundador') : null),
    h('h3', {}, p.name),
    h('p', { class: 'muted' }, p.tagline || 'Perfil em preparação.'),
    h('div', { class: 'actions' },
      h('a', { class: 'btn btn-dark btn-small', href: `/parceiros/${p.slug}` }, 'Ver perfil'),
      p.whatsapp ? h('a', { class: 'btn btn-ghost btn-small', href: waLink(p.whatsapp, `Olá! Vi o ${p.name} no Terra dos Cânions Online.`), rel: 'noopener', target: '_blank' }, 'WhatsApp') : null,
      !hasContact ? h('span', { class: 'small muted' }, 'Contato em breve') : null));
}

function render() {
  clear(grid);
  const list = current === 'todos' ? all : all.filter((p) => p.category === current);
  grid.append(...(list.length ? list.map(card) : [h('p', { class: 'muted' }, 'Nenhum parceiro nesta categoria ainda.')]));
}

try {
  all = await api('/partners');
  const cats = ['todos', ...new Set(all.map((p) => p.category))];
  filters.append(...cats.map((c) => {
    const b = h('button', { class: 'chip', type: 'button', 'aria-pressed': String(c === current), onclick: () => {
      current = c;
      filters.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      render();
    } }, c === 'todos' ? 'Todos' : CATEGORY[c]);
    return b;
  }));
  render();
} catch (e) { showError(grid, e); }
