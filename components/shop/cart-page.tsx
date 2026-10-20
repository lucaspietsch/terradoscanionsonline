"use client";
import Link from "next/link";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartLine } from "@/components/shop/cart-line";
import { CouponForm } from "@/components/shop/coupon-form";
import { FreeShippingBar } from "@/components/shop/free-shipping-bar";
import { ShippingCalculator } from "@/components/shop/shipping-calculator";
import { useSiteConfig } from "@/components/site-config";
import { selectSubtotal, toLineInputs, useCart } from "@/lib/cart-store";
import { useHydrated } from "@/lib/hooks";
import { formatBRL } from "@/lib/money";
import { computeTotals } from "@/lib/totals";
import { useCoupon } from "@/lib/use-coupon";
import type { ShippingOption } from "@/lib/shipping";

export function CartPage() {
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const subtotal = useCart(selectSubtotal);
  const { freeShippingThresholdCents, checkoutEnabled } = useSiteConfig();
  const coupon = useCoupon();
  const [shipping, setShipping] = useState<ShippingOption | null>(null);

  if (!hydrated) return <div className="container py-16"><div className="img-skeleton h-64 rounded" /></div>;

  if (items.length === 0) {
    return (
      <div className="container flex flex-col items-center py-28 text-center">
        <ShoppingBag className="h-12 w-12 text-salvia" strokeWidth={1.2} aria-hidden />
        <h1 className="mt-6 font-serif text-4xl font-light">Seu carrinho está vazio</h1>
        <p className="mt-3 max-w-md text-secundario">Escolha um vaso feito à mão para começar o seu jardim.</p>
        <Button asChild size="lg" className="mt-8"><Link href="/vasos">Ver vasos</Link></Button>
      </div>
    );
  }

  const totals = computeTotals({ lines: items, shippingCents: shipping?.priceCents ?? 0, discountCents: coupon.discountCents });

  return (
    <div className="container py-12 md:py-16">
      <h1 className="font-serif text-4xl font-light md:text-5xl">Carrinho</h1>
      <div className="mt-10 grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        <div>
          <FreeShippingBar subtotalCents={subtotal} thresholdCents={freeShippingThresholdCents} />
          <ul className="mt-2 divide-y divide-concreto border-b border-concreto">
            {items.map((i) => (
              <CartLine key={`${i.productId}:${i.finishId}`} item={i} />
            ))}
          </ul>
          <Link href="/vasos" className="mt-6 inline-block text-musgo underline underline-offset-4">Continuar comprando</Link>
        </div>

        <aside className="h-fit space-y-8 rounded border border-concreto bg-pedra p-6 md:p-8" aria-label="Resumo do pedido">
          <ShippingCalculator items={toLineInputs(items)} selectedId={shipping?.id ?? null} onSelect={(o) => setShipping(o)} />
          <CouponForm coupon={coupon} />
          <dl className="space-y-3 border-t border-concreto pt-6 text-[0.9375rem]">
            <div className="flex justify-between"><dt className="text-secundario">Subtotal</dt><dd>{formatBRL(totals.subtotalCents)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-secundario">Frete</dt>
              <dd>{shipping ? (shipping.priceCents === 0 ? <span className="text-musgo">Grátis</span> : formatBRL(shipping.priceCents)) : <span className="text-secundario">Calcule acima</span>}</dd>
            </div>
            {totals.discountCents > 0 && <div className="flex justify-between"><dt className="text-secundario">Desconto</dt><dd className="text-musgo">− {formatBRL(totals.discountCents)}</dd></div>}
            <div className="flex items-baseline justify-between border-t border-concreto pt-4">
              <dt className="font-normal">Total</dt>
              <dd className="font-serif text-3xl font-light">{formatBRL(totals.totalCents)}</dd>
            </div>
          </dl>
          <Button asChild size="lg" className="w-full"><Link href="/checkout">Finalizar compra</Link></Button>
          {!checkoutEnabled && <p className="text-xs text-secundario">Modo demonstração: o checkout está desativado até configurar banco de dados e Mercado Pago.</p>}
          <p className="text-center text-xs text-secundario">Os valores são conferidos novamente no servidor antes do pagamento.</p>
        </aside>
      </div>
    </div>
  );
}
