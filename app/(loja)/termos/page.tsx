import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Termos de uso", description: "Condições de uso do site e de compra na Cambará Ornamentais.", alternates: { canonical: "/termos" } };

export default function Page() {
  return (
    <PageShell eyebrow="Condições" title="Termos de uso" intro="Ao usar este site e comprar na Cambará Ornamentais, você concorda com as condições abaixo.">
      <h2>1. Produtos</h2>
      <p>Os vasos são feitos à mão em cimento. Medidas, pesos e cores são aproximados e podem variar levemente entre peças. As fotos são ilustrativas e cada peça é única.</p>
      <h2>2. Preços e frete</h2>
      <p>Os preços estão em reais (R$) e são acrescidos de frete, calculado pelo CEP de entrega. Compras com subtotal acima do valor divulgado na loja têm a opção de frete mais econômica gratuita; a regra considera o valor dos produtos antes de cupons. Valores e promoções podem ser alterados sem aviso prévio, sem afetar pedidos já confirmados.</p>
      <h2>3. Pagamento</h2>
      <p>Aceitamos Pix, cartão de crédito e boleto, processados pelo Mercado Pago. O pedido só segue para produção e envio após a confirmação do pagamento. Pix expira em 30 minutos e boleto em 3 dias; pedidos não pagos são cancelados.</p>
      <h2>4. Prazos</h2>
      <p>O prazo é a soma do tempo de produção/separação e do prazo da transportadora exibido no checkout. Por se tratar de produção artesanal, o prazo de produção pode aumentar em períodos de alta procura; avisaremos você.</p>
      <h2>5. Trocas e devoluções</h2>
      <p>Valem as regras da página <Link href="/trocas-e-devolucoes">Trocas e devoluções</Link>, em conformidade com o Código de Defesa do Consumidor.</p>
      <h2>6. Conta e responsabilidades</h2>
      <p>Você é responsável pela veracidade dos dados informados e pela guarda de sua senha. Podemos cancelar pedidos com indícios de fraude.</p>
      <h2>7. Propriedade intelectual</h2>
      <p>Marca, logotipo, textos e imagens do site pertencem à {site.name} e não podem ser reproduzidos sem autorização.</p>
      <h2>8. Privacidade</h2>
      <p>O tratamento de dados pessoais segue a <Link href="/privacidade">Política de privacidade</Link>.</p>
      <h2>9. Foro</h2>
      <p>Fica eleito o foro do domicílio do consumidor para dirimir dúvidas decorrentes destes termos. Dúvidas: <a href={`mailto:${site.email}`}>{site.email}</a>.</p>
    </PageShell>
  );
}
