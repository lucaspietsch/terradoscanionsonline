import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AddressManager, ProfileForm } from "@/components/account/profile-forms";
import { LogoutButton } from "@/components/account/logout-button";
import { Badge } from "@/components/ui/badge";
import { hasDatabase, prisma } from "@/lib/db";
import { getProducts } from "@/lib/data/catalog";
import { formatBRL } from "@/lib/money";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { getSessionUser } from "@/lib/server/auth";
import { formatOrderNumber } from "@/lib/totals";

export const metadata: Metadata = { title: "Minha conta", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/entrar?next=/conta");
  if (!hasDatabase) {
    return <div className="container py-20"><p className="text-secundario">Banco de dados não configurado neste ambiente.</p></div>;
  }

  const [profile, orders, addresses, wishlist, products] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id } }),
    prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { items: true }, take: 30 }),
    prisma.address.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.wishlistItem.findMany({ where: { userId: user.id } }),
    getProducts(),
  ]);
  const wished = products.filter((p) => wishlist.some((w) => w.productId === p.id));

  return (
    <div className="container max-w-4xl py-14 md:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Minha conta</p>
          <h1 className="mt-2 font-serif text-4xl font-light md:text-5xl">Olá{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}</h1>
        </div>
        <div className="flex gap-3">
          {user.isAdmin && <Link href="/admin" className="inline-flex h-9 items-center rounded border border-musgo px-4 text-sm text-musgo hover:bg-musgo hover:text-pedra">Painel admin</Link>}
          <LogoutButton />
        </div>
      </div>

      <section className="mt-14" aria-labelledby="orders">
        <h2 id="orders" className="font-serif text-2xl font-light">Meus pedidos</h2>
        {orders.length === 0 ? (
          <p className="mt-4 text-secundario">Você ainda não fez pedidos. <Link href="/vasos" className="text-musgo underline underline-offset-4">Conheça os vasos</Link>.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {orders.map((o) => (
              <li key={o.id} className="rounded border border-concreto bg-pedra p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Link href={`/pedido/${formatOrderNumber(o.seq)}`} className="font-serif text-xl font-light hover:text-musgo">{formatOrderNumber(o.seq)}</Link>
                  <Badge tone={o.status === "CANCELLED" ? "outline" : "sage"}>{ORDER_STATUS_LABEL(o.status, o.deliveryMethod)}</Badge>
                </div>
                <p className="mt-2 text-sm text-secundario">{o.createdAt.toLocaleDateString("pt-BR")} · {o.items.reduce((n, i) => n + i.quantity, 0)} item(ns) · {formatBRL(o.totalCents)}</p>
                {o.trackingCode && o.deliveryMethod === "SHIPPING" && <p className="mt-2 text-sm">Rastreio: <a className="text-musgo underline underline-offset-4" href={`https://www.melhorrastreio.com.br/rastreio/${encodeURIComponent(o.trackingCode)}`} target="_blank" rel="noopener noreferrer">{o.trackingCode}</a></p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-14" aria-labelledby="fav">
        <h2 id="fav" className="font-serif text-2xl font-light">Lista de desejos</h2>
        {wished.length === 0 ? <p className="mt-4 text-secundario">Nenhum favorito ainda.</p> : (
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {wished.map((p) => (
              <li key={p.id}>
                <Link href={`/vasos/${p.slug}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded bg-pedra">{p.images[0] && <Image src={p.images[0].url} alt={p.images[0].alt} fill sizes="25vw" className="object-cover transition group-hover:scale-[1.03]" />}</div>
                  <p className="mt-2 text-sm">{p.name}</p><p className="text-sm text-secundario">{formatBRL(p.priceCents)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-14" aria-labelledby="addr"><h2 id="addr" className="mb-6 font-serif text-2xl font-light">Endereços salvos</h2><AddressManager initial={addresses} /></section>
      <section className="mt-14" aria-labelledby="data"><h2 id="data" className="mb-6 font-serif text-2xl font-light">Dados pessoais</h2><ProfileForm initial={{ name: profile?.name ?? "", email: user.email, phone: profile?.phone ?? "", cpf: profile?.cpf ?? "" }} /></section>
    </div>
  );
}
