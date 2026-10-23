import { $, ApiError, api, brl, clear, CATEGORY, fmtDay, h, setCsrf } from '/js/common.js';

const app = $('#app');
const dlg = $('#dlg');
let me = null;

const STATUS = { pending: 'Pendente', paid: 'Pago', expired: 'Expirado', cancelled: 'Cancelado', refunded: 'Estornado' };
const fmtDT = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—');
const flash = (el, msg, ok = true) => { const b = h('div', { class: `alert ${ok ? 'alert-ok' : 'alert-error'}`, role: 'status' }, msg); el.prepend(b); setTimeout(() => b.remove(), 5000); };
const fail = (el) => (e) => flash(el, e instanceof ApiError ? (e.body.issues?.map((i) => `${i.path}: ${i.message}`).join(' · ') || e.message) : 'Erro inesperado', false);

function table(cols, rows, { onRow } = {}) {
  return h('div', { class: 'tablewrap' }, h('table', {},
    h('thead', {}, h('tr', {}, cols.map((c) => h('th', { class: c.num ? 'tr' : '' }, c.label)))),
    h('tbody', {}, rows.length ? rows.map((r) => h('tr', { class: onRow ? 'clickable' : '', onclick: onRow ? () => onRow(r) : null },
      cols.map((c) => h('td', { class: c.num ? 'tr' : '' }, c.render ? c.render(r) : r[c.key])))) : h('tr', {}, h('td', { colspan: cols.length, class: 'muted' }, 'Nada por aqui ainda.')))));
}
const field = (label, input, id) => h('div', { class: 'field' }, h('label', { for: id }, label), input);
const input = (id, attrs = {}) => h('input', { id, ...attrs });
const val = (id) => $(`#${id}`).value;

// ---------------- Login ----------------
function loginView(needTotp = false, prev = {}) {
  const err = h('div', { 'aria-live': 'assertive' });
  const form = h('form', { class: 'card login stack', onsubmit: async (e) => {
    e.preventDefault();
    clear(err);
    try {
      const r = await api('/auth/login', { method: 'POST', body: { email: val('le'), password: val('lp'), ...(needTotp ? { totp: val('lt') } : {}) } });
      setCsrf(r.csrf); me = r.user; start();
    } catch (ex) {
      if (ex.body?.needTotp) return loginView(true, { email: val('le'), password: val('lp') });
      err.append(h('div', { class: 'alert alert-error', role: 'alert' }, ex.message));
    }
  } },
    h('h1', {}, 'Painel'), h('p', { class: 'muted' }, 'Terra dos Cânions Online — área restrita'),
    field('E-mail', input('le', { type: 'email', autocomplete: 'username', required: true, value: prev.email || '' }), 'le'),
    field('Senha', input('lp', { type: 'password', autocomplete: 'current-password', required: true, value: prev.password || '' }), 'lp'),
    needTotp ? field('Código do autenticador (6 dígitos)', input('lt', { inputmode: 'numeric', autocomplete: 'one-time-code', pattern: '\\d{6}', maxlength: 6, required: true }), 'lt') : null,
    err, h('button', { class: 'btn btn-primary btn-block' }, needTotp ? 'Confirmar' : 'Entrar'),
    needTotp ? null : h('p', { class: 'center small' }, h('a', { href: '#', onclick: (e) => { e.preventDefault(); forgotView(val('le')); } }, 'Esqueci minha senha')));
  clear(app).append(form);
  $(needTotp ? '#lt' : '#le').focus();
}

function forgotView(email = '') {
  const out = h('div', { 'aria-live': 'polite' });
  clear(app).append(h('form', { class: 'card login stack', onsubmit: async (e) => {
    e.preventDefault(); clear(out);
    try { const r = await api('/auth/forgot', { method: 'POST', body: { email: val('fe') } }); out.append(h('div', { class: 'alert alert-ok' }, r.message)); } catch (ex) { out.append(h('div', { class: 'alert alert-error' }, ex.message)); }
  } }, h('h1', {}, 'Esqueci a senha'), h('p', { class: 'muted' }, 'Informe o e-mail do seu acesso. Se o envio por e-mail estiver ativo, você recebe um link para criar uma nova senha.'),
    field('E-mail', input('fe', { type: 'email', autocomplete: 'username', required: true, value: email }), 'fe'), out,
    h('button', { class: 'btn btn-primary btn-block' }, 'Enviar link'), h('p', { class: 'center small' }, h('a', { href: '#', onclick: (e) => { e.preventDefault(); loginView(); } }, 'Voltar ao login'))));
  $('#fe').focus();
}

// ---------------- Shell ----------------
const TABS = {
  admin: [['dash', 'Painel'], ['orders', 'Pedidos'], ['slots', 'Horários e preço'], ['coupons', 'Cupons e regras'], ['qr', 'Placas QR'], ['partners', 'Parceiros'], ['checkin', 'Check-in'], ['users', 'Usuários'], ['audit', 'Auditoria']],
  checkin: [['checkin', 'Check-in']],
  partner: [['mine', 'Meu perfil']],
};
const VIEWS = { dash, orders, slots, coupons, qr, partners, checkin, users, audit, mine };

function start() {
  const tabs = TABS[me.role];
  const nav = h('div', { class: 'tabs', role: 'tablist' }, tabs.map(([k, label]) => h('button', { type: 'button', 'data-k': k, onclick: () => go(k) }, label)));
  const out = h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: async () => { await api('/auth/logout', { method: 'POST' }); location.reload(); } }, 'Sair');
  clear(app).append(
    h('div', { class: 'topbar' }, h('div', { class: 'wrap' }, h('strong', {}, 'Terra dos Cânions'), nav, h('span', { class: 'small' }, me.name), out)),
    h('main', { class: 'wrap page', id: 'view' }));
  go(location.hash.slice(1) && VIEWS[location.hash.slice(1)] && tabs.some(([k]) => k === location.hash.slice(1)) ? location.hash.slice(1) : tabs[0][0]);
}

async function go(k) {
  history.replaceState(null, '', `#${k}`);
  app.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.k === k)));
  const root = clear($('#view'));
  try { await VIEWS[k](root); } catch (e) {
    if (e instanceof ApiError && e.status === 401) { me = null; return loginView(); }
    fail(root)(e);
  }
}

// ---------------- Painel ----------------
async function dash(root) {
  const s = await api('/admin/stats');
  const stat = (t, v) => h('div', { class: 'card stat' }, h('b', {}, v), h('span', {}, t));
  const line = (x) => `${brl(x.revenue)} · ${x.tickets} ingr.`;
  root.append(h('h1', {}, 'Visão geral'),
    h('div', { class: 'cards4' }, stat('Hoje', line(s.today)), stat('Últimos 30 dias', line(s.last30)), stat('Total', line(s.total)), stat('Pedidos pendentes (agora)', String(s.pending))),
    h('h2', { class: 'sec' }, 'Placas QR: leituras e vendas'),
    table([{ label: 'Placa', render: (r) => `${r.label} (${r.code})` }, { label: 'Local', key: 'location' }, { label: 'Leituras', key: 'scans', num: true }, { label: 'Pedidos pagos', key: 'orders', num: true },
      { label: 'Conversão', num: true, render: (r) => (r.scans ? `${((r.orders / r.scans) * 100).toFixed(1)}%` : '—') }, { label: 'Receita', num: true, render: (r) => brl(r.revenue) }], s.byQr),
    h('h2', { class: 'sec' }, 'Vendas atribuídas a parceiros'),
    table([{ label: 'Parceiro', key: 'name' }, { label: 'Pedidos', key: 'orders', num: true }, { label: 'Ingressos', key: 'tickets', num: true }, { label: 'Receita', num: true, render: (r) => brl(r.revenue) }], s.byPartner),
    h('h2', { class: 'sec' }, 'Ocupação — próximos 7 dias'),
    table([{ label: 'Dia', render: (r) => fmtDay(r.day) }, { label: 'Vendidas', num: true, render: (r) => `${r.reserved}/${r.capacity}` },
      { label: 'Ocupação', render: (r) => h('progress', { max: r.capacity || 1, value: r.reserved }) }], s.upcoming),
    h('h2', { class: 'sec' }, 'Receita por dia (30 dias)'),
    table([{ label: 'Dia', render: (r) => fmtDay(r.day) }, { label: 'Ingressos', key: 'tickets', num: true }, { label: 'Receita', num: true, render: (r) => brl(r.revenue) }], s.revenueByDay));
}

// ---------------- Pedidos ----------------
async function orders(root) {
  const list = h('div');
  const load = async () => {
    const qs = new URLSearchParams();
    for (const k of ['status', 'day', 'q']) if (val(`o-${k}`)) qs.set(k, val(`o-${k}`));
    try {
      const rows = await api(`/admin/orders?${qs}`);
      clear(list).append(table([{ label: 'Pedido', key: 'code' }, { label: 'Status', render: (r) => STATUS[r.status] }, { label: 'Data/hora', render: (r) => `${r.day} ${r.time}` }, { label: 'Comprador', key: 'buyer' }, { label: 'E-mail', key: 'email' },
        { label: 'Qtd', key: 'qty', num: true }, { label: 'Total', num: true, render: (r) => brl(r.totalCents) }, { label: 'Desconto', key: 'discountLabel' }], rows, { onRow: (r) => openOrder(r.code, load) }));
    } catch (e) { fail(list)(e); }
  };
  root.append(h('h1', {}, 'Pedidos'),
    h('form', { class: 'toolbar', onsubmit: (e) => { e.preventDefault(); load(); } },
      field('Status', h('select', { id: 'o-status' }, h('option', { value: '' }, 'Todos'), Object.entries(STATUS).map(([k, v]) => h('option', { value: k }, v))), 'o-status'),
      field('Dia da atividade', input('o-day', { type: 'date' }), 'o-day'),
      field('Código ou e-mail', input('o-q', { placeholder: 'ABCD1234 ou e-mail' }), 'o-q'),
      h('button', { class: 'btn btn-dark' }, 'Buscar')), list);
  load();
}

async function openOrder(code, reload) {
  const body = $('#dlg-body');
  clear(body).append(h('p', {}, 'Carregando…'));
  dlg.showModal();
  try {
    const o = await api(`/admin/orders/${code}`);
    clear(body).append(h('h2', {}, `Pedido ${o.code} — ${STATUS[o.status]}`),
      h('dl', { class: 'kv' },
        h('dt', {}, 'Comprador'), h('dd', {}, o.buyer.name), h('dt', {}, 'E-mail'), h('dd', {}, o.buyer.email), h('dt', {}, 'WhatsApp'), h('dd', {}, o.buyer.phone),
        h('dt', {}, 'Atividade'), h('dd', {}, `${fmtDay(o.day)} ${o.time}`), h('dt', {}, 'Total'), h('dd', {}, `${brl(o.totalCents)}${o.discountLabel ? ` (${o.discountLabel})` : ''}`),
        h('dt', {}, 'Pagamento'), h('dd', {}, `${o.paymentRef || '—'} em ${fmtDT(o.paidAt)}`), h('dt', {}, 'Aceite'), h('dd', {}, `termo ${o.waiverVersion} em ${fmtDT(o.consentAt)}`)),
      h('h3', {}, 'Participantes'),
      table([{ label: 'Nome', key: 'holderName' }, { label: 'Peso', render: (t) => `${t.weightKg} kg` }, { label: 'Menor', render: (t) => (t.isMinor ? 'sim' : 'não') }, { label: 'Ingresso', key: 'code' }, { label: 'Status', key: 'status' }], o.tickets),
      h('p', { class: 'small muted' }, 'Esta consulta a dados pessoais foi registrada no log de auditoria.'),
      h('div', { class: 'actions' },
        o.status === 'paid' ? h('button', { class: 'btn btn-ghost btn-small', onclick: async () => { const r = await api(`/admin/orders/${code}/resend`, { method: 'POST' }); flash(body, r.ok ? 'E-mail enviado.' : 'Envio indisponível (SMTP não configurado?).', r.ok); } }, 'Reenviar e-mail') : null,
        ['paid', 'pending'].includes(o.status) ? h('button', { class: 'btn btn-primary btn-small', onclick: async () => {
          if (!confirm(o.status === 'paid' ? 'Cancelar o pedido e ESTORNAR o valor ao cliente?' : 'Cancelar este pedido pendente?')) return;
          try { await api(`/admin/orders/${code}/cancel`, { method: 'POST' }); dlg.close(); reload?.(); } catch (e) { fail(body)(e); }
        } }, o.status === 'paid' ? 'Cancelar e estornar' : 'Cancelar pedido') : null));
  } catch (e) { fail(clear(body))(e); }
}

// ---------------- Horários e produto ----------------
async function slots(root) {
  const p = await api('/admin/product');
  const msg = h('div');
  const pf = h('form', { class: 'card inline-form', onsubmit: async (e) => {
    e.preventDefault();
    try {
      await api('/admin/product', { method: 'PATCH', body: { priceCents: Math.round(Number(val('p-price').replace(',', '.')) * 100), minWeightKg: Number(val('p-min')), maxWeightKg: Number(val('p-max')), active: $('#p-active').checked } });
      flash(msg, 'Produto atualizado.');
    } catch (ex) { fail(msg)(ex); }
  } },
    field('Preço por ingresso (R$)', input('p-price', { value: (p.priceCents / 100).toFixed(2).replace('.', ','), inputmode: 'decimal' }), 'p-price'),
    field('Peso mínimo (kg)', input('p-min', { type: 'number', value: p.minWeightKg }), 'p-min'),
    field('Peso máximo (kg)', input('p-max', { type: 'number', value: p.maxWeightKg }), 'p-max'),
    h('label', { class: 'check' }, input('p-active', { type: 'checkbox', checked: p.active }), 'Vendas abertas'),
    h('button', { class: 'btn btn-dark btn-small' }, 'Salvar'));

  const today = new Date().toISOString().slice(0, 10);
  const wd = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const bulk = h('form', { class: 'card stack', onsubmit: async (e) => {
    e.preventDefault();
    try {
      const r = await api('/admin/slots/bulk', { method: 'POST', body: {
        from: val('b-from'), to: val('b-to'), capacity: Number(val('b-cap')),
        weekdays: [...document.querySelectorAll('.wd:checked')].map((c) => Number(c.value)),
        times: val('b-times').split(',').map((t) => t.trim()).filter(Boolean) } });
      flash(msg, `${r.created} horários criados.`); loadSlots();
    } catch (ex) { fail(msg)(ex); }
  } },
    h('h3', {}, 'Gerar horários em lote'),
    h('div', { class: 'inline-form' }, field('De', input('b-from', { type: 'date', value: today, required: true }), 'b-from'), field('Até', input('b-to', { type: 'date', required: true }), 'b-to'),
      field('Vagas por horário', input('b-cap', { type: 'number', min: 0, value: 18, required: true }), 'b-cap'), field('Horários (HH:MM, separados por vírgula)', input('b-times', { value: '09:00, 11:00, 14:00', required: true }), 'b-times')),
    h('div', { class: 'weekdays' }, wd.map((n, i) => h('label', {}, h('input', { type: 'checkbox', class: 'wd', value: i, checked: true }), n))),
    h('button', { class: 'btn btn-dark btn-small' }, 'Gerar (não sobrescreve horários existentes)'));

  const list = h('div');
  async function loadSlots() {
    const rows = await api(`/admin/slots?from=${val('s-from')}&to=${val('s-to')}`);
    clear(list).append(table([{ label: 'Dia', render: (r) => fmtDay(r.day) }, { label: 'Hora', key: 'time' }, { label: 'Vendidas', num: true, render: (r) => `${r.reserved}/${r.capacity}` },
      { label: 'Capacidade', render: (r) => h('input', { type: 'number', min: r.reserved, value: r.capacity, 'aria-label': 'Capacidade', onchange: async (e) => { try { await api(`/admin/slots/${r.id}`, { method: 'PATCH', body: { capacity: Number(e.target.value) } }); flash(msg, 'Capacidade salva.'); } catch (ex) { fail(msg)(ex); loadSlots(); } } }) },
      { label: 'Status', render: (r) => h('button', { class: `btn btn-small ${r.status === 'open' ? 'btn-dark' : 'btn-primary'}`, type: 'button', onclick: async () => {
        if (r.status === 'open' && r.reserved > 0 && !confirm(`Há ${r.reserved} ingressos vendidos neste horário. Fechar impede novas vendas, mas NÃO cancela os pedidos existentes. Continuar?`)) return;
        await api(`/admin/slots/${r.id}`, { method: 'PATCH', body: { status: r.status === 'open' ? 'closed' : 'open' } }); loadSlots();
      } }, r.status === 'open' ? 'Aberto' : 'Fechado') }], rows));
  }
  root.append(h('h1', {}, 'Horários e preço'), msg, pf, h('div', { class: 'stack' }, bulk),
    h('h2', { class: 'sec' }, 'Horários cadastrados'),
    h('form', { class: 'toolbar', onsubmit: (e) => { e.preventDefault(); loadSlots(); } }, field('De', input('s-from', { type: 'date', value: today }), 's-from'),
      field('Até', input('s-to', { type: 'date', value: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10) }), 's-to'), h('button', { class: 'btn btn-dark' }, 'Ver')), list);
  loadSlots();
}

// ---------------- Cupons e regras ----------------
async function coupons(root) {
  const msg = h('div');
  const [cs, rules, partners] = await Promise.all([api('/admin/coupons'), api('/admin/rules'), api('/admin/partners')]);
  const reload = () => go('coupons');
  root.append(h('h1', {}, 'Cupons e regras de desconto'), msg,
    h('p', { class: 'muted' }, 'Descontos não se acumulam: o cliente recebe sempre a melhor oferta (cupom, placa QR ou regra de grupo).'),
    h('form', { class: 'card stack', onsubmit: async (e) => {
      e.preventDefault();
      try {
        await api('/admin/coupons', { method: 'POST', body: { code: val('c-code'), label: val('c-label'), kind: val('c-kind'), value: val('c-kind') === 'fixed' ? Math.round(Number(val('c-value').replace(',', '.')) * 100) : Number(val('c-value')),
          minQty: Number(val('c-min')), maxUses: val('c-max') ? Number(val('c-max')) : null, validUntil: val('c-until') ? new Date(`${val('c-until')}T23:59:59-03:00`).toISOString() : null, partnerId: val('c-partner') ? Number(val('c-partner')) : null } });
        reload();
      } catch (ex) { fail(msg)(ex); }
    } },
      h('h3', {}, 'Novo cupom'),
      h('div', { class: 'inline-form' },
        field('Código', input('c-code', { required: true, placeholder: 'POUSADA10' }), 'c-code'), field('Descrição', input('c-label', { placeholder: 'Desconto parceiros' }), 'c-label'),
        field('Tipo', h('select', { id: 'c-kind' }, h('option', { value: 'percent' }, '% de desconto'), h('option', { value: 'fixed' }, 'R$ por ingresso')), 'c-kind'),
        field('Valor (% ou R$)', input('c-value', { required: true, inputmode: 'decimal' }), 'c-value'), field('Mín. ingressos', input('c-min', { type: 'number', value: 1, min: 1 }), 'c-min'),
        field('Limite de usos', input('c-max', { type: 'number', min: 1, placeholder: 'ilimitado' }), 'c-max'), field('Válido até', input('c-until', { type: 'date' }), 'c-until'),
        field('Parceiro indicador', h('select', { id: 'c-partner' }, h('option', { value: '' }, '— nenhum —'), partners.map((p) => h('option', { value: p.id }, p.name))), 'c-partner')),
      h('button', { class: 'btn btn-dark btn-small' }, 'Criar cupom')),
    table([{ label: 'Código', key: 'code' }, { label: 'Descrição', key: 'label' }, { label: 'Desconto', render: (c) => (c.kind === 'percent' ? `${c.value}%` : `${brl(c.value)}/ingr.`) },
      { label: 'Usos', num: true, render: (c) => `${c.used_count}${c.max_uses ? `/${c.max_uses}` : ''}` }, { label: 'Validade', render: (c) => (c.valid_until ? fmtDT(c.valid_until) : '—') },
      { label: 'Parceiro', render: (c) => partners.find((p) => p.id === c.partner_id)?.name ?? '—' },
      { label: 'Ativo', render: (c) => h('button', { class: `btn btn-small ${c.active ? 'btn-dark' : 'btn-primary'}`, onclick: async () => { await api(`/admin/coupons/${c.id}`, { method: 'PATCH', body: { active: !c.active } }); reload(); } }, c.active ? 'Ativo' : 'Inativo') }], cs),
    h('h2', { class: 'sec' }, 'Regras automáticas (grupo)'),
    h('form', { class: 'card inline-form', onsubmit: async (e) => { e.preventDefault(); try { await api('/admin/rules', { method: 'POST', body: { label: val('r-label'), minQty: Number(val('r-min')), percent: Number(val('r-pct')) } }); reload(); } catch (ex) { fail(msg)(ex); } } },
      field('Descrição', input('r-label', { required: true, placeholder: 'Grupo de 6+' }), 'r-label'), field('A partir de (ingressos)', input('r-min', { type: 'number', min: 2, required: true }), 'r-min'),
      field('Desconto (%)', input('r-pct', { type: 'number', min: 1, max: 100, required: true }), 'r-pct'), h('button', { class: 'btn btn-dark btn-small' }, 'Adicionar')),
    table([{ label: 'Regra', key: 'label' }, { label: 'A partir de', key: 'min_qty', num: true }, { label: 'Desconto', num: true, render: (r) => `${r.percent}%` },
      { label: '', render: (r) => h('button', { class: 'btn btn-ghost btn-small', onclick: async () => { if (confirm('Remover regra?')) { await api(`/admin/rules/${r.id}`, { method: 'DELETE' }); reload(); } } }, 'Remover') }], rules));
}

// ---------------- Placas QR ----------------
async function qr(root) {
  const msg = h('div');
  const [rows, cs, partners] = await Promise.all([api('/admin/qr'), api('/admin/coupons'), api('/admin/partners')]);
  const reload = () => go('qr');
  root.append(h('h1', {}, 'Placas com QR Code'), msg,
    h('p', { class: 'muted' }, 'Cada placa tem um endereço curto e estável (/q/código). Você pode trocar cupom e destino depois sem reimprimir. Baixe o PNG em alta resolução para a gráfica.'),
    h('form', { class: 'card stack', onsubmit: async (e) => {
      e.preventDefault();
      try { await api('/admin/qr', { method: 'POST', body: { code: val('q-code'), label: val('q-label'), location: val('q-loc'), target: val('q-target'), couponId: val('q-coupon') ? Number(val('q-coupon')) : null, partnerId: val('q-partner') ? Number(val('q-partner')) : null } }); reload(); } catch (ex) { fail(msg)(ex); }
    } }, h('h3', {}, 'Nova placa'),
      h('div', { class: 'inline-form' }, field('Código curto', input('q-code', { required: true, placeholder: 'praca-01', pattern: '[a-z0-9-]{3,30}' }), 'q-code'), field('Nome da placa', input('q-label', { required: true }), 'q-label'), field('Local', input('q-loc', { placeholder: 'Praça central' }), 'q-loc'),
        field('Ao ler a placa, abrir…', h('select', { id: 'q-target' }, [['/tirolesa', 'Ingresso da Tirolesa (venda direta)'], ['/atrativos/canion-fortaleza', 'Página do Cânion Fortaleza'], ['/produtos', 'Produtos e serviços'], ['/', 'Início']].map(([v, t]) => h('option', { value: v }, t))), 'q-target'),
        field('Cupom automático', h('select', { id: 'q-coupon' }, h('option', { value: '' }, '— nenhum —'), cs.filter((c) => c.active).map((c) => h('option', { value: c.id }, `${c.code}`))), 'q-coupon'),
        field('Parceiro (atribuição)', h('select', { id: 'q-partner' }, h('option', { value: '' }, '— nenhum —'), partners.map((p) => h('option', { value: p.id }, p.name))), 'q-partner')),
      h('button', { class: 'btn btn-dark btn-small' }, 'Criar placa')),
    table([{ label: 'QR', render: (r) => h('img', { class: 'qr-preview', src: `/api/admin/qr/${r.id}/image.svg`, alt: `QR ${r.code}`, loading: 'lazy' }) },
      { label: 'Placa', render: (r) => h('div', {}, h('b', {}, r.label), h('div', { class: 'small muted' }, r.location), h('div', { class: 'small' }, r.url)) },
      { label: 'Leituras', key: 'scans', num: true }, { label: 'Cupom', render: (r) => r.coupon_code ?? '—' },
      { label: 'Baixar', render: (r) => h('div', { class: 'stack' }, h('a', { class: 'btn btn-dark btn-small', href: `/api/admin/qr/${r.id}/image.png?size=2400`, download: `qr-${r.code}.png` }, 'PNG'), h('a', { class: 'btn btn-ghost btn-small', href: `/api/admin/qr/${r.id}/image.svg`, download: `qr-${r.code}.svg` }, 'SVG')) },
      { label: 'Ativa', render: (r) => h('button', { class: `btn btn-small ${r.active ? 'btn-dark' : 'btn-primary'}`, onclick: async () => { await api(`/admin/qr/${r.id}`, { method: 'PATCH', body: { active: !r.active } }); reload(); } }, r.active ? 'Ativa' : 'Inativa') }], rows));
}


// ---------------- Produtos dos parceiros (usado pelo admin e pelo próprio parceiro) ----------------
const KIND_LABEL = { hospedagem: 'Hospedagem', passeio: 'Passeio', refeicao: 'Gastronomia', experiencia: 'Experiência', servico: 'Serviço', produto: 'Produto' };
const ATTR_OPTIONS = [['aparados-da-serra', 'Aparados da Serra'], ['serra-geral', 'Serra Geral'], ['canion-fortaleza', 'Cânion Fortaleza'], ['parque-estadual-do-tainhas', 'Parque Estadual do Tainhas'], ['cascata-velha-ouro-verde', 'Cascata Velha — Ouro Verde'], ['costao-do-cambara', 'Costão do Cambará']];
const parsePrice = (v) => (v.trim() === '' ? null : Math.round(Number(v.replace(',', '.')) * 100));

function productsPanel(ep, onChange) {
  if (onChange) { const raw = ep; ep = { list: raw.list, create: async (b) => { const r = await raw.create(b); onChange(); return r; }, update: async (id, b) => { const r = await raw.update(id, b); onChange(); return r; }, remove: async (id) => { const r = await raw.remove(id); onChange(); return r; } }; }
  const box = h('div', { class: 'stack' });
  const msg = h('div');
  let editing = null;
  async function render() {
    let rows;
    try { rows = await ep.list(); } catch (e) { return fail(clear(box))(e); }
    const f = editing ? rows.find((r) => r.id === editing) : null;
    const input2 = (id, v = '', extra = {}) => h('input', { id, value: v, ...extra });
    const form = h('form', { class: 'card stack', onsubmit: async (e) => {
      e.preventDefault();
      const body = { kind: val('pr-kind'), name: val('pr-name'), description: val('pr-desc'), priceCents: parsePrice(val('pr-price')), priceNote: val('pr-note'), attractionSlug: val('pr-attr') || null, published: $('#pr-pub').checked };
      try { if (editing) await ep.update(editing, body); else await ep.create(body); editing = null; render(); } catch (ex) { fail(msg)(ex); }
    } },
      h('h3', {}, editing ? 'Editar produto' : 'Novo produto'),
      h('div', { class: 'inline-form' },
        field('Tipo', h('select', { id: 'pr-kind' }, Object.entries(KIND_LABEL).map(([k, v]) => h('option', { value: k, selected: f?.kind === k }, v))), 'pr-kind'),
        field('Nome', input2('pr-name', f?.name ?? '', { required: true, maxlength: 100 }), 'pr-name'),
        field('Preço de referência (R$) — vazio = "Consulte"', input2('pr-price', f?.priceCents != null ? (f.priceCents / 100).toFixed(2).replace('.', ',') : '', { inputmode: 'decimal' }), 'pr-price'),
        field('Unidade (ex.: por noite, por pessoa)', input2('pr-note', f?.priceNote ?? '', { maxlength: 40 }), 'pr-note'),
        field('Ligado ao atrativo', h('select', { id: 'pr-attr' }, h('option', { value: '' }, '— nenhum —'), ATTR_OPTIONS.map(([k, v]) => h('option', { value: k, selected: f?.attractionSlug === k }, v))), 'pr-attr')),
      field('Descrição', h('textarea', { id: 'pr-desc', rows: 3, maxlength: 800 }, f?.description ?? ''), 'pr-desc'),
      h('label', { class: 'check' }, h('input', { id: 'pr-pub', type: 'checkbox', checked: f ? f.published : true }), 'Publicado no site'),
      h('div', { class: 'actions' }, h('button', { class: 'btn btn-dark btn-small' }, editing ? 'Salvar alterações' : 'Adicionar produto'),
        editing ? h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: () => { editing = null; render(); } }, 'Cancelar') : null));
    clear(box).append(msg, table([{ label: 'Produto', key: 'name' }, { label: 'Tipo', render: (r) => KIND_LABEL[r.kind] }, { label: 'Preço', render: (r) => (r.priceCents == null ? 'Consulte' : `${brl(r.priceCents)} ${r.priceNote}`) },
      { label: 'Publicado', render: (r) => h('button', { class: `btn btn-small ${r.published ? 'btn-dark' : 'btn-primary'}`, type: 'button', onclick: async () => { try { await ep.update(r.id, { published: !r.published }); render(); } catch (ex) { fail(msg)(ex); } } }, r.published ? 'Sim' : 'Rascunho') },
      { label: '', render: (r) => h('div', { class: 'actions' }, h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: () => { editing = r.id; render(); } }, 'Editar'),
        h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: async () => { if (confirm(`Remover "${r.name}"?`)) { try { await ep.remove(r.id); render(); } catch (ex) { fail(msg)(ex); } } } }, 'Remover')) }], rows), form);
  }
  render();
  return box;
}
const adminProducts = (pid) => ({
  list: () => api(`/admin/partners/${pid}/products`), create: (b) => api(`/admin/partners/${pid}/products`, { method: 'POST', body: b }),
  update: (id, b) => api(`/admin/products/${id}`, { method: 'PATCH', body: b }), remove: (id) => api(`/admin/products/${id}`, { method: 'DELETE' }),
});
const partnerProducts = {
  list: () => api('/partner/products'), create: (b) => api('/partner/products', { method: 'POST', body: b }),
  update: (id, b) => api(`/partner/products/${id}`, { method: 'PATCH', body: b }), remove: (id) => api(`/partner/products/${id}`, { method: 'DELETE' }),
};


// ---------------- Convite de acesso dos parceiros ----------------
async function copyText(text, btn) {
  try { await navigator.clipboard.writeText(text); btn.textContent = 'Copiado!'; } catch { btn.textContent = 'Selecione e copie'; }
  setTimeout(() => { btn.textContent = btn.dataset.label; }, 2200);
}
function inviteDialog(p, after) {
  const body = clear($('#dlg-body'));
  const out = h('div', { class: 'stack' });
  const copyBtn = (label, getText) => { const b = h('button', { class: 'btn btn-dark btn-small', type: 'button', 'data-label': label, onclick: () => copyText(getText(), b) }, label); return b; };
  body.append(h('h2', {}, `Acesso de ${p.name}`),
    h('p', { class: 'muted' }, p.access_users ? 'Este parceiro já tem login. Gerar um novo link serve para redefinir a senha (se for o mesmo e-mail).' : 'Informe o e-mail e o nome de quem vai cuidar da página. O parceiro cria a própria senha: você nunca vê nem define a senha dele.'),
    h('form', { class: 'stack', onsubmit: async (e) => {
      e.preventDefault(); clear(out);
      try {
        const r = await api(`/admin/partners/${p.id}/invite`, { method: 'POST', body: { email: val('iv-mail'), name: val('iv-name') } });
        const wa = r.partnerWhatsapp ? `https://wa.me/${r.partnerWhatsapp.replace(/\D/g, '').replace(/^(?!55)(\d{10,11})$/, '55$1')}?text=${encodeURIComponent(r.message)}` : `https://wa.me/?text=${encodeURIComponent(r.message)}`;
        out.append(h('div', { class: 'alert alert-ok' }, `${r.purpose === 'reset' ? 'Link de redefinição' : 'Convite'} gerado — vale até ${fmtDT(r.expiresAt)}, uso único.${r.emailed ? ' Também enviado por e-mail.' : ''}`),
          field('Link (trate como uma senha)', h('input', { id: 'iv-url', readonly: true, value: r.url, onfocus: (ev) => ev.target.select() }), 'iv-url'),
          field('Mensagem pronta para enviar', h('textarea', { id: 'iv-msg', rows: 4, readonly: true }, r.message), 'iv-msg'),
          h('div', { class: 'actions' }, copyBtn('Copiar link', () => r.url), copyBtn('Copiar mensagem', () => r.message),
            h('a', { class: 'btn btn-wa btn-small', href: wa, target: '_blank', rel: 'noopener noreferrer' }, 'Abrir no WhatsApp')));
        out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        after?.();
      } catch (ex) { fail(out)(ex); }
    } },
      h('div', { class: 'inline-form' }, field('Nome do responsável', input('iv-name', { required: true, maxlength: 100, autocomplete: 'off' }), 'iv-name'), field('E-mail de acesso', input('iv-mail', { type: 'email', required: true, maxlength: 160, autocomplete: 'off' }), 'iv-mail')),
      h('button', { class: 'btn btn-primary btn-small' }, p.access_users ? 'Gerar link de redefinição' : 'Gerar convite')), out);
  dlg.showModal();
}

// ---------------- Parceiros ----------------
async function partners(root) {
  const rows = await api('/admin/partners');
  const msg = h('div');
  const edit = (p) => {
    const body = clear($('#dlg-body'));
    const f = (k, label, extra = {}) => field(label, input(`pe-${k}`, { value: p[k] ?? '', ...extra }), `pe-${k}`);
    body.append(h('h2', {}, p.name),
      h('form', { class: 'stack', onsubmit: async (e) => {
        e.preventDefault();
        try {
          await api(`/admin/partners/${p.id}`, { method: 'PATCH', body: { name: val('pe-name'), tagline: val('pe-tagline'), description: val('pe-description'), whatsapp: val('pe-whatsapp'), phone: val('pe-phone'), website: val('pe-website'), instagram: val('pe-instagram'), address: val('pe-address'),
            plan: val('pe-plan'), freeUntil: val('pe-free') || null, featured: $('#pe-featured').checked, published: $('#pe-published').checked, sortOrder: Number(val('pe-sort_order')) } });
          dlg.close(); go('partners');
        } catch (ex) { fail(body)(ex); }
      } },
        f('name', 'Nome'), f('tagline', 'Frase de destaque', { maxlength: 140 }), field('Descrição', h('textarea', { id: 'pe-description', rows: 4, maxlength: 1500 }, p.description), 'pe-description'),
        h('div', { class: 'row' }, f('whatsapp', 'WhatsApp (com DDD)'), f('phone', 'Telefone')), h('div', { class: 'row' }, f('website', 'Site (https://…)'), f('instagram', 'Instagram')), f('address', 'Endereço'),
        h('div', { class: 'row' }, field('Plano', h('select', { id: 'pe-plan' }, ['fundador', 'gratuito', 'pago'].map((x) => h('option', { value: x, selected: x === p.plan }, x))), 'pe-plan'),
          field('Cortesia até', input('pe-free', { type: 'date', value: p.free_until ?? '' }), 'pe-free'), f('sort_order', 'Ordem', { type: 'number' })),
        h('label', { class: 'check' }, input('pe-featured', { type: 'checkbox', checked: Boolean(p.featured) }), 'Destaque'), h('label', { class: 'check' }, input('pe-published', { type: 'checkbox', checked: Boolean(p.published) }), 'Publicado no site'),
        h('button', { class: 'btn btn-primary' }, 'Salvar')),
      h('h3', {}, 'Produtos deste parceiro'), productsPanel(adminProducts(p.id)));
    dlg.showModal();
  };
  root.append(h('h1', {}, 'Parceiros'), msg,
    h('p', { class: 'muted' }, 'Os 15 parceiros fundadores já estão cadastrados. Clique em “Convidar” para gerar o link de acesso: cada parceiro cria a própria senha e preenche a própria página e produtos. Clique na linha para editar plano, cortesia e dados.'),
    h('form', { class: 'card inline-form', onsubmit: async (e) => { e.preventDefault(); try { await api('/admin/partners', { method: 'POST', body: { slug: val('n-slug'), name: val('n-name'), category: val('n-cat') } }); go('partners'); } catch (ex) { fail(msg)(ex); } } },
      field('Nome', input('n-name', { required: true }), 'n-name'), field('Endereço curto (slug)', input('n-slug', { required: true, pattern: '[a-z0-9-]+' }), 'n-slug'),
      field('Categoria', h('select', { id: 'n-cat' }, Object.entries(CATEGORY).map(([k, v]) => h('option', { value: k }, v))), 'n-cat'), h('button', { class: 'btn btn-dark btn-small' }, 'Adicionar parceiro')),
    table([{ label: 'Parceiro', key: 'name' }, { label: 'Categoria', render: (p) => CATEGORY[p.category] }, { label: 'Plano', key: 'plan' }, { label: 'Cortesia até', render: (p) => p.free_until ?? '—' },
      { label: 'Produtos', num: true, render: (p) => String(p.published_products) },
      { label: 'Contato', render: (p) => (p.whatsapp || p.phone || p.website ? 'ok' : 'faltando') },
      { label: 'Acesso', render: (p) => (p.access_users ? 'ativo' : p.pending_invite_until ? `convite até ${new Date(p.pending_invite_until).toLocaleDateString('pt-BR')}` : 'sem login') },
      { label: '', render: (p) => h('button', { class: `btn btn-small ${p.access_users ? 'btn-ghost' : 'btn-primary'}`, type: 'button', onclick: (ev) => { ev.stopPropagation(); inviteDialog(p, () => {}); } }, p.access_users ? 'Redefinir senha' : p.pending_invite_until ? 'Novo link' : 'Convidar') },
      { label: 'Publicado', render: (p) => (p.published ? 'sim' : 'não') }], rows, { onRow: edit }));
}

// ---------------- Check-in ----------------
async function checkin(root) {
  const out = h('div', { 'aria-live': 'assertive' });
  const stats = h('div');
  const video = h('video', { class: 'scanner hidden', playsinline: true, muted: true });
  let stream; let scanning = false; let busy = false;

  async function submitCode(code, force = false) {
    if (busy) return; busy = true;
    try {
      const r = await api('/checkin', { method: 'POST', body: { code, ...(force ? { force: true } : {}) } });
      const cls = r.result === 'ok' ? 'scan-ok' : ['already_used', 'wrong_day'].includes(r.result) ? 'scan-warn' : 'scan-bad';
      const titles = { ok: 'LIBERADO', already_used: 'JÁ UTILIZADO', wrong_day: 'DIA DIFERENTE', not_paid: 'NÃO PAGO', cancelled: 'CANCELADO', not_found: 'NÃO ENCONTRADO', invalid_signature: 'QR FALSO' };
      clear(out).append(h('div', { class: `scan-result ${cls}` }, h('div', { class: 'big' }, titles[r.result] ?? r.result),
        r.holderName ? h('p', {}, `${r.holderName} · ${r.weightKg} kg${r.isMinor ? ' · MENOR' : ''}`) : null, r.day ? h('p', {}, `${r.day} às ${r.time}`) : null,
        r.usedAt ? h('p', {}, `Usado em ${fmtDT(r.usedAt)}`) : null,
        r.result === 'wrong_day' && me.role === 'admin' ? h('button', { class: 'btn btn-ghost btn-small', onclick: () => submitCode(code, true) }, 'Liberar mesmo assim (admin)') : null));
      navigator.vibrate?.(r.result === 'ok' ? 80 : [120, 60, 120]);
      loadStats();
    } catch (e) { fail(out)(e); } finally { busy = false; }
  }
  async function loadStats() {
    try {
      const s = await api('/checkin/today');
      clear(stats).append(h('h2', { class: 'sec' }, `Hoje (${s.day})`), table([{ label: 'Horário', key: 'time' }, { label: 'Esperados', key: 'expected', num: true }, { label: 'Chegaram', key: 'arrived', num: true }, { label: 'Vagas', key: 'capacity', num: true }], s.slots));
    } catch { /* ignora */ }
  }
  async function toggleCam(btn) {
    if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; scanning = false; video.classList.add('hidden'); btn.textContent = 'Ativar câmera'; return; }
    if (!('BarcodeDetector' in window)) { flash(out, 'Este navegador não lê QR pela câmera. Use um leitor USB/Bluetooth ou digite o código.', false); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      video.srcObject = stream; await video.play(); video.classList.remove('hidden'); btn.textContent = 'Desligar câmera';
      const det = new BarcodeDetector({ formats: ['qr_code'] }); scanning = true;
      let last = '';
      const loop = async () => {
        if (!scanning) return;
        try { const codes = await det.detect(video); const v = codes[0]?.rawValue; if (v && v !== last) { last = v; await submitCode(v); setTimeout(() => { last = ''; }, 3000); } } catch { /* frame ruim */ }
        requestAnimationFrame(loop);
      };
      loop();
    } catch { flash(out, 'Não foi possível abrir a câmera (permissão negada?).', false); }
  }
  const camBtn = h('button', { class: 'btn btn-dark', type: 'button', onclick: () => toggleCam(camBtn) }, 'Ativar câmera');
  root.append(h('h1', {}, 'Check-in'),
    h('form', { class: 'card stack', onsubmit: (e) => { e.preventDefault(); const v = val('ck'); $('#ck').value = ''; if (v) submitCode(v); $('#ck').focus(); } },
      field('Leia o QR (leitor USB) ou digite o código de 10 caracteres', input('ck', { autocomplete: 'off', autocapitalize: 'characters', autofocus: true }), 'ck'),
      h('div', { class: 'actions' }, h('button', { class: 'btn btn-primary' }, 'Validar'), camBtn), video),
    out, stats);
  loadStats();
  $('#ck').focus();
}

// ---------------- Usuários ----------------
async function users(root) {
  const msg = h('div');
  const [rows, partners] = await Promise.all([api('/admin/users'), api('/admin/partners')]);
  root.append(h('h1', {}, 'Usuários'), msg,
    h('p', { class: 'muted' }, 'Para a equipe com função admin ou check-in, ative o 2FA pelo terminal: npm run create-admin. Parceiros usam senha forte (mín. 12 caracteres) e veem só os próprios números.'),
    h('form', { class: 'card stack', onsubmit: async (e) => {
      e.preventDefault();
      try { await api('/admin/users', { method: 'POST', body: { email: val('u-mail'), name: val('u-name'), role: val('u-role'), partnerId: val('u-partner') ? Number(val('u-partner')) : null, password: val('u-pass') } }); go('users'); } catch (ex) { fail(msg)(ex); }
    } }, h('h3', {}, 'Novo usuário'),
      h('div', { class: 'inline-form' }, field('Nome', input('u-name', { required: true }), 'u-name'), field('E-mail', input('u-mail', { type: 'email', required: true }), 'u-mail'),
        field('Função', h('select', { id: 'u-role' }, h('option', { value: 'partner' }, 'Parceiro'), h('option', { value: 'checkin' }, 'Check-in'), h('option', { value: 'admin' }, 'Administrador')), 'u-role'),
        field('Parceiro (se função = parceiro)', h('select', { id: 'u-partner' }, h('option', { value: '' }, '—'), partners.map((p) => h('option', { value: p.id }, p.name))), 'u-partner'),
        field('Senha inicial (12+ caracteres)', input('u-pass', { type: 'password', minlength: 12, autocomplete: 'new-password', required: true }), 'u-pass')),
      h('button', { class: 'btn btn-dark btn-small' }, 'Criar')),
    table([{ label: 'Nome', key: 'name' }, { label: 'E-mail', key: 'email' }, { label: 'Função', key: 'role' }, { label: '2FA', render: (u) => (u.totp_enabled ? 'ativo' : '—') },
      { label: '', render: (u) => (u.disabled ? 'desativado' : u.id === me.id ? '(você)' : h('button', { class: 'btn btn-ghost btn-small', onclick: async () => { if (confirm('Desativar este usuário e encerrar sessões?')) { await api(`/admin/users/${u.id}/disable`, { method: 'POST' }); go('users'); } } }, 'Desativar')) }], rows));
}

// ---------------- Auditoria ----------------
async function audit(root) {
  const rows = await api('/admin/audit');
  const res = h('span');
  root.append(h('h1', {}, 'Auditoria'),
    h('p', { class: 'muted' }, 'Registro encadeado por hash: qualquer alteração ou remoção de linha é detectada.'),
    h('p', {}, h('button', { class: 'btn btn-dark btn-small', onclick: async () => { const r = await api('/admin/audit/verify'); res.textContent = r.ok ? ' ✔ Cadeia íntegra' : ` ✖ ADULTERAÇÃO detectada na linha ${r.brokenAt}`; } }, 'Verificar integridade'), res),
    table([{ label: '#', key: 'id' }, { label: 'Quando', render: (r) => fmtDT(r.ts) }, { label: 'Quem', key: 'actor' }, { label: 'Ação', key: 'action' }, { label: 'Entidade', render: (r) => `${r.entity} ${r.entity_id}` }, { label: 'Detalhes', render: (r) => (r.meta === '{}' ? '' : r.meta) }], rows));
}

// ---------------- Painel do parceiro ----------------
async function mine(root) {
  let d = await api('/partner/me');
  const p = () => d.partner;
  const msg = h('div');
  // O texto padrão do cadastro inicial ("perfil em breve") não vira valor do campo: o parceiro escreve o dele.
  const f = (k, label, extra = {}) => field(label, input(`m-${k}`, { value: k === 'tagline' && /em breve/i.test(p().tagline || '') ? '' : (p()[k] ?? ''), ...extra }), `m-${k}`);
  const steps = [
    ['Frase de destaque', () => (p().tagline || '').length > 0 && !/em breve/i.test(p().tagline), '#sec-vitrine'],
    ['Descrição do seu negócio', () => (p().description || '').trim().length >= 40, '#sec-vitrine'],
    ['WhatsApp para os clientes falarem com você', () => Boolean(p().whatsapp), '#sec-vitrine'],
    ['Endereço', () => Boolean(p().address), '#sec-vitrine'],
    ['Pelo menos 1 produto publicado', () => p().publishedProducts > 0, '#sec-produtos'],
  ];
  const jump = (sel) => (ev) => { ev.preventDefault(); $(sel)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const pwMsg = h('div');
  const checklist = h('div');
  const drawChecklist = () => {
    const done = steps.filter(([, ok]) => ok()).length;
    clear(checklist).append(h('div', { class: 'card stack' },
      h('div', { class: 'actions' }, h('div', {}, h('h2', {}, done === steps.length ? 'Sua página está completa 🎉' : 'Deixe sua página pronta'),
        h('p', { class: 'muted' }, done === steps.length ? 'Tudo preenchido. Mantenha preços e descrições em dia.' : `${done} de ${steps.length} passos concluídos. Páginas completas passam mais confiança e recebem mais mensagens.`)),
        h('a', { class: 'btn btn-primary btn-small', href: `/parceiros/${p().slug}`, target: '_blank', rel: 'noopener' }, 'Ver minha página no site')),
      h('progress', { max: steps.length, value: done, 'aria-label': 'Progresso da página' }),
      h('ul', { class: 'info-list' }, steps.map(([label, ok, target]) => h('li', {}, ok() ? h('span', { class: 'badge badge-ok' }, '✓') : h('span', { class: 'badge badge-pending' }, '•'),
        h('a', { href: target, onclick: jump(target) }, label))))));
  };
  const refresh = async () => { try { d = await api('/partner/me'); drawChecklist(); } catch { /* mantém o estado atual */ } };
  drawChecklist();

  root.append(h('h1', {}, `Olá, ${p().userName.split(' ')[0]}!`), msg,
    checklist,
    h('h2', { class: 'sec', id: 'sec-vitrine' }, 'Dados da sua página'),
    h('form', { class: 'card stack', onsubmit: async (e) => {
      e.preventDefault();
      try { await api('/partner/me', { method: 'PATCH', body: { tagline: val('m-tagline'), description: val('m-description'), whatsapp: val('m-whatsapp'), phone: val('m-phone'), website: val('m-website'), instagram: val('m-instagram'), address: val('m-address') } }); await refresh(); flash(msg, 'Página atualizada.'); } catch (ex) { fail(msg)(ex); }
    } }, f('tagline', 'Frase de destaque (aparece no card)', { maxlength: 140, placeholder: 'Ex.: Chalés aconchegantes com vista para o cânion' }), field('Descrição', h('textarea', { id: 'm-description', rows: 5, maxlength: 1500 }, p.description), 'm-description'),
      h('div', { class: 'row' }, f('whatsapp', 'WhatsApp (com DDD)', { inputmode: 'tel', placeholder: '(54) 99999-9999' }), f('phone', 'Telefone fixo (opcional)')), h('div', { class: 'row' }, f('website', 'Site (https://…)'), f('instagram', 'Instagram (@usuario)')), f('address', 'Endereço'),
      h('p', { class: 'hint' }, 'Nome, categoria e plano são definidos pela administração do portal.'), h('button', { class: 'btn btn-primary' }, 'Salvar')),
    h('h2', { class: 'sec', id: 'sec-produtos' }, 'Seus produtos e serviços'),
    h('p', { class: 'muted' }, 'Aparecem na sua página e no catálogo do site. Use um preço de referência (ou deixe vazio para mostrar “Consulte”). Itens em “Rascunho” não aparecem para o público.'), productsPanel(partnerProducts, refresh),
    h('h2', { class: 'sec' }, 'Resultados'),
    h('div', { class: 'cards4' }, h('div', { class: 'card stat' }, h('b', {}, String(d.stats.tickets)), h('span', {}, 'Ingressos da tirolesa vendidos com seu cupom/placa')),
      h('div', { class: 'card stat' }, h('b', {}, String(d.stats.paidOrders)), h('span', {}, 'Pedidos pagos')), h('div', { class: 'card stat' }, h('b', {}, brl(d.stats.revenueCents)), h('span', {}, 'Valor vendido')),
      h('div', { class: 'card stat' }, h('b', {}, p().freeUntil ?? 'sem prazo'), h('span', {}, `Plano ${p().plan}${p().freeUntil ? ' — cortesia até' : ''}`))),
    d.coupons.length ? table([{ label: 'Cupom', key: 'code' }, { label: 'Descrição', key: 'label' }, { label: 'Usos', num: true, key: 'used_count' }], d.coupons) : '',
    d.qrs.length ? table([{ label: 'Placa', key: 'label' }, { label: 'Local', key: 'location' }, { label: 'Leituras', num: true, key: 'scans' }], d.qrs) : '',
    h('h2', { class: 'sec' }, 'Minha conta'),
    h('form', { class: 'card stack', onsubmit: async (e) => {
      e.preventDefault(); clear(pwMsg);
      if (val('pw-new') !== val('pw-new2')) { flash(pwMsg, 'As duas senhas novas não são iguais.', false); return; }
      try { await api('/auth/change-password', { method: 'POST', body: { current: val('pw-cur'), next: val('pw-new') } }); e.target.reset(); flash(pwMsg, 'Senha alterada. Os outros aparelhos foram desconectados.'); } catch (ex) { fail(pwMsg)(ex); }
    } }, h('h3', {}, 'Trocar senha'), pwMsg,
      h('div', { class: 'inline-form' }, field('Senha atual', input('pw-cur', { type: 'password', autocomplete: 'current-password', required: true }), 'pw-cur'),
        field('Nova senha (12+ caracteres)', input('pw-new', { type: 'password', autocomplete: 'new-password', required: true, minlength: 12 }), 'pw-new'), field('Repita a nova senha', input('pw-new2', { type: 'password', autocomplete: 'new-password', required: true }), 'pw-new2')),
      h('button', { class: 'btn btn-dark btn-small' }, 'Alterar senha')));
}

// ---------------- Boot ----------------
try {
  const r = await api('/auth/me');
  setCsrf(r.csrf); me = r.user; start();
} catch { loginView(); }
