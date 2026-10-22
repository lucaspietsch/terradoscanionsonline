"use client";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CartLine } from "@/components/shop/cart-line";
import { FreeShippingBar } from "@/components/shop/free-shipping-bar";
import { WhatsAppOrderButton } from "@/components/shop/whatsapp-order-button";
import { useSiteConfig } from "@/components/site-config";
import { selectSubtotal, useCart } from "@/lib/cart-store";
import { formatBRL } from "@/lib/money";
import { toMsgLine } from "@/lib/cart-helpers";

export function CartDrawer() {
  const { items, isOpen, setOpen } = useCart();
  const subtotal = useCart(selectSubtotal);
  const { freeShippingThresholdCents, checkoutEnabled, } = useSiteConfig();
  const cep = useCart((s) => s.cep);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent aria-describedby="cart-desc">
        <div className="border-b border-concreto px-6 py-5">
          <SheetTitle className="font-serif text-2xl font-light">Seu carrinho</SheetTitle>
          <SheetDescription id="cart-desc" className="sr-only">
            Itens adicionados, progresso do frete grátis e acesso ao checkout.
          </SheetDescription>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="h-10 w-10 text-salvia" strokeWidth={1.2} aria-hidden />
            <p className="font-serif text-xl font-light">Seu carrinho está vazio</p>
            <p className="max-w-xs text-sm text-secundario">Escolha um vaso feito à mão para começar o seu jardim.</p>
            <Button asChild onClick={() => setOpen(false)}>
              <Link href="/vasos">Ver vasos</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              <FreeShippingBar className="mt-5" subtotalCents={subtotal} thresholdCents={freeShippingThresholdCents} />
              <ul className="divide-y divide-concreto">
                {items.map((i) => (
                  <CartLine key={`${i.productId}:${i.finishId}`} item={i} compact />
                ))}
              </ul>
            </div>
            <div className="space-y-3 border-t border-concreto bg-pedra px-6 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-secundario">Subtotal (+ frete)</span>
                <span className="font-serif text-2xl font-light">{formatBRL(subtotal)}</span>
              </div>
              <WhatsAppOrderButton size="lg" className="w-full" lines={items.map(toMsgLine)} options={{ cep }}>
                Enviar pedido pelo WhatsApp
              </WhatsAppOrderButton>
              {checkoutEnabled && (
                <Button asChild variant="secondary" className="w-full" onClick={() => setOpen(false)}>
                  <Link href="/checkout">Pagar online</Link>
                </Button>
              )}
              <Button asChild variant="ghost" className="w-full" onClick={() => setOpen(false)}>
                <Link href="/carrinho">Ver carrinho e calcular frete</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
