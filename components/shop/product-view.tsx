"use client";
import { useState } from "react";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductPurchase } from "@/components/shop/product-purchase";
import type { ProductDTO } from "@/types";

/** Galeria + compra com a opção (cor) escolhida compartilhada: ao escolher uma cor, a galeria mostra a foto dela. */
export function ProductView({ product }: { product: ProductDTO }) {
  const first = product.variants.find((v) => !v.comingSoon && v.stock > 0) ?? product.variants.find((v) => !v.comingSoon) ?? product.variants[0];
  const [finishId, setFinishId] = useState(first?.finish.id ?? "");
  const focusUrl = product.variants.find((v) => v.finish.id === finishId)?.imageUrl ?? null;
  return (
    <>
      <ProductGallery images={product.images} name={product.name} focusUrl={focusUrl} />
      <ProductPurchase product={product} finishId={finishId} onFinishChange={setFinishId} />
    </>
  );
}
