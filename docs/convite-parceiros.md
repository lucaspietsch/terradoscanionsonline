# Como os parceiros assumem a própria página

Cada parceiro cria a **própria senha** (você nunca vê nem repassa senha) e passa a preencher a
página dele: frase de destaque, descrição, WhatsApp, endereço e **produtos/serviços**.

## Para você (administração)

**Pelo painel** (`/admin` → *Parceiros*)
1. Clique em **Convidar** na linha do parceiro.
2. Informe o **nome** do responsável e o **e-mail** de acesso → **Gerar convite**.
3. Use **Abrir no WhatsApp** (mensagem já pronta) ou copie o link e a mensagem.
4. Acompanhe a coluna **Acesso**: `sem login` → `convite até dd/mm` → `ativo`. A coluna **Produtos** mostra quantos itens ele já publicou.

**Em lote** (os 15 de uma vez)
```bash
# parceiros.csv  →  slug,email,Nome do responsável
canyons-chalet,contato@canyons.example,Ana Souza
campanario-chales,reservas@campanario.example,João Lima

npm run invite-partners -- parceiros.csv
```
O comando imprime o link e a mensagem de cada parceiro (para colar no WhatsApp).
Os `slug` de cada parceiro estão em `scripts/seed.js` (lista `FOUNDING_PARTNERS`).

**Segurança dos links**
- Valem **7 dias** e só podem ser usados **uma vez**; gerar um novo invalida o anterior.
- Trate como senha: envie apenas ao responsável do parceiro.
- Esqueceu a senha? Clique em **Redefinir senha** na linha do parceiro e envie o novo link
  (ele destrava a conta e desconecta os outros aparelhos). Se o `SMTP_URL` estiver configurado,
  o parceiro também pode usar **“Esqueci minha senha”** na tela de login.

## Mensagem para enviar ao parceiro (WhatsApp)

> Olá, {nome}! 👋 O **{negócio}** já está no **Terra dos Cânions Online**, o novo guia de
> Cambará do Sul, e você ganhou um período de cortesia como parceiro fundador.
>
> Crie sua senha neste link (vale 7 dias, uso único): **{link}**
>
> Depois é só entrar e preencher, em 5 minutos:
> 1. frase de destaque e descrição do seu negócio;
> 2. WhatsApp e endereço;
> 3. seus produtos e serviços (com preço de referência ou "Consulte").
>
> Sua página fica em **{site}/parceiros/{slug}**. Qualquer dúvida, me chame aqui.

## O que o parceiro consegue (e não consegue) fazer

| Pode | Não pode |
|---|---|
| Editar frase, descrição, WhatsApp, telefone, site (https), Instagram e endereço | Alterar nome, categoria, plano e período de cortesia |
| Criar, editar, despublicar e remover **os próprios** produtos (até 50) | Ver ou mexer em produtos/dados de outro parceiro |
| Ver números agregados das vendas atribuídas a ele (cupom/placa) | Ver **dados de clientes** (nome, e-mail, telefone) |
| Trocar a própria senha (desconecta os outros aparelhos) | Criar outros usuários ou convites |

Tudo o que o parceiro escreve é exibido como texto puro (sem HTML), links só `https://`, e as
alterações ficam no log de auditoria. Se algum conteúdo for inadequado, despublique o parceiro
ou o produto em *Parceiros*.
