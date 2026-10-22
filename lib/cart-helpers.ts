import type { CartItem } from "@/lib/cart-store";
import type { ProductCardDTO, ProductDTO } from "@/types";

type Finish = { id: string; name: string; hex: string; stock: number };

export function toCartItem(
  product: Pick<ProductCardDTO | ProductDTO, "id" | "slug" | "name" | "priceCents" | "images">,
  finish: Finish,
): Omit<CartItem, "quantity"> {
  const img = product.images[0];
  return {
    productId: product.id,
    finishId: finish.id,
    slug: product.slug,
    name: product.name,
    finishName: finish.name,
    finishHex: finish.hex,
    unitPriceCents: product.priceCents,
    maxStock: finish.stock,
    image: img?.url ?? null,
    imageAlt: img?.alt ?? product.name,
  };
}

/** Linha do carrinho no formato da mensagem de pedido (WhatsApp). */
export function toMsgLine(i: CartItem) {
  return { name: i.name, finishName: i.finishName, quantity: i.quantity, unitPriceCents: i.unitPriceCents };
}
