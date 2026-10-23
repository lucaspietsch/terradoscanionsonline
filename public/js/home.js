import {
  $, api, attractionCard, boot, brl, clear, h, icon, liveSlots, partnerCard, productCard, reduced, reveal, watchCounters,
} from './common.js';
import { openSearch } from './search.js';
boot();

const [attractions, partners, catalog, fort] = await Promise.all([
  api('/attractions').catch(() => []),
  api('/partners').catch(() => []),
  api('/catalog').catch(() => ({ items: [] })),
  api('/attractions/canion-fortaleza').catch(() => null),
]);

// --- Herói: busca, palavra que alterna e números que "sobem" ---
$('#hero-search').prepend(icon('search'));
$('#hero-search').addEventListener('click', openSearch);

const words = ['atrativos', 'pousadas', 'passeios', 'restaurantes', 'experiências'];
const rot = $('#rot');
if (!reduced()) {
  let i = 0;
  setInterval(() => {
    rot.classList.add('out');
    setTimeout(() => { i = (i + 1) % words.length; rot.textContent = words[i]; rot.classList.remove('out'); }, 360);
  }, 2600);
}
const stat = (n, label) => h('div', { class: 'glass hero-stat' }, h('b', {}, h('span', { class: 'count', 'data-to': String(n) }, '0')), h('span', {}, label));
$('#hero-stats').append(stat(attractions.length, 'atrativos para conhecer'), stat(partners.length, 'parceiros locais'), stat(catalog.items.length, 'produtos e experiências'));
rot.classList.add('rot');

// --- Faixa de parceiros (rola sozinha; pausa ao passar o mouse) ---
const strip = partners.map((p) => h('a', { href: `/parceiros/${p.slug}` }, h('span', { class: 'avatar', 'data-cat': p.category, 'aria-hidden': 'true' }, p.name[0]), p.name));
$('#marquee').append(...strip, ...strip.map((n) => n.cloneNode(true)));

// --- Atrativos ---
$('#home-attractions').append(...attractions.map((a, i) => attractionCard(a, i)));
$('#all-attr').append('Ver todos os atrativos', icon('arrow-right'));

// --- Destaque: Cânion Fortaleza (a Tirolesa é um dos produtos dele) ---
if (fort) {
  $('#spot-text').textContent = fort.summary;
  $('#spot-tags').append(...fort.highlights.map((x) => h('span', { class: 'pill' }, icon('check'), x)));
  const t = catalog.items.find((x) => x.buy);
  $('#spot-products').append(...(t ? [productCard(t, { i: 0 })] : []), ...(t ? [liveSlots()] : []));
}

// --- Produtos (a Tirolesa aparece como um item, junto dos demais) ---
$('#home-products').append(...catalog.items.slice(0, 6).map((p, i) => productCard(p, { i })));
$('#all-products').append(`Ver todos os ${catalog.items.length} produtos`, icon('arrow-right'));

// --- Parceiros ---
$('#home-partners').append(...partners.slice(0, 6).map((p, i) => partnerCard(p, i)));
$('#all-partners').append(`Ver os ${partners.length} parceiros`, icon('arrow-right'));

// --- Como usar ---
const steps = ['Escolha os atrativos que quer conhecer e veja dicas e destaques de cada um.', 'Veja os produtos: passeios, hospedagem, gastronomia e experiências.', 'Fale direto com o parceiro pelo WhatsApp, ou compre o ingresso online quando disponível.', 'Salve seus favoritos (❤) e volte quando quiser: eles ficam neste aparelho.'];
$('#home-steps').append(...steps.map((s, i) => reveal(h('li', {}, s), i)));
watchCounters();
void brl; void clear;
