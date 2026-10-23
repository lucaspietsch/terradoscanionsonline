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
    { id: 5, nome: "Xis Filé Mignon", desc: "Tiras suculentas de filé mignon, queijo mussarela derretido, ovo, maionese e alface.", preco: 39.90, img: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=600&q=75" },
    { id: 6, nome: "Xis Calabresa", desc: "Calabresa acebolada na chapa, queijo, presunto, ovo, alface, tomate e maionese.", preco: 31.90, img: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=600&q=75" },
    { id: 7, nome: "Xis Frango", desc: "Peito de frango grelhado e desfiado, queijo, presunto, ovo, milho e maionese caseira.", preco: 32.90, img: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=75" },
    { id: 8, nome: "Xis Vegetariano", desc: "Ovo, queijo, tomate, alface, milho, ervilha, cenoura ralada e maionese. Sem carne.", preco: 26.90, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=75" }
  ];

  // Cada empreendimento oferece de 3 a 5 lanches deste catálogo.
  const MIN_LANCHES = 3;
  const MAX_LANCHES = 5;
  // Todo município com cadastro tem pelo menos 3 empreendimentos.
  const MIN_EMPREENDIMENTOS = 3;

  const TAXA_ENTREGA = 7.00;
  const MAX_SUGESTOES = 8;

  // Municípios do Oeste/Fronteira Oeste ainda sem empreendimentos cadastrados.
  const EM_BREVE = new Set([
    "Alegrete", "Uruguaiana", "Itaqui", "São Borja", "Santiago", "Sant'Ana do Livramento",
    "Rosário do Sul", "Quaraí", "Barra do Quaraí", "Itacurubi", "Maçambará", "Manoel Viana"
  ]);

  // Municípios maiores têm mais empreendimentos cadastrados.
  const GRANDES = ["Porto Alegre", "Caxias do Sul", "Canoas", "Pelotas", "Santa Maria", "Passo Fundo", "Novo Hamburgo", "Gravataí"];

  // Nomes fictícios usados para gerar os empreendimentos de cada município.
  const NOMES_XIS = [
    "Xis do Canyon", "Xis do Gordo", "Xis do Baixinho", "Xis da Laura", "Xis do Zé", "Xis da Vovó",
    "Xis do Chimarrão", "Xis do Gaúcho", "Xis do Pampa", "Xis da Esquina", "Xis do Mateus", "Xis da Praça",
    "Xis do Tchê", "Xis da Maria", "Xis do Galpão", "Xis do Peão", "Xis da Serra", "Xis do Alemão",
    "Xis do Italiano", "Xis do Tio Beto", "Xis da Dona Neusa", "Xis do Pedrão", "Xis do Barão", "Xis da Chapa",
    "Xis do Bigode", "Xis do Fogão", "Xis da Prensa", "Xis do Capitão", "Xis do Rancho", "Xis do Vovô",
    "Xis da Gurizada", "Xis do Cuca", "Xis do Kiko", "Xis da Bia", "Xis do Careca", "Xis do Churrasqueiro",
    "Xis do Lampião", "Xis da Estação", "Xis do Bolicho", "Xis da Tia Ná"
  ];

  // Etapas do pedido, em minutos desde a criação (simulação — não há backend).
  const ETAPAS = [
    { rotulo: "Recebido", ate: 2 },
    { rotulo: "Em preparo", ate: 12 },
    { rotulo: "Saiu para entrega", ate: 35 },
    { rotulo: "Entregue", ate: Infinity }
  ];

  const KEYS = {
    carrinho: "ixistudo:carrinho:v2",
    pedidos: "pedidos_ixistudo",
    usuario: "usuario_ixistudo",
    municipio: "ixistudo:municipio",
    tema: "ixistudo:tema",
    consentimento: "ixistudo:consentimento"
  };
  const CONSENT_VERSAO = 1;
  const RAIO_MAX_KM = 120; // além disso, a pessoa provavelmente não está no RS

  /* ======================================================================
     UTILITÁRIOS
     ====================================================================== */
  const $ = (sel, root = document) => root.querySelector(sel);
  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const fmtData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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
     EMPREENDIMENTOS (gerados de forma determinística por município)
     ====================================================================== */
  const cidadePorSlug = new Map(MUNICIPIOS_RS.map((m) => [slug(m), m]));

  // PRNG com semente: o mesmo município sempre gera os mesmos empreendimentos.
  function semente(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^ (h >>> 16)) >>> 0;
  }
  function prng(a) {
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const cacheEmpreendimentos = new Map();
  function empreendimentosDe(cidade) {
    if (cacheEmpreendimentos.has(cidade)) return cacheEmpreendimentos.get(cidade);
    let lista = [];
    if (!EM_BREVE.has(cidade)) {
      const rnd = prng(semente(cidade));
      const nomes = [...NOMES_XIS];
      for (let i = nomes.length - 1; i > 0; i--) { // embaralha (Fisher–Yates)
        const j = Math.floor(rnd() * (i + 1));
        [nomes[i], nomes[j]] = [nomes[j], nomes[i]];
      }
      const qtd = GRANDES.includes(cidade)
        ? 6 + Math.floor(rnd() * 3)
        : MIN_EMPREENDIMENTOS + Math.floor(rnd() * 3);
      lista = nomes.slice(0, qtd).map((nome) => {
        const min = 20 + Math.floor(rnd() * 5) * 5;
        const ids = produtos.map((p) => p.id);
        for (let i = ids.length - 1; i > 0; i--) { // sorteia o cardápio desta loja
          const j = Math.floor(rnd() * (i + 1));
          [ids[i], ids[j]] = [ids[j], ids[i]];
        }
        const qtdLanches = MIN_LANCHES + Math.floor(rnd() * (MAX_LANCHES - MIN_LANCHES + 1));
        return {
          id: `${slug(cidade)}/${slug(nome)}`,
          nome, cidade,
          nota: (4.2 + rnd() * 0.8).toFixed(1).replace(".", ","),
          tempo: `${min}–${min + 15} min`,
          img: produtos[Math.floor(rnd() * produtos.length)].img,
          menu: ids.slice(0, qtdLanches).sort((a, b) => a - b)
        };
      });
    }
    cacheEmpreendimentos.set(cidade, lista);
    return lista;
  }

  function lojaPorId(id) {
    if (typeof id !== "string") return null;
    const cidade = cidadePorSlug.get(id.split("/")[0]);
    return cidade ? empreendimentosDe(cidade).find((l) => l.id === id) || null : null;
  }

  /* ======================================================================
     ESTADO
     ====================================================================== */
  function lerConsentimento() {
    const c = ler(KEYS.consentimento, null);
    return c && c.versao === CONSENT_VERSAO ? c : null;
  }
  const carrinhoSalvo = ler(KEYS.carrinho, null);
  const estado = {
    // { lojaId, itens: [{ id, qtd }] } — preços sempre vêm do catálogo
    carrinho: {
      lojaId: lojaPorId(carrinhoSalvo?.lojaId) ? carrinhoSalvo.lojaId : null,
      itens: lojaPorId(carrinhoSalvo?.lojaId)
        ? (carrinhoSalvo.itens || []).filter((i) => i && produtoPorId(i.id) && i.qtd > 0)
        : []
    },
    pedidos: ler(KEYS.pedidos, []) || [],
    usuario: ler(KEYS.usuario, null),
    municipio: cidadePorSlug.has(slug(ler(KEYS.municipio, "") || "")) ? ler(KEYS.municipio, "") : "",
    consent: lerConsentimento(),
    temaManual: false, // o usuário alternou o tema nesta sessão
    lojaAtual: null, // empreendimento aberto na tela
    busca: "",
    pendente: null   // item aguardando confirmação de troca de empreendimento
  };

  const totais = () => {
    const subtotal = estado.carrinho.itens.reduce((s, i) => s + produtoPorId(i.id).preco * i.qtd, 0);
    const entrega = estado.carrinho.itens.length ? TAXA_ENTREGA : 0;
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
     ROTAS (hash): #/  ·  #/municipio/<slug>  ·  #/loja/<cidade>/<loja>
     ====================================================================== */
  const app = () => $("#app");

  // Preferências (tema, município) só são gravadas se a pessoa permitiu.
  const podeGravarPreferencias = () => estado.consent?.preferencias === true;

  function definirMunicipio(cidade) {
    estado.municipio = cidade;
    if (podeGravarPreferencias()) gravar(KEYS.municipio, cidade);
    $("#input-municipio").value = cidade;
  }

  function irParaMunicipio(cidade) {
    const alvo = `#/municipio/${slug(cidade)}`;
    if (location.hash === alvo) rotear(); else location.hash = alvo;
  }

  let primeiraRota = true;
  function rotear() {
    const partes = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
    estado.busca = "";
    estado.lojaAtual = null;
    let titulo = "iXisTudo — O verdadeiro Xis Gaúcho";

    if (partes[0] === "privacidade" || partes[0] === "termos") {
      app().innerHTML = `<section class="container">${LEGAL[partes[0]]()}</section>`;
      titulo = (partes[0] === "privacidade" ? "Política de Privacidade" : "Termos de Uso") + " — iXisTudo";
    } else if (partes[0] === "municipio" && cidadePorSlug.has(partes[1])) {
      const cidade = cidadePorSlug.get(partes[1]);
      definirMunicipio(cidade);
      renderizarMunicipio(cidade);
      titulo = `Xis em ${cidade} — iXisTudo`;
    } else if (partes[0] === "loja" && lojaPorId(`${partes[1]}/${partes[2]}`)) {
      const loja = lojaPorId(`${partes[1]}/${partes[2]}`);
      definirMunicipio(loja.cidade);
      estado.lojaAtual = loja;
      renderizarLoja(loja);
      titulo = `${loja.nome} — ${loja.cidade} — iXisTudo`;
    } else {
      renderizarInicio();
    }

    document.title = titulo;
    window.scrollTo({ top: 0, behavior: "instant" });
    if (!primeiraRota) app().focus({ preventScroll: true });
    primeiraRota = false;
  }

  /* ======================================================================
     TELAS
     ====================================================================== */
  function renderizarInicio() {
    const destaques = GRANDES.map((c) =>
      `<li><a class="chip" href="#/municipio/${slug(c)}">${esc(c)}</a></li>`).join("");
    app().innerHTML = `
      <section class="hero">
        <div class="hero-inner">
          <p class="eyebrow">Tradição gaúcha</p>
          <h1>O autêntico Xis Gaúcho, entregue na sua porta</h1>
          <p class="hero-sub">Escolha seu município, veja os xis-burgers da sua cidade e peça direto do empreendimento mais perto de você.</p>
          <ul class="hero-chips" aria-label="Diferenciais">
            <li>🧀 Bem recheado</li>
            <li>🥫 Maionese caseira</li>
            <li>🛵 Entrega no RS</li>
          </ul>
          <div class="hero-actions">
            <button type="button" class="btn btn-accent btn-lg" data-action="focar-municipio">Escolher meu município</button>
            <button type="button" class="btn btn-glass btn-lg" data-action="usar-localizacao">
              <svg class="icon" aria-hidden="true"><use href="#i-locate"/></svg> Usar minha localização
            </button>
          </div>
        </div>
      </section>
      <section class="container" aria-labelledby="titulo-destaques">
        <div class="section-head"><h2 id="titulo-destaques">Municípios em destaque</h2></div>
        <ul class="chips">${destaques}</ul>
        <p class="hint">Não achou o seu? Digite o nome do município na barra de busca lá em cima.</p>
      </section>`;
  }

  function renderizarMunicipio(cidade) {
    const lojas = empreendimentosDe(cidade);

    if (!lojas.length) {
      app().innerHTML = `
        <section class="container">
          <nav class="crumb" aria-label="Navegação"><a href="#/">← Início</a></nav>
          <div class="coming-soon">
            <div class="coming-emoji" aria-hidden="true">🚧</div>
            <p class="eyebrow">${esc(cidade)}</p>
            <h1>Em breve…</h1>
            <p>Ainda não temos empreendimentos cadastrados em ${esc(cidade)}, mas estamos chegando por aí!</p>
            <button type="button" class="btn btn-primary" data-action="focar-municipio">Escolher outro município</button>
          </div>
        </section>`;
      return;
    }

    app().innerHTML = `
      <section class="container">
        <nav class="crumb" aria-label="Navegação"><a href="#/">← Início</a></nav>
        <div class="section-head">
          <div>
            <p class="eyebrow">${esc(cidade)}</p>
            <h1 class="page-title">Empreendimentos em ${esc(cidade)}</h1>
            <p class="muted">${lojas.length} ${lojas.length === 1 ? "empreendimento cadastrado" : "empreendimentos cadastrados"}</p>
          </div>
        </div>
        <div class="store-grid">
          ${lojas.map((l) => `
            <a class="store-card" href="#/loja/${l.id}">
              <div class="card-media">
                <img src="${esc(l.img)}" alt="" loading="lazy" width="600" height="338">
                <span class="img-fallback" aria-hidden="true">🍔</span>
              </div>
              <div class="card-body">
                <h2 class="card-title">${esc(l.nome)}</h2>
                <p class="store-meta">
                  <span class="rating" aria-label="Nota ${l.nota}">★ ${l.nota}</span>
                  <span>${l.tempo}</span>
                  <span>Entrega ${brl.format(TAXA_ENTREGA)}</span>
                </p>
              </div>
            </a>`).join("")}
        </div>
      </section>`;
  }

  function renderizarLoja(loja) {
    app().innerHTML = `
      <section class="container">
        <nav class="crumb" aria-label="Navegação">
          <a href="#/municipio/${slug(loja.cidade)}">← Empreendimentos em ${esc(loja.cidade)}</a>
        </nav>
        <header class="store-hero">
          <div class="store-hero-avatar" aria-hidden="true">🍔</div>
          <div>
            <h1 class="page-title">${esc(loja.nome)}</h1>
            <p class="store-meta">
              <span class="rating" aria-label="Nota ${loja.nota}">★ ${loja.nota}</span>
              <span>${esc(loja.cidade)}</span>
              <span>${loja.tempo}</span>
              <span>Entrega ${brl.format(TAXA_ENTREGA)}</span>
            </p>
          </div>
        </header>
        <div class="section-head">
          <h2 id="titulo-cardapio">Cardápio <span class="muted count">· ${loja.menu.length} lanches</span></h2>
          <label class="menu-search">
            <svg class="icon" aria-hidden="true"><use href="#i-search"/></svg>
            <span class="sr-only">Buscar no cardápio</span>
            <input type="search" id="input-busca" placeholder="Buscar (ex.: bacon, frango)…" autocomplete="off">
          </label>
        </div>
        <div class="menu-grid" id="menu-grid" aria-live="polite"></div>
      </section>`;
    renderizarCardapio();
  }

  function renderizarCardapio() {
    const grid = $("#menu-grid");
    if (!grid) return;
    const q = norm(estado.busca.trim());
    const cardapio = estado.lojaAtual ? estado.lojaAtual.menu.map(produtoPorId) : produtos;
    const lista = q ? cardapio.filter((p) => norm(p.nome + " " + p.desc).includes(q)) : cardapio;

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
    const loja = estado.lojaAtual;
    if (!loja || !loja.menu.includes(id)) return;

    // Um carrinho só aceita itens de um empreendimento por vez.
    if (estado.carrinho.itens.length && estado.carrinho.lojaId !== loja.id) {
      const atual = lojaPorId(estado.carrinho.lojaId);
      estado.pendente = { id, loja };
      $("#swap-text").textContent =
        `Seu carrinho tem itens de “${atual ? atual.nome : "outro empreendimento"}”. ` +
        `Para pedir de “${loja.nome}”, é preciso esvaziar o carrinho atual.`;
      abrirDialogo($("#swap-modal"));
      return;
    }
    inserir(id, loja);
  }

  function inserir(id, loja) {
    estado.carrinho.lojaId = loja.id;
    const item = estado.carrinho.itens.find((i) => i.id === id);
    if (item) item.qtd++; else estado.carrinho.itens.push({ id, qtd: 1 });
    salvarCarrinho();
    renderizarCarrinho(true);
    toast(`${produtoPorId(id).nome} adicionado`);
  }

  function confirmarTroca() {
    const { id, loja } = estado.pendente || {};
    estado.pendente = null;
    fecharDialogo($("#swap-modal"));
    if (!loja) return;
    estado.carrinho.itens = [];
    inserir(id, loja);
  }

  function alterarQtd(id, delta) {
    const item = estado.carrinho.itens.find((i) => i.id === id);
    if (!item) return;
    item.qtd += delta;
    if (item.qtd <= 0) estado.carrinho.itens = estado.carrinho.itens.filter((i) => i.id !== id);
    if (!estado.carrinho.itens.length) estado.carrinho.lojaId = null;
    salvarCarrinho();
    renderizarCarrinho();
  }

  function renderizarCarrinho(animar = false) {
    const itens = estado.carrinho.itens;
    const badge = $("#cart-badge");
    const totalItens = itens.reduce((s, i) => s + i.qtd, 0);
    badge.textContent = totalItens;
    badge.hidden = totalItens === 0;
    $("#btn-cart").setAttribute("aria-label", `Carrinho, ${totalItens} ${totalItens === 1 ? "item" : "itens"}`);
    if (animar) {
      badge.classList.remove("bump");
      void badge.offsetWidth; // reinicia a animação
      badge.classList.add("bump");
    }

    const container = $("#cart-items");
    if (!itens.length) {
      container.innerHTML = `<p class="empty-msg">Seu carrinho está vazio.<br>Escolha um xis no cardápio 🍔</p>`;
    } else {
      container.innerHTML = itens.map((i) => {
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
    const loja = lojaPorId(estado.carrinho.lojaId);
    const linha = $("#cart-city");
    linha.innerHTML = loja
      ? `<a href="#/loja/${loja.id}" data-close-cart>${esc(loja.nome)}</a> · ${esc(loja.cidade)}`
      : "—";
    linha.classList.toggle("muted", !loja);
    $("#btn-checkout").disabled = !itens.length;
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
          ${ped.loja ? `<div class="order-store">${esc(ped.loja)}</div>` : ""}
          <div class="order-items">${ped.itens.map((i) => `${i.qtd}× ${esc(i.nome)}`).join(", ")}</div>
          <div class="order-total">Total: ${brl.format(ped.total)}</div>
          ${ped.municipio ? `<div class="order-city">Entrega em ${esc(ped.municipio)}</div>` : ""}
          <ol class="stepper" aria-label="Andamento do pedido">${passos}</ol>
          <div class="status-line">${etapa === ETAPAS.length - 1 ? "✓ " : ""}${ETAPAS[etapa].rotulo}</div>
        </article>`;
    }).join("");
  }

  function finalizarPedido() {
    const itens = estado.carrinho.itens;
    const loja = lojaPorId(estado.carrinho.lojaId);
    if (!itens.length || !loja) return toast("Adicione ao menos um xis ao carrinho.", "error");

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
      loja: loja.nome,
      municipio: loja.cidade,
      itens: itens.map((i) => ({ id: i.id, nome: produtoPorId(i.id).nome, qtd: i.qtd, preco: produtoPorId(i.id).preco })),
      total: t.total
    });
    gravar(KEYS.pedidos, estado.pedidos);

    estado.carrinho = { lojaId: null, itens: [] };
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
    $("#btn-cart").addEventListener("click", () => abrirDialogo($("#cart-modal")));

    document.querySelectorAll("dialog").forEach((d) => {
      // Fechar pelo botão "×" ou clicando no fundo (backdrop)
      d.addEventListener("click", (e) => {
        if (e.target === d || e.target.closest("[data-close]")) d.close();
        // Link do carrinho para o empreendimento: fecha a gaveta e segue o link
        if (e.target.closest("[data-close-cart]")) d.close();
        // Links para páginas legais dentro de um diálogo
        if (e.target.closest("[data-fechar-dialogo]")) d.close();
      });
    });
    $("#swap-modal").addEventListener("close", () => { estado.pendente = null; });

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
  function entrar(nome, email, telefone = "") {
    estado.usuario = { nome, email, telefone };
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
      entrar(capitalizar($("#reg-name").value), $("#reg-email").value.trim(), $("#reg-phone").value.trim());
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
        : `<li class="no-result" aria-disabled="true">Nenhum município do RS encontrado</li>`;
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
      input.value = nome;
      fechar();
      input.blur();
      irParaMunicipio(nome); // abre a página de empreendimentos do município
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
      estado.temaManual = true;
      // Texto puro (sem JSON): o script do <head> lê este valor diretamente.
      if (podeGravarPreferencias()) try { localStorage.setItem(KEYS.tema, novo); } catch { /* ignora */ }
    });
  }

  /* ======================================================================
     LGPD: CONSENTIMENTO, LOCALIZAÇÃO E DIREITOS DO TITULAR
     ====================================================================== */
  function mostrarBanner(visivel) {
    $("#cookie-banner").hidden = !visivel;
    document.body.classList.toggle("has-banner", visivel);
  }

  function abrirPreferenciasCookies() {
    $("#consent-pref").checked = estado.consent?.preferencias === true;
    abrirDialogo($("#consent-modal"));
  }

  function aplicarConsentimento(preferencias) {
    estado.consent = { versao: CONSENT_VERSAO, necessarios: true, preferencias, data: new Date().toISOString() };
    gravar(KEYS.consentimento, estado.consent);
    if (preferencias) {
      if (estado.municipio) gravar(KEYS.municipio, estado.municipio);
      if (estado.temaManual) try { localStorage.setItem(KEYS.tema, document.documentElement.dataset.theme); } catch { /* ignora */ }
    } else {
      // Revogação: apaga o que dependia do consentimento.
      try { localStorage.removeItem(KEYS.tema); localStorage.removeItem(KEYS.municipio); } catch { /* ignora */ }
    }
    mostrarBanner(false);
    fecharDialogo($("#consent-modal"));
    toast(preferencias ? "Preferências permitidas." : "Apenas o armazenamento necessário está ativo.");
  }

  // --- Localização (consentimento a cada uso; coordenadas nunca são guardadas) ---
  function haversineKm(lat1, lon1, lat2, lon2) {
    const rad = (d) => (d * Math.PI) / 180;
    const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 +
      Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(a));
  }

  function municipioMaisProximo(lat, lon) {
    let melhor = null, menor = Infinity;
    for (const [nome, la, lo] of MUNICIPIOS_RS_DADOS) {
      const d = haversineKm(lat, lon, la, lo);
      if (d < menor) { menor = d; melhor = nome; }
    }
    return { nome: melhor, km: menor };
  }

  function localizar() {
    if (!("geolocation" in navigator)) {
      return toast("Seu navegador não oferece localização. Use a busca de município.", "error");
    }
    toast("Buscando sua localização…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { nome, km } = municipioMaisProximo(pos.coords.latitude, pos.coords.longitude);
        if (km > RAIO_MAX_KM) {
          return toast("Parece que você está fora do Rio Grande do Sul. Busque um município pela barra de pesquisa.", "error");
        }
        irParaMunicipio(nome);
        toast(`Município mais próximo de você: ${nome}`);
      },
      (err) => {
        toast(err.code === 1
          ? "Localização negada. Sem problema: busque seu município pela barra de pesquisa."
          : "Não foi possível obter sua localização. Busque seu município pela barra de pesquisa.", "error");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    );
  }

  // --- Meus dados ---
  function abrirMeusDados() {
    const u = estado.usuario;
    const c = estado.consent;
    const qtdItens = estado.carrinho.itens.reduce((s, i) => s + i.qtd, 0);
    const linhas = [
      ["Conta", u ? `${u.nome} · ${u.email}${u.telefone ? " · " + u.telefone : ""}` : "Nenhuma conta neste navegador"],
      ["Pedidos", `${estado.pedidos.length} no histórico`],
      ["Carrinho", `${qtdItens} ${qtdItens === 1 ? "item" : "itens"}`],
      ["Preferências salvas", [ler(KEYS.municipio, "") && `município ${ler(KEYS.municipio, "")}`,
        (() => { try { return localStorage.getItem(KEYS.tema) && `tema ${localStorage.getItem(KEYS.tema) === "dark" ? "escuro" : "claro"}`; } catch { return ""; } })()
      ].filter(Boolean).join(" e ") || "nenhuma"],
      ["Cookies", c ? `preferências ${c.preferencias ? "permitidas" : "recusadas"} em ${fmtData.format(new Date(c.data))}` : "ainda não respondido"]
    ];
    $("#data-summary").innerHTML = linhas.map(([k, v]) => `<li><strong>${esc(k)}:</strong> ${esc(v)}</li>`).join("");
    resetarBotaoExcluir();
    abrirDialogo($("#data-modal"));
  }

  function baixarMeusDados() {
    const tema = (() => { try { return localStorage.getItem(KEYS.tema); } catch { return null; } })();
    const dados = {
      exportadoEm: new Date().toISOString(),
      origem: "iXisTudo — dados armazenados neste navegador (LGPD, art. 18)",
      conta: estado.usuario,
      pedidos: estado.pedidos,
      carrinho: estado.carrinho,
      preferencias: { municipio: ler(KEYS.municipio, null), tema },
      consentimento: estado.consent
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "meus-dados-ixistudo.json" });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Download iniciado.");
  }

  let confirmaExclusao = 0;
  function resetarBotaoExcluir() {
    clearTimeout(confirmaExclusao);
    confirmaExclusao = 0;
    $("#btn-excluir-dados").textContent = "Excluir meus dados";
  }

  function excluirMeusDados() {
    // Primeiro clique pede confirmação; o segundo (em até 6 s) exclui.
    if (!confirmaExclusao) {
      $("#btn-excluir-dados").textContent = "Clique de novo para confirmar";
      confirmaExclusao = setTimeout(resetarBotaoExcluir, 6000);
      return;
    }
    resetarBotaoExcluir();
    try { Object.values(KEYS).forEach((k) => localStorage.removeItem(k)); } catch { /* ignora */ }
    estado.usuario = null;
    estado.pedidos = [];
    estado.carrinho = { lojaId: null, itens: [] };
    estado.municipio = "";
    estado.consent = null;
    estado.temaManual = false;
    $("#input-municipio").value = "";
    renderizarUsuario();
    renderizarCarrinho();
    renderizarHistoricoPedidos();
    mostrarBanner(true);
    fecharDialogo($("#data-modal"));
    toast("Seus dados foram excluídos deste navegador.");
    if (location.hash === "#/" || !location.hash) rotear(); else location.hash = "#/";
  }

  /* ======================================================================
     INICIALIZAÇÃO
     ====================================================================== */
  document.addEventListener("DOMContentLoaded", () => {
    $("#ano").textContent = new Date().getFullYear();

    // Delegação de eventos
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-skip]")) { // o link "pular" não pode alterar o hash das rotas
        e.preventDefault();
        return app().focus();
      }
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const acao = btn.dataset.action;
      const id = Number(btn.dataset.id);
      if (acao === "add") adicionar(id);
      else if (acao === "mais") alterarQtd(id, 1);
      else if (acao === "menos") alterarQtd(id, -1);
      else if (acao === "swap-confirm") confirmarTroca();
      else if (acao === "usar-localizacao") abrirDialogo($("#geo-modal"));
      else if (acao === "geo-confirmar") { fecharDialogo($("#geo-modal")); localizar(); }
      else if (acao === "abrir-cookies") abrirPreferenciasCookies();
      else if (acao === "consent-aceitar") aplicarConsentimento(true);
      else if (acao === "consent-recusar") aplicarConsentimento(false);
      else if (acao === "consent-salvar") aplicarConsentimento($("#consent-pref").checked);
      else if (acao === "abrir-meus-dados") abrirMeusDados();
      else if (acao === "dados-baixar") baixarMeusDados();
      else if (acao === "dados-excluir") excluirMeusDados();
      else if (acao === "focar-municipio") { window.scrollTo({ top: 0, behavior: "smooth" }); $("#input-municipio").focus(); }
    });

    // Imagem quebrada → mostra o emoji de fallback (o evento "error" não propaga, então usa captura)
    document.addEventListener("error", (e) => {
      if (e.target.tagName !== "IMG") return;
      e.target.closest(".card-media")?.classList.add("is-broken");
      if (e.target.closest(".cart-thumb")) e.target.hidden = true;
    }, true);

    document.addEventListener("input", (e) => {
      if (e.target.id !== "input-busca") return;
      estado.busca = e.target.value;
      renderizarCardapio();
    });

    renderizarCarrinho();
    renderizarUsuario();
    configurarAutocomplete();
    configurarDialogos();
    configurarAuth();
    configurarTema();
    mostrarBanner(!estado.consent);
    window.addEventListener("hashchange", rotear);
    rotear();
  });
})();
