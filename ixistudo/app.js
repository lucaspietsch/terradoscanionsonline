(() => {
  'use strict';

  /* ======================================================================
     DADOS
     ====================================================================== */
  const produtos = [
    { id: 1, nome: "Xis Salada Gaúcho", desc: "Pão de Xis, hambúrguer, queijo, presunto, ovo, alface, tomate, milho, ervilha e maionese da casa.", preco: 28.90, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=75" },
    { id: 2, nome: "Xis Bacon Prensado", desc: "Pão prensado, muita tira de bacon crocante, hambúrguer, queijo duplo, ovo e maionese.", preco: 34.90, tag: "Mais pedido", img: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=600&q=75" },
    { id: 3, nome: "Xis Coração de Galinha", desc: "Coração temperado na chapa, queijo provolone derretido, presunto, ovo e maionese especial.", preco: 36.90, img: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=75" },
    { id: 4, nome: "Xis Tudo Especial", desc: "O rei do RS! Carne, bacon, frango, calabresa, queijo, presunto, ovo duplo e salada completa.", preco: 42.00, tag: "Especial", img: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=600&q=75" },
    { id: 5, nome: "Xis Filé Mignon", desc: "Tiras suculentas de filé mignon, queijo mussarela derretido, ovo, maionese e alface.", preco: 39.90, img: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=600&q=75" }
  ];

  const TAXA_ENTREGA = 7.00;
  const MAX_SUGESTOES = 8;

  // Etapas do pedido, em minutos desde a criação (simulação — não há backend).
  const ETAPAS = [
    { rotulo: "Recebido", ate: 2 },
    { rotulo: "Em preparo", ate: 12 },
    { rotulo: "Saiu para entrega", ate: 35 },
    { rotulo: "Entregue", ate: Infinity }
  ];

  const KEYS = {
    carrinho: "ixistudo:carrinho",
    pedidos: "pedidos_ixistudo",
    usuario: "usuario_ixistudo",
    municipio: "ixistudo:municipio",
    tema: "ixistudo:tema"
  };

  /* ======================================================================
     UTILITÁRIOS
     ====================================================================== */
  const $ = (sel, root = document) => root.querySelector(sel);
  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const fmtData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  function ler(chave, padrao) {
    try {
      const v = localStorage.getItem(chave);
      return v == null ? padrao : JSON.parse(v);
    } catch { return padrao; }
  }
  function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* modo privado / cheio */ }
  }

  const produtoPorId = (id) => produtos.find((p) => p.id === id);
  const capitalizar = (s) => s.trim().split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  /* ======================================================================
     ESTADO
     ====================================================================== */
  const estado = {
    // [{ id, qtd }] — preços sempre vêm do catálogo
    carrinho: (ler(KEYS.carrinho, []) || []).filter((i) => i && produtoPorId(i.id) && i.qtd > 0),
    pedidos: ler(KEYS.pedidos, []) || [],
    usuario: ler(KEYS.usuario, null),
    municipio: ler(KEYS.municipio, "") || "",
    busca: ""
  };

  const totais = () => {
    const subtotal = estado.carrinho.reduce((s, i) => s + produtoPorId(i.id).preco * i.qtd, 0);
    const entrega = estado.carrinho.length ? TAXA_ENTREGA : 0;
    return { subtotal, entrega, total: subtotal + entrega };
  };

  /* ======================================================================
     TOAST
     ====================================================================== */
  function toast(msg, tipo = "ok") {
    const el = document.createElement("div");
    el.className = "toast" + (tipo === "error" ? " error" : "");
    el.textContent = msg;
    $("#toasts").appendChild(el);
    setTimeout(() => {
      el.classList.add("leaving");
      setTimeout(() => el.remove(), 260);
    }, 3200);
  }

  /* ======================================================================
     CARDÁPIO
     ====================================================================== */
  function renderizarCardapio() {
    const grid = $("#menu-grid");
    const q = norm(estado.busca.trim());
    const lista = q ? produtos.filter((p) => norm(p.nome + " " + p.desc).includes(q)) : produtos;

    if (!lista.length) {
      grid.innerHTML = `<p class="empty-msg">Nenhum xis encontrado para “${esc(estado.busca)}”.</p>`;
      return;
    }

    grid.innerHTML = lista.map((p) => `
      <article class="card-xis">
        <div class="card-media">
          <img src="${esc(p.img)}" alt="${esc(p.nome)}" loading="lazy" width="600" height="375">
          <span class="img-fallback" aria-hidden="true">🍔</span>
          ${p.tag ? `<span class="card-tag">${esc(p.tag)}</span>` : ""}
        </div>
        <div class="card-body">
          <h3 class="card-title">${esc(p.nome)}</h3>
          <p class="card-desc">${esc(p.desc)}</p>
          <div class="card-footer">
            <span class="price">${brl.format(p.preco)}</span>
            <button type="button" class="btn btn-primary" data-action="add" data-id="${p.id}" aria-label="Adicionar ${esc(p.nome)} ao carrinho">
              <svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg> Adicionar
            </button>
          </div>
        </div>
      </article>`).join("");
  }

  /* ======================================================================
     CARRINHO
     ====================================================================== */
  function salvarCarrinho() { gravar(KEYS.carrinho, estado.carrinho); }

  function adicionar(id) {
    const item = estado.carrinho.find((i) => i.id === id);
    if (item) item.qtd++; else estado.carrinho.push({ id, qtd: 1 });
    salvarCarrinho();
    renderizarCarrinho(true);
    toast(`${produtoPorId(id).nome} adicionado`);
  }

  function alterarQtd(id, delta) {
    const item = estado.carrinho.find((i) => i.id === id);
    if (!item) return;
    item.qtd += delta;
    if (item.qtd <= 0) estado.carrinho = estado.carrinho.filter((i) => i.id !== id);
    salvarCarrinho();
    renderizarCarrinho();
  }

  function renderizarCarrinho(animar = false) {
    const badge = $("#cart-badge");
    const totalItens = estado.carrinho.reduce((s, i) => s + i.qtd, 0);
    badge.textContent = totalItens;
    badge.hidden = totalItens === 0;
    $("#btn-cart").setAttribute("aria-label", `Carrinho, ${totalItens} ${totalItens === 1 ? "item" : "itens"}`);
    if (animar) {
      badge.classList.remove("bump");
      void badge.offsetWidth; // reinicia a animação
      badge.classList.add("bump");
    }

    const container = $("#cart-items");
    if (!estado.carrinho.length) {
      container.innerHTML = `<p class="empty-msg">Seu carrinho está vazio.<br>Escolha um xis no cardápio 🍔</p>`;
    } else {
      container.innerHTML = estado.carrinho.map((i) => {
        const p = produtoPorId(i.id);
        return `
          <div class="cart-item">
            <span class="cart-thumb"><img src="${esc(p.img)}" alt="" loading="lazy"></span>
            <div>
              <div class="cart-item-name">${esc(p.nome)}</div>
              <div class="cart-item-price">${brl.format(p.preco)} · ${brl.format(p.preco * i.qtd)}</div>
            </div>
            <div class="qty-controls" role="group" aria-label="Quantidade de ${esc(p.nome)}">
              <button type="button" class="qty-btn" data-action="menos" data-id="${p.id}" aria-label="Diminuir quantidade"><svg class="icon" aria-hidden="true"><use href="#i-minus"/></svg></button>
              <span aria-live="polite">${i.qtd}</span>
              <button type="button" class="qty-btn" data-action="mais" data-id="${p.id}" aria-label="Aumentar quantidade"><svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg></button>
            </div>
          </div>`;
      }).join("");
    }

    const t = totais();
    $("#cart-subtotal").textContent = brl.format(t.subtotal);
    $("#cart-delivery").textContent = brl.format(t.entrega);
    $("#cart-total").textContent = brl.format(t.total);
    const cidade = $("#cart-city");
    cidade.textContent = estado.municipio || "Escolha seu município";
    cidade.classList.toggle("muted", !estado.municipio);
    $("#btn-checkout").disabled = !estado.carrinho.length;
  }

  /* ======================================================================
     PEDIDOS
     ====================================================================== */
  function etapaAtual(pedido) {
    if (!pedido.criadoEm) return ETAPAS.length - 1; // pedidos antigos (sem timestamp)
    const min = (Date.now() - pedido.criadoEm) / 60000;
    return ETAPAS.findIndex((e) => min < e.ate);
  }

  function renderizarHistoricoPedidos() {
    const container = $("#orders-history");
    if (!estado.pedidos.length) {
      container.innerHTML = `<p class="empty-msg">Nenhum pedido realizado ainda.</p>`;
      return;
    }

    container.innerHTML = estado.pedidos.map((ped, idx) => {
      const numero = ped.numero ?? (estado.pedidos.length - idx);
      const quando = ped.criadoEm ? fmtData.format(ped.criadoEm) : (ped.data || "");
      const etapa = etapaAtual(ped);
      const passos = ETAPAS.map((e, i) =>
        `<li class="${i < etapa ? "done" : i === etapa ? "done current" : ""}"${i === etapa ? ' aria-current="step"' : ""}>${e.rotulo}</li>`
      ).join("");
      return `
        <article class="order-card">
          <div class="order-head"><span>Pedido #${numero}</span><time>${esc(quando)}</time></div>
          <div class="order-items">${ped.itens.map((i) => `${i.qtd}× ${esc(i.nome)}`).join(", ")}</div>
          <div class="order-total">Total: ${brl.format(ped.total)}</div>
          ${ped.municipio ? `<div class="order-city">Entrega em ${esc(ped.municipio)}</div>` : ""}
          <ol class="stepper" aria-label="Andamento do pedido">${passos}</ol>
          <div class="status-line">${etapa === ETAPAS.length - 1 ? "✓ " : ""}${ETAPAS[etapa].rotulo}</div>
        </article>`;
    }).join("");
  }

  function finalizarPedido() {
    if (!estado.carrinho.length) return toast("Adicione ao menos um xis ao carrinho.", "error");

    if (!estado.municipio) {
      fecharDialogo($("#cart-modal"));
      toast("Escolha seu município para calcular a entrega.", "error");
      $("#input-municipio").focus();
      return;
    }
    if (!estado.usuario) {
      toast("Entre na sua conta para finalizar o pedido.", "error");
      abrirDialogo($("#auth-modal"));
      return;
    }

    const t = totais();
    const ultimo = estado.pedidos.reduce((m, p) => Math.max(m, p.numero || 0), estado.pedidos.length);
    estado.pedidos.unshift({
      numero: ultimo + 1,
      criadoEm: Date.now(),
      municipio: estado.municipio,
      itens: estado.carrinho.map((i) => ({ id: i.id, nome: produtoPorId(i.id).nome, qtd: i.qtd, preco: produtoPorId(i.id).preco })),
      total: t.total
    });
    gravar(KEYS.pedidos, estado.pedidos);

    estado.carrinho = [];
    salvarCarrinho();
    renderizarCarrinho();
    mostrarAba("pedidos");
    toast("Pedido realizado com sucesso! 🎉");
  }

  /* ======================================================================
     DIÁLOGOS E ABAS
     ====================================================================== */
  function abrirDialogo(d) { if (!d.open) d.showModal(); }
  function fecharDialogo(d) { if (d.open) d.close(); }

  // Alterna abas (role="tab") dentro de um tablist, mostrando o painel correspondente.
  function selecionarAba(abaSelecionada) {
    const lista = abaSelecionada.closest('[role="tablist"]');
    lista.querySelectorAll('[role="tab"]').forEach((aba) => {
      const ativa = aba === abaSelecionada;
      aba.setAttribute("aria-selected", String(ativa));
      aba.tabIndex = ativa ? 0 : -1;
      const painel = document.getElementById(aba.getAttribute("aria-controls"));
      if (painel) painel.hidden = !ativa;
    });
  }

  function mostrarAba(nome) {
    selecionarAba($(nome === "pedidos" ? "#tab-orders-view" : "#tab-cart-view"));
    if (nome === "pedidos") renderizarHistoricoPedidos();
  }

  function configurarDialogos() {
    // Abrir
    $("#btn-cart").addEventListener("click", () => abrirDialogo($("#cart-modal")));

    document.querySelectorAll("dialog").forEach((d) => {
      // Fechar pelo botão "×" ou clicando no fundo (backdrop)
      d.addEventListener("click", (e) => {
        if (e.target === d || e.target.closest("[data-close]")) d.close();
      });
    });

    // Abas (clique + setas do teclado)
    document.querySelectorAll('[role="tablist"]').forEach((lista) => {
      lista.addEventListener("click", (e) => {
        const aba = e.target.closest('[role="tab"]');
        if (!aba) return;
        if (aba.id === "tab-orders-view") mostrarAba("pedidos");
        else if (aba.id === "tab-cart-view") mostrarAba("carrinho");
        else selecionarAba(aba);
      });
      lista.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const abas = [...lista.querySelectorAll('[role="tab"]')];
        const atual = abas.findIndex((a) => a.getAttribute("aria-selected") === "true");
        const prox = abas[(atual + (e.key === "ArrowRight" ? 1 : -1) + abas.length) % abas.length];
        prox.focus();
        prox.click();
      });
    });

    $("#btn-checkout").addEventListener("click", finalizarPedido);

    // Mantém o andamento dos pedidos atualizado enquanto a aba está visível
    setInterval(() => {
      if ($("#cart-modal").open && !$("#orders-view").hidden) renderizarHistoricoPedidos();
    }, 30000);
  }

  /* ======================================================================
     AUTENTICAÇÃO (simulada — sem backend)
     ====================================================================== */
  function entrar(nome, email) {
    estado.usuario = { nome, email };
    gravar(KEYS.usuario, estado.usuario);
    renderizarUsuario();
    fecharDialogo($("#auth-modal"));
    toast(`Olá, ${nome.split(" ")[0]}!`);
  }

  function configurarAuth() {
    $("#form-login").addEventListener("submit", (e) => {
      e.preventDefault();
      const email = $("#login-email").value.trim();
      entrar(capitalizar(email.split("@")[0].replace(/[._-]+/g, " ")), email);
      e.target.reset();
    });

    $("#form-register").addEventListener("submit", (e) => {
      e.preventDefault();
      entrar(capitalizar($("#reg-name").value), $("#reg-email").value.trim());
      e.target.reset();
    });

    // Máscara simples de telefone: (51) 99999-9999
    $("#reg-phone").addEventListener("input", (e) => {
      const d = e.target.value.replace(/\D/g, "").slice(0, 11);
      let v = d;
      if (d.length > 2) v = `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length > 7) v = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
      e.target.value = v;
    });

    $("#user-area").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      if (btn.dataset.action === "login") abrirDialogo($("#auth-modal"));
      if (btn.dataset.action === "logout") {
        localStorage.removeItem(KEYS.usuario);
        estado.usuario = null;
        renderizarUsuario();
        toast("Você saiu da conta.");
      }
    });
  }

  function renderizarUsuario() {
    const area = $("#user-area");
    if (estado.usuario) {
      area.innerHTML = `
        <div class="user-logged">
          <svg class="icon" aria-hidden="true"><use href="#i-user"/></svg>
          <span class="greeting">Olá,</span> <span class="user-name">${esc(estado.usuario.nome)}</span>
          <button type="button" class="link-btn" data-action="logout">Sair</button>
        </div>`;
    } else {
      area.innerHTML = `
        <button type="button" class="btn btn-ghost" data-action="login">
          <svg class="icon" aria-hidden="true"><use href="#i-user"/></svg>
          <span>Entrar</span>
        </button>`;
    }
  }

  /* ======================================================================
     AUTOCOMPLETE DE MUNICÍPIOS (combobox acessível)
     ====================================================================== */
  function configurarAutocomplete() {
    const input = $("#input-municipio");
    const lista = $("#autocomplete-list");
    const indice = MUNICIPIOS_RS.map((nome) => ({ nome, chave: norm(nome) }));
    let sugestoes = [];
    let ativo = -1;

    const abrir = () => { lista.hidden = false; input.setAttribute("aria-expanded", "true"); };
    const fechar = () => {
      lista.hidden = true;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      ativo = -1;
    };

    function destacar(nome, termo) {
      const pos = norm(nome).indexOf(termo);
      if (pos < 0 || norm(nome).length !== nome.length) return esc(nome);
      return esc(nome.slice(0, pos)) + "<strong>" + esc(nome.slice(pos, pos + termo.length)) + "</strong>" + esc(nome.slice(pos + termo.length));
    }

    function renderizar() {
      const termo = norm(input.value.trim());
      if (!termo) return fechar();

      const comeca = indice.filter((m) => m.chave.startsWith(termo));
      const contem = indice.filter((m) => !m.chave.startsWith(termo) && m.chave.includes(termo));
      sugestoes = [...comeca, ...contem].slice(0, MAX_SUGESTOES).map((m) => m.nome);
      ativo = -1;

      lista.innerHTML = sugestoes.length
        ? sugestoes.map((nome, i) => `<li role="option" id="mun-${i}" data-nome="${esc(nome)}" aria-selected="false">${destacar(nome, termo)}</li>`).join("")
        : `<li class="no-result" aria-disabled="true">Município não encontrado</li>`;
      abrir();
    }

    function marcar(i) {
      lista.querySelectorAll('[role="option"]').forEach((li, n) => li.setAttribute("aria-selected", String(n === i)));
      ativo = i;
      if (i >= 0) {
        input.setAttribute("aria-activedescendant", `mun-${i}`);
        document.getElementById(`mun-${i}`).scrollIntoView({ block: "nearest" });
      } else input.removeAttribute("aria-activedescendant");
    }

    function escolher(nome) {
      estado.municipio = nome;
      gravar(KEYS.municipio, nome);
      input.value = nome;
      fechar();
      renderizarCarrinho();
      toast(`Entregando em ${nome} 🛵`);
    }

    input.addEventListener("input", renderizar);
    input.addEventListener("focus", () => { if (input.value.trim() && input.value !== estado.municipio) renderizar(); else input.select(); });

    input.addEventListener("keydown", (e) => {
      if (lista.hidden && e.key === "ArrowDown") return renderizar();
      if (lista.hidden) return;
      if (e.key === "ArrowDown") { e.preventDefault(); marcar((ativo + 1) % sugestoes.length); }
      else if (e.key === "ArrowUp") { e.preventDefault(); marcar((ativo - 1 + sugestoes.length) % sugestoes.length); }
      else if (e.key === "Enter") {
        e.preventDefault();
        if (ativo >= 0) escolher(sugestoes[ativo]);
        else if (sugestoes.length === 1) escolher(sugestoes[0]);
      } else if (e.key === "Escape") fechar();
    });

    // mousedown (e não click) para disparar antes do blur do input
    lista.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const li = e.target.closest("[data-nome]");
      if (li) escolher(li.dataset.nome);
    });

    // Ao sair do campo, volta ao município realmente escolhido
    input.addEventListener("blur", () => {
      fechar();
      input.value = estado.municipio;
    });

    input.value = estado.municipio;
  }

  /* ======================================================================
     TEMA
     ====================================================================== */
  function configurarTema() {
    const btn = $("#btn-theme");
    const aplicar = (t) => {
      document.documentElement.dataset.theme = t;
      btn.setAttribute("aria-pressed", String(t === "dark"));
    };
    aplicar(document.documentElement.dataset.theme || "light");
    btn.addEventListener("click", () => {
      const novo = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      aplicar(novo);
      // Texto puro (sem JSON): o script do <head> lê este valor diretamente.
      try { localStorage.setItem(KEYS.tema, novo); } catch { /* ignora */ }
    });
  }

  /* ======================================================================
     INICIALIZAÇÃO
     ====================================================================== */
  document.addEventListener("DOMContentLoaded", () => {
    $("#ano").textContent = new Date().getFullYear();

    // Delegação de eventos: cardápio e carrinho
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action][data-id]");
      if (!btn) return;
      const id = Number(btn.dataset.id);
      if (btn.dataset.action === "add") adicionar(id);
      else if (btn.dataset.action === "mais") alterarQtd(id, 1);
      else if (btn.dataset.action === "menos") alterarQtd(id, -1);
    });

    // Imagem quebrada → mostra o emoji de fallback (o evento "error" não propaga, então usa captura)
    document.addEventListener("error", (e) => {
      if (e.target.tagName !== "IMG") return;
      e.target.closest(".card-media")?.classList.add("is-broken");
      if (e.target.closest(".cart-thumb")) e.target.hidden = true;
    }, true);

    $("#input-busca").addEventListener("input", (e) => {
      estado.busca = e.target.value;
      renderizarCardapio();
    });

    renderizarCardapio();
    renderizarCarrinho();
    renderizarUsuario();
    configurarAutocomplete();
    configurarDialogos();
    configurarAuth();
    configurarTema();
  });
})();
