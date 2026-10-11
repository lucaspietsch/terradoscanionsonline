/*
 * Arauco Protectum — núcleo da calculadora de impacto potencial.
 *
 * Lógica pura (sem DOM) para poder ser testada em Node e usada no navegador
 * via `window.AraucoCalc`. Todos os resultados são estimativas educativas.
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AraucoCalc = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** Razão estequiométrica O₂/CO₂ da fotossíntese: 32 g/mol ÷ 44 g/mol. */
  var O2_PER_CO2 = 32 / 44;
  /** Volume de uma piscina olímpica (50 × 25 × 2 m), em m³. */
  var OLYMPIC_POOL_M3 = 2500;

  /** Limites aceitos e valores iniciais de cada premissa. */
  var FIELDS = {
    trees: { min: 1, max: 10000000, def: 247, integer: true },
    age: { min: 1, max: 80, def: 15, integer: true },
    co2Rate: { min: 0.1, max: 1000, def: 22 },
    canopy: { min: 1, max: 400, def: 20 },
    rainfall: { min: 100, max: 6000, def: 1700 },
    infiltration: { min: 0, max: 100, def: 20 },
  };

  function toNumber(value, fallback) {
    if (value === null || value === undefined || value === '') return fallback;
    var n = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : Number(value);
    return isFinite(n) ? n : fallback;
  }

  /** Converte a entrada bruta em números válidos, respeitando os limites de cada campo. */
  function sanitize(input) {
    var out = {};
    var src = input || {};
    Object.keys(FIELDS).forEach(function (key) {
      var f = FIELDS[key];
      var n = toNumber(src[key], f.def);
      if (f.integer) n = Math.round(n);
      out[key] = Math.min(f.max, Math.max(f.min, n));
    });
    return out;
  }

  /**
   * Calcula o cenário.
   *  CO₂ acumulado = árvores × idade × taxa anual
   *  O₂ associado  = CO₂ × 32/44
   *  Água/ano      = árvores × copa × chuva × fração que infiltra
   *                  (1 mm de chuva sobre 1 m² = 1 litro)
   */
  function calculate(input) {
    var v = sanitize(input);
    var co2Kg = v.trees * v.age * v.co2Rate;
    var waterLitersPerYear = v.trees * v.canopy * v.rainfall * (v.infiltration / 100);
    return {
      inputs: v,
      co2Kg: co2Kg,
      co2PerTreeKg: v.age * v.co2Rate,
      co2PerYearKg: v.trees * v.co2Rate,
      o2Kg: co2Kg * O2_PER_CO2,
      waterLitersPerYear: waterLitersPerYear,
      waterM3PerYear: waterLitersPerYear / 1000,
      poolsPerYear: waterLitersPerYear / 1000 / OLYMPIC_POOL_M3,
    };
  }

  function nf(maximumFractionDigits) {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: maximumFractionDigits });
  }

  /** Formata uma massa em kg: abaixo de 1 t em kg, acima disso em toneladas. */
  function formatMass(kg) {
    if (kg < 1000) return nf(kg < 10 ? 1 : 0).format(kg) + ' kg';
    var t = kg / 1000;
    return nf(t < 100 ? 1 : 0).format(t) + ' t';
  }

  /** Formata um volume em m³. */
  function formatVolume(m3) {
    return nf(m3 < 10 ? 1 : 0).format(m3) + ' m³';
  }

  /** Formata litros de forma legível ("1,7 milhões de litros"). */
  function formatLiters(liters) {
    if (liters >= 1e9) return nf(1).format(liters / 1e9) + ' bilhões de litros';
    if (liters >= 1e6) return nf(1).format(liters / 1e6) + ' milhões de litros';
    return nf(0).format(liters) + ' litros';
  }

  /** Textos prontos para a interface a partir de um resultado de `calculate`. */
  function describe(r) {
    var v = r.inputs;
    return {
      co2: formatMass(r.co2Kg),
      co2Sub:
        nf(0).format(v.trees) + ' árvores × ' + v.age + ' anos × ' + nf(1).format(v.co2Rate) +
        ' kg/ano · média de ' + formatMass(r.co2PerYearKg) + ' por ano',
      o2: formatMass(r.o2Kg),
      water: formatVolume(r.waterM3PerYear) + '/ano',
      waterSub:
        formatLiters(r.waterLitersPerYear) + ' por ano · ' +
        nf(r.poolsPerYear < 1 ? 2 : 1).format(r.poolsPerYear) + ' piscina(s) olímpica(s)',
    };
  }

  /** Resumo em texto puro para copiar e colar. */
  function summarize(r) {
    var d = describe(r);
    var v = r.inputs;
    return [
      'Arauco Protectum — cenário de impacto potencial',
      'Premissas: ' + nf(0).format(v.trees) + ' araucárias, ' + v.age + ' anos, ' +
        nf(1).format(v.co2Rate) + ' kg CO₂/árvore/ano, copa de ' + nf(1).format(v.canopy) + ' m², ' +
        nf(0).format(v.rainfall) + ' mm/ano de chuva, ' + nf(0).format(v.infiltration) + '% de infiltração adicional.',
      'CO₂ potencial acumulado: ' + d.co2,
      'O₂ associado à fotossíntese: ' + d.o2,
      'Água direcionada ao solo: ' + d.water,
      'Estimativa educativa — não substitui inventário florestal, modelagem hidrológica nem crédito de carbono.',
    ].join('\n');
  }

  return {
    O2_PER_CO2: O2_PER_CO2,
    FIELDS: FIELDS,
    sanitize: sanitize,
    calculate: calculate,
    describe: describe,
    summarize: summarize,
    formatMass: formatMass,
    formatVolume: formatVolume,
    formatLiters: formatLiters,
  };
});
