import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

export default function Page() {
  return <CheckoutFlow />;
}
