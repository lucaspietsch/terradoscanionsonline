"use client";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { toCartItem } from "@/lib/cart-helpers";
import { useCart } from "@/lib/cart-store";
import type { ProductCardDTO } from "@/types";

/** Única parte interativa do card: o resto do card é renderizado no servidor (menos JS para hidratar). */
export function AddToCartButton({ product }: { product: ProductCardDTO }) {
  const add = useCart((s) => s.add);
  const finish = product.finishes.find((f) => f.id === product.defaultFinishId);
  return (
    <Button
      variant="secondary"
      size="sm"
      className="w-full"
      disabled={!finish || !product.inStock}
      onClick={() => {
        if (!finish) return;
        add(toCartItem(product, finish), 1);
        track("add_to_cart", { currency: "BRL", value: product.priceCents / 100, items: [{ item_id: product.id, item_name: product.name, price: product.priceCents / 100, quantity: 1 }] });
      }}
    >
      {product.inStock ? "Adicionar" : "Esgotado"}
    </Button>
  );
}
