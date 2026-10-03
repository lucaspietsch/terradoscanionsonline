import { $, api, boot, CATEGORY, clear, h, showError, waLink } from './common.js';
boot();
const root = $('#partner');
const slug = location.pathname.split('/').filter(Boolean).pop();
try {
  const p = await api(`/partners/${encodeURIComponent(slug)}`);
  document.title = `${p.name} — Terra dos Cânions Online`;
  const insta = p.instagram ? p.instagram.replace(/^@/, '') : '';
  clear(root).append(
    h('a', { href: '/parceiros' }, '← Todos os parceiros'),
    h('div', { class: 'card stack' },
      h('div', {}, h('span', { class: 'tag' }, CATEGORY[p.category]), ' ', p.plan === 'fundador' ? h('span', { class: 'tag tag-founder' }, 'Parceiro fundador') : null),
      h('h1', {}, p.name),
      p.tagline ? h('p', { class: 'muted' }, p.tagline) : null,
      p.description ? h('p', {}, p.description) : h('p', { class: 'muted' }, 'O perfil completo deste parceiro estará disponível em breve.'),
      p.address ? h('p', {}, h('b', {}, 'Endereço: '), p.address) : null,
      h('div', { class: 'actions' },
        p.whatsapp ? h('a', { class: 'btn btn-primary', href: waLink(p.whatsapp, `Olá! Vi o ${p.name} no Terra dos Cânions Online.`), rel: 'noopener', target: '_blank' }, 'Chamar no WhatsApp') : null,
        p.phone ? h('a', { class: 'btn btn-ghost', href: `tel:+55${p.phone.replace(/^55/, '')}` }, 'Ligar') : null,
        /^https:\/\//.test(p.website) ? h('a', { class: 'btn btn-ghost', href: p.website, rel: 'noopener noreferrer', target: '_blank' }, 'Site') : null,
        insta ? h('a', { class: 'btn btn-ghost', href: `https://instagram.com/${encodeURIComponent(insta)}`, rel: 'noopener noreferrer', target: '_blank' }, 'Instagram') : null)));
} catch (e) { showError(root, e); }
