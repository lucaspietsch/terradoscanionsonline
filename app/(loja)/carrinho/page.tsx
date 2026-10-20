import type { Metadata } from "next";
import { CartPage } from "@/components/shop/cart-page";

export const metadata: Metadata = { title: "Carrinho", robots: { index: false } };

export default function Page() {
  return <CartPage />;
}
