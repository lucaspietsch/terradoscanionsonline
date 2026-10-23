import { $, CATEGORY, api, boot, clear, h, partnerCard, showError } from './common.js';
boot();
const grid = $('#partners');
const filters = $('#filters');
let all = [];
let current = 'todos';

function render() {
  clear(grid);
  const list = current === 'todos' ? all : all.filter((p) => p.category === current);
  grid.append(...(list.length ? list.map((p, i) => partnerCard(p, i)) : [h('p', { class: 'muted' }, 'Nenhum parceiro nesta categoria ainda.')]));
}

try {
  all = await api('/partners');
  const cats = ['todos', ...new Set(all.map((p) => p.category))];
  filters.append(...cats.map((c) => {
    const n = c === 'todos' ? all.length : all.filter((p) => p.category === c).length;
    const b = h('button', { class: 'chip', type: 'button', 'aria-pressed': String(c === current), onclick: () => {
      current = c;
      filters.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      render();
    } }, c === 'todos' ? 'Todos' : CATEGORY[c], h('small', {}, String(n)));
    return b;
  }));
  render();
} catch (e) { showError(grid, e); }
