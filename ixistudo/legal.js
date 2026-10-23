/* ==========================================================================
   Textos legais (LGPD — Lei nº 13.709/2018)
   --------------------------------------------------------------------------
   ATENÇÃO: preencha os dados da empresa abaixo antes de publicar o site e
   peça a revisão de um(a) advogado(a). Valores entre colchetes aparecem
   destacados na página para não passarem despercebidos.
   ========================================================================== */
const EMPRESA = {
  razaoSocial: "[RAZÃO SOCIAL DA EMPRESA]",
  nomeFantasia: "iXisTudo",
  cnpj: "[CNPJ DA EMPRESA]",
  endereco: "[ENDEREÇO COMPLETO DA EMPRESA]",
  encarregado: "[NOME DO ENCARREGADO PELO TRATAMENTO DE DADOS (DPO)]",
  emailPrivacidade: "[E-MAIL DE PRIVACIDADE, ex.: privacidade@seudominio.com.br]"
};

const LEGAL_VERSAO = "1.0";
const LEGAL_DATA = "23/10/2026";

// Chaves guardadas no navegador, usadas na tabela da política e no painel "Meus dados".
const ARMAZENAMENTO_LOCAL = [
  { chave: "ixistudo:consentimento", categoria: "Necessário", finalidade: "Registrar a sua escolha sobre cookies e armazenamento local (prova do consentimento).", duracao: "Até você revogar ou excluir seus dados" },
  { chave: "ixistudo:carrinho:v2", categoria: "Necessário", finalidade: "Manter os itens do carrinho ao recarregar a página.", duracao: "Até o pedido ser finalizado ou você excluir seus dados" },
  { chave: "usuario_ixistudo", categoria: "Necessário", finalidade: "Manter você identificado(a) depois de entrar (nome, e-mail e telefone).", duracao: "Até você sair da conta ou excluir seus dados" },
  { chave: "pedidos_ixistudo", categoria: "Necessário", finalidade: "Guardar o histórico e o andamento dos seus pedidos.", duracao: "Até você excluir seus dados" },
  { chave: "ixistudo:tema", categoria: "Preferências", finalidade: "Lembrar o tema claro ou escuro.", duracao: "Até você revogar o consentimento ou excluir seus dados" },
  { chave: "ixistudo:municipio", categoria: "Preferências", finalidade: "Lembrar o município escolhido na próxima visita.", duracao: "Até você revogar o consentimento ou excluir seus dados" }
];

const LEGAL = (() => {
  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
  // Valores ainda não preenchidos (entre colchetes) ganham destaque.
  const v = (s) => (/^\[.*\]$/.test(s) ? `<mark class="placeholder">${esc(s)}</mark>` : esc(s));

  const cabecalho = (titulo) => `
    <nav class="crumb" aria-label="Navegação"><a href="#/">← Início</a></nav>
    <h1 class="page-title">${titulo}</h1>
    <p class="muted legal-meta">Versão ${LEGAL_VERSAO} · em vigor desde ${LEGAL_DATA}</p>`;

  function privacidade() {
    const linhasArmazenamento = ARMAZENAMENTO_LOCAL.map((a) => `
      <tr><td data-label="Chave"><code>${esc(a.chave)}</code></td><td data-label="Categoria">${esc(a.categoria)}</td>
      <td data-label="Para que serve">${esc(a.finalidade)}</td><td data-label="Duração">${esc(a.duracao)}</td></tr>`).join("");

    return `
    <article class="legal">
      ${cabecalho("Política de Privacidade")}

      <p>Esta Política explica, de forma simples, como o <strong>${esc(EMPRESA.nomeFantasia)}</strong> trata os seus dados pessoais, em
      conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).</p>

      <h2>1. Quem é o responsável pelos seus dados</h2>
      <p>O controlador dos dados pessoais é:</p>
      <ul>
        <li><strong>Razão social:</strong> ${v(EMPRESA.razaoSocial)}</li>
        <li><strong>Nome fantasia:</strong> ${esc(EMPRESA.nomeFantasia)}</li>
        <li><strong>CNPJ:</strong> ${v(EMPRESA.cnpj)}</li>
        <li><strong>Endereço:</strong> ${v(EMPRESA.endereco)}</li>
        <li><strong>Encarregado(a) pelo tratamento de dados (DPO):</strong> ${v(EMPRESA.encarregado)}</li>
        <li><strong>Contato de privacidade:</strong> ${v(EMPRESA.emailPrivacidade)}</li>
      </ul>

      <h2>2. Quais dados tratamos, para quê e com que base legal</h2>
      <div class="table-wrap">
        <table class="legal-table">
          <thead><tr><th>Dado</th><th>Quando</th><th>Finalidade</th><th>Base legal (art. 7º)</th></tr></thead>
          <tbody>
            <tr><td data-label="Dado">Nome e e-mail</td><td data-label="Quando">Cadastro ou login</td><td data-label="Finalidade">Identificar você, exibir seu nome e permitir fazer pedidos.</td><td data-label="Base legal">Execução de contrato (V)</td></tr>
            <tr><td data-label="Dado">Telefone / WhatsApp</td><td data-label="Quando">Cadastro</td><td data-label="Finalidade">Permitir contato sobre a entrega do seu pedido.</td><td data-label="Base legal">Execução de contrato (V)</td></tr>
            <tr><td data-label="Dado">Pedidos (itens, valor, empreendimento, município, data e hora)</td><td data-label="Quando">Ao finalizar um pedido</td><td data-label="Finalidade">Montar o histórico e mostrar o andamento do pedido.</td><td data-label="Base legal">Execução de contrato (V)</td></tr>
            <tr><td data-label="Dado">Itens do carrinho</td><td data-label="Quando">Ao adicionar itens</td><td data-label="Finalidade">Não perder o carrinho ao recarregar a página.</td><td data-label="Base legal">Execução de contrato — medidas preliminares (V)</td></tr>
            <tr><td data-label="Dado">Município escolhido e tema (claro/escuro)</td><td data-label="Quando">Ao escolher</td><td data-label="Finalidade">Lembrar suas preferências na próxima visita.</td><td data-label="Base legal">Consentimento (I)</td></tr>
            <tr><td data-label="Dado">Localização aproximada (opcional)</td><td data-label="Quando">Somente se você clicar em “usar minha localização” e permitir</td><td data-label="Finalidade">Descobrir o município mais próximo de você. O cálculo é feito no seu próprio navegador; as coordenadas <strong>não são enviadas, nem guardadas</strong>.</td><td data-label="Base legal">Consentimento (I), pedido a cada uso</td></tr>
            <tr><td data-label="Dado">Registro da sua escolha sobre cookies</td><td data-label="Quando">Ao responder o aviso de cookies</td><td data-label="Finalidade">Comprovar o consentimento e respeitar a sua escolha.</td><td data-label="Base legal">Obrigação legal e exercício regular de direitos (II e VI; art. 8º, §2º)</td></tr>
            <tr><td data-label="Dado">Endereço IP e dados técnicos do navegador</td><td data-label="Quando">Ao carregar o site e as imagens</td><td data-label="Finalidade">Entregar o conteúdo e manter o site seguro.</td><td data-label="Base legal">Legítimo interesse (IX)</td></tr>
          </tbody>
        </table>
      </div>
      <p><strong>Senha:</strong> a senha digitada no login e no cadastro não é armazenada nem enviada a ninguém nesta versão do site.</p>
      <p><strong>Não tratamos</strong> dados pessoais sensíveis (art. 5º, II), não vendemos seus dados, não criamos perfis de consumo e não tomamos decisões automatizadas sobre você.</p>

      <h2>3. Onde os dados ficam e por quanto tempo</h2>
      <p>Nesta versão do site, os dados dos itens acima ficam armazenados <strong>no seu próprio navegador</strong> (armazenamento local) e permanecem até que você
      os exclua pelo painel <button type="button" class="link-inline" data-action="abrir-meus-dados">Meus dados</button>, saia da conta ou limpe os dados do navegador. Os dados técnicos (IP) ficam nos
      registros de acesso do provedor de hospedagem, pelo prazo que ele mantiver.</p>

      <h2>4. Compartilhamento</h2>
      <ul>
        <li>Nesta versão, os pedidos <strong>não são transmitidos</strong> aos empreendimentos. Quando isso passar a acontecer, vamos compartilhar apenas o necessário para preparar e entregar
        o pedido (nome, telefone, itens e município), atualizar esta Política e avisar você.</li>
        <li><strong>Imagens de terceiros:</strong> as fotos dos lanches são carregadas do serviço Unsplash (<code>images.unsplash.com</code>). Ao carregá-las, o seu navegador envia
        ao serviço o endereço IP e dados técnicos, o que pode envolver servidores fora do Brasil (transferência internacional, art. 33 da LGPD).</li>
        <li>Podemos compartilhar dados com autoridades quando houver obrigação legal ou ordem judicial.</li>
      </ul>

      <h2>5. Cookies e armazenamento local</h2>
      <p>Este site <strong>não usa cookies de publicidade, de análise ou de rastreamento</strong>. Ele usa o armazenamento local do navegador (<em>localStorage</em>), tecnologia
      semelhante a cookies, divididas em duas categorias:</p>
      <ul>
        <li><strong>Necessários:</strong> sem eles o carrinho, o login e o histórico de pedidos não funcionam. Não dependem de consentimento, mas informamos você aqui.</li>
        <li><strong>Preferências:</strong> lembram o tema e o município. Só são gravados <strong>se você permitir</strong>.</li>
      </ul>
      <div class="table-wrap">
        <table class="legal-table">
          <thead><tr><th>Chave</th><th>Categoria</th><th>Para que serve</th><th>Duração</th></tr></thead>
          <tbody>${linhasArmazenamento}</tbody>
        </table>
      </div>
      <p>Você pode mudar de ideia a qualquer momento em <button type="button" class="link-inline" data-action="abrir-cookies">Gerenciar cookies</button>. Se um dia incluirmos
      cookies de análise ou publicidade, vamos pedir o seu consentimento antes.</p>

      <h2>6. Seus direitos (art. 18 da LGPD)</h2>
      <p>Você pode, a qualquer momento e gratuitamente:</p>
      <ul>
        <li>confirmar que tratamos seus dados e ter acesso a eles;</li>
        <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
        <li>pedir anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;</li>
        <li>pedir a portabilidade dos seus dados;</li>
        <li>pedir a eliminação dos dados tratados com base no seu consentimento;</li>
        <li>saber com quem compartilhamos seus dados;</li>
        <li>ser informado(a) sobre a possibilidade de não consentir e as consequências da recusa;</li>
        <li>revogar o consentimento;</li>
        <li>se opor a tratamento feito sem consentimento, em caso de descumprimento da lei;</li>
        <li>pedir a revisão de decisões automatizadas (não fazemos esse tipo de decisão).</li>
      </ul>
      <p><strong>Como exercer:</strong> use o painel <button type="button" class="link-inline" data-action="abrir-meus-dados">Meus dados</button> para baixar ou excluir
      o que está guardado no seu navegador, ou escreva para ${v(EMPRESA.emailPrivacidade)}. Respondemos em até 15 dias. Você também pode reclamar à
      Autoridade Nacional de Proteção de Dados (ANPD) em <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer">gov.br/anpd</a>.</p>

      <h2>7. Segurança</h2>
      <p>Adotamos medidas técnicas razoáveis para proteger os dados, como não armazenar senhas e limitar a coleta ao necessário (princípio da minimização). Nenhum sistema é
      100% seguro; se houver incidente que possa causar risco ou dano relevante, comunicaremos você e a ANPD, nos termos do art. 48 da LGPD.</p>

      <h2>8. Crianças e adolescentes</h2>
      <p>O site é destinado a maiores de 18 anos. Menores de idade só devem usá-lo com o consentimento específico de pelo menos um dos pais ou do responsável legal (art. 14 da LGPD).</p>

      <h2>9. Alterações desta Política</h2>
      <p>Podemos atualizar esta Política. A data e a versão ficam no topo da página e, se a mudança for relevante, pediremos novamente a sua escolha sobre cookies.</p>

      <h2>10. Fale com a gente</h2>
      <p>Dúvidas sobre privacidade: ${v(EMPRESA.emailPrivacidade)} — Encarregado(a): ${v(EMPRESA.encarregado)}.</p>
    </article>`;
  }

  function termos() {
    return `
    <article class="legal">
      ${cabecalho("Termos de Uso")}

      <h2>1. Aceitação</h2>
      <p>Ao criar uma conta ou fazer um pedido no <strong>${esc(EMPRESA.nomeFantasia)}</strong>, você declara ter lido e concordado com estes Termos e com a
      <a href="#/privacidade">Política de Privacidade</a>.</p>

      <h2>2. O que o ${esc(EMPRESA.nomeFantasia)} faz</h2>
      <p>Apresentamos empreendimentos de xis e seus cardápios por município do Rio Grande do Sul, para que você monte e acompanhe seus pedidos.</p>

      <h2>3. Cadastro</h2>
      <ul>
        <li>Informe dados verdadeiros e mantenha-os atualizados.</li>
        <li>Você é responsável pelo uso da sua conta neste aparelho.</li>
        <li>O uso é destinado a maiores de 18 anos.</li>
      </ul>

      <h2>4. Pedidos e preços</h2>
      <ul>
        <li>Preços, taxa de entrega e tempos estimados são informados na tela antes de você finalizar o pedido.</li>
        <li>As fotos são ilustrativas e podem diferir do produto entregue.</li>
        <li>O tempo de entrega é uma estimativa e pode variar.</li>
      </ul>

      <h2>5. Uso adequado</h2>
      <p>É proibido usar o site para fraudes, para tentar acessar dados de outras pessoas ou para prejudicar o funcionamento do serviço.</p>

      <h2>6. Seus dados</h2>
      <p>O tratamento dos seus dados pessoais é explicado na <a href="#/privacidade">Política de Privacidade</a>, onde você também encontra como exercer seus direitos.</p>

      <h2>7. Lei aplicável</h2>
      <p>Estes Termos são regidos pelas leis do Brasil, em especial o Código de Defesa do Consumidor e a LGPD. Fica eleito o foro do domicílio do consumidor.</p>

      <h2>8. Contato</h2>
      <p>Empresa: ${v(EMPRESA.razaoSocial)} — CNPJ ${v(EMPRESA.cnpj)} — ${v(EMPRESA.endereco)}.</p>
    </article>`;
  }

  return { privacidade, termos };
})();
