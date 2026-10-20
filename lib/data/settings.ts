import { hasDatabase, prisma } from "@/lib/db";
import { site } from "@/lib/site";
import { DEFAULT_FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/shipping";
import type { SiteSettings, TestimonialDTO } from "@/types";

export const SETTING_KEYS = [
  "free_shipping_threshold",
  "origin_cep",
  "whatsapp",
  "instagram",
  "announcement",
  "pickup_enabled",
  "pickup_address",
  "max_installments",
  "contact_email",
] as const;

export function defaultSettings(): SiteSettings {
  return {
    freeShippingThresholdCents: DEFAULT_FREE_SHIPPING_THRESHOLD_CENTS,
    originCep: site.originCep,
    whatsapp: site.whatsapp,
    instagram: site.instagramHandle,
    announcement: "",
    pickupEnabled: true,
    pickupAddress: site.pickupAddress,
    maxInstallments: 3,
    contactEmail: site.email,
  };
}

export async function getSettings(): Promise<SiteSettings> {
  const d = defaultSettings();
  if (!hasDatabase) return d;
  try {
    const rows = await prisma.setting.findMany();
    const m = new Map(rows.map((r) => [r.key, r.value]));
    const int = (k: string, fallback: number) => {
      const n = Number.parseInt(m.get(k) ?? "", 10);
      return Number.isFinite(n) ? n : fallback;
    };
    return {
      freeShippingThresholdCents: int("free_shipping_threshold", d.freeShippingThresholdCents),
      originCep: m.get("origin_cep") || d.originCep,
      whatsapp: m.get("whatsapp") || d.whatsapp,
      instagram: m.get("instagram") || d.instagram,
      announcement: m.get("announcement") ?? d.announcement,
      pickupEnabled: (m.get("pickup_enabled") ?? "true") === "true",
      pickupAddress: m.get("pickup_address") || d.pickupAddress,
      maxInstallments: Math.min(3, Math.max(1, int("max_installments", 3))),
      contactEmail: m.get("contact_email") || d.contactEmail,
    };
  } catch (err) {
    console.error("[settings] falha ao ler configurações, usando padrões", err);
    return d;
  }
}

export async function saveSettings(patch: Partial<Record<(typeof SETTING_KEYS)[number], string>>) {
  await prisma.$transaction(
    Object.entries(patch).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, create: { key, value: value ?? "" }, update: { value: value ?? "" } }),
    ),
  );
}

export async function getTestimonials(): Promise<TestimonialDTO[]> {
  if (!hasDatabase) return [];
  try {
    const rows = await prisma.testimonial.findMany({ where: { published: true }, orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
    return rows.map((t) => ({ id: t.id, author: t.author, location: t.location, text: t.text }));
  } catch {
    return [];
  }
}
