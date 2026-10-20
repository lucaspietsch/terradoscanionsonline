import Link from "next/link";
import { DemoNotice, PageHeader, StatCard, Table, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { brtBoundaries, dbReady } from "@/lib/server/admin-page";
import { formatOrderNumber } from "@/lib/totals";

const LIVE = ["PAID", "IN_PRODUCTION", "SHIPPED", "DELIVERED"] as const;
const LOW_STOCK = 3;

export default async function AdminHome() {
  if (!dbReady()) return <><PageHeader title="Dashboard" /><DemoNotice /></>;

  const { startOfDay, startOfMonth } = brtBoundaries();
  const [day, month, awaiting, toShip, lowStock, recent] = await Promise.all([
    prisma.order.aggregate({ where: { status: { in: [...LIVE] }, paidAt: { gte: startOfDay } }, _sum: { totalCents: true }, _count: true }),
    prisma.order.aggregate({ where: { status: { in: [...LIVE] }, paidAt: { gte: startOfMonth } }, _sum: { totalCents: true }, _count: true }),
    prisma.order.count({ where: { status: "AWAITING_PAYMENT" } }),
    prisma.order.count({ where: { status: { in: ["PAID", "IN_PRODUCTION"] } } }),
    prisma.productVariant.findMany({ where: { stock: { lte: LOW_STOCK }, product: { active: true } }, include: { product: true, finish: true }, orderBy: { stock: "asc" }, take: 20 }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Visão geral da loja (horário de Brasília)" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Vendas hoje" value={formatBRL(day._sum.totalCents ?? 0)} hint={`${day._count} pedido(s) pago(s)`} />
        <StatCard label="Vendas no mês" value={formatBRL(month._sum.totalCents ?? 0)} hint={`${month._count} pedido(s) pago(s)`} />
        <StatCard label="Aguardando pagamento" value={String(awaiting)} hint="Pix/boleto em aberto" />
        <StatCard label="Para produzir / enviar" value={String(toShip)} hint="Pagos, ainda não enviados" />
      </div>

      <div className="mt-12 grid gap-10 xl:grid-cols-2">
        <section aria-labelledby="low">
          <h2 id="low" className="mb-4 font-serif text-2xl font-light">Estoque baixo</h2>
          {lowStock.length === 0 ? <p className="text-secundario">Nenhum produto com {LOW_STOCK} ou menos unidades.</p> : (
            <Table>
              <thead><tr><Th>Produto</Th><Th>Acabamento</Th><Th className="text-right">Estoque</Th></tr></thead>
              <tbody>
                {lowStock.map((v) => (
                  <tr key={v.id}>
                    <Td><Link className="hover:text-musgo" href={`/admin/produtos/${v.productId}`}>{v.product.name}</Link></Td>
                    <Td>{v.finish.name}</Td>
                    <Td className="text-right"><Badge tone={v.stock === 0 ? "dark" : "sage"}>{v.stock === 0 ? "Esgotado" : v.stock}</Badge></Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </section>

        <section aria-labelledby="rec">
          <h2 id="rec" className="mb-4 font-serif text-2xl font-light">Últimos pedidos</h2>
          {recent.length === 0 ? <p className="text-secundario">Ainda não há pedidos.</p> : (
            <Table>
              <thead><tr><Th>Pedido</Th><Th>Cliente</Th><Th>Status</Th><Th className="text-right">Total</Th></tr></thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <Td><Link className="text-musgo underline underline-offset-4" href={`/admin/pedidos/${o.id}`}>{formatOrderNumber(o.seq)}</Link></Td>
                    <Td>{o.customerName}</Td>
                    <Td>{ORDER_STATUS_LABEL(o.status, o.deliveryMethod)}</Td>
                    <Td className="text-right">{formatBRL(o.totalCents)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </section>
      </div>
    </>
  );
}
