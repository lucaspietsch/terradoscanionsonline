/* Núcleo independente: a calculadora não depende de recursos externos. */
(function () {
  'use strict';
  function el(id) { return document.getElementById(id); }
  function value(id) { return Number(el(id).value); }
  function format(number, decimals) { return Number(number).toLocaleString('pt-BR', { maximumFractionDigits: decimals || 0 }); }
  function mass(kg, name) { return kg >= 1000 ? format(kg / 1000, kg / 1000 < 10 ? 1 : 0) + ' t ' + name : format(kg, kg < 10 ? 1 : 0) + ' kg ' + name; }
  function updateCalculator() {
    var trees = value('trees'), age = value('age'), rate = value('co2Rate'), canopy = value('canopy'), rainfall = value('rainfall'), infiltration = value('infiltration'), status = el('calculatorStatus');
    if (!isFinite(trees) || trees < 1 || !isFinite(age) || age < 0 || !isFinite(rate) || rate < 0 || !isFinite(canopy) || canopy < 0 || !isFinite(rainfall) || rainfall < 0 || !isFinite(infiltration) || infiltration < 0 || infiltration > 100) { status.textContent = 'Preencha todos os campos com números válidos. A infiltração deve ficar entre 0 e 100%.'; return null; }
    var co2 = trees * age * rate, oxygen = co2 * 32 / 44, water = trees * canopy * rainfall * infiltration / 100;
    el('ageOutput').textContent = format(age) + ' anos'; el('co2Result').textContent = mass(co2, 'CO₂'); el('co2Sub').textContent = mass(trees * rate, 'CO₂/ano') + ' no ritmo informado'; el('o2Result').textContent = mass(oxygen, 'O₂'); el('waterResult').textContent = water >= 1000000 ? format(water / 1000000, 1) + ' milhões L' : format(water) + ' L'; el('waterSub').textContent = format(water / 1000, water / 1000 < 10 ? 1 : 0) + ' m³ no período anual estimado'; status.textContent = 'Calculadora ativa — resultado atualizado.';
    return { trees: trees, age: age, rate: rate, co2: co2, water: water };
  }
  function changeView(id) { var views = document.querySelectorAll('.view'), links = document.querySelectorAll('.nav-link'), i; for (i = 0; i < views.length; i++) views[i].className = views[i].id === id ? 'view active' : 'view'; for (i = 0; i < links.length; i++) links[i].className = links[i].getAttribute('data-view') === id ? 'nav-link active' : 'nav-link'; window.location.hash = id; }
  function init() { var ids = ['trees', 'age', 'co2Rate', 'canopy', 'rainfall', 'infiltration'], i, links = document.querySelectorAll('[data-view], [data-go]'); for (i = 0; i < ids.length; i++) { el(ids[i]).addEventListener('input', updateCalculator); el(ids[i]).addEventListener('change', updateCalculator); } el('calculatorForm').addEventListener('submit', function (event) { event.preventDefault(); updateCalculator(); }); for (i = 0; i < links.length; i++) links[i].addEventListener('click', function (event) { event.preventDefault(); changeView(this.getAttribute('data-view') || this.getAttribute('data-go')); }); el('themeButton').addEventListener('click', function () { document.body.classList.toggle('dim'); }); if (window.location.hash && el(window.location.hash.slice(1))) changeView(window.location.hash.slice(1)); updateCalculator(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());
