"use client";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FinishSelector, QuantityInput } from "@/components/shop/finish-selector";
import { Price } from "@/components/shop/price";
import { ShippingCalculator } from "@/components/shop/shipping-calculator";
import { WishlistButton } from "@/components/shop/wishlist-button";
import { WhatsAppOrderButton } from "@/components/shop/whatsapp-order-button";
import { useSiteConfig } from "@/components/site-config";
import { track } from "@/lib/analytics";
import { toCartItem } from "@/lib/cart-helpers";
import { useCart } from "@/lib/cart-store";
import { ARTISANAL_NOTICE, SOLD_ONLY_VASES_NOTICE, whatsappUrl } from "@/lib/site";
import type { ProductDTO } from "@/types";

export function ProductPurchase({ product, finishId, onFinishChange }: { product: ProductDTO; finishId: string; onFinishChange: (id: string) => void }) {
  const add = useCart((s) => s.add);
  const { whatsapp } = useSiteConfig();

  const finishes = useMemo(() => product.variants.map((v) => ({ id: v.finish.id, name: v.finish.name, hex: v.finish.hex, hex2: v.finish.hex2, stock: v.stock, comingSoon: v.comingSoon })), [product]);
  const [quantity, setQuantity] = useState(1);
  const finish = finishes.find((f) => f.id === finishId);
  const soon = Boolean(finish?.comingSoon);
  const out = !finish || soon || finish.stock <= 0;
  const [pageUrl, setPageUrl] = useState("");
  useEffect(() => setPageUrl(window.location.protocol.startsWith("http") ? window.location.href : ""), []);

  useEffect(() => {
    track("view_item", { currency: "BRL", value: product.priceCents / 100, items: [{ item_id: product.id, item_name: product.name, price: product.priceCents / 100 }] });
  }, [product]);

  function addToCart(open = true) {
    if (!finish || out) return;
    add(toCartItem(product, finish), quantity);
    if (!open) useCart.getState().setOpen(false);
    track("add_to_cart", { currency: "BRL", value: (product.priceCents * quantity) / 100, items: [{ item_id: product.id, item_name: product.name, price: product.priceCents / 100, quantity }] });
  }

  const wa = whatsappUrl(
    soon
      ? `Olá! Tenho interesse no ${product.name} na opção "${finish?.name}" (em breve). Pode me avisar quando estiver disponível? ${pageUrl}`
      : `Olá! Tenho uma dúvida sobre o ${product.name} (${finish?.name ?? ""}) que vi no site: ${pageUrl}`,
    whatsapp,
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="outline">Feito à mão</Badge>
        {product.badge && <Badge tone="dark">{product.badge}</Badge>}
        {product.hasDrainage && <Badge tone="sage">Com furo de drenagem</Badge>}
      </div>
      <h1 className="mt-4 font-serif text-4xl font-light leading-tight md:text-5xl">{product.name}</h1>
      <p className="mt-3 text-lg text-secundario">{product.shortDescription}</p>
      <Price cents={product.priceCents} size="lg" className="mt-6" />

      <div className="mt-8 space-y-7 border-t border-concreto pt-8">
        <FinishSelector finishes={finishes} value={finishId} onChange={(id) => { onFinishChange(id); setQuantity(1); }} />
        <div>
          <p className="eyebrow mb-3">Quantidade</p>
          <div className="flex items-center gap-4">
            <QuantityInput value={quantity} onChange={setQuantity} max={Math.max(1, finish?.stock ?? 1)} />
            {finish && finish.stock > 0 && finish.stock <= 5 && <p className="text-sm text-secundario">Restam {finish.stock} em {finish.name}</p>}
            {soon && <p className="text-sm text-secundario">Esta cor ainda não foi produzida — em breve. A foto é uma ilustração de como vai ficar.</p>}
            {out && !soon && <p className="text-sm text-erro">Este acabamento está esgotado</p>}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="flex-1" onClick={() => addToCart(true)} disabled={out}>{soon ? "Em breve" : "Adicionar ao carrinho"}</Button>
          <WhatsAppOrderButton
            size="lg"
            variant="secondary"
            className="flex-1"
            disabled={out}
            lines={finish ? [{ name: product.name, finishName: finish.name, quantity, unitPriceCents: product.priceCents }] : []}
            onSent={() => track("begin_checkout", { currency: "BRL", value: (product.priceCents * quantity) / 100 })}
          >
            Comprar pelo WhatsApp
          </WhatsAppOrderButton>
        </div>

        <Button asChild variant="ghost" className="w-full">
          <a href={wa} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" strokeWidth={1.5} aria-hidden /> {soon ? "Avise-me quando chegar (WhatsApp)" : "Tirar dúvidas no WhatsApp"}
          </a>
        </Button>
        <WishlistButton productId={product.id} />
      </div>

      <div className="mt-8 border-t border-concreto pt-8">
        <ShippingCalculator items={finish ? [{ productId: product.id, finishId: finish.id, quantity }] : []} showProgress />
      </div>

      <p className="mt-8 rounded border border-concreto bg-pedra p-4 text-sm leading-relaxed text-secundario">{ARTISANAL_NOTICE}</p>
      <p className="mt-3 rounded border border-concreto bg-pedra p-4 text-sm leading-relaxed text-secundario">{SOLD_ONLY_VASES_NOTICE}</p>
    </div>
  );
}
