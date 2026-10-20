"use client";
import { useEffect, useRef } from "react";
import { useSiteConfig } from "@/components/site-config";
import { toLineInputs, useCart, type CartItem } from "@/lib/cart-store";
import { useAuthUser } from "@/lib/hooks";

/**
 * Usuário logado: mescla o carrinho do servidor com o local (soma por item) e passa a salvar mudanças.
 * Anônimo ou modo demonstração: não faz nada (fica só no localStorage).
 */
export function CartSync() {
  const { authEnabled, checkoutEnabled } = useSiteConfig();
  const user = useAuthUser(authEnabled && checkoutEnabled);
  const items = useCart((s) => s.items);
  const started = useRef(false);
  const ready = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!user || started.current) return;
    started.current = true;
    (async () => {
      try {
        const res = await fetch("/api/cart");
        if (!res.ok) return;
        const { items: remote } = (await res.json()) as { items: { productId: string; finishId: string; quantity: number }[] };
        const local = useCart.getState().items;
        const merged: CartItem[] = [...local];
        for (const r of remote) {
          const hit = merged.find((m) => m.productId === r.productId && m.finishId === r.finishId);
          if (!hit) {
            // item só existe no servidor: busca dados de exibição
            const p = await fetch(`/api/products`).then((x) => x.json());
            const prod = p.products.find((x: { id: string }) => x.id === r.productId);
            const fin = prod?.finishes.find((f: { id: string }) => f.id === r.finishId);
            if (prod && fin) {
              merged.push({ productId: prod.id, finishId: fin.id, slug: prod.slug, name: prod.name, finishName: fin.name, finishHex: fin.hex, unitPriceCents: prod.priceCents, quantity: r.quantity, maxStock: fin.stock, image: prod.images[0]?.url ?? null, imageAlt: prod.images[0]?.alt ?? prod.name });
            }
          }
        }
        useCart.getState().replace(merged);
      } catch {
        /* sincronização é opcional */
      } finally {
        ready.current = true;
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user || !ready.current) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetch("/api/cart", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: toLineInputs(items) }) }).catch(() => undefined);
    }, 800);
    return () => clearTimeout(timer.current);
  }, [items, user]);

  return null;
}
