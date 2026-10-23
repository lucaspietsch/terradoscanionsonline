import { $, ATTRACTION_ICON, FACT_ICON, api, attractionArt, boot, brl, h, icon, partnerCard, reveal } from './common.js';
boot();

const [product, attractions, partners] = await Promise.all([
  api('/products/tirolesa-mais-alta-das-americas').catch(() => null),
  api('/attractions').catch(() => []),
  api('/partners').catch(() => []),
]);

const strip = [['bolt', 'Pix com aprovação na hora'], ['qr', 'QR Code no seu celular'], ['clock', `Vagas reservadas por ${product?.holdMinutes ?? 15} min`], ['shield', 'Pagamento seguro']];
strip.forEach(([ic, text], i) => $(`#s${i + 1}`).append(icon(ic), text));

if (product) {
  $('#hero-stats').append(...product.facts.slice(0, 4).map((f) => h('div', { class: 'glass hero-stat' }, h('b', {}, f.value), h('span', {}, f.label))));
  $('#bento').append(
    reveal(h('div', { class: 'b-main' },
      h('div', {}, h('span', { class: 'tag tag-founder' }, 'Venda online'), h('h3', {}, product.name), h('p', {}, product.summary)),
      h('div', {}, h('p', { class: 'small' }, 'a partir de'), h('p', { class: 'price-big' }, h('b', {}, brl(product.priceCents)), ' por pessoa'),
        h('a', { class: 'btn btn-primary', href: '/tirolesa' }, icon('ticket'), 'Ver datas e preços')))),
    ...product.facts.map((f, i) => reveal(h('div', { class: 'b-fact' }, icon(FACT_ICON[f.label] || 'info'), h('b', {}, f.value), h('span', {}, f.label)), i + 1)));
  $('#home-steps').append(...product.howItWorks.map((s, i) => reveal(h('li', {}, s), i)));
}

$('#home-attractions').append(...attractions.map((a, i) => reveal(h('a', { class: 'card', href: `/atrativos/${a.slug}` },
  attractionArt(a), h('span', { class: 'tag' }, a.kind), h('h3', {}, a.name), h('p', { class: 'muted small' }, a.summary),
  h('span', { class: 'link-arrow' }, 'Ver página', icon('arrow-right'))), i)));
$('#all-attr').append('Ver todos os atrativos', icon('arrow-right'));
$('#home-partners').append(...partners.slice(0, 6).map((p, i) => partnerCard(p, i)));
$('#all-partners').append(`Ver os ${partners.length} parceiros`, icon('arrow-right'));
void ATTRACTION_ICON;
