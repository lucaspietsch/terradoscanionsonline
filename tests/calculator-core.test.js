'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const calc = require('../calculator-core.js');

// Intl usa espaços não separáveis; normalizamos para comparar.
const plain = (s) => s.replace(/\s/g, ' ');

test('cenário padrão: 247 árvores, 15 anos, 22 kg/ano', () => {
  const r = calc.calculate({});
  assert.equal(r.co2Kg, 247 * 15 * 22);
  assert.ok(Math.abs(r.o2Kg - r.co2Kg * (32 / 44)) < 1e-9);
  // 247 × 20 m² × 1700 mm × 20% = 1.679.600 L = 1679,6 m³
  assert.equal(r.waterLitersPerYear, 1679600);
  assert.ok(Math.abs(r.waterM3PerYear - 1679.6) < 1e-9);
});

test('entradas inválidas caem no padrão e valores extremos são limitados', () => {
  const r = calc.sanitize({ trees: 'abc', age: -5, co2Rate: '', canopy: 99999, rainfall: null, infiltration: 250 });
  assert.equal(r.trees, 247);
  assert.equal(r.age, 1);
  assert.equal(r.co2Rate, 22);
  assert.equal(r.canopy, 400);
  assert.equal(r.rainfall, 1700);
  assert.equal(r.infiltration, 100);
});

test('aceita vírgula decimal e arredonda campos inteiros', () => {
  const r = calc.sanitize({ trees: '10,6', co2Rate: '22,5' });
  assert.equal(r.trees, 11);
  assert.equal(r.co2Rate, 22.5);
});

test('infiltração 0% resulta em zero água adicional', () => {
  assert.equal(calc.calculate({ infiltration: 0 }).waterLitersPerYear, 0);
});

test('formatação de massa e volume', () => {
  assert.equal(plain(calc.formatMass(500)), '500 kg');
  assert.equal(plain(calc.formatMass(81510)), '81,5 t');
  assert.equal(plain(calc.formatMass(2500000)), '2.500 t');
  assert.equal(plain(calc.formatVolume(1679.6)), '1.680 m³');
  assert.equal(plain(calc.formatLiters(1679600)), '1,7 milhões de litros');
});

test('resumo em texto traz as premissas e o aviso de limitação', () => {
  const text = calc.summarize(calc.calculate({}));
  assert.match(text, /247 araucárias/);
  assert.match(text, /não substitui inventário florestal/);
});
