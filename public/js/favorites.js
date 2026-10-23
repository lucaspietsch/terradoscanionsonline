// Favoritos: guardados só neste aparelho (localStorage). Nenhum dado pessoal; é um atalho do visitante.
import { clear, h, icon } from './dom.js';
import { safeStore, toast } from './ui.js';

const KEY = 'tdc_fav';
const safeHref = (u) => typeof u === 'string' && u.startsWith('/') && !u.startsWith('//');

export function favorites() {
  try {
    const list = JSON.parse(safeStore.get(KEY) || '[]');
    return Array.isArray(list) ? list.filter((f) => f && typeof f.key === 'string' && typeof f.name === 'string' && safeHref(f.href)).slice(0, 100) : [];
  } catch { return []; }
}
export const isFavorite = (key) => favorites().some((f) => f.key === key);

export function toggleFavorite(item) {
  const list = favorites();
  const i = list.findIndex((f) => f.key === item.key);
  if (i >= 0) list.splice(i, 1);
  else list.unshift({ key: item.key, name: item.name.slice(0, 120), sub: (item.sub || '').slice(0, 120), href: item.href, type: item.type });
  safeStore.set(KEY, JSON.stringify(list));
  document.dispatchEvent(new CustomEvent('tdc:favs'));
  return i < 0;
}

// Coração para colocar sobre um cartão. item: { key, name, sub, href, type }
export function heartButton(item, { className = '' } = {}) {
  const btn = h('button', { class: `heart ${className}`.trim(), type: 'button' }, icon('heart'));
  const paint = () => {
    const on = isFavorite(item.key);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? `Remover ${item.name} dos favoritos` : `Salvar ${item.name} nos favoritos`);
    btn.classList.toggle('on', on);
  };
  btn.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    const on = toggleFavorite(item);
    navigator.vibrate?.(on ? 18 : 8);
    toast(on ? 'Salvo nos favoritos' : 'Removido dos favoritos', { type: on ? 'ok' : 'info', ic: 'heart' });
    if (on) { btn.classList.add('pop'); setTimeout(() => btn.classList.remove('pop'), 500); }
  });
  document.addEventListener('tdc:favs', paint);
  paint();
  return btn;
}

// Botão do cabeçalho com contador + gaveta com a lista.
export function favoritesButton() {
  const badge = h('span', { class: 'badge-count', hidden: true });
  const btn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Meus favoritos', onclick: openFavorites }, icon('heart'), badge);
  const paint = () => { const n = favorites().length; badge.textContent = String(n); badge.hidden = n === 0; };
  document.addEventListener('tdc:favs', paint);
  addEventListener('storage', (e) => { if (e.key === KEY) { paint(); document.dispatchEvent(new CustomEvent('tdc:favs')); } });
  paint();
  return btn;
}

const TYPE_ICON = { Atrativo: 'mountain', Parceiro: 'users', Produto: 'bag' };
let dlg;
export function openFavorites() {
  dlg ??= document.body.appendChild(h('dialog', { class: 'drawer', 'aria-labelledby': 'fav-title' }));
  const render = () => {
    const list = favorites();
    clear(dlg).append(
      h('div', { class: 'drawer-head' }, h('h2', { id: 'fav-title' }, 'Meus favoritos'), h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Fechar', onclick: () => dlg.close() }, icon('x'))),
      list.length
        ? h('ul', { class: 'drawer-list' }, list.map((f) => h('li', {}, h('a', { href: f.href, class: 'drawer-item' }, h('span', { class: 'drawer-ic' }, icon(TYPE_ICON[f.type] || 'heart')), h('span', { class: 'drawer-txt' }, h('b', {}, f.name), f.sub ? h('small', {}, f.sub) : null)),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Remover ${f.name}`, onclick: () => { toggleFavorite(f); render(); } }, icon('x')))))
        : h('div', { class: 'empty' }, icon('heart'), h('h3', {}, 'Nada por aqui ainda'), h('p', { class: 'muted' }, 'Toque no coração dos atrativos, parceiros e produtos para guardar o que você quer lembrar.')));
  };
  render();
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.showModal();
}
