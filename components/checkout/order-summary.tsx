"use client";
import Image from "next/image";
import { CouponForm } from "@/components/shop/coupon-form";
import { FinishDot } from "@/components/shop/finish-selector";
import type { CartItem } from "@/lib/cart-store";
import { formatBRL } from "@/lib/money";
import type { Totals } from "@/lib/totals";
import type { useCoupon } from "@/lib/use-coupon";

export function OrderSummary({ items, totals, shippingLabel, coupon }: { items: CartItem[]; totals: Totals; shippingLabel: string; coupon: ReturnType<typeof useCoupon> }) {
  return (
    <aside className="h-fit rounded border border-concreto bg-pedra p-6 lg:sticky lg:top-28" aria-label="Resumo do pedido">
      <h2 className="font-serif text-2xl font-light">Resumo</h2>
      <ul className="mt-5 divide-y divide-concreto">
        {items.map((i) => (
          <li key={`${i.productId}:${i.finishId}`} className="flex gap-3 py-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-nevoa">
              {i.image && <Image src={i.image} alt={i.imageAlt} fill sizes="64px" className="object-cover" />}
              <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-bl bg-musgo px-1 text-[0.6875rem] text-pedra">{i.quantity}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{i.name}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-secundario"><FinishDot hex={i.finishHex} className="h-3 w-3" /> {i.finishName}</p>
            </div>
            <p className="text-sm">{formatBRL(i.unitPriceCents * i.quantity)}</p>
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-concreto pt-5"><CouponForm coupon={coupon} /></div>
      <dl className="mt-5 space-y-2.5 border-t border-concreto pt-5 text-sm">
        <div className="flex justify-between"><dt className="text-secundario">Subtotal</dt><dd>{formatBRL(totals.subtotalCents)}</dd></div>
        <div className="flex justify-between"><dt className="text-secundario">Frete</dt><dd>{shippingLabel}</dd></div>
        {totals.discountCents > 0 && <div className="flex justify-between"><dt className="text-secundario">Desconto</dt><dd className="text-musgo">− {formatBRL(totals.discountCents)}</dd></div>}
        <div className="flex items-baseline justify-between border-t border-concreto pt-4"><dt>Total</dt><dd className="font-serif text-3xl font-light">{formatBRL(totals.totalCents)}</dd></div>
      </dl>
    </aside>
  );
}
