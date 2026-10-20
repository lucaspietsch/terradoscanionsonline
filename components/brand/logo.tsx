import { cn } from "@/lib/utils";

/** Símbolo oficial: "C" desenhado como vaso, com base e duas folhas. Cores por variante. */
export function LogoSymbol({
  size = 36,
  variant = "dark",
  className,
  title = "Cambará Ornamentais",
}: {
  size?: number;
  variant?: "dark" | "light";
  className?: string;
  title?: string | null;
}) {
  const stroke = variant === "dark" ? "#2F3E2C" : "#ECEAE5";
  const leafB = variant === "dark" ? "#2F3E2C" : "#ECEAE5";
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
      className={className}
    >
      <path d="M86.9 39.1 A38 38 0 1 0 86.9 92.9" fill="none" stroke={stroke} strokeWidth="11" strokeLinecap="round" />
      <path d="M46 113 L74 113" fill="none" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
      <path d="M88 37 C 85 24, 91 12, 103 5 C 107 19, 101 31, 88 37 Z" fill="#8A9A7B" />
      <path d="M86 37 C 75 30, 71 18, 73 7 C 85 13, 90 25, 86 37 Z" fill={leafB} />
    </svg>
  );
}

/** Símbolo + "Cambará" (Jost 300, tracking .06em) + "ORNAMENTAIS" (Jost 400, 10px, tracking .5em). */
export function Logo({ variant = "dark", className }: { variant?: "dark" | "light"; className?: string }) {
  const color = variant === "dark" ? "text-musgo" : "text-nevoa";
  const sub = variant === "dark" ? "text-secundario" : "text-concreto";
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LogoSymbol size={36} variant={variant} title={null} />
      <span className="flex flex-col leading-none">
        <span className={cn("font-sans text-[1.65rem] font-light tracking-logo", color)}>Cambará</span>
        <span className={cn("mt-1.5 font-sans text-[10px] font-normal uppercase tracking-logoSub", sub)}>Ornamentais</span>
      </span>
      <span className="sr-only">Cambará Ornamentais — página inicial</span>
    </span>
  );
}
