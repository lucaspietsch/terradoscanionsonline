// Backend FICTÍCIO para a pré-visualização (roda no navegador, dentro da janela pai).
// Nada aqui é dado real: serve só para você navegar pelas telas sem servidor.
(function () {
  const D = window.__DATA;
  const iso = (d) => d.toISOString().slice(0, 10);
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const TIMES = ['09:00', '10:30', '13:00', '14:30', '16:00'];
  const slots = [];
  let id = 1;
  for (let i = 1; i <= 40; i++) {
    const day = iso(new Date(today.getTime() + i * 86400000));
    TIMES.forEach((t, k) => {
      const v = (i * 7 + k * 5) % 23;
      slots.push({ id: id++, day, time: t, capacity: 18, left: v < 4 ? 0 : v < 8 ? v - 3 : 18 - (v % 9), closed: false, note: '' });
    });
  }
  const orders = [];
  const brl = (c) => c;
  const money = { unit: 15000 };

  function quote(body) {
    const qty = body.qty; const sub = money.unit * qty; let best = { d: 0, label: '' };
    const code = (body.coupon || '').toUpperCase();
    if (code && code !== 'PLACA10') { const e = new Error('Cupom inválido ou inativo.'); e.status = 400; throw e; }
    if (code === 'PLACA10' || body.qr === 'praca-01') best = { d: Math.floor(sub * 10 / 100), label: 'Desconto exclusivo das placas' };
    if (qty >= 4 && Math.floor(sub * 10 / 100) > best.d) best = { d: Math.floor(sub * 10 / 100), label: 'Desconto de grupo (4+ ingressos)' };
    return { unitPriceCents: money.unit, qty, subtotalCents: sub, discountCents: best.d, totalCents: sub - best.d, discountLabel: best.label };
  }
  const rnd = (n) => Array.from({ length: n }, () => '0123456789ABCDEFGHJKMNPQRSTVWXYZ'[Math.floor(Math.random() * 32)]).join('');
  const view = (o) => ({
    code: o.code, accessToken: o.token, status: o.status, product: { name: D.product.name, slug: D.product.slug }, day: o.day, time: o.time, qty: o.qty,
    subtotalCents: o.q.subtotalCents, discountCents: o.q.discountCents, discountLabel: o.q.discountLabel, totalCents: o.q.totalCents,
    expiresAt: new Date(o.created + 15 * 60000).toISOString(), pixCopyPaste: o.status === 'pending' ? `00020126DEMO${o.code}5204000053039865802BR5909TERRACANI6009CAMBARA62070503***6304ABCD` : null,
    tickets: o.tickets.map((t) => ({ ...t, qr: o.status === 'paid' ? `TDC1.${t.code}.DEMODEMODEMOD` : null })),
  });
  const cats = { atrativo: 'Atrativo', guia: 'Guia', agencia: 'Agência', hospedagem: 'Hospedagem', gastronomia: 'Gastronomia', servico: 'Serviço' };

  const partners = D.partners.map((p, i) => ({ id: i + 1, ...p }));
  const SAMPLE = [
    ['canyons-chalet', 'hospedagem', 'Chalé para casal (exemplo)', 'Texto de exemplo: assim aparece a descrição de uma acomodação.', 48000, 'por noite', null],
    ['canyons-chalet', 'hospedagem', 'Chalé família (exemplo)', 'Texto de exemplo para uma acomodação maior.', 72000, 'por noite', null],
    ['guia-aparados-da-serra', 'passeio', 'Trilha guiada no Itaimbezinho (exemplo)', 'Texto de exemplo: passeio guiado com saída pela manhã.', 25000, 'por pessoa', 'aparados-da-serra'],
    ['guia-aparados-da-serra', 'passeio', 'Cachoeira do Tigre Preto (exemplo)', 'Texto de exemplo de um passeio guiado.', null, '', 'serra-geral'],
    ['duperau-gastro-pub', 'refeicao', 'Hambúrguer da casa (exemplo)', 'Texto de exemplo de um prato do cardápio.', 4200, 'por prato', null],
    ['pousada-costao-do-cambara', 'experiencia', 'Cavalgada das cachoeiras (exemplo)', 'Texto de exemplo: passeio a cavalo pelas cachoeiras da fazenda.', 18000, 'por pessoa', 'costao-do-cambara'],
  ];
  const products = SAMPLE.map((x, i) => ({ id: i + 1, partnerSlug: x[0], kind: x[1], name: x[2], description: x[3], priceCents: x[4], priceNote: x[5], attractionSlug: x[6] }));
  const bare = (x) => ({ id: x.id, kind: x.kind, name: x.name, description: x.description, priceCents: x.priceCents, priceNote: x.priceNote, attractionSlug: x.attractionSlug });
  const withPartner = (x) => { const pa = partners.find((y) => y.slug === x.partnerSlug); return { ...bare(x), partner: { slug: pa.slug, name: pa.name, category: pa.category, whatsapp: pa.whatsapp } }; };
  partners.forEach((pa) => { if (['canyons-chalet', 'guia-aparados-da-serra', 'duperau-gastro-pub', 'pousada-costao-do-cambara'].includes(pa.slug)) pa.whatsapp = pa.whatsapp || '5500000000'; });
  const adminOrders = () => orders.map((o) => ({ code: o.code, status: o.status, day: o.day, time: o.time, qty: o.qty, totalCents: o.q.totalCents, discountLabel: o.q.discountLabel, createdAt: new Date(o.created).toISOString(), paidAt: o.paidAt || null, buyer: o.buyer, email: 'm•••@example.com' }))
    .concat([
      { code: 'K4M9X2QA', status: 'paid', day: slots[3].day, time: '10:30', qty: 3, totalCents: 45000, discountLabel: '', buyer: 'Ana Souza (exemplo)', email: 'a•••@example.com', createdAt: new Date().toISOString(), paidAt: new Date().toISOString() },
      { code: 'B7TT05ZE', status: 'paid', day: slots[8].day, time: '13:00', qty: 4, totalCents: 54000, discountLabel: 'Desconto de grupo (4+ ingressos)', buyer: 'Carlos Lima (exemplo)', email: 'c•••@example.com', createdAt: new Date().toISOString(), paidAt: new Date().toISOString() },
      { code: 'Q2N8W6VD', status: 'pending', day: slots[12].day, time: '09:00', qty: 2, totalCents: 27000, discountLabel: 'Desconto exclusivo das placas', buyer: 'Júlia Alves (exemplo)', email: 'j•••@example.com', createdAt: new Date().toISOString(), paidAt: null },
    ]);

  function handle(method, path, body) {
    const [p, qs] = path.split('?'); const parts = p.split('/').filter(Boolean);
    const q = new URLSearchParams(qs || '');
    const ok = () => ({ ok: true });
    // público
    if (p === '/attractions') return D.attractions;
    if (p === '/partners') return partners.filter((x) => x.published !== 0);
    if (parts[0] === 'partners' && parts[1]) {
      const x = partners.find((y) => y.slug === parts[1]);
      if (!x) throw Object.assign(new Error('Parceiro não encontrado.'), { status: 404 });
      return { ...x, products: products.filter((y) => y.partnerSlug === x.slug).map(bare) };
    }
    if (parts[0] === 'attractions' && parts[1]) {
      const a = D.attractions.find((y) => y.slug === parts[1]);
      if (!a) throw Object.assign(new Error('Atrativo não encontrado.'), { status: 404 });
      return {
        ...a, tirolesa: a.slug === 'serra-geral' ? { slug: D.product.slug, name: D.product.name, summary: D.product.summary, priceCents: money.unit } : null,
        products: products.filter((y) => y.attractionSlug === a.slug).map(withPartner), hosts: partners.filter((y) => y.attractionSlug === a.slug),
        guides: partners.filter((y) => ['guia', 'agencia'].includes(y.category)).slice(0, 6), others: D.attractions.filter((y) => y.slug !== a.slug).map((y) => ({ slug: y.slug, name: y.name, kind: y.kind })),
      };
    }
    if (p === '/catalog') { const k = q.get('kind'); return { featured: { slug: D.product.slug, name: D.product.name, summary: D.product.summary, priceCents: money.unit, href: '/tirolesa' }, items: products.filter((y) => !k || y.kind === k).map(withPartner) }; }
    if (p === '/partner/products' && method === 'GET') return products.filter((y) => y.partnerSlug === 'canyons-chalet').map((y) => ({ ...bare(y), published: true, sortOrder: 100, partnerId: 6 }));
    if (parts[0] === 'admin' && parts[1] === 'partners' && parts[3] === 'products' && method === 'GET') { const pa = partners.find((y) => y.id === Number(parts[2])); return products.filter((y) => y.partnerSlug === pa?.slug).map((y) => ({ ...bare(y), published: true, sortOrder: 100, partnerId: pa.id })); }
    if (p === `/products/${D.product.slug}`) return { ...D.product, priceCents: money.unit, mockPayments: true };
    if (p.endsWith('/availability')) return { slots };
    if (p.endsWith('/quote') && method === 'POST') return quote(body);
    if (p === '/orders' && method === 'POST') {
      const slot = slots.find((s) => s.id === body.slotId); const code = rnd(8);
      const o = { code, token: `${code}.DEMOTOKENDEMOTOKENDEMOTOK`, status: 'pending', day: slot.day, time: slot.time, qty: body.qty, q: quote({ qty: body.qty, coupon: body.coupon, qr: body.qr }), created: Date.now(), buyer: body.buyer.name,
        tickets: body.participants.map((x) => ({ code: rnd(10), holderName: x.name, isMinor: false, status: 'valid' })) };
      orders.unshift(o); return view(o);
    }
    if (parts[0] === 'orders' && parts[1]) { const o = orders.find((x) => x.token === decodeURIComponent(parts[1])); if (!o) throw Object.assign(new Error('Pedido não encontrado.'), { status: 404 }); return view(o); }
    if (parts[0] === 'dev' && parts[1] === 'pay') { const o = orders.find((x) => x.token === decodeURIComponent(parts[2])); if (o) { o.status = 'paid'; o.paidAt = new Date().toISOString(); } return ok(); }
    // auth/admin
    if (p === '/auth/me') return { user: { id: 1, email: 'admin@exemplo.com', name: 'Administrador (exemplo)', role: 'admin', partnerId: null }, csrf: 'demo' };
    if (p === '/auth/logout') return ok();
    if (p === '/admin/stats') return {
      today: { orders: 6, tickets: 14, revenue: 189000 }, last30: { orders: 142, tickets: 331, revenue: 4411500 }, total: { orders: 142, tickets: 331, revenue: 4411500 }, pending: 3,
      byQr: [{ code: 'praca-01', label: 'Placa Praça Central', location: 'Praça central', scans: 812, orders: 61, revenue: 1620000 }, { code: 'rodoviaria-01', label: 'Placa Rodoviária', location: 'Rodoviária', scans: 455, orders: 29, revenue: 760500 }, { code: 'mirante-01', label: 'Placa Mirante', location: 'Mirante da cidade', scans: 233, orders: 11, revenue: 295500 }],
      byPartner: [{ name: 'Canyons Chalet (exemplo)', orders: 14, tickets: 33, revenue: 445500 }, { name: 'Agência Cânion Turismo (exemplo)', orders: 9, tickets: 21, revenue: 283500 }],
      upcoming: slots.filter((s, i) => i % 5 === 0).slice(0, 7).map((s, i) => ({ day: s.day, capacity: 90, reserved: [74, 51, 88, 30, 62, 19, 45][i] })),
      revenueByDay: Array.from({ length: 10 }, (_, i) => ({ day: iso(new Date(today.getTime() - (9 - i) * 86400000)), tickets: 8 + (i * 5) % 17, revenue: (8 + (i * 5) % 17) * 13500 })),
    };
    if (p === '/admin/orders') return adminOrders();
    if (parts[0] === 'admin' && parts[1] === 'orders' && parts[2]) {
      const l = adminOrders().find((x) => x.code === parts[2]) || adminOrders()[0];
      return { ...l, accessToken: '', buyer: { name: l.buyer, email: 'exemplo@example.com', phone: '(54) 90000-0000' }, product: {}, paymentRef: 'demo_123', paidAt: l.paidAt, consentAt: l.createdAt, waiverVersion: 'v1-rascunho', tickets: [{ code: 'DEMO000001', holderName: l.buyer, weightKg: 70, isMinor: false, status: 'valid', usedAt: null }] };
    }
    if (p === '/admin/product') return { slug: D.product.slug, name: D.product.name, summary: D.product.summary, priceCents: money.unit, minWeightKg: 40, maxWeightKg: 110, minAge: 0, active: true, waiverVersion: 'v1-rascunho' };
    if (p === '/admin/slots') { const f = q.get('from'); const t = q.get('to'); return slots.filter((s) => (!f || s.day >= f) && (!t || s.day <= t)).map((s) => ({ id: s.id, day: s.day, time: s.time, capacity: s.capacity, reserved: s.capacity - s.left, status: 'open', note: '' })); }
    if (p === '/admin/slots/bulk') return { created: 35 };
    if (p === '/admin/coupons' && method === 'GET') return [
      { id: 1, code: 'PLACA10', label: 'Desconto exclusivo das placas', kind: 'percent', value: 10, min_qty: 1, max_uses: null, used_count: 101, valid_until: null, partner_id: null, active: 1 },
      { id: 2, code: 'CANYONS10', label: 'Cupom do parceiro Canyons Chalet (exemplo)', kind: 'percent', value: 10, min_qty: 1, max_uses: 200, used_count: 33, valid_until: null, partner_id: 6, active: 1 }];
    if (p === '/admin/rules' && method === 'GET') return [{ id: 1, label: 'Desconto de grupo (4+ ingressos)', min_qty: 4, percent: 10, active: 1 }];
    if (p === '/admin/qr' && method === 'GET') return [
      { id: 1, code: 'praca-01', label: 'Placa Praça Central', location: 'Praça central de Cambará do Sul', scans: 812, coupon_code: 'PLACA10', active: 1, url: 'https://seu-dominio.com.br/q/praca-01' },
      { id: 2, code: 'rodoviaria-01', label: 'Placa Rodoviária', location: 'Rodoviária', scans: 455, coupon_code: 'PLACA10', active: 1, url: 'https://seu-dominio.com.br/q/rodoviaria-01' }];
    if (p === '/admin/partners' && method === 'GET') return partners.map((x) => ({ ...x, free_until: x.freeUntil || null, sort_order: x.id * 10, published: 1, featured: 0 }));
    if (p === '/admin/users' && method === 'GET') return [{ id: 1, email: 'admin@exemplo.com', name: 'Administrador (exemplo)', role: 'admin', partner_id: null, totp_enabled: 1, disabled: 0 }, { id: 2, email: 'porta@exemplo.com', name: 'Equipe da portaria (exemplo)', role: 'checkin', partner_id: null, totp_enabled: 1, disabled: 0 }];
    if (p === '/admin/audit') return [{ id: 3, ts: new Date().toISOString(), actor: 'user:1', action: 'pii.view', entity: 'order', entity_id: 'K4M9X2QA', meta: '{}' }, { id: 2, ts: new Date().toISOString(), actor: 'payment', action: 'payment.paid', entity: 'order', entity_id: 'K4M9X2QA', meta: '{"ref":"demo"}' }, { id: 1, ts: new Date().toISOString(), actor: 'customer', action: 'order.created', entity: 'order', entity_id: 'K4M9X2QA', meta: '{"qty":3}' }];
    if (p === '/admin/audit/verify') return { ok: true };
    if (p === '/checkin/today') return { day: iso(today), slots: [{ time: '09:00', capacity: 18, expected: 12, arrived: 9 }, { time: '10:30', capacity: 18, expected: 15, arrived: 4 }, { time: '13:00', capacity: 18, expected: 7, arrived: 0 }] };
    if (p === '/checkin' && method === 'POST') { const c = String(body.code).toUpperCase(); return c.startsWith('ZZ') ? { result: 'not_found' } : { result: 'ok', holderName: 'Maria da Silva (exemplo)', weightKg: 65, isMinor: false, day: iso(today), time: '09:00', orderCode: 'K4M9X2QA' }; }
    if (method !== 'GET') return { ok: true, id: 99 };
    throw Object.assign(new Error('Não disponível na pré-visualização.'), { status: 404 });
  }
  window.__api = function (method, path, body) {
    try { return { status: 200, data: handle(method, path, body) }; }
    catch (e) { return { status: e.status || 500, data: { message: e.message } }; }
  };
  window.__lastOrder = function () { return orders[0] && orders[0].token; };
  void cats; void brl;
})();
