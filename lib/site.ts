/**
 * Dados institucionais. Tudo que estava entre [COLCHETES] no briefing vem de variáveis de ambiente
 * (veja .env.example); os padrões abaixo são marcadores óbvios para você substituir.
 */
export const site = {
  name: "Cambará Ornamentais",
  tagline: "Vasos de cimento feitos à mão",
  description:
    "Vasos de cimento artesanais feitos à mão no Brasil. Peças únicas para trazer o jardim para dentro de casa.",
  url: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "5554999197178", // +55 54 99919-7178 (pedidos), só dígitos com 55
  instagramHandle: process.env.NEXT_PUBLIC_INSTAGRAM ?? "cambaraornamentais", // [SEU @]
  cnpj: process.env.NEXT_PUBLIC_CNPJ ?? "00.000.000/0000-00", // [SEU CNPJ]
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contato@cambaraornamentais.com.br",
  pickupAddress: process.env.NEXT_PUBLIC_PICKUP_ADDRESS ?? "[SEU ENDEREÇO], [SUA CIDADE]",
  originCep: process.env.ORIGIN_CEP ?? "00000000", // [SEU CEP DE ORIGEM]
  ga4Id: process.env.NEXT_PUBLIC_GA4_ID ?? "",
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "",
  mapEmbedUrl: process.env.NEXT_PUBLIC_MAP_EMBED_URL ?? "",
} as const;

export const instagramUrl = (handle: string = site.instagramHandle) =>
  `https://instagram.com/${handle.replace(/^@/, "")}`;

export function whatsappUrl(message?: string, number: string = site.whatsapp) {
  const q = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number.replace(/\D/g, "")}${q}`;
}

export const navLinks = [
  { href: "/vasos#produtos", label: "Vasos" },
  { href: "/vasos?categoria=jardineiras#produtos", label: "Jardineiras" },
  { href: "/sobre", label: "Sobre" },
  { href: "/cuidados", label: "Cuidados" },
  { href: "/contato", label: "Contato" },
] as const;

export const ARTISANAL_NOTICE =
  "Por ser artesanal, cada peça pode ter pequenas variações de cor e textura — é o que a torna única.";
