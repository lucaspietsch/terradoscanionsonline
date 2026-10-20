import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentInstructions } from "@/components/checkout/payment-instructions";
import { Button } from "@/components/ui/button";
import { hasDatabase, prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { getSessionUser } from "@/lib/server/auth";
import { parseOrderNumber } from "@/lib/totals";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";

export const metadata: Metadata = { title: "Acompanhar pedido", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OrderPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ token?: string }> }) {
  const { number } = await params;
  const { token } = await searchParams;
  const seq = parseOrderNumber(number);
  if (!hasDatabase || !seq) notFound();

  const order = await prisma.order.findUnique({ where: { seq }, include: { items: true } });
  if (!order) notFound();

  // acesso: dono do pedido logado OU quem tem o token secreto (guest / link do e-mail)
  const user = await getSessionUser();
  const allowed = (user && order.userId === user.id) || (token && token === order.accessToken) || user?.isAdmin;
  if (!allowed) notFound();

  const addr = order.shippingAddress as { street: string; number: string; complement?: string | null; neighborhood: string; city: string; state: string; cep: string };
  const pickup = order.deliveryMethod === "PICKUP";

  return (
    <div className="container max-w-3xl py-14 md:py-20">
      <p className="eyebrow">Pedido</p>
      <h1 className="mt-2 font-serif text-4xl font-light md:text-5xl">{number.toUpperCase()}</h1>
      <p className="mt-3 text-secundario">Status: <strong className="font-medium text-sombra">{ORDER_STATUS_LABEL(order.status, order.deliveryMethod)}</strong></p>

      {order.status === "AWAITING_PAYMENT" && (
        <div className="mt-8">
          <PaymentInstructions
            view={{
              orderNumber: number.toUpperCase(), token: order.accessToken, status: order.status, method: order.paymentMethod, totalCents: order.totalCents,
              pix: order.pixQrCode ? { qrCode: order.pixQrCode, qrCodeBase64: order.pixQrCodeBase64 ?? "", expiresAt: order.pixExpiresAt?.toISOString() ?? null } : undefined,
              boletoUrl: order.boletoUrl ?? undefined,
            }}
          />
        </div>
      )}

      {order.trackingCode && !pickup && (
        <div className="mt-8 rounded border border-concreto bg-pedra p-6">
          <p className="eyebrow">Rastreio</p>
          <p className="mt-2 text-xl tracking-wide">{order.trackingCode}</p>
          <Button asChild variant="secondary" size="sm" className="mt-4">
            <a href={`https://www.melhorrastreio.com.br/rastreio/${encodeURIComponent(order.trackingCode)}`} target="_blank" rel="noopener noreferrer">Rastrear entrega</a>
          </Button>
        </div>
      )}

      <section className="mt-10" aria-label="Itens do pedido">
        <ul className="divide-y divide-concreto border-y border-concreto">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 py-4">
              <span>{i.quantity}× {i.productName} <span className="text-secundario">· {i.finishName}</span></span>
              <span>{formatBRL(i.unitPriceCents * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-secundario">Subtotal</dt><dd>{formatBRL(order.subtotalCents)}</dd></div>
          <div className="flex justify-between"><dt className="text-secundario">Frete ({order.shippingService})</dt><dd>{order.shippingCents ? formatBRL(order.shippingCents) : "Grátis"}</dd></div>
          {order.discountCents > 0 && <div className="flex justify-between"><dt className="text-secundario">Desconto {order.couponCode ? `(${order.couponCode})` : ""}</dt><dd>− {formatBRL(order.discountCents)}</dd></div>}
          <div className="flex items-baseline justify-between border-t border-concreto pt-3"><dt>Total</dt><dd className="font-serif text-2xl font-light">{formatBRL(order.totalCents)}</dd></div>
        </dl>
      </section>

      <section className="mt-10 grid gap-6 text-sm sm:grid-cols-2">
        <div>
          <p className="eyebrow mb-2">{pickup ? "Retirada" : "Entrega"}</p>
          {pickup ? <p>Retirada no local, combinaremos o horário pelo WhatsApp ou e-mail.</p> : (
            <address className="not-italic leading-relaxed text-secundario">
              {addr.street}, {addr.number}{addr.complement ? ` — ${addr.complement}` : ""}<br />{addr.neighborhood} · {addr.city}/{addr.state}<br />CEP {addr.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}
            </address>
          )}
        </div>
        <div>
          <p className="eyebrow mb-2">Contato</p>
          <p className="text-secundario">{order.customerName}<br />{order.customerEmail}</p>
        </div>
      </section>

      <Button asChild className="mt-12"><Link href="/vasos">Continuar comprando</Link></Button>
    </div>
  );
}
