import { $, api, boot, h, showError } from './common.js';
boot();
const root = $('#attractions');
try {
  const list = await api('/attractions');
  root.append(...list.map((a) => h('article', { class: 'card', id: a.slug },
    h('span', { class: 'tag' }, a.kind), h('h2', {}, a.name), h('p', {}, a.summary),
    h('h3', {}, 'Destaques'), h('ul', {}, a.highlights.map((x) => h('li', {}, x))),
    h('h3', {}, 'Dicas'), h('ul', {}, a.tips.map((x) => h('li', {}, x))),
    a.slug === 'serra-geral' ? h('a', { class: 'btn btn-primary', href: '/tirolesa' }, 'Ingressos da tirolesa') : null)));
} catch (e) { showError(root, e); }
