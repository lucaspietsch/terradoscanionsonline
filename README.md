<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terra dos Cânions Online - Guia Completo de Turismo na Região</title>
    <meta name="description" content="Descubra a Terra dos Cânions com guias credenciados, hospedagem local, restaurantes e tudo que você precisa para uma experiência inesquecível na natureza.">
    <meta name="keywords" content="Terra dos Cânions, turismo, cânions, guias de turismo, hospedagem, trilhas, natureza, Cambará do Sul">
    <meta name="author" content="Terra dos Cânions Online">
    
    <!-- Open Graph -->
    <meta property="og:title" content="Terra dos Cânions Online - Guia Completo de Turismo">
    <meta property="og:description" content="Descubra a Terra dos Cânions com guias credenciados, hospedagem local e restaurantes.">
    <meta property="og:type" content="website">
    
    <style>
        /* Reset e variáveis */
        :root {
            --primary-color: #2c5530;
            --secondary-color: #4a7c59;
            --accent-color: #e0f7e9;
            --text-color: #333;
            --light-color: #f8f9fa;
            --dark-color: #1a3c23;
            --shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            --transition: all 0.3s ease;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html {
            scroll-behavior: smooth;
        }
        
        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--light-color);
            overflow-x: hidden;
        }
        
        /* Tipografia responsiva */
        h1 {
            font-size: clamp(1.8rem, 5vw, 2.5rem);
            line-height: 1.2;
        }
        
        h2 {
            font-size: clamp(1.5rem, 4vw, 2rem);
        }
        
        h3 {
            font-size: clamp(1.2rem, 3vw, 1.5rem);
        }
        
        p {
            font-size: clamp(1rem, 2.5vw, 1.1rem);
        }
        
        /* Layout */
        .container {
            width: 90%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1rem;
        }
        
        /* Header e Navegação */
        header {
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            padding: 1rem 0;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .header-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
        }
        
        .logo {
            text-align: center;
        }
        
        .logo h1 {
            background: linear-gradient(45deg, #ffffff, var(--accent-color));
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            text-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
            letter-spacing: 1px;
            position: relative;
            margin-bottom: 0.5rem;
        }
        
        .logo h1::after {
            content: "";
            position: absolute;
            bottom: -5px;
            left: 0;
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg, transparent, #ffffff, transparent);
        }
        
        nav ul {
            display: flex;
            list-style: none;
            gap: 1.5rem;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        nav a {
            color: white;
            text-decoration: none;
            font-weight: 500;
            transition: var(--transition);
            padding: 0.5rem;
            border-radius: 4px;
            white-space: nowrap;
        }
        
        nav a:hover,
        nav a:focus {
            background-color: rgba(255, 255, 255, 0.2);
            outline: none;
        }
        
        /* Hero Section */
        .hero {
            background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), 
                        url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80');
            background-size: cover;
            background-position: center;
            color: white;
            text-align: center;
            padding: 4rem 0;
            min-height: 60vh;
            display: flex;
            align-items: center;
        }
        
        .hero-card {
            background-color: rgba(255, 255, 255, 0.9);
            color: var(--text-color);
            padding: 2rem;
            border-radius: 8px;
            max-width: 700px;
            margin: 0 auto;
            box-shadow: var(--shadow);
        }
        
        .hero-card h2 {
            color: var(--primary-color);
            margin-bottom: 1rem;
            font-size: 1.8rem;
        }
        
        /* Seções */
        section {
            padding: 3rem 0;
        }
        
        .section-title {
            text-align: center;
            margin-bottom: 2rem;
            color: var(--primary-color);
            position: relative;
        }
        
        .section-title::after {
            content: "";
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 4px;
            background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
            border-radius: 2px;
        }
        
        /* Cards */
        .cards {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.5rem;
        }
        
        .card {
            background-color: white;
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: var(--shadow);
            transition: var(--transition);
            display: flex;
            flex-direction: column;
        }
        
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }
        
        .card h3 {
            color: var(--primary-color);
            margin-bottom: 0.8rem;
        }
        
        .card p {
            margin-bottom: 1rem;
            flex-grow: 1;
        }
        
        /* Botões */
        .btn {
            padding: 0.8rem 1.5rem;
            border: none;
            border-radius: 4px;
            font-size: 1rem;
            cursor: pointer;
            transition: var(--transition);
            font-weight: 500;
            text-align: center;
            display: inline-block;
            text-decoration: none;
        }
        
        .btn-primary {
            background-color: var(--primary-color);
            color: white;
        }
        
        .btn-primary:hover,
        .btn-primary:focus {
            background-color: var(--secondary-color);
        }
        
        .btn-secondary {
            background-color: transparent;
            color: var(--primary-color);
            border: 2px solid var(--primary-color);
        }
        
        .btn-secondary:hover,
        .btn-secondary:focus {
            background-color: var(--primary-color);
            color: white;
        }
        
        .btn-small {
            padding: 0.4rem 0.8rem;
            font-size: 0.85rem;
            white-space: nowrap;
        }
        
        /* Modal */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }
        
        .modal-content {
            background-color: white;
            border-radius: 8px;
            padding: 2rem;
            max-width: 700px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            position: relative;
        }
        
        .close-btn {
            position: absolute;
            top: 1rem;
            right: 1.5rem;
            font-size: 1.5rem;
            background: none;
            border: none;
            cursor: pointer;
            color: var(--text-color);
        }
        
        .modal-title {
            color: var(--primary-color);
            margin-bottom: 1.5rem;
            padding-right: 2rem;
        }
        
        .guide-list {
            list-style-type: none;
        }
        
        .guide-list li {
            padding: 0.8rem 0;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        
        .guide-list li:last-child {
            border-bottom: none;
        }
        
        .guide-info {
            flex: 1;
            min-width: 200px;
        }
        
        /* Formulário */
        .form {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: var(--shadow);
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: var(--primary-color);
        }
        
        input, textarea, select {
            width: 100%;
            padding: 0.8rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
            transition: var(--transition);
        }
        
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: var(--secondary-color);
            box-shadow: 0 0 0 2px rgba(74, 124, 89, 0.2);
        }
        
        textarea {
            min-height: 120px;
            resize: vertical;
        }
        
        .submit-row {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            align-items: center;
        }
        
        @media (min-width: 768px) {
            .submit-row {
                flex-direction: row;
                justify-content: space-between;
                align-items: center;
            }
        }
        
        .success-message {
            color: var(--secondary-color);
            font-style: italic;
        }
        
        /* Footer */
        footer {
            background-color: var(--dark-color);
            color: white;
            text-align: center;
            padding: 2rem 0;
            margin-top: 2rem;
        }
        
        /* Media Queries para responsividade */
        @media (min-width: 768px) {
            .header-content {
                flex-direction: row;
                justify-content: space-between;
            }
            
            .logo {
                text-align: left;
            }
            
            nav ul {
                justify-content: flex-end;
            }
            
            .hero {
                min-height: 70vh;
            }
        }
        
        @media (max-width: 480px) {
            .cards {
                grid-template-columns: 1fr;
            }
            
            .card {
                padding: 1rem;
            }
            
            .form {
                padding: 1.5rem;
            }
            
            section {
                padding: 2rem 0;
            }
            
            .modal-content {
                padding: 1.5rem;
            }
            
            .guide-list li {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .guide-info {
                margin-bottom: 0.5rem;
            }
        }
        
        /* Acessibilidade */
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }
        
        /* Animações simples */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .fade-in {
            animation: fadeIn 0.8s ease forwards;
        }
    </style>
</head>
<body>
    <header role="banner">
        <div class="container">
            <div class="header-content">
                <div class="logo">
                    <h1>Terra dos Cânions Online</h1>
                    <span class="sr-only">Portal completo de turismo na região dos cânions</span>
                </div>
                <nav role="navigation" aria-label="Menu principal">
                    <ul>
                        <li><a href="#inicio">Início</a></li>
                        <li><a href="#servicos">Serviços</a></li>
                        <li><a href="#contato">Contato</a></li>
                    </ul>
                </nav>
            </div>
        </div>
    </header>

    <main role="main">
        <section id="inicio" class="hero" aria-labelledby="hero-heading">
            <div class="container">
                <div class="hero-card fade-in">
                    <h2 id="hero-heading">Natureza, cultura e lazer</h2>
                    <p>Além de informações sobre Cambará do Sul você pode ter contato direto com guias, agências, hotéis, restaurantes e muito mais!</p>
                </div>
            </div>
        </section>

        <section id="servicos" aria-labelledby="servicos-heading">
            <div class="container">
                <h2 id="servicos-heading" class="section-title">Serviços disponíveis</h2>

                <div class="cards">
                    <article class="card fade-in">
                        <h3>Guias de Turismo</h3>
                        <p>Guias credenciados para acompanhá-lo nas trilhas e aventuras.</p>
                        <button class="btn btn-primary modal-btn" data-modal="guias-modal">Ver Guias</button>
                    </article>

                    <article class="card fade-in">
                        <h3>Agências Locais</h3>
                        <p>Agências de turismo especializadas na região dos cânions.</p>
                        <button class="btn btn-primary modal-btn" data-modal="agencias-modal">Ver Agências</button>
                    </article>

                    <article class="card fade-in">
                        <h3>Hospedagem</h3>
                        <p>Pousadas locais para uma estadia confortável e acolhedora.</p>
                        <button class="btn btn-primary modal-btn" data-modal="hospedagem-modal">Ver Opções</button>
                    </article>

                    <article class="card fade-in">
                        <h3>Gastronomia</h3>
                        <p>Restaurantes, lanchonetes e serviço de delivery.</p>
                        <button class="btn btn-primary modal-btn" data-modal="gastronomia-modal">Ver Opções</button>
                    </article>

                    <article class="card fade-in">
                        <h3>Parques e Áreas de Visitação</h3>
                        <p>Conheça os parques e áreas de visitação disponíveis.</p>
                        <button class="btn btn-primary modal-btn" data-modal="parques-modal">Ver Parques</button>
                    </article>

                    <article class="card fade-in">
                        <h3>Academias</h3>
                        <p>Opções para manter sua rotina de exercícios durante a viagem.</p>
                        <a href="#contato" class="btn btn-secondary">Entrar em Contato</a>
                    </article>

                    <article class="card fade-in">
                        <h3>Serviços Públicos</h3>
                        <p>Informações sobre serviços públicos da região.</p>
                        <a href="#contato" class="btn btn-secondary">Entrar em Contato</a>
                    </article>

                    <article class="card fade-in">
                        <h3>SOS</h3>
                        <p>Serviços de emergência e auxílio ao turista.</p>
                        <button class="btn btn-primary modal-btn" data-modal="sos-modal">Ver Serviços SOS</button>
                    </article>
                </div>
            </div>
        </section>

        <!-- Modal para Guias de Turismo -->
        <div id="guias-modal" class="modal">
            <div class="modal-content">
                <button class="close-btn">&times;</button>
                <h2 class="modal-title">Guias de Turismo Disponíveis</h2>
                <ul class="guide-list">
                    <li>
                        <div class="guide-info">
                            <strong>Lucas Pietsch</strong> - experiência com Ecoturismo desde 2013
                        </div>
                        <button class="btn btn-primary btn-small contact-guide" data-guide="Lucas Pietsch">Entrar em contato</button>
                    </li>
                    <li>
                        <div class="guide-info">
                            <strong>Ana Silva</strong> - guia especializada em trilhas e escalada
                        </div>
                        <button class="btn btn-primary btn-small contact-guide" data-guide="Ana Silva">Entrar em contato</button>
                    </li>
                    <li>
                        <div class="guide-info">
                            <strong>Carlos Mendes</strong> - conhecedor da flora e fauna local
                        </div>
                        <button class="btn btn-primary btn-small contact-guide" data-guide="Carlos Mendes">Entrar em contato</button>
                    </li>
                    <li>
                        <div class="guide-info">
                            <strong>Mariana Oliveira</strong> - guia para grupos familiares
                        </div>
                        <button class="btn btn-primary btn-small contact-guide" data-guide="Mariana Oliveira">Entrar em contato</button>
                    </li>
                    <li>
                        <div class="guide-info">
                            <strong>Roberto Santos</strong> - especialista em turismo de aventura
                        </div>
                        <button class="btn btn-primary btn-small contact-guide" data-guide="Roberto Santos">Entrar em contato</button>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Modal para Agências Locais -->
        <div id="agencias-modal" class="modal">
            <div class="modal-content">
                <button class="close-btn">&times;</button>
                <h2 class="modal-title">Agências Locais</h2>
                <ul class="guide-list">
                    <li>
                        <div class="guide-info">
                            <strong>Cânion Tur</strong> - pacotes completos para aventuras
                        </div>
                        <button class="btn btn-primary btn-small contact-agency" data-agency="Cânion Tur">Entrar em contato</button>
                    </li>
                    <li>
                        <div class="guide-info">
                            <strong>EcoSerra Viagens</strong> - turismo ecológico e sustentável
                        </div>
                        <button class="btn btn-primary btn-small contact-agency" data-agency="EcoSerra Viagens">Entrar em contato</button>
                    </li>
                    <li>
                        <div class="guide-info">
                            <strong>Aventura Gaúcha</strong> - experiências autênticas na região
                        </div>
                        <button class="btn btn-primary btn-small contact-agency" data-agency="Aventura Gaúcha">Entrar em contato</button>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Modal para Hospedagem -->
        <div id="hospedagem-modal" class="modal">
            <div class="modal-content">
                <button class="close-btn">&times;</button>
                <h2 class="modal-title">Opções de Hospedagem</h2>
                <ul class="guide-list">
                    <li>
                        <div class="guide-info">
                            <strong>Pousada Cânion Verde</strong> - vista privilegiada e café colonial
                        </div>
                        <button class="btn btn-primary btn-small contact-lodging" data-lodging="Pousada Cânion Verde">Entrar em contato</button>
                    </li>
                    <li>
                        <div class="guide-info">
                            <strong>Hotel Serra Azul</strong> - conforto no centro da cidade
                        </div>
                        <button class="btn btn-primary btn-small contact-lodging" data-lodging="Hotel Serra Azul">Entrar em contato</button>
                    </li>
                    <li>
                        <div class="guide-info">
                            <strong>Chalé das Araucárias</strong> - experiência rústica na natureza
                        </div>
                        <button class="btn btn-primary btn-small contact-lodging" data-lodging="Chalé das Araucárias">Entrar em contato</button>
                    </li>
                    <li>
                        <div class="guide-info">
                            <strong>Hostel Aventura</strong> - opção econômica para mochileiros
                        </div>
                        <button class="btn btn-primary btn-small contact-lodging" data-lodging="Hostel Aventura">Entrar em contato</button>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Modal para Gastronomia -->
        <div id="gastronomia-modal" class="modal">
            <div class="modal-content">
                <button class="close-btn">&times;</button>
                <h2 class="modal-title">Opções Gastronômicas</h2>
                <ul class="guide-list">
                    <li>
                        <div class="guide-info">
                            <strong>Restaurante Sabor Serrano</strong> - pratos típicos da região
                        </div>
                        <button class="btn btn-primary btn-small contact-gastronomy" data-gastronomy="Restaurante Sabor Serrano">Entrar em contato</button>
                    </li>
                    <li>
                        <div class="guide-info">
                            <strong>Café do Cânion</strong> - lanches rápidos e café colonial
                        </div>
                        <button class="btn btn-primary btn-small contact-gastronomy" data-gastronomy="Café do Cânion">Entrar em contato</button>
                    </li>
                    <li>
                        <div class="guide-info">
                            <strong>Pizzaria Montanha</strong> - pizzas artesanais e delivery
                        </div>
                        <button class="btn btn-primary btn-small contact-gastronomy" data-gastronomy="Pizzaria Montanha">Entrar em contato</button>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Modal para Parques -->
        <div id="parques-modal" class="modal">
            <div class="modal-content">
                <button class="close-btn">&times;</button>
                <h2 class="modal-title">Parques e Áreas de Visitação</h2>
                <ul class="guide-list">
                    <li>
                        <div class="guide-info">
                            <strong>Parque Nacional de Aparados da Serra</strong> - cânion Itaimbezinho
                        </div>
                        <button class="btn btn-primary btn-small contact-park" data-park="Parque Nacional de Aparados da Serra">Mais informações</button>
                    </li>
                    <li>
                        <div class="guide-info">
                            <strong>Parque Nacional da Serra Geral</strong> - cânion Fortaleza
                        </div>
                        <button class="btn btn-primary btn-small contact-park" data-park="Parque Nacional da Serra Geral">Mais informações</button>
                    </li>
                    <li>
                        <div class="guide-info">
                            <strong>Parque do Caracol</strong> - cascata e mirantes
                        </div>
                        <button class="btn btn-primary btn-small contact-park" data-park="Parque do Caracol">Mais informações</button>
                    </li>
                    <li>
                        <div class="guide-info">
                            <strong>Vale da Lageana</strong> - trilhas e cachoeiras
                        </div>
                        <button class="btn btn-primary btn-small contact-park" data-park="Vale da Lageana">Mais informações</button>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Modal para SOS -->
        <div id="sos-modal" class="modal">
            <div class="modal-content">
                <button class="close-btn">&times;</button>
                <h2 class="modal-title">Serviços de Emergência</h2>
                <ul class="guide-list">
                    <li>
                        <div class="guide-info">
                            <strong>Resgate Montanhismo</strong> - (54) 99988-7766
                        </div>
                        <a href="tel:54999887766" class="btn btn-primary btn-small">Ligar</a>
                    </li>
                    <li>
                        <div class="guide-info">
                            <strong>Hospital Regional</strong> - (54) 3251-1234
                        </div>
                        <a href="tel:5432511234" class="btn btn-primary btn-small">Ligar</a>
                    </li>
                    <li>
                        <div class="guide-info">
                            <strong>Polícia Turística</strong> - 190
                        </div>
                        <a href="tel:190" class="btn btn-primary btn-small">Ligar</a>
                    </li>
                    <li>
                        <div class="guide-info">
                            <strong>Bombeiros</strong> - 193
                        </div>
                        <a href="tel:193" class="btn btn-primary btn-small">Ligar</a>
                    </li>
                    <li>
                        <div class="guide-info">
                            <strong>Defesa Civil</strong> - 199
                        </div>
                        <a href="tel:199" class="btn btn-primary btn-small">Ligar</a>
                    </li>
                </ul>
            </div>
        </div>

        <section id="contato" aria-labelledby="contato-heading">
            <div class="container">
                <h2 id="contato-heading" class="section-title">Entre em contato</h2>
                <form class="form fade-in" action="#" method="post">
                    <div class="form-group">
                        <label for="nome">Nome</label>
                        <input type="text" id="nome" name="nome" placeholder="Seu nome completo" required>
                    </div>

                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" placeholder="seu@email.com" required>
                    </div>

                    <div class="form-group">
                        <label for="servico">Serviço de Interesse</label>
                        <select id="servico" name="servico" required>
                            <option value="">Selecione um serviço</option>
                            <option value="guias">Guias de Turismo</option>
                            <option value="agencias">Agências Locais</option>
                            <option value="hospedagem">Hospedagem</option>
                            <option value="gastronomia">Gastronomia</option>
                            <option value="parques">Parques e Áreas de Visitação</option>
                            <option value="academias">Academias</option>
                            <option value="servicos-publicos">Serviços Públicos</option>
                            <option value="sos">SOS</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="contato-especifico">Contato Específico (se aplicável)</label>
                        <input type="text" id="contato-especifico" name="contato-especifico" placeholder="Ex: Lucas Pietsch, Pousada Cânion Verde, etc.">
                    </div>

                    <div class="form-group">
                        <label for="mensagem">Mensagem</label>
                        <textarea id="mensagem" name="mensagem" placeholder="Como podemos ajudar?" required></textarea>
                    </div>

                    <div class="submit-row">
                        <button type="submit" class="btn btn-primary">Enviar</button>
                        <span class="success-message">Retornaremos o contato em breve.</span>
                    </div>
                </form>
            </div>
        </section>
    </main>

    <footer role="contentinfo">
        <div class="container">
            <p>&copy; 2023 Terra dos Cânions Online. Todos os direitos reservados.</p>
        </div>
    </footer>

    <script>
        // Funcionalidade dos modais
        document.addEventListener('DOMContentLoaded', function() {
            // Abrir modal
            const modalBtns = document.querySelectorAll('.modal-btn');
            const modals = document.querySelectorAll('.modal');
            const closeBtns = document.querySelectorAll('.close-btn');
            
            modalBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const modalId = this.getAttribute('data-modal');
                    document.getElementById(modalId).style.display = 'flex';
                });
            });
            
            // Fechar modal com botão X
            closeBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    this.closest('.modal').style.display = 'none';
                });
            });
            
            // Fechar modal clicando fora
            modals.forEach(modal => {
                modal.addEventListener('click', function(e) {
                    if (e.target === this) {
                        this.style.display = 'none';
                    }
                });
            });
            
            // Fechar modal com tecla ESC
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    modals.forEach(modal => {
                        modal.style.display = 'none';
                    });
                }
            });
            
            // Correção do link Início
            document.querySelector('a[href="#inicio"]').addEventListener('click', function(e) {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
            
            // Botões de contato individual
            document.querySelectorAll('.contact-guide').forEach(btn => {
                btn.addEventListener('click', function() {
                    const guideName = this.getAttribute('data-guide');
                    document.getElementById('servico').value = 'guias';
                    document.getElementById('contato-especifico').value = guideName;
                    document.querySelectorAll('.modal').forEach(modal => {
                        modal.style.display = 'none';
                    });
                    document.getElementById('contato').scrollIntoView({
                        behavior: 'smooth'
                    });
                });
            });
            
            document.querySelectorAll('.contact-agency').forEach(btn => {
                btn.addEventListener('click', function() {
                    const agencyName = this.getAttribute('data-agency');
                    document.getElementById('servico').value = 'agencias';
                    document.getElementById('contato-especifico').value = agencyName;
                    document.querySelectorAll('.modal').forEach(modal => {
                        modal.style.display = 'none';
                    });
                    document.getElementById('contato').scrollIntoView({
                        behavior: 'smooth'
                    });
                });
            });
            
            document.querySelectorAll('.contact-lodging').forEach(btn => {
                btn.addEventListener('click', function() {
                    const lodgingName = this.getAttribute('data-lodging');
                    document.getElementById('servico').value = 'hospedagem';
                    document.getElementById('contato-especifico').value = lodgingName;
                    document.querySelectorAll('.modal').forEach(modal => {
                        modal.style.display = 'none';
                    });
                    document.getElementById('contato').scrollIntoView({
                        behavior: 'smooth'
                    });
                });
            });
            
            document.querySelectorAll('.contact-gastronomy').forEach(btn => {
                btn.addEventListener('click', function() {
                    const gastronomyName = this.getAttribute('data-gastronomy');
                    document.getElementById('servico').value = 'gastronomia';
                    document.getElementById('contato-especifico').value = gastronomyName;
                    document.querySelectorAll('.modal').forEach(modal => {
                        modal.style.display = 'none';
                    });
                    document.getElementById('contato').scrollIntoView({
                        behavior: 'smooth'
                    });
                });
            });
            
            document.querySelectorAll('.contact-park').forEach(btn => {
                btn.addEventListener('click', function() {
                    const parkName = this.getAttribute('data-park');
                    document.getElementById('servico').value = 'parques';
                    document.getElementById('contato-especifico').value = parkName;
                    document.querySelectorAll('.modal').forEach(modal => {
                        modal.style.display = 'none';
                    });
                    document.getElementById('contato').scrollIntoView({
                        behavior: 'smooth'
                    });
                });
            });
            
            // Animações de entrada
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('fade-in');
                    }
                });
            }, observerOptions);
            
            document.querySelectorAll('.card, .form').forEach(el => {
                observer.observe(el);
            });
        });
    </script>
</body>
</html>
