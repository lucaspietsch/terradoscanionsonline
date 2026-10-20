/** Todos os valores monetários do sistema são inteiros em centavos. */
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(cents: number): string {
  // Intl usa NBSP entre "R$" e o valor; normalizamos para espaço comum para facilitar testes e cópia.
  return brl.format(cents / 100).replace(/ /g, " ");
}

/** "35,00" | "35.00" | "1.234,56" -> 3500 */
export function parseBRLToCents(input: string): number {
  const clean = input.trim().replace(/[^\d,.-]/g, "");
  if (!clean) return 0;
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function centsToDecimal(cents: number): number {
  return Math.round(cents) / 100;
}

export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}
