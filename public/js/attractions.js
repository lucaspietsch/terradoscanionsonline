import { $, api, attractionArt, boot, h, icon, reveal, showError } from './common.js';
boot();
const root = $('#attractions');
try {
  const list = await api('/attractions');
  root.append(...list.map((a, i) => reveal(h('a', { class: 'card', href: `/atrativos/${a.slug}` },
    attractionArt(a), h('span', { class: 'tag' }, a.kind), h('h2', { class: 'h3' }, a.name), h('p', { class: 'muted' }, a.summary),
    h('div', { class: 'tags' }, a.highlights.slice(0, 3).map((x) => h('span', { class: 'pill' }, x))),
    h('span', { class: 'link-arrow' }, a.slug === 'serra-geral' ? 'Ver página e ingressos' : 'Ver página', icon('arrow-right'))), i)));
} catch (e) { showError(root, e); }
