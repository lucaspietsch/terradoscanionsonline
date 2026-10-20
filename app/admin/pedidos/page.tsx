import type { Metadata } from "next";
import Link from "next/link";
import { DemoNotice, PageHeader, Table, Td, Th } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { ORDER_STATUS_LABEL, STATUS_OPTIONS } from "@/lib/order-status";
import { dbReady } from "@/lib/server/admin-page";
import { formatOrderNumber, parseOrderNumber } from "@/lib/totals";
import { cn } from "@/lib/utils";
import type { OrderStatus, Prisma } from "@prisma/client";

export const metadata: Metadata = { title: "Pedidos" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  if (!dbReady()) return <><PageHeader title="Pedidos" /><DemoNotice /></>;
  const { status, q } = await searchParams;
  const where: Prisma.OrderWhereInput = {};
  if (status && STATUS_OPTIONS.includes(status as OrderStatus)) where.status = status as OrderStatus;
  if (q) {
    const seq = parseOrderNumber(q) ?? (/^\d+$/.test(q) ? Number(q) : null);
    where.OR = [
      { customerEmail: { contains: q, mode: "insensitive" } },
      { customerName: { contains: q, mode: "insensitive" } },
      ...(seq ? [{ seq }] : []),
    ];
  }
  const orders = await prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 100, include: { items: true } });

  const chip = (active: boolean) => cn("rounded-full border px-3.5 py-1.5 text-sm", active ? "border-musgo bg-musgo text-pedra" : "border-concreto hover:border-musgo");
  return (
    <>
      <PageHeader title="Pedidos" />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link href="/admin/pedidos" className={chip(!status)}>Todos</Link>
        {STATUS_OPTIONS.map((s) => (
          <Link key={s} href={`/admin/pedidos?status=${s}`} className={chip(status === s)}>{ORDER_STATUS_LABEL(s)}</Link>
        ))}
        <form className="ml-auto" role="search">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Buscar nome, e-mail ou CB-0001" aria-label="Buscar pedidos" className="field-input h-9 w-64 text-sm" />
        </form>
      </div>
      {orders.length === 0 ? <p className="text-secundario">Nenhum pedido encontrado.</p> : (
        <Table>
          <thead><tr><Th>Pedido</Th><Th>Data</Th><Th>Cliente</Th><Th>Pagamento</Th><Th>Status</Th><Th className="text-right">Total</Th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <Td><Link className="text-musgo underline underline-offset-4" href={`/admin/pedidos/${o.id}`}>{formatOrderNumber(o.seq)}</Link></Td>
                <Td>{o.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })}</Td>
                <Td>{o.customerName}<span className="block text-xs text-secundario">{o.customerEmail}</span></Td>
                <Td>{{ PIX: "Pix", CREDIT_CARD: "Cartão", BOLETO: "Boleto" }[o.paymentMethod]}</Td>
                <Td>{ORDER_STATUS_LABEL(o.status, o.deliveryMethod)}</Td>
                <Td className="text-right">{formatBRL(o.totalCents)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
