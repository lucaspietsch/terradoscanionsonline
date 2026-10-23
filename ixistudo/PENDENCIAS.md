# iXisTudo — o que falta fazer

Projeto de longo prazo. Esta lista foi registrada em 23/10/2026, depois da
modernização do site (PR #4). Quando for retomar, comece por aqui.

## Estado atual (já feito)
- Site estático em HTML/CSS/JS puros (`index.html`, `styles.css`, `app.js`, `legal.js`, `municipios-rs.js`).
- 497 municípios do RS com autocomplete e botão "usar minha localização".
- Página de empreendimentos por município (mín. 3) e cardápio por empreendimento (3 a 5 lanches).
- 12 municípios do Oeste em "Em breve…" (lista `EM_BREVE` no `app.js`).
- Aviso de cookies, Política de Privacidade, Termos de Uso, painel "Meus dados" (baixar/excluir) e aceite no cadastro.

## 1. Antes de publicar (obrigatório)
- [ ] Preencher os dados da empresa no começo do `legal.js` (`EMPRESA`): razão social, CNPJ, endereço, encarregado (DPO) e e-mail de privacidade. Hoje aparecem como campos amarelos na página.
- [ ] Revisão jurídica da Política de Privacidade e dos Termos de Uso (feitos sem advogado).
- [ ] Trocar os empreendimentos gerados pelo código por cadastros reais. Os nomes, as notas e os tempos de entrega de hoje são fictícios. Remover as notas até existirem avaliações reais (risco de publicidade enganosa).
- [ ] Hospedar as fotos dos lanches no próprio site. Hoje vêm do Unsplash, o que expõe o IP do visitante a esse serviço (já citado na política). Usar fotos reais de cada empreendimento.
- [ ] Publicar em HTTPS e domínio próprio (a geolocalização do navegador exige HTTPS).

## 2. Backend e dados reais
- [ ] Login real: senha com hash, recuperação de senha, sessão segura. Hoje o login é só local e a senha não é usada.
- [ ] Enviar o pedido ao empreendimento escolhido. Hoje o pedido fica só no navegador.
- [ ] Quando os pedidos forem enviados: atualizar a Política (compartilhamento, retenção, prazos), pedir novo consentimento (aumentar `CONSENT_VERSAO` no `app.js`) e incluir o fluxo de exclusão/exportação no servidor.
- [ ] Status do pedido real (hoje é simulado pelo tempo).
- [ ] Pagamento (Pix, cartão) e o que isso exige na política.
- [ ] Plano de resposta a incidentes (art. 48 da LGPD) e prazo de 15 dias para atender pedidos de titulares.
- [ ] Cadastro de empreendimentos pelos donos (painel do lojista), com cardápio, preços e taxa de entrega próprios (hoje todos têm os mesmos preços e a taxa fixa de R$ 7,00).

## 3. Melhorias de produto
- [ ] Localização mais precisa perto de divisas: hoje usa o município com a sede mais próxima. Usar os limites (polígonos) dos municípios do IBGE.
- [ ] Confirmar a lista final de municípios do Oeste em "Em breve".
- [ ] Link para empreendimento inexistente cair na página do município (hoje cai no início).
- [ ] Conferir a licença do conjunto de coordenadas usado em `municipios-rs.js`, ou baixar direto da fonte do IBGE.
- [ ] Teste de acessibilidade com leitor de tela (NVDA/VoiceOver) e revisão de contraste.
- [ ] Testes automatizados no repositório (hoje os testes de navegador foram feitos só durante o desenvolvimento).

## 4. Organização
- [ ] Mover o projeto para um repositório próprio. Hoje está na pasta `ixistudo/` do repositório `terradoscanionsonline`, que é de outro projeto.
