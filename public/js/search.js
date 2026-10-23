// Busca rápida (Ctrl/⌘+K ou "/"): atrativos, parceiros e produtos num só lugar, com navegação por teclado.
import { api } from './api.js';
import { clear, h, icon } from './dom.js';

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
let indexPromise;
let dlg;

function buildIndex() {
  indexPromise ??= (async () => {
    const [attractions, partners, catalog] = await Promise.all([api('/attractions'), api('/partners'), api('/catalog')]);
    const items = [];
    for (const a of attractions) items.push({ type: 'Atrativo', ic: 'mountain', title: a.name, sub: a.kind, href: `/atrativos/${a.slug}`, text: norm(`${a.name} ${a.summary} ${a.highlights.join(' ')}`) });
    for (const p of partners) items.push({ type: 'Parceiro', ic: 'users', title: p.name, sub: p.tagline || p.category, href: `/parceiros/${p.slug}`, text: norm(`${p.name} ${p.category} ${p.tagline} ${p.description}`) });
    for (const p of catalog.items) items.push({ type: 'Produto', ic: 'bag', title: p.name, sub: p.partner ? `por ${p.partner.name}` : 'Ingresso online', href: p.href || (p.partner ? `/parceiros/${p.partner.slug}` : '/produtos'), text: norm(`${p.name} ${p.description} ${p.kind} ${p.partner?.name || ''}`) });
    return items;
  })().catch((e) => { indexPromise = null; throw e; });
  return indexPromise;
}

export function searchIndex(items, query) {
  const tokens = norm(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  return items
    .map((it) => {
      if (!tokens.every((t) => it.text.includes(t))) return null;
      const title = norm(it.title);
      let score = 0;
      for (const t of tokens) score += (title.startsWith(t) ? 6 : title.includes(t) ? 4 : 1);
      return { it, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((x) => x.it);
}

const QUICK = [
  { type: 'Atalho', ic: 'ticket', title: 'Comprar ingresso da Tirolesa', sub: 'Cânion Fortaleza', href: '/tirolesa' },
  { type: 'Atalho', ic: 'mountain', title: 'Ver todos os atrativos', sub: '', href: '/atrativos' },
  { type: 'Atalho', ic: 'bag', title: 'Produtos e serviços', sub: '', href: '/produtos' },
  { type: 'Atalho', ic: 'users', title: 'Parceiros', sub: '', href: '/parceiros' },
];

export function openSearch() {
  if (dlg?.open) { dlg.querySelector('input')?.focus(); return; }
  if (!dlg) {
    dlg = document.body.appendChild(h('dialog', { class: 'palette', 'aria-label': 'Buscar no site' }));
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  }
  let results = QUICK;
  let active = 0;
  const list = h('ul', { class: 'palette-list', role: 'listbox', id: 'palette-list' });
  const input = h('input', { type: 'search', placeholder: 'Buscar atrativos, pousadas, passeios…', 'aria-label': 'Buscar', autocomplete: 'off', 'aria-controls': 'palette-list', spellcheck: 'false' });
  const hint = h('p', { class: 'palette-hint' }, '↑ ↓ para navegar · Enter para abrir · Esc para fechar');

  const draw = (msg) => {
    clear(list);
    if (msg) { list.append(h('li', { class: 'palette-empty' }, msg)); return; }
    if (!results.length) { list.append(h('li', { class: 'palette-empty' }, 'Nada encontrado. Tente outra palavra (ex.: “cânion”, “chalé”, “café”).')); return; }
    results.forEach((r, i) => list.append(h('li', { role: 'option', 'aria-selected': String(i === active) },
      h('a', { href: r.href, class: `palette-item${i === active ? ' active' : ''}`, onmousemove: () => { if (active !== i) { active = i; paint(); } } },
        h('span', { class: 'drawer-ic' }, icon(r.ic)), h('span', { class: 'drawer-txt' }, h('b', {}, r.title), r.sub ? h('small', {}, r.sub) : null), h('span', { class: 'tag' }, r.type)))));
  };
  const paint = () => list.querySelectorAll('li[role=option]').forEach((li, i) => { li.setAttribute('aria-selected', String(i === active)); li.firstChild.classList.toggle('active', i === active); if (i === active) li.scrollIntoView({ block: 'nearest' }); });

  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const q = input.value.trim();
      if (!q) { results = QUICK; active = 0; draw(); return; }
      try { results = searchIndex(await buildIndex(), q); active = 0; draw(); } catch { draw('Não foi possível buscar agora. Tente de novo.'); }
    }, 90);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(results.length - 1, active + 1); paint(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(0, active - 1); paint(); }
    else if (e.key === 'Enter' && results[active]) { e.preventDefault(); location.assign(results[active].href); }
    else if (e.key === 'Escape') { e.preventDefault(); dlg.close(); } // 1 toque fecha (o navegador só limparia o texto)
  });

  clear(dlg).append(h('div', { class: 'palette-box' }, h('div', { class: 'palette-input' }, icon('search'), input, h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Fechar busca', onclick: () => dlg.close() }, icon('x'))), list, hint));
  draw();
  dlg.showModal();
  input.focus();
  buildIndex().catch(() => {}); // aquece o índice enquanto a pessoa digita
}

export function searchButton({ label = false } = {}) {
  return h('button', { class: `icon-btn${label ? ' search-pill' : ''}`, type: 'button', 'aria-label': 'Buscar no site', onclick: openSearch }, icon('search'), label ? h('span', {}, 'Buscar') : null, label ? h('kbd', {}, 'Ctrl K') : null);
}

export function initSearchShortcuts() {
  addEventListener('keydown', (e) => {
    const ae = document.activeElement;
    const typing = (/^(INPUT|TEXTAREA|SELECT)$/.test(ae?.tagName || '') || ae?.isContentEditable) && !ae.closest?.('dialog:not([open])');
    if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !typing)) {
      e.preventDefault();
      openSearch();
    }
  });
}
