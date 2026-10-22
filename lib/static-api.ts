/**
 * "API" que roda no navegador para a VERSÃO ESTÁTICA do site (sem servidor): intercepta as chamadas a /api/*
 * feitas pelo carrinho, pelo cálculo de frete e pela busca e responde com as mesmas regras do servidor
 * (tabela de frete por região, frete grátis acima de R$ 160, retirada no local).
 * Não é usado na versão com servidor — lá a API real recalcula tudo.
 */
import { filterAndSort } from "@/lib/catalog/filter";
import { toCard } from "@/lib/catalog/format";
import { staticProducts } from "@/lib/catalog/static";
import {
  DEFAULT_FREE_SHIPPING_THRESHOLD_CENTS,
  applyFreeShippingRule,
  buildPackage,
  fallbackTableOptions,
  isFreeShipping,
  pickupOption,
  regionFromCep,
  remainingForFreeShipping,
} from "@/lib/shipping";
import { site } from "@/lib/site";

const reply = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

interface Line { productId: string; finishId: string; quantity: number }

function quote(body: { cep?: string; items?: Line[] }) {
  const cep = String(body.cep ?? "").replace(/\D/g, "");
  if (!regionFromCep(cep)) return reply({ error: "CEP não encontrado." }, 400);

  const lines = (body.items ?? []).flatMap((i) => {
    const p = staticProducts.find((x) => x.id === i.productId);
    const v = p?.variants.find((x) => x.finish.id === i.finishId);
    return p && v ? [{ p, quantity: Math.max(1, Math.min(99, Math.floor(i.quantity))) }] : [];
  });
  if (!lines.length) return reply({ error: "Nenhum item válido para cotar." }, 400);

  const subtotalCents = lines.reduce((s, l) => s + l.p.priceCents * l.quantity, 0);
  const pkg = buildPackage(lines.map((l) => ({ quantity: l.quantity, weightGrams: l.p.weightGrams, heightCm: l.p.heightCm, widthCm: l.p.widthCm, depthCm: l.p.depthCm ?? l.p.widthCm })));
  const carriers = fallbackTableOptions(cep, site.originCep, pkg);
  if (!carriers.length) return reply({ error: "Não foi possível calcular o frete para este CEP." }, 422);

  const threshold = DEFAULT_FREE_SHIPPING_THRESHOLD_CENTS;
  return reply({
    options: [...applyFreeShippingRule(carriers, subtotalCents, threshold), pickupOption()],
    subtotalCents,
    thresholdCents: threshold,
    freeShipping: isFreeShipping(subtotalCents, threshold),
    remainingCents: remainingForFreeShipping(subtotalCents, threshold),
    source: "tabela",
  });
}

const UNAVAILABLE = "Indisponível nesta versão do site. Fale com a gente pelo WhatsApp.";

export function installStaticApi() {
  if (typeof window === "undefined" || (window as unknown as { __cbStaticApi?: boolean }).__cbStaticApi) return;
  (window as unknown as { __cbStaticApi?: boolean }).__cbStaticApi = true;
  const original = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw, window.location.href);
    if (url.origin !== window.location.origin || !url.pathname.startsWith("/api/")) return original(input, init);

    const path = url.pathname.replace(/\/$/, "");
    let body: Record<string, unknown> = {};
    try { body = init?.body ? JSON.parse(String(init.body)) : {}; } catch { /* corpo vazio */ }

    switch (path) {
      case "/api/shipping/quote": return quote(body as { cep?: string; items?: Line[] });
      case "/api/products": return reply({ products: filterAndSort(staticProducts.map(toCard), { q: url.searchParams.get("q") ?? undefined, categoria: url.searchParams.get("categoria") ?? undefined }) });
      case "/api/coupon": return reply({ error: "Cupom inválido." }, 400);
      case "/api/cart": return reply({ items: [] });
      case "/api/wishlist": return reply({ productIds: [] });
      default: return reply({ error: UNAVAILABLE }, 503);
    }
  };
}
