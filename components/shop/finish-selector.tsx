"use client";
import { cn } from "@/lib/utils";

interface Finish {
  id: string;
  name: string;
  hex: string;
  hex2?: string | null;
  stock: number;
  comingSoon?: boolean;
}

export { FinishDot } from "@/components/shop/finish-dot";

export function FinishSelector({ finishes, value, onChange }: { finishes: Finish[]; value: string; onChange: (id: string) => void }) {
  const selected = finishes.find((f) => f.id === value);
  return (
    <fieldset>
      <legend className="eyebrow mb-3">
        Acabamento: <span className="normal-case tracking-normal text-sombra">{selected?.name}{selected?.comingSoon ? " (em breve)" : ""}</span>
      </legend>
      <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Acabamento">
        {finishes.map((f) => {
          const active = f.id === value;
          const soon = Boolean(f.comingSoon);
          const out = f.stock <= 0 && !soon;
          const label = `${f.name}${soon ? " (em breve)" : out ? " (esgotado)" : ""}`;
          return (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={label}
              title={label}
              onClick={() => onChange(f.id)}
              className={cn(
                "relative flex h-11 w-11 items-center justify-center rounded-full border transition-all",
                active ? "border-musgo ring-1 ring-musgo ring-offset-2 ring-offset-nevoa" : "border-concreto hover:border-musgo",
                out && "opacity-50",
                soon && "border-dashed",
              )}
            >
              <span className="h-7 w-7 rounded-full border border-sombra/15" style={{ background: f.hex2 ? `linear-gradient(135deg, ${f.hex} 50%, ${f.hex2} 50%)` : f.hex }} />
              {out && <span aria-hidden className="absolute h-px w-9 rotate-45 bg-sombra/60" />}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function QuantityInput({ value, onChange, max = 99, size = "md" }: { value: number; onChange: (n: number) => void; max?: number; size?: "sm" | "md" }) {
  const btn = cn("flex items-center justify-center text-musgo hover:bg-musgo/10 disabled:opacity-40", size === "sm" ? "h-8 w-8" : "h-11 w-11");
  return (
    <div className={cn("inline-flex items-center rounded border border-concreto bg-pedra", size === "sm" ? "h-8" : "h-11")}>
      <button type="button" className={btn} aria-label="Diminuir quantidade" disabled={value <= 1} onClick={() => onChange(value - 1)}>
        −
      </button>
      <span className={cn("min-w-8 text-center tabular-nums", size === "sm" ? "text-sm" : "text-base")} aria-live="polite" aria-label={`Quantidade: ${value}`}>
        {value}
      </span>
      <button type="button" className={btn} aria-label="Aumentar quantidade" disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}
