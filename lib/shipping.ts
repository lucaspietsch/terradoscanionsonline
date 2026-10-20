/**
 * Regras de frete — funções puras (sem I/O) para poderem ser testadas e usadas
 * tanto no servidor (fonte da verdade) quanto no cliente (apenas exibição).
 */

/** Padrão: R$ 160,00 em centavos. Configurável no admin (Setting `free_shipping_threshold`). */
export const DEFAULT_FREE_SHIPPING_THRESHOLD_CENTS = 16000;

/** Embalagem reforçada: +10% no peso. */
export const PACKAGING_WEIGHT_FACTOR = 1.1;

export type ShippingKind = "CARRIER" | "PICKUP";

export interface ShippingOption {
  id: string;
  kind: ShippingKind;
  carrier: string;
  name: string;
  priceCents: number;
  /** Valor cheio antes da regra de frete grátis (só preenchido quando a opção foi zerada). */
  originalPriceCents?: number;
  days: number;
  free: boolean;
}

/** Frete grátis é ESTRITAMENTE acima do limite: subtotal > limite. Exatamente R$ 160,00 não ganha. */
export function isFreeShipping(subtotalCents: number, thresholdCents: number): boolean {
  return subtotalCents > thresholdCents;
}

/** Quanto falta (em centavos) para o subtotal ficar acima do limite. 0 quando já ganhou. */
export function remainingForFreeShipping(subtotalCents: number, thresholdCents: number): number {
  if (isFreeShipping(subtotalCents, thresholdCents)) return 0;
  // Regra estrita: precisa passar do limite, então falta pelo menos 1 centavo mesmo quando subtotal == limite.
  return thresholdCents - subtotalCents + 1;
}

/** Progresso 0..1 da barra de frete grátis. */
export function freeShippingProgress(subtotalCents: number, thresholdCents: number): number {
  if (thresholdCents <= 0) return 1;
  if (isFreeShipping(subtotalCents, thresholdCents)) return 1;
  return Math.max(0, Math.min(0.99, subtotalCents / thresholdCents));
}

/**
 * Aplica a regra de frete grátis às opções cotadas:
 *  - subtotal <= limite: nada muda;
 *  - subtotal  > limite: a opção de transportadora MAIS ECONÔMICA vira "Grátis"; as demais mantêm o valor normal.
 * Retirada no local já é R$ 0 e nunca é alterada.
 */
export function applyFreeShippingRule(
  options: ShippingOption[],
  subtotalCents: number,
  thresholdCents: number,
): ShippingOption[] {
  if (!isFreeShipping(subtotalCents, thresholdCents)) return options.map((o) => ({ ...o }));

  const carriers = options.filter((o) => o.kind === "CARRIER");
  if (carriers.length === 0) return options.map((o) => ({ ...o }));

  const cheapest = carriers.reduce((best, o) =>
    o.priceCents < best.priceCents || (o.priceCents === best.priceCents && o.days > best.days) ? o : best,
  );

  return options.map((o) =>
    o.id === cheapest.id
      ? { ...o, originalPriceCents: o.priceCents, priceCents: 0, free: true }
      : { ...o },
  );
}

export interface PackageItem {
  quantity: number;
  weightGrams: number;
  heightCm: number;
  widthCm: number;
  depthCm: number;
}

export interface ShippingPackage {
  weightGrams: number;
  heightCm: number;
  widthCm: number;
  lengthCm: number;
}

// Mínimos aceitos pelos Correios para caixa.
const MIN_HEIGHT = 2;
const MIN_WIDTH = 11;
const MIN_LENGTH = 16;

/**
 * Soma os itens em uma única caixa: peso somado (+10% de embalagem reforçada),
 * peças empilhadas na altura e largura/comprimento da maior peça (+2 cm de proteção por lado).
 */
export function buildPackage(items: PackageItem[]): ShippingPackage {
  let weight = 0;
  let height = 0;
  let width = 0;
  let length = 0;
  for (const it of items) {
    weight += it.weightGrams * it.quantity;
    height += it.heightCm * it.quantity;
    width = Math.max(width, it.widthCm);
    length = Math.max(length, it.depthCm);
  }
  const pad = items.length ? 2 : 0;
  return {
    weightGrams: Math.ceil(weight * PACKAGING_WEIGHT_FACTOR),
    heightCm: Math.max(MIN_HEIGHT, Math.ceil(height + pad)),
    widthCm: Math.max(MIN_WIDTH, Math.ceil(width + pad)),
    lengthCm: Math.max(MIN_LENGTH, Math.ceil(length + pad)),
  };
}

// ---------- Fallback: tabela fixa por região ----------

export type Region = "N" | "NE" | "CO" | "SE" | "S";

/** Faixas de CEP (5 primeiros dígitos) por região, conforme a tabela de faixas dos Correios. */
const CEP_RANGES: [number, number, Region][] = [
  [1000, 39999, "SE"], // SP, RJ, ES, MG
  [40000, 65999, "NE"], // BA, SE, PE, AL, PB, RN, CE, PI, MA
  [66000, 69999, "N"], // PA, AP, AM, RR, AC
  [70000, 76799, "CO"], // DF, GO
  [76800, 77999, "N"], // RO, TO
  [78000, 78899, "CO"], // MT
  [78900, 78999, "N"], // RO
  [79000, 79999, "CO"], // MS
  [80000, 99999, "S"], // PR, SC, RS
];

export function regionFromCep(cep: string): Region | null {
  const d = cep.replace(/\D/g, "");
  if (d.length !== 8) return null;
  const n = Number(d.slice(0, 5));
  return CEP_RANGES.find(([a, b]) => n >= a && n <= b)?.[2] ?? null;
}

type Zone = "same" | "near" | "far";

const NEAR: Record<Region, Region[]> = {
  S: ["SE"],
  SE: ["S", "CO", "NE"],
  CO: ["SE", "N", "NE"],
  NE: ["SE", "CO", "N"],
  N: ["CO", "NE"],
};

function zoneBetween(from: Region, to: Region): Zone {
  if (from === to) return "same";
  return NEAR[from].includes(to) ? "near" : "far";
}

interface TableRate {
  baseCents: number;
  perKgCents: number;
  days: number;
}

const PAC_TABLE: Record<Zone, TableRate> = {
  same: { baseCents: 1800, perKgCents: 350, days: 5 },
  near: { baseCents: 2400, perKgCents: 550, days: 8 },
  far: { baseCents: 3200, perKgCents: 850, days: 12 },
};
const SEDEX_TABLE: Record<Zone, TableRate> = {
  same: { baseCents: 2900, perKgCents: 600, days: 2 },
  near: { baseCents: 4000, perKgCents: 950, days: 4 },
  far: { baseCents: 5400, perKgCents: 1400, days: 6 },
};

/** Tabela fixa por região, usada quando a API do Melhor Envio não está configurada ou falha. */
export function fallbackTableOptions(
  destCep: string,
  originCep: string,
  pkg: ShippingPackage,
): ShippingOption[] {
  const to = regionFromCep(destCep);
  const from = regionFromCep(originCep) ?? "S";
  if (!to) return [];
  const zone = zoneBetween(from, to);
  const kg = Math.max(1, Math.ceil(pkg.weightGrams / 1000));
  const mk = (id: string, name: string, t: TableRate): ShippingOption => ({
    id,
    kind: "CARRIER",
    carrier: "Correios",
    name,
    priceCents: t.baseCents + t.perKgCents * (kg - 1),
    days: t.days,
    free: false,
  });
  return [mk("table:pac", "PAC", PAC_TABLE[zone]), mk("table:sedex", "SEDEX", SEDEX_TABLE[zone])];
}

export const PICKUP_OPTION_ID = "pickup";

export function pickupOption(): ShippingOption {
  return {
    id: PICKUP_OPTION_ID,
    kind: "PICKUP",
    carrier: "Cambará Ornamentais",
    name: "Retirar no local",
    priceCents: 0,
    days: 2,
    free: true,
  };
}
