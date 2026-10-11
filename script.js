/* Arauco Protectum — interface: navegação, tema, calculadora e registro de plantios. */
(function () {
  'use strict';

  var KEYS = { theme: 'arauco.theme', plantings: 'arauco.plantings.v1' };
  var calc = window.AraucoCalc;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- armazenamento (pode falhar em janela privada ou com dados bloqueados) ---------- */
  var store = {
    get: function (key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set: function (key, value) { try { localStorage.setItem(key, value); return true; } catch (e) { return false; } },
    remove: function (key) { try { localStorage.removeItem(key); } catch (e) {} },
  };

  /* ---------- aviso (toast) ---------- */
  var toastTimer;
  function toast(message) {
    var el = $('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2800);
  }

  function setStatus(el, message, isError) {
    el.textContent = message;
    el.classList.toggle('error', !!isError);
  }

  /* ---------- navegação por hash ---------- */
  var views = Array.prototype.slice.call(document.querySelectorAll('.view'));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
  var baseTitle = 'Arauco Protectum — Missão Araucária';

  function showView(initial) {
    var id = decodeURIComponent(location.hash.slice(1));
    var view = views.filter(function (v) { return v.id === id; })[0] || views[0];

    views.forEach(function (v) { v.classList.toggle('active', v === view); });
    navLinks.forEach(function (link) {
      var on = link.dataset.view === view.id;
      link.classList.toggle('active', on);
      if (on) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    document.title = view.id === 'inicio' ? baseTitle : view.dataset.title + ' · Arauco Protectum';

    if (!initial) {
      window.scrollTo(0, 0);
      var heading = view.querySelector('h1');
      if (heading) heading.focus({ preventScroll: true });
    }
  }

  window.addEventListener('hashchange', function () { showView(false); });

  /* ---------- tema claro/escuro ---------- */
  var themeButton = $('themeButton');
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }
  function syncThemeButton() {
    var light = currentTheme() === 'light';
    themeButton.setAttribute('aria-pressed', String(light));
    themeButton.textContent = light ? '☾' : '☼';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', light ? '#f3f6ef' : '#0b160d');
  }
  themeButton.addEventListener('click', function () {
    var next = currentTheme() === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    store.set(KEYS.theme, next);
    syncThemeButton();
  });

  /* ---------- registro de plantios ---------- */
  function loadPlantings() {
    try {
      var list = JSON.parse(store.get(KEYS.plantings) || '[]');
      if (!Array.isArray(list)) return [];
      return list.filter(function (p) {
        return p && typeof p.place === 'string' && isFinite(p.trees) && p.trees > 0;
      });
    } catch (e) { return []; }
  }
  var plantings = loadPlantings();

  function savePlantings() {
    if (!store.set(KEYS.plantings, JSON.stringify(plantings))) {
      toast('Não foi possível salvar neste navegador (armazenamento bloqueado).');
    }
  }

  function formatDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
  }

  function totalTrees() {
    var base = parseInt($('treeCount').dataset.base, 10) || 0;
    return base + plantings.reduce(function (sum, p) { return sum + p.trees; }, 0);
  }

  function renderTreeCount() {
    var extra = plantings.reduce(function (sum, p) { return sum + p.trees; }, 0);
    $('treeCount').textContent = new Intl.NumberFormat('pt-BR').format(totalTrees());
    $('treeNote').textContent = extra > 0
      ? 'mudas e árvores em acompanhamento (inclui ' + new Intl.NumberFormat('pt-BR').format(extra) + ' agendadas neste dispositivo)'
      : 'mudas e árvores em acompanhamento';
  }

  function renderPlantings() {
    var list = $('plantingList');
    list.textContent = '';
    if (!plantings.length) {
      var empty = document.createElement('li');
      empty.className = 'empty';
      empty.textContent = 'Ainda não há ações salvas neste dispositivo.';
      list.appendChild(empty);
    } else {
      // Ações com data primeiro (mais próximas no topo); sem data ao final, por ordem de cadastro.
      plantings
        .slice()
        .sort(function (a, b) {
          if (a.date && b.date) return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
          if (a.date) return -1;
          if (b.date) return 1;
          return a.created - b.created;
        })
        .forEach(function (p) {
          var li = document.createElement('li');
          var info = document.createElement('div');
          var name = document.createElement('strong');
          var meta = document.createElement('span');
          var del = document.createElement('button');

          name.textContent = p.place;
          meta.textContent = p.trees + (p.trees === 1 ? ' muda' : ' mudas') + (p.date ? ' · ' + formatDate(p.date) : '');
          info.appendChild(name);
          info.appendChild(meta);

          del.type = 'button';
          del.className = 'remove-button';
          del.textContent = '×';
          del.setAttribute('aria-label', 'Remover ' + p.place);
          del.addEventListener('click', function () {
            plantings = plantings.filter(function (x) { return x.id !== p.id; });
            savePlantings();
            renderPlantings();
            toast('Registro removido.');
          });

          li.appendChild(info);
          li.appendChild(del);
          list.appendChild(li);
        });
    }
    $('clearPlantings').hidden = plantings.length === 0;
    renderTreeCount();
  }

  $('plantingForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var status = $('formStatus');
    var place = $('plantingPlace').value.trim();
    var trees = parseInt($('plantingTrees').value, 10);
    var date = $('plantingDate').value;

    if (!place) { setStatus(status, 'Informe o local ou o nome da ação.', true); $('plantingPlace').focus(); return; }
    if (!(trees >= 1 && trees <= 100000)) { setStatus(status, 'Informe de 1 a 100.000 mudas.', true); $('plantingTrees').focus(); return; }

    var now = Date.now();
    plantings.push({ id: now + '-' + Math.random().toString(36).slice(2, 7), place: place, trees: trees, date: date, created: now });
    savePlantings();
    renderPlantings();
    this.reset();
    setStatus(status, 'Plantio salvo neste dispositivo.', false);
    $('plantingPlace').focus();
  });

  $('clearPlantings').addEventListener('click', function () {
    if (!plantings.length || !window.confirm('Apagar todos os registros salvos neste dispositivo?')) return;
    plantings = [];
    store.remove(KEYS.plantings);
    renderPlantings();
    setStatus($('formStatus'), '', false);
    toast('Registros locais apagados.');
  });

  /* ---------- calculadora ---------- */
  var fieldIds = Object.keys(calc ? calc.FIELDS : {});
  var current = null;

  function readInputs() {
    var input = {};
    fieldIds.forEach(function (id) { input[id] = $(id).value; });
    return input;
  }

  function writeInputs(values) {
    fieldIds.forEach(function (id) { $(id).value = values[id]; });
    $('ageOutput').textContent = values.age + (values.age === 1 ? ' ano' : ' anos');
  }

  function updateResults(announce) {
    var raw = readInputs();
    current = calc.calculate(raw);
    var text = calc.describe(current);
    $('co2Result').textContent = text.co2;
    $('co2Sub').textContent = text.co2Sub;
    $('o2Result').textContent = text.o2;
    $('waterResult').textContent = text.water;
    $('waterSub').textContent = text.waterSub;
    $('ageOutput').textContent = current.inputs.age + (current.inputs.age === 1 ? ' ano' : ' anos');

    // Avisa quando algum valor digitado foi ajustado aos limites.
    var adjusted = fieldIds.filter(function (id) {
      var typed = String(raw[id]).replace(',', '.');
      return typed !== '' && Number(typed) !== current.inputs[id];
    });
    var status = $('calculatorStatus');
    if (adjusted.length) setStatus(status, 'Valores fora do intervalo aceito foram ajustados nos cálculos.', true);
    else setStatus(status, announce ? 'Cenário atualizado.' : '', false);
  }

  function initCalculator() {
    if (!calc) {
      setStatus($('calculatorStatus'), 'Não foi possível carregar a calculadora (calculator-core.js).', true);
      return;
    }
    $('calculatorForm').addEventListener('submit', function (e) {
      e.preventDefault();
      // Normaliza os campos para os valores realmente usados.
      writeInputs(calc.calculate(readInputs()).inputs);
      updateResults(true);
    });
    $('calculatorForm').addEventListener('input', function () { updateResults(false); });

    $('useRegistered').addEventListener('click', function () {
      $('trees').value = totalTrees();
      updateResults(true);
    });
    $('resetCalculator').addEventListener('click', function () {
      var defaults = {};
      fieldIds.forEach(function (id) { defaults[id] = calc.FIELDS[id].def; });
      writeInputs(defaults);
      updateResults(true);
    });
    $('copyResults').addEventListener('click', function () {
      var text = calc.summarize(current || calc.calculate(readInputs()));
      copyText(text).then(
        function () { toast('Resumo copiado.'); },
        function () { toast('Não foi possível copiar. Selecione o texto manualmente.'); }
      );
    });
    updateResults(false);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(area);
      ok ? resolve() : reject(new Error('copy failed'));
    });
  }

  /* ---------- início ---------- */
  showView(true);
  syncThemeButton();
  renderPlantings();
  initCalculator();
})();
