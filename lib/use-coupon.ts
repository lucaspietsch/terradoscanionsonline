"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toLineInputs, useCart } from "@/lib/cart-store";

/** Valida o cupom no servidor e mantém o desconto em sincronia com os itens. O checkout recalcula tudo de novo. */
export function useCoupon() {
  const items = useCart((s) => s.items);
  const code = useCart((s) => s.couponCode);
  const setCoupon = useCart((s) => s.setCoupon);
  const [discountCents, setDiscount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const itemsKey = JSON.stringify(toLineInputs(items));
  const first = useRef(true);

  const validate = useCallback(
    async (candidate: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/coupon", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: candidate, items: JSON.parse(itemsKey) }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Cupom inválido.");
        setCoupon(data.code);
        setDiscount(data.discountCents);
        return true;
      } catch (e) {
        setDiscount(0);
        setCoupon(null);
        setError(e instanceof Error ? e.message : "Cupom inválido.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [itemsKey, setCoupon],
  );

  // revalida quando os itens mudam (ou ao recarregar a página com cupom salvo)
  useEffect(() => {
    if (!code || items.length === 0) {
      setDiscount(0);
      return;
    }
    if (first.current) first.current = false;
    void validate(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey]);

  return {
    code,
    discountCents,
    error,
    loading,
    apply: (c: string) => validate(c.trim()),
    remove: () => {
      setCoupon(null);
      setDiscount(0);
      setError(null);
    },
  };
}
