import { $, api, boot, CATEGORY, h } from './common.js';
boot();

const [product, attractions, partners] = await Promise.all([
  api('/products/tirolesa-mais-alta-das-americas').catch(() => null),
  api('/attractions').catch(() => []),
  api('/partners').catch(() => []),
]);

if (product) {
  $('#home-facts').append(...product.facts.map((f) => h('div', { class: 'fact' }, h('b', {}, f.value), h('span', {}, f.label))));
  $('#home-steps').append(...product.howItWorks.map((s) => h('li', {}, s)));
}
$('#home-attractions').append(...attractions.slice(0, 3).map((a) => h('article', { class: 'card' },
  h('span', { class: 'tag' }, a.kind), h('h3', {}, a.name), h('p', { class: 'muted' }, a.summary))));
$('#home-partners').append(...partners.slice(0, 6).map((p) => h('article', { class: 'card partner-card' },
  h('span', { class: 'tag' }, CATEGORY[p.category]), h('h3', {}, p.name),
  h('a', { href: `/parceiros/${p.slug}` }, 'Ver perfil'))));
