import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/data/catalog";
import { site } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts().catch(() => []);
  const now = new Date();
  const staticPages = ["", "/vasos", "/sobre", "/cuidados", "/trocas-e-devolucoes", "/privacidade", "/termos", "/contato"];
  return [
    ...staticPages.map((p) => ({ url: `${site.url}${p}`, lastModified: now, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...products.map((p) => ({ url: `${site.url}/vasos/${p.slug}`, lastModified: new Date(p.createdAt), changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
