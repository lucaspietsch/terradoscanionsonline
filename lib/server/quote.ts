import "server-only";
import {
  applyFreeShippingRule,
  buildPackage,
  fallbackTableOptions,
  isFreeShipping,
  pickupOption,
  remainingForFreeShipping,
  type ShippingOption,
} from "@/lib/shipping";
import { hasMelhorEnvio, melhorEnvioQuote } from "@/lib/server/melhor-envio";
import type { ResolvedLine, SiteSettings } from "@/types";

export interface QuoteResult {
  options: ShippingOption[];
  subtotalCents: number;
  thresholdCents: number;
  freeShipping: boolean;
  remainingCents: number;
  source: "melhor-envio" | "tabela" | "nenhuma";
}

/**
 * Fonte única da verdade para frete. Usada pela cotação pública E pelo checkout
 * (que recotiza no servidor e ignora qualquer preço vindo do front).
 */
export async function quoteShipping(cep: string, lines: ResolvedLine[], settings: SiteSettings): Promise<QuoteResult> {
  const subtotalCents = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  const pkg = buildPackage(lines);

  let carriers: ShippingOption[] = [];
  let source: QuoteResult["source"] = "nenhuma";

  if (hasMelhorEnvio()) {
    try {
      carriers = await melhorEnvioQuote(settings.originCep, cep, pkg, subtotalCents);
      if (carriers.length) source = "melhor-envio";
    } catch (err) {
      console.error("[frete] Melhor Envio falhou, usando tabela fixa:", err instanceof Error ? err.message : err);
    }
  }
  if (!carriers.length) {
    carriers = fallbackTableOptions(cep, settings.originCep, pkg);
    if (carriers.length) source = "tabela";
  }

  const withRule = applyFreeShippingRule(carriers, subtotalCents, settings.freeShippingThresholdCents);
  const options = settings.pickupEnabled ? [...withRule, pickupOption()] : withRule;

  return {
    options,
    subtotalCents,
    thresholdCents: settings.freeShippingThresholdCents,
    freeShipping: isFreeShipping(subtotalCents, settings.freeShippingThresholdCents),
    remainingCents: remainingForFreeShipping(subtotalCents, settings.freeShippingThresholdCents),
    source,
  };
}
