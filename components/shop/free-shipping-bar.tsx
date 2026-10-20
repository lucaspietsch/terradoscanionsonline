"use client";
import { Leaf } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { freeShippingProgress, isFreeShipping, remainingForFreeShipping } from "@/lib/shipping";
import { cn } from "@/lib/utils";

export function FreeShippingBar({ subtotalCents, thresholdCents, className }: { subtotalCents: number; thresholdCents: number; className?: string }) {
  const won = isFreeShipping(subtotalCents, thresholdCents);
  const remaining = remainingForFreeShipping(subtotalCents, thresholdCents);
  const pct = Math.round(freeShippingProgress(subtotalCents, thresholdCents) * 100);

  return (
    <div className={cn("rounded border border-concreto bg-pedra p-4", className)}>
      <p className="flex items-center gap-2 text-sm text-sombra" aria-live="polite">
        <Leaf className={cn("h-4 w-4 shrink-0", won ? "text-musgo" : "text-salvia")} strokeWidth={1.5} aria-hidden />
        {won ? (
          <span>Você ganhou frete grátis</span>
        ) : (
          <span>
            Faltam <strong className="font-medium">{formatBRL(remaining)}</strong> para você ganhar frete grátis
          </span>
        )}
      </p>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-concreto/60"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Progresso para frete grátis"
      >
        <div className="h-full rounded-full bg-musgo transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
