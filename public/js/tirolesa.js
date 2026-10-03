import { $, ApiError, api, boot, brl, clear, currentQr, dayParts, fmtDay, h } from './common.js';
boot();

const SLUG = 'tirolesa-mais-alta-das-americas';
const booking = $('#booking');

let product;
let slots = [];
const state = { day: null, slotId: null, qty: 1, coupon: '', couponApplied: '', participants: [{ name: '', birthDate: '', weightKg: '' }], quote: null, idemKey: null, idemSig: null, busy: false };

function renderStatic() {
  $('#facts').append(...product.facts.map((f) => h('div', { class: 'fact' }, h('b', {}, f.value), h('span', {}, f.label))));
  $('#place').textContent = product.place;
  $('#how').append(...product.howItWorks.map((s) => h('li', {}, s)));
  $('#faq').append(...product.faq.map((f) => h('details', {}, h('summary', {}, f.q), h('p', {}, f.a))));
  $('#waiver-text').append(...product.waiver.text.map((t) => h('p', {}, t)),
    h('p', { class: 'small muted' }, `Versão do termo: ${product.waiver.version}. O aceite fica registrado junto ao pedido.`));
  $('#sticky-price').textContent = brl(product.priceCents);
  $('#sticky').hidden = false;
}

async function renderPromo() {
  const qr = currentQr();
  if (!qr) return;
  try {
    const q = await api(`/products/${SLUG}/quote`, { method: 'POST', body: { qty: 1, qr } });
    if (q.discountCents > 0) {
      $('#promo').append(h('div', { class: 'promo' }, h('span', { 'aria-hidden': 'true' }, '🎟️'),
        h('span', {}, 'Você chegou pela nossa placa: ', h('strong', {}, `${brl(q.discountCents)} de desconto`), ' aplicado automaticamente por ingresso.')));
    }
  } catch { /* sem promoção */ }
}

// ---------------- Etapa 1: data, horário, quantidade ----------------
const dateRow = h('div', { class: 'chips', role: 'group', 'aria-label': 'Datas disponíveis' });
const timeGrid = h('div', { class: 'times', role: 'group', 'aria-label': 'Horários' });
const timeLabel = h('p', { class: 'muted small' }, 'Escolha uma data para ver os horários.');
const qtyOut = h('output', { 'aria-live': 'polite' }, '1');
const qtyHint = h('p', { class: 'hint' });

function groupByDay() {
  const map = new Map();
  for (const s of slots) {
    if (!map.has(s.day)) map.set(s.day, []);
    map.get(s.day).push(s);
  }
  return map;
}

function renderDates() {
  clear(dateRow);
  const days = [...groupByDay().entries()].filter(([, list]) => list.some((s) => s.left > 0));
  if (!days.length) dateRow.append(h('p', { class: 'muted' }, 'Sem datas disponíveis no momento. Volte em breve!'));
  for (const [day] of days) {
    const p = dayParts(day);
    dateRow.append(h('button', { type: 'button', class: 'chip', 'aria-pressed': String(state.day === day), onclick: () => { state.day = day; state.slotId = null; renderDates(); renderTimes(); updateQtyLimit(); } },
      h('small', {}, p.wd), h('b', {}, String(p.d)), h('small', {}, p.mo)));
  }
}

function renderTimes() {
  clear(timeGrid);
  if (!state.day) { timeLabel.textContent = 'Escolha uma data para ver os horários.'; return; }
  timeLabel.textContent = fmtDay(state.day);
  for (const s of groupByDay().get(state.day) ?? []) {
    const low = s.left > 0 && s.left <= 5;
    timeGrid.append(h('button', { type: 'button', class: 'chip', disabled: s.left === 0, 'aria-pressed': String(state.slotId === s.id), onclick: () => { state.slotId = s.id; renderTimes(); updateQtyLimit(); refreshQuote(); } },
      s.time, h('small', { class: low ? 'low' : '' }, s.left === 0 ? 'esgotado' : low ? `só ${s.left} vagas` : `${s.left} vagas`)));
  }
}

const currentSlot = () => slots.find((s) => s.id === state.slotId);
const maxQty = () => Math.min(product.maxPerOrder, currentSlot()?.left ?? product.maxPerOrder);

function setQty(n) {
  state.qty = Math.max(1, Math.min(n, maxQty()));
  qtyOut.textContent = String(state.qty);
  while (state.participants.length < state.qty) state.participants.push({ name: '', birthDate: '', weightKg: '' });
  state.participants.length = state.qty;
  renderPeople();
  refreshQuote();
}
function updateQtyLimit() {
  qtyHint.textContent = currentSlot() ? `Máximo para este horário: ${maxQty()}.` : `Máximo de ${product.maxPerOrder} por pedido. Grupos maiores: fale com a gente.`;
  if (state.qty > maxQty()) setQty(maxQty());
}

// ---------------- Etapa 2: participantes ----------------
const people = h('div');
function renderPeople() {
  clear(people);
  const r = product.rules;
  state.participants.forEach((p, i) => {
    const bind = (key, transform = (v) => v) => (e) => { p[key] = transform(e.target.value); e.target.removeAttribute('aria-invalid'); };
    people.append(h('fieldset', { class: 'person' }, h('legend', {}, `Participante ${i + 1}`),
      h('div', { class: 'field' }, h('label', { for: `pn${i}` }, 'Nome completo'),
        h('input', { id: `pn${i}`, name: `pn${i}`, autocomplete: i === 0 ? 'name' : 'off', value: p.name, maxlength: 100, required: true, oninput: bind('name') })),
      h('div', { class: 'row' },
        h('div', { class: 'field' }, h('label', { for: `pb${i}` }, 'Data de nascimento'),
          h('input', { id: `pb${i}`, type: 'date', value: p.birthDate, required: true, max: new Date().toISOString().slice(0, 10), autocomplete: i === 0 ? 'bday' : 'off', onchange: bind('birthDate') })),
        h('div', { class: 'field' }, h('label', { for: `pw${i}` }, 'Peso (kg)'),
          h('input', { id: `pw${i}`, type: 'number', inputmode: 'numeric', min: r.minWeightKg, max: r.maxWeightKg, value: p.weightKg, required: true, oninput: bind('weightKg', (v) => (v === '' ? '' : Number(v))) }),
          h('p', { class: 'hint' }, `Permitido: ${r.minWeightKg} a ${r.maxWeightKg} kg (será conferido na chegada).`)))));
  });
}

// ---------------- Etapa 3: dados, cupom, pagamento ----------------
const summary = h('div', { class: 'summary', 'aria-live': 'polite' });
const couponMsg = h('p', { class: 'hint', 'aria-live': 'polite' });
const errorBox = h('div', { 'aria-live': 'assertive' });
const submitBtn = h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'Ir para o pagamento');
let refreshTimer;

function renderSummary() {
  clear(summary);
  const q = state.quote;
  if (!q) { summary.append(h('p', { class: 'muted' }, 'Calculando…')); return; }
  summary.append(
    h('div', { class: 'line' }, h('span', {}, `${q.qty} × ${brl(q.unitPriceCents)}`), h('span', {}, brl(q.subtotalCents))),
    q.discountCents > 0 ? h('div', { class: 'line disc' }, h('span', {}, q.discountLabel || 'Desconto'), h('span', {}, `− ${brl(q.discountCents)}`)) : null,
    h('div', { class: 'line total' }, h('span', {}, 'Total'), h('span', {}, brl(q.totalCents))));
  submitBtn.textContent = q.totalCents === 0 ? 'Confirmar reserva gratuita' : `Pagar ${brl(q.totalCents)}`;
}

function refreshQuote() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(async () => {
    try {
      state.quote = await api(`/products/${SLUG}/quote`, { method: 'POST', body: { qty: state.qty, coupon: state.couponApplied || null, qr: currentQr() } });
      couponMsg.textContent = '';
    } catch (e) {
      if (state.couponApplied) { couponMsg.textContent = e.message; couponMsg.className = 'hint error'; state.couponApplied = ''; return refreshQuote(); }
    }
    renderSummary();
  }, 150);
}

async function applyCoupon() {
  const code = state.coupon.trim();
  if (!code) { state.couponApplied = ''; couponMsg.textContent = ''; return refreshQuote(); }
  try {
    const q = await api(`/products/${SLUG}/quote`, { method: 'POST', body: { qty: state.qty, coupon: code, qr: currentQr() } });
    state.couponApplied = code;
    state.quote = q;
    couponMsg.className = 'hint';
    couponMsg.textContent = q.discountCents > 0 ? `Cupom aplicado: ${q.discountLabel}` : 'Cupom válido, mas outra oferta já dá desconto maior nesta compra.';
    renderSummary();
  } catch (e) {
    state.couponApplied = '';
    couponMsg.className = 'hint error';
    couponMsg.textContent = e.message;
  }
}

const buyer = { name: '', email: '', phone: '' };
let payMethod = 'pix';
let acceptedWaiver = false;
let acceptedPrivacy = false;

function validate() {
  const errs = [];
  if (!state.slotId) errs.push('Escolha uma data e um horário.');
  const r = product.rules;
  state.participants.forEach((p, i) => {
    const n = i + 1;
    if (p.name.trim().length < 3) { errs.push(`Participante ${n}: informe o nome completo.`); $(`#pn${i}`)?.setAttribute('aria-invalid', 'true'); }
    if (!p.birthDate) { errs.push(`Participante ${n}: informe a data de nascimento.`); $(`#pb${i}`)?.setAttribute('aria-invalid', 'true'); }
    if (!(p.weightKg >= r.minWeightKg && p.weightKg <= r.maxWeightKg)) { errs.push(`Participante ${n}: o peso deve estar entre ${r.minWeightKg} e ${r.maxWeightKg} kg.`); $(`#pw${i}`)?.setAttribute('aria-invalid', 'true'); }
  });
  if (buyer.name.trim().length < 3) errs.push('Informe seu nome.');
  if (!/^\S+@\S+\.\S+$/.test(buyer.email)) errs.push('Informe um e-mail válido (enviaremos seus ingressos).');
  if (buyer.phone.replace(/\D/g, '').length < 10) errs.push('Informe seu WhatsApp com DDD.');
  if (!acceptedWaiver) errs.push('Aceite o termo de responsabilidade.');
  if (!acceptedPrivacy) errs.push('Aceite a política de privacidade.');
  return errs;
}

async function submit(e) {
  e.preventDefault();
  if (state.busy) return;
  clear(errorBox);
  const errs = validate();
  if (errs.length) {
    errorBox.append(h('div', { class: 'alert alert-error', role: 'alert' }, h('ul', {}, errs.map((m) => h('li', {}, m)))));
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const payload = {
    slotId: state.slotId, qty: state.qty, coupon: state.couponApplied || null, qr: currentQr(), paymentMethod: payMethod,
    buyer: { name: buyer.name.trim(), email: buyer.email.trim(), phone: buyer.phone },
    participants: state.participants.map((p) => ({ name: p.name.trim(), birthDate: p.birthDate, weightKg: Number(p.weightKg) })),
    acceptedWaiver: true, acceptedPrivacy: true,
  };
  // Mesma tentativa (mesmo conteúdo) reutiliza a chave → um duplo clique/queda de rede não gera dois pedidos.
  const sig = JSON.stringify(payload);
  if (state.idemSig !== sig) { state.idemSig = sig; state.idemKey = crypto.randomUUID().replaceAll('-', ''); }

  state.busy = true;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Reservando suas vagas…';
  try {
    const order = await api('/orders', { method: 'POST', body: payload, headers: { 'Idempotency-Key': state.idemKey } });
    try { localStorage.setItem('tdc_last_order', order.accessToken); } catch { /* ok */ }
    location.assign(order.checkoutUrl || `/pedido/${order.accessToken}`);
  } catch (err) {
    const msg = err instanceof ApiError ? err.message : 'Não foi possível concluir. Tente novamente.';
    errorBox.append(h('div', { class: 'alert alert-error', role: 'alert' }, msg));
    if (err.body?.error === 'sold_out' || err.body?.error === 'slot_closed') await reloadSlots();
    state.busy = false;
    submitBtn.disabled = false;
    renderSummary();
  }
}

async function reloadSlots() {
  const r = await api(`/products/${SLUG}/availability`);
  slots = r.slots;
  if (!currentSlot() || currentSlot().left === 0) state.slotId = null;
  renderDates(); renderTimes(); updateQtyLimit();
}

function field(label, id, input, hint) {
  return h('div', { class: 'field' }, h('label', { for: id }, label), input, hint ? h('p', { class: 'hint' }, hint) : null);
}

function renderBooking() {
  clear(booking);
  const form = h('form', { novalidate: true, onsubmit: submit },
    h('div', { class: 'booking-step' }, h('h3', {}, h('span', { class: 'num' }, '1'), 'Quando você quer voar?'),
      dateRow, timeLabel, timeGrid,
      h('div', { class: 'field' }, h('label', {}, 'Quantos ingressos?'),
        h('div', { class: 'stepper' },
          h('button', { type: 'button', 'aria-label': 'Menos um ingresso', onclick: () => setQty(state.qty - 1) }, '−'), qtyOut,
          h('button', { type: 'button', 'aria-label': 'Mais um ingresso', onclick: () => setQty(state.qty + 1) }, '+')), qtyHint),
      product.groupDiscounts.length ? h('p', { class: 'hint' }, product.groupDiscounts.map((g) => `${g.label}: ${g.percent}% de desconto`).join(' · ')) : null),
    h('div', { class: 'booking-step' }, h('h3', {}, h('span', { class: 'num' }, '2'), 'Quem vai voar?'),
      h('p', { class: 'muted small' }, 'Peso e idade são requisitos de segurança. Menores precisam de um adulto responsável no mesmo pedido.'), people),
    h('div', { class: 'booking-step' }, h('h3', {}, h('span', { class: 'num' }, '3'), 'Seus dados e pagamento'),
      h('div', { class: 'row' },
        field('Seu nome', 'bn', h('input', { id: 'bn', autocomplete: 'name', maxlength: 100, required: true, oninput: (e) => { buyer.name = e.target.value; const p0 = state.participants[0]; if (p0 && !p0.name) { p0.name = buyer.name; const el = $('#pn0'); if (el && document.activeElement !== el) el.value = buyer.name; } } })),
        field('WhatsApp', 'bp', h('input', { id: 'bp', type: 'tel', inputmode: 'tel', autocomplete: 'tel', placeholder: '(54) 99999-9999', required: true, oninput: (e) => { buyer.phone = e.target.value; } }))),
      field('E-mail', 'be', h('input', { id: 'be', type: 'email', autocomplete: 'email', maxlength: 160, required: true, oninput: (e) => { buyer.email = e.target.value; } }), 'Enviaremos o link dos ingressos para este e-mail.'),
      h('div', { class: 'field' }, h('label', { for: 'bc' }, 'Cupom de desconto (opcional)'),
        h('div', { class: 'row' },
          h('input', { id: 'bc', autocapitalize: 'characters', autocomplete: 'off', maxlength: 40, oninput: (e) => { state.coupon = e.target.value; }, onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } } }),
          h('button', { type: 'button', class: 'btn btn-dark btn-small', onclick: applyCoupon }, 'Aplicar')), couponMsg),
      product.paymentMethods.length > 1 ? h('fieldset', { class: 'field' }, h('legend', { class: 'small' }, 'Forma de pagamento'),
        ...product.paymentMethods.map((m) => h('label', { class: 'check' },
          h('input', { type: 'radio', name: 'pay', value: m, checked: m === payMethod, onchange: () => { payMethod = m; } }), m === 'pix' ? 'Pix (aprovação na hora)' : 'Cartão de crédito (ambiente seguro do Mercado Pago)'))) : null,
      summary,
      h('label', { class: 'check' }, h('input', { type: 'checkbox', onchange: (e) => { acceptedWaiver = e.target.checked; } }),
        h('span', {}, 'Li e aceito o ', h('a', { href: '#', onclick: (e) => { e.preventDefault(); $('#waiver-dialog').showModal(); } }, 'termo de responsabilidade'), ' e confirmo que peso e idade informados são verdadeiros.')),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', onchange: (e) => { acceptedPrivacy = e.target.checked; } }),
        h('span', {}, 'Li a ', h('a', { href: '/privacidade', target: '_blank', rel: 'noopener' }, 'política de privacidade'), ' e autorizo o uso dos meus dados para emitir os ingressos.')),
      errorBox,
      h('p', {}, submitBtn),
      h('p', { class: 'hint center' }, `🔒 Suas vagas ficam reservadas por ${product.holdMinutes} minutos enquanto você paga.`)));
  booking.append(form);
  renderDates(); renderTimes(); renderPeople(); renderSummary(); updateQtyLimit();
}

try {
  product = await api(`/products/${SLUG}`);
  renderStatic();
  const avail = await api(`/products/${SLUG}/availability`);
  slots = avail.slots;
  renderBooking();
  refreshQuote();
  renderPromo();
} catch (e) {
  clear(booking).append(h('div', { class: 'booking-step' },
    h('div', { class: 'alert alert-warn' }, e.status === 404 ? 'As vendas online da tirolesa abrem em breve. Volte logo!' : (e.message || 'Não foi possível carregar os horários.'))));
}
