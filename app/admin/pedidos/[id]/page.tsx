import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderActions } from "@/components/admin/order-actions";
import { DemoNotice, PageHeader } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { dbReady } from "@/lib/server/admin-page";
import { formatOrderNumber } from "@/lib/totals";
import { maskCpf, maskPhone } from "@/lib/utils";

export const metadata: Metadata = { title: "Pedido" };

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  if (!dbReady()) return <DemoNotice />;
  const { id } = await params;
  const o = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!o) notFound();
  const a = o.shippingAddress as { street: string; number: string; complement?: string | null; neighborhood: string; city: string; state: string; cep: string };

  return (
    <>
      <PageHeader title={formatOrderNumber(o.seq)} subtitle={`${ORDER_STATUS_LABEL(o.status, o.deliveryMethod)} · ${o.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`} actions={<Link href="/admin/pedidos" className="text-sm text-musgo underline underline-offset-4">← Pedidos</Link>} />
      <div className="grid gap-8 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-8">
          <section aria-labelledby="itens" className="rounded border border-concreto bg-pedra p-5">
            <h2 id="itens" className="mb-4 font-serif text-xl font-light">Itens</h2>
            <ul className="divide-y divide-concreto">
              {o.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4 py-3 text-sm"><span>{i.quantity}× {i.productName} <span className="text-secundario">· {i.finishName}</span></span><span>{formatBRL(i.unitPriceCents * i.quantity)}</span></li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-concreto pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-secundario">Subtotal</dt><dd>{formatBRL(o.subtotalCents)}</dd></div>
              <div className="flex justify-between"><dt className="text-secundario">Frete — {o.shippingService}{o.shippingDays ? ` (${o.shippingDays} dias)` : ""}</dt><dd>{formatBRL(o.shippingCents)}</dd></div>
              {o.discountCents > 0 && <div className="flex justify-between"><dt className="text-secundario">Desconto {o.couponCode ? `(${o.couponCode})` : ""}</dt><dd>− {formatBRL(o.discountCents)}</dd></div>}
              <div className="flex justify-between border-t border-concreto pt-2 text-base"><dt>Total</dt><dd className="font-medium">{formatBRL(o.totalCents)}</dd></div>
            </dl>
          </section>

          <section className="grid gap-6 rounded border border-concreto bg-pedra p-5 text-sm sm:grid-cols-2" aria-label="Cliente e entrega">
            <div>
              <p className="eyebrow mb-2">Cliente</p>
              <p>{o.customerName}</p>
              <p className="text-secundario">{o.customerEmail}{o.guestEmail ? " (convidado)" : ""}</p>
              {o.customerPhone && <p className="text-secundario">{maskPhone(o.customerPhone)}</p>}
              {o.customerCpf && <p className="text-secundario">CPF {maskCpf(o.customerCpf)}</p>}
            </div>
            <div>
              <p className="eyebrow mb-2">{o.deliveryMethod === "PICKUP" ? "Retirada no local" : "Entrega"}</p>
              <address className="not-italic leading-relaxed text-secundario">{a.street}, {a.number}{a.complement ? ` — ${a.complement}` : ""}<br />{a.neighborhood} · {a.city}/{a.state}<br />CEP {a.cep}</address>
            </div>
            <div>
              <p className="eyebrow mb-2">Pagamento</p>
              <p>{{ PIX: "Pix", CREDIT_CARD: `Cartão${o.installments ? ` em ${o.installments}x` : ""}`, BOLETO: "Boleto" }[o.paymentMethod]}</p>
              <p className="text-secundario">Mercado Pago: {o.paymentId ?? "—"} · {o.paymentStatus ?? "—"}</p>
              {o.paidAt && <p className="text-secundario">Pago em {o.paidAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>}
            </div>
            <div>
              <p className="eyebrow mb-2">Estoque</p>
              <p className="text-secundario">{o.stockDeducted ? "Baixa já realizada" : "Baixa pendente (ocorre no pagamento)"}</p>
              <Link className="mt-1 inline-block text-musgo underline underline-offset-4" href={`/pedido/${formatOrderNumber(o.seq)}`}>Ver página do cliente</Link>
            </div>
          </section>
        </div>
        <OrderActions id={o.id} status={o.status} trackingCode={o.trackingCode} deliveryMethod={o.deliveryMethod} />
      </div>
    </>
  );
}
