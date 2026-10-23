import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PricingError, computeQuote } from '../server/services/pricing.js';

const base = { unitPriceCents: 15000 };
const pct = (v, extra = {}) => ({ id: 1, code: 'X', kind: 'percent', value: v, min_qty: 1, max_uses: null, used_count: 0, active: 1, valid_from: null, valid_until: null, ...extra });
const group = { id: 1, label: 'Grupo', min_qty: 4, percent: 10, active: 1 };

test('sem desconto', () => {
  const q = computeQuote({ ...base, qty: 2 });
  assert.equal(q.totalCents, 30000);
  assert.equal(q.discountCents, 0);
});

test('percentual arredonda para baixo e nunca passa de 100%', () => {
  assert.equal(computeQuote({ ...base, unitPriceCents: 3333, qty: 1, coupon: pct(10) }).discountCents, 333);
  assert.equal(computeQuote({ ...base, qty: 2, coupon: pct(100) }).totalCents, 0);
});

test('valor fixo é por ingresso e limitado ao subtotal', () => {
  const q = computeQuote({ ...base, qty: 2, coupon: { ...pct(1), kind: 'fixed', value: 99999 } });
  assert.equal(q.totalCents, 0);
  const q2 = computeQuote({ ...base, qty: 2, coupon: { ...pct(1), kind: 'fixed', value: 2000 } });
  assert.equal(q2.discountCents, 4000);
});

test('maior desconto vence e não acumula; cupom só é consumido se vencer', () => {
  const a = computeQuote({ ...base, qty: 4, coupon: pct(5), groupRules: [group] });
  assert.equal(a.discountCents, 6000);
  assert.equal(a.couponId, null);
  assert.equal(a.discountLabel, 'Grupo');
  const b = computeQuote({ ...base, qty: 4, coupon: pct(20), groupRules: [group] });
  assert.equal(b.discountCents, 12000);
  assert.equal(b.couponId, 1);
});

test('cupom: esgotado, expirado, inativo e mínimo de ingressos', () => {
  const now = new Date('2026-06-01T12:00:00Z');
  assert.throws(() => computeQuote({ ...base, qty: 1, coupon: pct(10, { max_uses: 5, used_count: 5 }), now }), PricingError);
  assert.throws(() => computeQuote({ ...base, qty: 1, coupon: pct(10, { valid_until: '2026-05-01T00:00:00.000Z' }), now }), /expirou/);
  assert.throws(() => computeQuote({ ...base, qty: 1, coupon: pct(10, { valid_from: '2026-07-01T00:00:00.000Z' }), now }), /ainda não/);
  assert.throws(() => computeQuote({ ...base, qty: 1, coupon: pct(10, { active: 0 }), now }), PricingError);
  assert.throws(() => computeQuote({ ...base, qty: 1, coupon: pct(10, { min_qty: 2 }), now }), /ao menos 2/);
});

test('quantidade inválida', () => {
  assert.throws(() => computeQuote({ ...base, qty: 0 }), PricingError);
  assert.throws(() => computeQuote({ ...base, qty: 1.5 }), PricingError);
});
