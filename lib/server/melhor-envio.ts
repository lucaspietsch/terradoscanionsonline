import "server-only";
import type { ShippingOption, ShippingPackage } from "@/lib/shipping";

const BASE = () =>
  process.env.MELHOR_ENVIO_ENV === "production" ? "https://melhorenvio.com.br" : "https://sandbox.melhorenvio.com.br";

export const hasMelhorEnvio = () => Boolean(process.env.MELHOR_ENVIO_TOKEN);

interface MeService {
  id: number;
  name: string;
  price?: string | number;
  custom_price?: string | number;
  delivery_time?: number;
  custom_delivery_time?: number;
  company?: { name?: string };
  error?: string;
}

/** Cotação via Melhor Envio. Lança em caso de falha — o chamador cai na tabela fixa. */
export async function melhorEnvioQuote(
  originCep: string,
  destCep: string,
  pkg: ShippingPackage,
  insuranceCents: number,
): Promise<ShippingOption[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(`${BASE()}/api/v2/me/shipment/calculate`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
        "User-Agent": `Cambara Ornamentais (${process.env.MELHOR_ENVIO_CONTACT_EMAIL ?? "contato@example.com"})`,
      },
      body: JSON.stringify({
        from: { postal_code: originCep },
        to: { postal_code: destCep },
        package: {
          height: pkg.heightCm,
          width: pkg.widthCm,
          length: pkg.lengthCm,
          weight: Math.max(0.1, pkg.weightGrams / 1000),
        },
        options: { receipt: false, own_hand: false, insurance_value: insuranceCents / 100 },
        services: process.env.MELHOR_ENVIO_SERVICES ?? "1,2,3,4",
      }),
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Melhor Envio HTTP ${res.status}`);
    const data = (await res.json()) as MeService[];
    if (!Array.isArray(data)) throw new Error("Resposta inesperada do Melhor Envio");

    return data
      .filter((s) => !s.error && (s.custom_price ?? s.price) != null)
      .map<ShippingOption>((s) => ({
        id: `me:${s.id}`,
        kind: "CARRIER",
        carrier: s.company?.name ?? "Transportadora",
        name: s.name,
        priceCents: Math.round(Number(s.custom_price ?? s.price) * 100),
        days: Number(s.custom_delivery_time ?? s.delivery_time ?? 0) || 0,
        free: false,
      }))
      .filter((o) => Number.isFinite(o.priceCents) && o.priceCents >= 0)
      .sort((a, b) => a.priceCents - b.priceCents);
  } finally {
    clearTimeout(timer);
  }
}
