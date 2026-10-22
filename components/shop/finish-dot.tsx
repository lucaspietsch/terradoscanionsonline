import { cn } from "@/lib/utils";

/** Bolinha de cor; com `hex2` vira um círculo dividido ao meio (acabamentos bicolores). */
export function FinishDot({ hex, hex2, className }: { hex: string; hex2?: string | null; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block h-4 w-4 rounded-full border border-sombra/20", className)}
      style={{ background: hex2 ? `linear-gradient(135deg, ${hex} 50%, ${hex2} 50%)` : hex }}
    />
  );
}
