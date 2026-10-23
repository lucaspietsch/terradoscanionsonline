import { $, KINDS, api, boot, clear, h, icon, productCard, showError, tirolesaFeature } from './common.js';
boot();
const grid = $('#items');
const filters = $('#filters');
let kind = 'todos';

async function load() {
  clear(grid).append(h('div', { class: 'skeleton' }), h('div', { class: 'skeleton' }), h('div', { class: 'skeleton' }));
  const d = await api(`/catalog${kind === 'todos' ? '' : `?kind=${kind}`}`);
  const feat = $('#featured');
  clear(feat);
  if (d.featured && (kind === 'todos' || kind === 'experiencia')) feat.append(h('div', { class: 'section-head' }, h('span', { class: 'kicker' }, 'Em destaque')), tirolesaFeature(d.featured));
  clear(grid);
  if (!d.items.length) grid.append(h('div', { class: 'empty' }, icon('sparkles'), h('h3', {}, 'Ainda não há produtos nesta categoria'), h('p', { class: 'muted' }, 'Os parceiros estão cadastrando seus produtos. Veja a lista de parceiros e fale direto com eles.'), h('a', { class: 'btn btn-dark btn-small', href: '/parceiros' }, 'Ver parceiros')));
  else grid.append(...d.items.map((p, i) => productCard(p, { i })));
}

try {
  filters.append(...['todos', ...Object.keys(KINDS)].map((k) => {
    const b = h('button', { class: 'chip', type: 'button', 'aria-pressed': String(k === kind), onclick: async () => {
      kind = k; filters.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      try { await load(); } catch (e) { showError(grid, e); }
    } }, k === 'todos' ? 'Todos' : KINDS[k][0]);
    return b;
  }));
  await load();
} catch (e) { showError(grid, e); }
