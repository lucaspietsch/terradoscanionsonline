# Cambará Ornamentais — e-commerce

Loja virtual de **vasos de cimento feitos à mão**. Next.js 15 (App Router) + TypeScript, Tailwind + shadcn/ui, Supabase (Auth, Storage, PostgreSQL) com Prisma, Mercado Pago (Pix, cartão até 3x sem juros e boleto), Melhor Envio (frete) e Resend (e-mails).

> **Modo demonstração:** sem `DATABASE_URL` o site sobe com o catálogo estático (os 10 vasos), cálculo de frete por tabela, carrinho e telas de checkout — mas pedidos, pagamento, login e painel admin ficam desativados. Dá para navegar e avaliar o visual antes de configurar qualquer serviço.

## Sumário

1. [Rodando localmente](#1-rodando-localmente)
2. [Supabase](#2-supabase)
3. [Banco de dados, seed e usuário admin](#3-banco-de-dados-seed-e-usuário-admin)
4. [Mercado Pago (sandbox e produção)](#4-mercado-pago-sandbox-e-produção)
5. [Melhor Envio (frete)](#5-melhor-envio-frete)
6. [Resend, Analytics e demais variáveis](#6-resend-analytics-e-demais-variáveis)
7. [Deploy na Vercel](#7-deploy-na-vercel)
8. [Regras de negócio](#8-regras-de-negócio)
9. [Testes](#9-testes)
10. [Trocando fotos e dados provisórios](#10-trocando-fotos-e-dados-provisórios)
11. [Estrutura do projeto](#11-estrutura-do-projeto)
12. [Segurança e limitações conhecidas](#12-segurança-e-limitações-conhecidas)

---

## 1. Rodando localmente

Requisitos: **Node 20.12+** e npm.

```bash
npm install
cp .env.example .env.local      # preencha aos poucos — tudo é opcional para o modo demonstração
npm run dev                     # http://localhost:3000
```

Scripts úteis:

| Comando | O que faz |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Testes (regra de frete, totais, webhook; integração com banco opcional) |
| `npm run db:push` | Cria/atualiza as tabelas a partir do `prisma/schema.prisma` |
| `npm run db:migrate` / `db:deploy` | Migrations versionadas (dev / produção) |
| `npm run db:seed` | Cria categorias, acabamentos, os 10 produtos, estoque e configurações padrão |
| `npm run admin:create` | Cria o usuário administrador inicial |
| `npm run assets:placeholders` | Regenera as imagens provisórias em `public/images` |
| `npm run assets:brand` | Regenera favicon, ícone do app e imagem Open Graph (1200×630) |

## 2. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (região **São Paulo**, de preferência).
2. **Settings → API:** copie `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`, `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (**segredo**, só servidor).
3. **Settings → Database → Connection string:**
   - `DATABASE_URL` = *Transaction pooler* (porta 6543, com `?pgbouncer=true&connection_limit=1`) — usado pelo app.
   - `DIRECT_URL` = conexão direta/session (porta 5432) — usada por `prisma db push/migrate`.
4. **Authentication → Providers:** mantenha *Email* ligado. Para login com Google, ative *Google* e cadastre o Client ID/Secret do Google Cloud (URI de redirecionamento: `https://SEU-PROJETO.supabase.co/auth/v1/callback`).
5. **Authentication → URL Configuration:** *Site URL* = sua URL pública; em *Redirect URLs* adicione `https://seudominio.com.br/auth/callback` e `http://localhost:3000/auth/callback`.
6. **Row Level Security + Storage:** depois do passo 3 (tabelas criadas), cole o conteúdo de [`prisma/rls.sql`](prisma/rls.sql) no *SQL Editor* e execute. Ele liga RLS em todas as tabelas (por padrão nada é exposto via API pública), libera leitura do catálogo e dos dados do próprio usuário, e cria o bucket público `products` para as fotos.

> O Prisma conecta como `postgres` (ignora RLS); as políticas protegem o acesso direto pela chave `anon`. Toda escrita sensível passa pelo servidor.

## 3. Banco de dados, seed e usuário admin

```bash
npm run db:push        # ou: npm run db:migrate -- --name init  (para versionar migrations)
npm run db:seed        # 10 produtos, 4 acabamentos, 4 categorias, estoque inicial
```

Crie o administrador (usa a service role; defina `ADMIN_EMAIL`/`ADMIN_PASSWORD` no `.env.local` ou passe como argumentos):

```bash
npm run admin:create -- voce@seudominio.com.br 'uma-senha-forte-com-12+'
```

O script cria o usuário no Supabase Auth com `app_metadata.role = "admin"` (lida pelo middleware) e grava `User.role = ADMIN` no banco (conferido de novo em cada rota `/api/admin/*`). Depois entre em `/entrar` e acesse **`/admin`**.

O seed **não sobrescreve** o estoque já ajustado pelo admin ao rodar de novo.

## 4. Mercado Pago (sandbox e produção)

Integração **Checkout Transparente** (sem redirecionar o cliente). O cartão é tokenizado no navegador pelo SDK do Mercado Pago — o número **nunca passa pelo nosso servidor**.

### Sandbox (testes)

1. Em [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers) crie uma aplicação (produto: *Checkout API / Pagamentos online*).
2. Em **Credenciais de teste**, copie `Access Token` (`TEST-...`) → `MERCADOPAGO_ACCESS_TOKEN` e `Public Key` → `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`.
3. **Webhooks:** em *Suas integrações → Webhooks → Modo de teste*, configure a URL `https://SEU-DOMINIO/api/webhooks/mercadopago` com o evento **Pagamentos**. Copie a **chave secreta** para `MERCADOPAGO_WEBHOOK_SECRET`.
   - Em desenvolvimento local use um túnel (ex.: `ngrok http 3000`) e defina `NEXT_PUBLIC_APP_URL` com a URL do túnel — o `notification_url` de cada pagamento usa esse valor.
4. Cartões de teste: <https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards> (use o titular `APRO` para aprovar, `OTHE` para recusar e CPF de teste `12345678909`).
5. Para Pix e boleto no sandbox, use um *comprador de teste* e o simulador do painel.

### Produção

1. Ative as **credenciais de produção** (exige conta verificada) e troque `MERCADOPAGO_ACCESS_TOKEN` (`APP_USR-...`) e `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`.
2. Repita o cadastro do webhook em *Modo de produção* e atualize `MERCADOPAGO_WEBHOOK_SECRET`.
3. **Parcelamento sem juros (até 3x):** o site limita a 3 parcelas, mas **quem decide quem paga os juros é a configuração da sua conta** — em *Seu negócio → Custos → Oferecer parcelamento sem juros* ative até 3x (a loja absorve a taxa). Sem isso, o cliente é cobrado com juros mesmo o site anunciando "sem juros".
4. Pix expira em 30 min; boleto em 3 dias (ajustável em `lib/server/mercadopago.ts`).

### Como o webhook funciona

`POST /api/webhooks/mercadopago` → valida a assinatura `x-signature` (HMAC-SHA256 com a chave secreta) → **não confia no corpo**: busca o pagamento na API do MP → confere o valor → aplica o status de forma **idempotente** (tabela `PaymentEvent`, uma linha por pagamento+status). Aprovado: pedido vira *Pago*, estoque é baixado (uma única vez) e o cliente recebe e-mail.

## 5. Melhor Envio (frete)

1. Crie conta em [melhorenvio.com.br](https://melhorenvio.com.br) (sandbox: [sandbox.melhorenvio.com.br](https://sandbox.melhorenvio.com.br)).
2. *Configurações → Tokens de acesso* → gere um token com permissão `shipping-calculate` → `MELHOR_ENVIO_TOKEN`. Use `MELHOR_ENVIO_ENV=sandbox` ou `production`.
3. Defina o **CEP de origem** (`ORIGIN_CEP` ou no admin → Configurações) e, se quiser, os serviços em `MELHOR_ENVIO_SERVICES` (padrão `1,2,3,4` = PAC, SEDEX, Jadlog .Package, Jadlog .Com).

Cálculo: peso e dimensões dos itens são somados numa única caixa (**+10% no peso** para embalagem reforçada; peças empilhadas na altura). **Sem token, ou se a API falhar/demorar (7 s), cai automaticamente na tabela fixa por região** (`lib/shipping.ts`: PAC e SEDEX por faixa de CEP × peso). Ajuste os valores da tabela ao seu contrato real.

## 6. Resend, Analytics e demais variáveis

- **Resend:** crie a API key, verifique seu domínio e defina `RESEND_API_KEY` e `EMAIL_FROM`. Sem a chave, os e-mails são apenas registrados no log (não quebram o checkout). Enviados: pedido recebido, pagamento aprovado e pedido enviado (com rastreio).
- **GA4 / Meta Pixel:** `NEXT_PUBLIC_GA4_ID` e `NEXT_PUBLIC_META_PIXEL_ID`. Só carregam **depois** do consentimento no banner de cookies (LGPD). Eventos: `view_item`, `add_to_cart`, `begin_checkout`, `purchase`.
- **Dados da loja** (WhatsApp, Instagram, CNPJ, e-mail, endereço de retirada, mapa): variáveis `NEXT_PUBLIC_*` no `.env.example`. WhatsApp, Instagram, CEP de origem, e-mail e a faixa de anúncio também podem ser mudados no **admin → Configurações**, sem novo deploy.
- **Upstash (opcional):** habilita rate limiting compartilhado entre as instâncias serverless.

Todas as variáveis estão documentadas em [`.env.example`](.env.example).

## 7. Deploy na Vercel

1. Suba o repositório no GitHub e importe em [vercel.com/new](https://vercel.com/new) (framework: Next.js; o *build command* padrão `npm run build` já roda `prisma generate`).
2. Cadastre **todas** as variáveis do `.env.example` em *Settings → Environment Variables* (marque `NEXT_PUBLIC_APP_URL` com a URL final, `https://...`).
3. Rode `db:push`/`db:migrate` e `db:seed` apontando para o banco de produção (da sua máquina, com o `.env` de produção) e crie o admin (`npm run admin:create`).
4. Cadastre o domínio e atualize: **Supabase** (Site URL e Redirect URLs), **Mercado Pago** (webhook de produção) e **Resend** (domínio).
5. Faça um pedido de teste real de baixo valor (Pix) e confirme: webhook chegou, pedido virou *Pago*, estoque baixou, e-mail enviado.

Notas:
- Páginas de produto usam **ISR** (`revalidate = 1h`); salvar produto/configuração no admin chama `revalidatePath` e atualiza a vitrine na hora.
- O CSP em `next.config.mjs` já libera Mercado Pago, Supabase, ViaCEP, GA4 e Meta; se usar outro serviço de terceiros, inclua-o lá.

## 8. Regras de negócio

- **Todos os valores são inteiros em centavos** (`3500` = R$ 35,00). `formatBRL()` só na exibição.
- **Frete grátis: `subtotal > R$ 160,00`** (estrito — exatamente R$ 160,00 **não** ganha). Limite configurável no admin (`free_shipping_threshold`, em centavos; padrão `16000`). O subtotal considerado é o dos **produtos antes de cupom**.
  - Acima do limite, a opção de transportadora **mais barata** vira "Grátis"; as demais mostram o valor normal. "Retirar no local" é sempre R$ 0.
  - A barra *"Faltam R$ XX,XX para você ganhar frete grátis"* mostra o mínimo necessário para **passar** do limite (com subtotal = R$ 160,00 faltam R$ 0,01).
- **Nada vindo do navegador é confiável:** o carrinho envia só `productId`, `finishId` e quantidade. `/api/checkout` recalcula no servidor preço, estoque, frete (nova cotação; a opção escolhida precisa existir na cotação), cupom e total — e só então cria o pedido e o pagamento.
- **Estoque:** validado no checkout e **baixado quando o pagamento é aprovado** (webhook), com `GREATEST(estoque - n, 0)` para não ficar negativo. Cancelamento pelo admin devolve o estoque.
- **Cupons:** % ou valor fixo, validade, uso máximo, subtotal mínimo. O uso é contado ao criar o pedido (com incremento condicional contra corrida) e devolvido se o pagamento falhar/for recusado.
- **Pedido:** número sequencial legível (`CB-0001`). Convidados acompanham pelo link com `token` secreto (enviado por e-mail); usuários logados veem em `/conta`.
- **Status:** Aguardando pagamento → Pago → Em produção → Enviado → Entregue / Cancelado. "Enviado" exige código de rastreio (retirada no local dispensa) e dispara e-mail.

## 9. Testes

```bash
npm test
```

- `tests/shipping.test.ts` — frete grátis **abaixo de 160, exatamente 160 e acima de 160**, opção mais barata, retirada, limite configurável, barra de progresso, pacote (+10%) e tabela por região.
- `tests/totals.test.ts` — subtotal/frete/desconto/total, cupons, formatação em BRL e numeração.
- `tests/webhook-signature.test.ts` — validação do `x-signature` do Mercado Pago.
- `tests/orders.integration.test.ts` — fluxo completo contra PostgreSQL real (checkout, recálculo no servidor, estoque, cupons, falha do MP, webhook idempotente, admin). **Só roda** com `TEST_DATABASE_URL` (um banco descartável, já com `db push` + `db:seed`); o Mercado Pago e o Resend são simulados:

```bash
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cambara_test npm test
```

## 10. Trocando fotos e dados provisórios

- **Imagens provisórias:** `public/images/**` são ilustrações geradas por script (`npm run assets:placeholders`) só para o site não ficar vazio. Troque por fotos reais de duas formas: (a) substitua os arquivos mantendo o mesmo nome (`products/<slug>-1..4.webp` = vazio, com planta, em ambiente, com régua); ou (b) **admin → Produtos → editar → Enviar fotos** (vão para o Supabase Storage). Escreva um `alt` descritivo para cada foto.
- **Depoimentos:** a seção começa **vazia** e some da home até você cadastrar depoimentos reais (admin → Configurações).
- **Textos legais** (privacidade, termos, trocas) são um ponto de partida — revise com seu contador/advogado.
- Marcadores do briefing que viram variáveis: CEP de origem (`ORIGIN_CEP`), endereço de retirada, Instagram, WhatsApp e CNPJ.

## 11. Estrutura do projeto

```
app/
  (loja)/            vitrine: home, /vasos, /vasos/[slug], /carrinho, /checkout, /pedido/[n], /conta, institucionais
  admin/             painel (dashboard, produtos, pedidos, cupons, configurações)
  api/               rotas: products, shipping/quote, coupon, checkout, webhooks/mercadopago, newsletter, contact, cart, wishlist, account, admin/*
  auth/callback/     retorno do login (e-mail/OAuth)
components/          ui/ (shadcn customizado), brand/, layout/, home/, shop/, checkout/, admin/, account/
lib/
  shipping.ts        regras PURAS de frete (grátis, pacote, tabela por região)
  totals.ts          cupons, totais, numeração de pedido
  money.ts           centavos ⇄ BRL
  server/            pedidos, Mercado Pago, Melhor Envio, cotação, e-mail, auth, rate limit  (server-only)
  data/              acesso a dados (Prisma ou catálogo estático no modo demonstração)
  catalog/seed-data  os 10 produtos — fonte única do seed e do modo demonstração
prisma/              schema.prisma, seed.ts, rls.sql
scripts/             create-admin, geradores de imagens/ícones
tests/               vitest
types/               DTOs compartilhados
middleware.ts        sessão Supabase + proteção de /conta, /admin e /api/admin
```

Identidade visual: tokens em `tailwind.config.ts` (Musgo, Sálvia, Concreto, Névoa, Branco Pedra, Sombra), fontes Fraunces (títulos) e Jost (texto) self-hosted via `next/font`, logomarca em `components/brand/logo.tsx` (SVG exatamente como no briefing).

## 12. Segurança e limitações conhecidas

**O que está implementado:** validação Zod no servidor em toda entrada; preço/frete/total sempre recalculados no backend; webhook com assinatura + idempotência + conferência de valor; checagem de `Origin` (CSRF) em toda rota mutável autenticada por cookie; rate limiting nas rotas públicas de escrita; honeypot no formulário de contato; headers de segurança (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy); sessões e senhas só pelo Supabase Auth; RLS (`prisma/rls.sql`); nenhum segredo no cliente; banner de cookies com consentimento antes de GA4/Meta.

**Ressalvas honestas:**

- O CSP usa `'unsafe-inline'` em scripts/estilos: um CSP com *nonce* obrigaria renderização dinâmica de todas as páginas e desligaria o ISR. Troque se preferir segurança máxima a cache estático.
- Sem Upstash, o rate limit é por instância (não compartilhado entre funções serverless).
- A tokenização de cartão usa `mp.createCardToken` do SDK v2. Para o nível mais alto de proteção PCI (SAQ A) o Mercado Pago recomenda **Secure Fields**; migrar é uma troca localizada em `components/checkout/card-form.tsx`.
- Cotação com muitos itens grandes pode ultrapassar os limites de dimensão dos Correios numa única caixa; nesse caso o Melhor Envio devolve erro e o site cai na tabela fixa (considere dividir o pedido em volumes).
- Sentry é opcional e não vem configurado (`npx @sentry/wizard@latest -i nextjs` resolve). Hoje os erros vão para `console.error` (logs da Vercel).
- Lighthouse: medido localmente (mobile, throttling simulado) com Acessibilidade/Boas práticas/SEO em 100 e Performance entre ~88 e 98 conforme a página e a máquina; confirme na URL final da Vercel.
