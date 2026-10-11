/* Arauco Protectum — registro local de plantios, contador e resumo do cenário.
   Navegação, tema e cálculo ficam em calculator-core.js. */
(function () {
  'use strict';
  var STORAGE_KEY = 'araucoProtectum.plantings';
  var BASE_TREES = 247;
  var toastTimer;

  function el(id) { return document.getElementById(id); }

  function load() {
    try {
      var data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(data) ? data : [];
    } catch (e) { return []; }
  }

  function save(items) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); return true; }
    catch (e) { return false; }
  }

  function toast(message) {
    var node = el('toast');
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { node.classList.remove('show'); }, 2600);
  }

  function render() {
    var items = load(), list = el('plantingList'), total = BASE_TREES, i;
    list.textContent = '';
    if (!items.length) {
      var empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'Ainda não há ações salvas neste dispositivo.';
      list.appendChild(empty);
    }
    for (i = 0; i < items.length; i++) {
      var row = document.createElement('div'), name = document.createElement('strong'), count = document.createElement('span');
      row.className = 'planting-item';
      name.textContent = items[i].place;
      count.textContent = Number(items[i].trees).toLocaleString('pt-BR') + ' mudas';
      row.appendChild(name); row.appendChild(count); list.appendChild(row);
      total += Number(items[i].trees) || 0;
    }
    el('treeCount').textContent = total.toLocaleString('pt-BR');
  }

  function copySummary() {
    var text = [
      'Arauco Protectum — cenário de impacto potencial',
      'Árvores: ' + el('trees').value + ' · Idade projetada: ' + el('age').value + ' anos',
      'CO₂ acumulado: ' + el('co2Result').textContent,
      'O₂ associado: ' + el('o2Result').textContent,
      'Água direcionada ao solo: ' + el('waterResult').textContent + ' (' + el('waterSub').textContent + ')',
      'Estimativa educativa; não substitui inventário florestal nem modelagem hidrológica.'
    ].join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('Resumo copiado'); }, function () { toast('Não foi possível copiar'); });
    } else { toast('Cópia não suportada neste navegador'); }
  }

  function init() {
    el('plantingForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var place = el('plantingPlace').value.trim(), trees = Math.floor(Number(el('plantingTrees').value)), status = el('formStatus');
      if (!place || !isFinite(trees) || trees < 1) { status.textContent = 'Informe o local e um número de mudas maior que zero.'; return; }
      var items = load();
      items.push({ place: place, trees: trees, createdAt: new Date().toISOString() });
      if (save(items)) { status.textContent = 'Ação salva neste dispositivo.'; event.target.reset(); render(); toast('Plantio registrado'); }
      else { status.textContent = 'Não foi possível salvar: o armazenamento do navegador está indisponível.'; }
    });
    el('clearPlantings').addEventListener('click', function () {
      if (!load().length) return;
      if (window.confirm('Remover todos os registros salvos neste dispositivo?')) { save([]); render(); toast('Registros removidos'); }
    });
    el('copyResults').addEventListener('click', copySummary);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());
