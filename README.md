# Terra dos Cânions Online

Portal de turismo de **Cambará do Sul (RS)** com **venda de ingressos da Tirolesa Mais Alta das Américas**,
vitrine de parceiros e painel de gestão. Pensado para o fluxo **QR Code da placa → celular → Pix → ingresso**.

## O que já está pronto

| Área | O que faz |
|---|---|
| **Ingresso da Tirolesa** (produto do atrativo **Cânion Fortaleza**) | Escolha de data/horário com vagas em tempo real, participantes (nome, nascimento, peso), Pix e cartão, QR Code por ingresso, página do pedido que atualiza sozinha. |
| **Placas com QR** | Cada placa tem um link curto e estável `/q/<código>` (gera QR leve e fácil de ler). Conta leituras, aplica cupom automático e mostra no painel leituras → vendas → conversão por placa. Dá para trocar cupom/destino sem reimprimir. |
| **Descontos** | Cupons (% ou R$), desconto automático de grupo, cupom da placa, cupom de parceiro (atribui a venda ao parceiro). **A melhor oferta vence; nada acumula.** |
| **Parceiros** | Os 15 parceiros fundadores já cadastrados, com plano `fundador`, campo **"cortesia até"** (meses grátis) e login próprio criado por **convite de uso único** (o parceiro define a própria senha): ele edita a própria vitrine e produtos, troca a senha, segue um checklist "deixe sua página pronta" e vê só números agregados das vendas dele (nunca dados de clientes). |
| **Páginas de produtos** | Ao clicar num **parceiro** (`/parceiros/<slug>`) abre a página dele com os produtos/serviços (hospedagem, passeios, gastronomia…), filtros por tipo e botão "Pedir informações" no WhatsApp com a mensagem já pronta. Ao clicar num **atrativo** (`/atrativos/<slug>`) abre a página com destaques, dicas, produtos ligados a ele (a Tirolesa aparece no Serra Geral, com compra direta), guias/agências e os outros atrativos. `/produtos` reúne tudo num catálogo. Parceiros e admin cadastram os produtos no painel. |
| **Atrativos** | Aparados da Serra, Serra Geral, **Cânion Fortaleza** (onde está a Tirolesa), Tainhas, Cascata Velha / Ouro Verde, Costão do Cambará. A Tirolesa aparece como um produto entre os demais (catálogo, página do Cânion Fortaleza e busca); o portal não gira mais em torno dela. As placas com QR continuam podendo abrir direto a venda (`/tirolesa`). |
| **Experiência de app** | O site **reconhece o aparelho** ao abrir (celular, tablet ou computador): no celular aparece uma barra inferior estilo app; no computador, navegação superior e efeitos de mouse. Busca rápida (`Ctrl/⌘+K` ou `/`), favoritos (❤) guardados no aparelho, tema claro/escuro, compartilhar, contadores animados, horários da Tirolesa "ao vivo", confete ao confirmar o ingresso e **instalável como app (PWA)**. |
| **Operação** | Check-in por câmera/leitor de QR (bloqueia reuso, dia errado, QR falsificado), ocupação por horário, cancelamento com estorno, geração de horários em lote. |

## Rodando localmente

```bash
npm install
npm run seed                      # produto, 15 parceiros, horários/cupom/placa de demonstração
npm run create-admin -- voce@email.com "Seu Nome"   # pede a senha e mostra o QR do 2FA
npm run dev                       # http://localhost:3000  (pagamento SIMULADO)
npm test                          # 49 testes
npm run preview                   # gera dist/terra-dos-canions-preview.html: um arquivo só, abre com duplo clique (dados fictícios)
```

Em desenvolvimento o pagamento é simulado (botão "Simular pagamento aprovado" na página do pedido) e a chave-mestra
fica em `data/.dev-master-key`. Painel: `/admin`.

## Identidade visual e foto de fundo

- **Paleta "interior gaúcho"**: verde de araucária e erva-mate, linho/barro claro, **bordô de urucum** como destaque discreto e **dourado de pinhão**. As cores ficam em variáveis no topo de `public/css/site.css` (`--ember` = bordô, `--amber` = dourado, `--forest`, `--moss`…): trocar ali muda o site todo.
- **Faixa de heranças** (`public/img/patterns/`): grafismo indígena (Kaingang/Guarani), azulejo português, parreira italiana e enxaimel alemão. São padrões **inspirados** no universo geométrico desses povos, desenhados aqui; antes de usar símbolos ou textos específicos em campanhas, vale consultar representantes dos povos Kaingang e Guarani e a prefeitura.
- **Foto de fundo do topo**: coloque a foto em **`public/img/hero/canyon.jpg`** (paisagem, ao menos 1600 px de largura, JPEG de preferência abaixo de 400 KB). Quando o arquivo existe, ele substitui automaticamente a ilustração em todas as capas; sem o arquivo, a ilustração continua. Garanta o direito de uso da imagem e dê o crédito ao autor.

## Segurança (resumo — detalhes em [SECURITY.md](SECURITY.md))

- **Dados pessoais cifrados por campo** (AES-256-GCM, vinculados ao registro) + índice cego para busca por e-mail.
- **Painel da equipe com 2FA (TOTP)**, senhas scrypt, bloqueio por tentativas, sessão `HttpOnly`/`Secure`/`SameSite=Strict`, CSRF, expiração por ociosidade.
- **CSP estrita** (sem script/estilo inline), HSTS, anti-clickjacking, rate limit por rota, validação rigorosa (zod `strict`) e SQL sempre parametrizado.
- **Pagamentos**: webhook com assinatura + anti-replay; o servidor **sempre reconfirma o pagamento na API do provedor** e confere valor e referência. Cartão no checkout hospedado (nunca tocamos em dados de cartão).
- **Sem overselling**: reserva atômica de vagas, expiração automática, tratamento de pagamento tardio.
- **Ingressos infalsificáveis**: QR assinado (HMAC) + código aleatório de 50 bits; link do pedido sem estado e não adivinhável.
- **Auditoria encadeada por hash** (detecta adulteração) e **LGPD**: consentimento versionado, minimização, anonimização automática.

## Produção

1. `npm run gen-secrets` → `MASTER_KEY` (guarde backup em cofre **separado** do backup do banco).
2. Copie `.env.example` para `.env` e preencha (domínio `https://`, Mercado Pago, SMTP).
3. `docker build -t terra-canions . && docker run -d --env-file .env -p 127.0.0.1:3000:3000 -v canions-data:/app/data terra-canions`
4. Coloque atrás de um proxy HTTPS (Caddy/Nginx/Cloudflare) e mantenha `TRUST_PROXY=true`.
5. `docker exec -it <container> node scripts/seed.js` (em produção cria só a estrutura: produto **inativo** e preço 0) e `npm run create-admin`.
6. No painel: defina o **preço real**, gere os **horários**, ative as vendas.
7. Mercado Pago: aponte o webhook para `https://seu-dominio/api/webhooks/mercadopago` e **teste com credenciais `TEST-`** antes de ir ao ar.
8. Backup diário de `data/terra-dos-canions.db` (SQLite em modo WAL; use `sqlite3 .backup`).

## ⚠️ Antes de publicar — pendências que dependem de você

1. **Autorização do operador.** A tirolesa fica no Parque Nacional da Serra Geral (Cânion Fortaleza). Confirme formalmente quem opera e se você é revendedor/operador autorizado, **como as vagas são sincronizadas** (aqui o site controla a capacidade) e a política de cancelamento. Não consegui verificar isso.
2. **Dados da tirolesa** (`server/content/tirolesa.js`): extensão 720 m, ~750 m de altura, 6 cabos, 40–110 kg etc. vêm de matérias sobre a inauguração (2023). Confirme com o operador; **peso e preço são editáveis no painel**.
3. **Textos jurídicos** (`public/termos.html`, `public/privacidade.html` e o termo de responsabilidade em `tirolesa.js`) são **rascunhos**: preencha razão social/CNPJ/DPO e passe por advogado. Ao alterar o termo, mude `waiver_version`.
4. **Mercado Pago**: o adaptador segue a documentação pública, mas **não foi testado contra a API real** aqui (só com simulação). Valide Pix, cartão, webhook e estorno em modo teste.
5. **Perfis e produtos dos parceiros**: só nome/categoria foram cadastrados (não inventei telefone, endereço, descrição, produtos nem preços). No painel, em *Parceiros*, preencha o perfil e os produtos de cada um — ou crie o login do parceiro em *Usuários* para ele mesmo cadastrar. Os produtos de exemplo "(exemplo)" só existem no modo demonstração do `npm run seed`.
   **Cada parceiro preenche pelo próprio login**: veja [docs/convite-parceiros.md](docs/convite-parceiros.md) (convite por link de uso único, em lote com `npm run invite-partners`, mensagem pronta de WhatsApp e recuperação de senha).
6. **Fotos**: o site usa ilustração SVG (`public/img/canyon.svg`). Coloque fotos reais (com permissão) em `public/img/`.
7. **E-mail transacional**: configure `SMTP_URL`; sem isso o cliente depende de guardar o link do pedido.
8. **Foto do topo e textos da seção "Raízes"** (`public/index.html`): a foto ainda precisa ser colocada em `public/img/hero/canyon.jpg`; os textos sobre as heranças são genéricos e devem ser revisados com fontes locais.
9. **Informações dos parques** (horários, valores de entrada) foram deliberadamente omitidas: mudam e precisam ser confirmadas com ICMBio/SEMA/gestores.

## Estrutura

```
server/        API Fastify (app.js, routes/, services/, lib/, migrations/)
public/        Site e painel (HTML/CSS/JS sem build; CSP estrita; fontes Inter e Fraunces hospedadas aqui)
scripts/       seed, create-admin, invite-partners, gen-secrets, preview/ (gerador do arquivo de pré-visualização)
docs/          convite-parceiros.md (passo a passo e mensagem para os parceiros)
test/          49 testes (preços, criptografia, pedidos, segurança, catálogo de produtos, convites e senhas)
```

## Próximos passos sugeridos

Remarcação de ingressos por clima (hoje: cancelar + estorno), lista de espera, pacotes (tirolesa + hospedagem), cobrança dos planos dos parceiros após a cortesia, integração com a agenda do operador, PostgreSQL se o volume crescer.

_Fontes sobre a atração: [CNN Brasil](https://www.cnnbrasil.com.br/viagemegastronomia/viagem/tirolesa-mais-alta-das-americas-e-inaugurada-nos-canions-do-sul/), [Correio do Estado](https://correiodoestado.com.br/mix/tirolesa-mais-alta-das-americas-fica-a-mais-de-750-metros-do-chao-em-destino-encantador-do-brasil/), [SEMA-RS — Parque Estadual do Tainhas](https://www.sema.rs.gov.br/parque-estadual-do-tainhas)._
