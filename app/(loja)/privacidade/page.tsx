import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Política de privacidade", description: "Como a Cambará Ornamentais coleta, usa e protege seus dados pessoais, conforme a LGPD.", alternates: { canonical: "/privacidade" } };

export default function Page() {
  return (
    <PageShell eyebrow="LGPD" title="Política de privacidade" intro="Esta política explica quais dados pessoais coletamos, por quê, e quais são os seus direitos, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).">
      <h2>Quem é o controlador</h2>
      <p>{site.name}, CNPJ {site.cnpj}. Canal do titular: <a href={`mailto:${site.email}`}>{site.email}</a>.</p>
      <h2>Dados que coletamos</h2>
      <ul>
        <li><strong>Cadastro e compra:</strong> nome, e-mail, CPF, telefone e endereço — necessários para emitir o pedido, processar o pagamento e entregar.</li>
        <li><strong>Pagamento:</strong> os dados do cartão são enviados diretamente ao Mercado Pago e não ficam armazenados em nossos servidores.</li>
        <li><strong>Navegação:</strong> cookies essenciais (carrinho, sessão) e, <em>somente com o seu consentimento</em>, cookies de análise e marketing (Google Analytics 4 e Meta Pixel).</li>
        <li><strong>Contato e newsletter:</strong> nome, e-mail e mensagem enviados por você.</li>
      </ul>
      <h2>Para que usamos</h2>
      <ul>
        <li>Executar o contrato de compra (pedido, pagamento, entrega, suporte) — base legal: execução de contrato.</li>
        <li>Cumprir obrigações legais e fiscais — base legal: obrigação legal.</li>
        <li>Enviar newsletter e medir o uso do site — base legal: consentimento, que pode ser retirado a qualquer momento.</li>
        <li>Prevenir fraudes e garantir a segurança — base legal: legítimo interesse.</li>
      </ul>
      <h2>Com quem compartilhamos</h2>
      <p>Apenas com quem é necessário para a operação: Mercado Pago (pagamentos), transportadoras e Melhor Envio (entrega), Supabase (hospedagem de dados e autenticação), Resend (e-mails transacionais) e, com consentimento, Google e Meta (análise e anúncios). Não vendemos seus dados.</p>
      <h2>Por quanto tempo guardamos</h2>
      <p>Dados de pedidos são mantidos pelo prazo exigido pela legislação fiscal e consumerista. Cadastro e newsletter, até você pedir a exclusão.</p>
      <h2>Seus direitos</h2>
      <p>Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade, exclusão e revogação de consentimento, escrevendo para <a href={`mailto:${site.email}`}>{site.email}</a>. Responderemos em até 15 dias.</p>
      <h2>Cookies</h2>
      <p>Ao entrar no site você escolhe entre aceitar todos os cookies ou apenas os essenciais. Para mudar a escolha, limpe os dados do site no navegador e o aviso aparecerá novamente.</p>
      <h2>Atualizações</h2>
      <p>Podemos atualizar esta política. A versão vigente estará sempre nesta página.</p>
    </PageShell>
  );
}
