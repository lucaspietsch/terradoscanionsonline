"use client";
import { useState } from "react";
import { Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBRL } from "@/lib/money";
import type { useCoupon } from "@/lib/use-coupon";

export function CouponForm({ coupon }: { coupon: ReturnType<typeof useCoupon> }) {
  const [value, setValue] = useState("");

  if (coupon.code && !coupon.error) {
    return (
      <div className="flex items-center justify-between gap-3 rounded border border-salvia bg-salvia/15 px-4 py-3 text-sm">
        <span className="flex items-center gap-2 text-musgo">
          <Tag className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          <strong className="font-medium">{coupon.code}</strong>
          {coupon.discountCents > 0 && <span>− {formatBRL(coupon.discountCents)}</span>}
        </span>
        <button type="button" onClick={coupon.remove} className="rounded p-1 text-secundario hover:text-erro" aria-label="Remover cupom">
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (value.trim() && (await coupon.apply(value))) setValue("");
      }}
      className="space-y-2"
    >
      <label htmlFor="coupon" className="eyebrow">Cupom de desconto</label>
      <div className="flex gap-2">
        <Input id="coupon" value={value} onChange={(e) => setValue(e.target.value.toUpperCase())} placeholder="Digite o cupom" autoComplete="off" aria-invalid={Boolean(coupon.error)} />
        <Button type="submit" variant="secondary" loading={coupon.loading} className="shrink-0">Aplicar</Button>
      </div>
      {coupon.error && <p role="alert" className="text-sm text-erro">{coupon.error}</p>}
    </form>
  );
}
