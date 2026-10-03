import { $, ApiError, api, boot, brl, clear, fmtDay, h, showError } from './common.js';
boot();

const root = $('#order');
const token = decodeURIComponent(location.pathname.split('/').filter(Boolean).pop() || '');
let timer;
let countdownTimer;
let mock = false;
let shown = null;

async function copy(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = 'Copiado!';
  } catch {
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents($('#pix-code'));
    sel.removeAllRanges();
    sel.addRange(range);
    btn.textContent = 'Selecionado — copie';
  }
  setTimeout(() => { btn.textContent = 'Copiar código Pix'; }, 2500);
}

function head(o) {
  return h('div', { class: 'stack' },
    h('h1', {}, o.status === 'paid' ? 'Ingressos confirmados 🎉' : 'Seu pedido'),
    h('p', { class: 'muted' }, `${o.product.name} · ${fmtDay(o.day)} às ${o.time} · ${o.qty} ${o.qty > 1 ? 'ingressos' : 'ingresso'}`),
    h('p', { class: 'small muted' }, `Pedido ${o.code} · Total ${brl(o.totalCents)}${o.discountCents ? ` (desconto: ${o.discountLabel})` : ''}`));
}

function pending(o) {
  const left = h('span', { class: 'countdown' });
  const tick = () => {
    const ms = new Date(o.expiresAt) - Date.now();
    if (ms <= 0) { left.textContent = '00:00'; return; }
    left.textContent = `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;
  };
  tick();
  clearInterval(countdownTimer);
  countdownTimer = setInterval(tick, 1000);
  const copyBtn = h('button', { class: 'btn btn-primary btn-block', type: 'button', onclick: () => copy(o.pixCopyPaste, copyBtn) }, 'Copiar código Pix');
  return [
    head(o),
    o.pixCopyPaste ? h('div', { class: 'pix-box stack' },
      h('h2', {}, 'Pague com Pix'),
      h('ol', {}, h('li', {}, 'Abra o app do seu banco e escolha Pix → “Pix Copia e Cola”.'), h('li', {}, 'Cole o código abaixo e confirme.'), h('li', {}, 'Esta página atualiza sozinha quando o pagamento for aprovado.')),
      h('div', { class: 'pix-code', id: 'pix-code', tabindex: 0 }, o.pixCopyPaste), copyBtn,
      h('p', { class: 'small' }, 'Suas vagas ficam reservadas por mais ', left, '.'))
      : h('div', { class: 'alert alert-warn' }, 'Aguardando a confirmação do pagamento…'),
    mock ? h('div', { class: 'alert alert-warn' }, h('p', {}, h('b', {}, 'Modo de desenvolvimento: '), 'pagamentos simulados.'),
      h('button', { class: 'btn btn-dark btn-small', type: 'button', onclick: async () => { await api(`/dev/pay/${token}`, { method: 'POST' }); load(); } }, 'Simular pagamento aprovado')) : null,
  ];
}

function paid(o) {
  const url = location.href;
  return [
    head(o),
    h('div', { class: 'alert alert-ok' }, 'Pagamento aprovado. Apresente o QR Code de cada participante na chegada — pode ser pelo celular. Recomendamos tirar um print (funciona sem internet).'),
    h('div', { class: 'stack' }, o.tickets.map((t, i) => h('article', { class: `ticket${t.status === 'used' ? ' used' : ''}` },
      h('div', { class: 'info' },
        h('span', { class: `badge ${t.status === 'used' ? 'badge-used' : t.status === 'valid' ? 'badge-ok' : 'badge-bad'}` }, t.status === 'used' ? 'Já utilizado' : t.status === 'valid' ? 'Válido' : 'Cancelado'),
        h('h3', {}, t.holderName || `Participante ${i + 1}`),
        h('p', {}, `${fmtDay(o.day)} · ${o.time}`),
        h('p', { class: 'small' }, 'Ingresso'), h('p', { class: 'code' }, t.code),
        t.isMinor ? h('p', { class: 'small' }, 'Menor de idade — acompanhado de responsável.') : null),
      h('div', { class: 'qr' }, t.qr ? h('img', { src: `/api/orders/${encodeURIComponent(token)}/tickets/${t.code}/qr.svg`, alt: `QR Code do ingresso ${t.code}`, width: 260, height: 260 }) : null)))),
    h('div', { class: 'no-print actions stack' },
      h('button', { class: 'btn btn-dark', type: 'button', onclick: () => window.print() }, 'Imprimir / salvar PDF'),
      h('a', { class: 'btn btn-ghost', target: '_blank', rel: 'noopener', href: `https://wa.me/?text=${encodeURIComponent(`Meus ingressos da tirolesa: ${url}`)}` }, 'Enviar link por WhatsApp'),
      h('p', { class: 'small muted' }, 'Guarde este link: ele dá acesso aos ingressos. Não o compartilhe publicamente.')),
  ];
}

function ended(o) {
  const msg = { expired: 'O tempo para pagar acabou e as vagas foram liberadas.', cancelled: 'Este pedido foi cancelado.', refunded: 'Este pedido foi cancelado e o valor estornado. O prazo para aparecer na fatura depende do seu banco.' }[o.status];
  return [head(o), h('div', { class: 'alert alert-warn' }, msg), h('a', { class: 'btn btn-primary', href: '/tirolesa' }, 'Fazer uma nova reserva')];
}

async function load() {
  try {
    const o = await api(`/orders/${encodeURIComponent(token)}`);
    // Só redesenha quando o status muda: evita atrapalhar quem está copiando o código Pix.
    if (shown !== o.status) {
      shown = o.status;
      clear(root).append(...(o.status === 'paid' ? paid(o) : o.status === 'pending' ? pending(o) : ended(o)).filter(Boolean));
    }
    clearTimeout(timer);
    if (o.status === 'pending' || o.status === 'expired') timer = setTimeout(load, 4000);
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof ApiError && e.status === 404) clear(root).append(h('div', { class: 'alert alert-error' }, 'Pedido não encontrado. Confira o link recebido por e-mail.'));
    else { showError(root, e); timer = setTimeout(load, 8000); }
  }
}

mock = await api('/products/tirolesa-mais-alta-das-americas').then((p) => p.mockPayments).catch(() => false);
load();
