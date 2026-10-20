import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Trocas e devoluções", description: "Como funcionam trocas, devoluções e arrependimento de compra na Cambará Ornamentais.", alternates: { canonical: "/trocas-e-devolucoes" } };

export default function Page() {
  return (
    <PageShell eyebrow="Compra segura" title="Trocas e devoluções" intro="Queremos que a peça certa chegue inteira e fique bem na sua casa.">
      <h2>Arrependimento (7 dias)</h2>
      <p>Conforme o art. 49 do Código de Defesa do Consumidor, você pode desistir da compra em até <strong>7 dias corridos</strong> após o recebimento, sem precisar justificar. A peça deve voltar sem uso, sem plantio e na embalagem. O reembolso é feito na mesma forma de pagamento. O frete de devolução, nesse caso, é por conta da loja.</p>
      <h2>Peça danificada no transporte</h2>
      <p>Embalamos com reforço, mas acidentes acontecem. Se algo chegar quebrado ou trincado, avise em até <strong>7 dias</strong> com fotos da peça e da embalagem pelo <Link href="/contato">formulário de contato</Link> ou WhatsApp. Enviaremos uma peça nova ou devolveremos o valor, sem custo de frete.</p>
      <h2>O que não é defeito</h2>
      <p>Por serem feitos à mão em cimento, os vasos têm pequenas variações de cor, textura, poros e marcas de molde. Esses detalhes fazem parte da peça e não motivam troca. Manchas claras (eflorescência) saem com pano úmido.</p>
      <h2>Como solicitar</h2>
      <ol className="list-decimal space-y-1 pl-6">
        <li>Fale com a gente informando o número do pedido (ex.: CB-0001).</li>
        <li>Enviaremos as instruções de envio ou coleta.</li>
        <li>Assim que a peça chegar e for conferida, concluímos a troca ou o reembolso em até 10 dias úteis.</li>
      </ol>
      <p>Contato: <a href={`mailto:${site.email}`}>{site.email}</a></p>
    </PageShell>
  );
}
