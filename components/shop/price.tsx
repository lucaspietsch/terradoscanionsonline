import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Preço + "+ frete" (obrigatório em todos os cards e na página do produto). */
export function Price({ cents, size = "md", className }: { cents: number; size?: "md" | "lg"; className?: string }) {
  return (
    <p className={cn("flex items-baseline gap-2", className)}>
      <span className={cn("font-serif font-light text-sombra", size === "lg" ? "text-4xl" : "text-xl")}>{formatBRL(cents)}</span>
      <span className="text-xs uppercase tracking-[0.18em] text-secundario">+ frete</span>
    </p>
  );
}
