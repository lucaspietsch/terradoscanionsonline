import { cn } from "@/lib/utils";

export function Badge({ className, tone = "sage", ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: "sage" | "dark" | "outline" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-1 text-[0.6875rem] font-normal uppercase leading-none tracking-[0.16em]",
        tone === "sage" && "bg-salvia/25 text-musgo",
        tone === "dark" && "bg-musgo text-pedra",
        tone === "outline" && "border border-concreto text-secundario",
        className,
      )}
      {...props}
    />
  );
}
