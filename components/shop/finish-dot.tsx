import { cn } from "@/lib/utils";

export function FinishDot({ hex, className }: { hex: string; className?: string }) {
  return <span aria-hidden className={cn("inline-block h-4 w-4 rounded-full border border-sombra/20", className)} style={{ backgroundColor: hex }} />;
}
