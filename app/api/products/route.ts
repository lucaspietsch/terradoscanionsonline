import { api, json } from "@/lib/server/api";
import { getProductCards } from "@/lib/data/catalog";
import { filterAndSort, type SortKey } from "@/lib/catalog/filter";

export const GET = api(async (req) => {
  const sp = new URL(req.url).searchParams;
  const list = filterAndSort(await getProductCards(), {
    q: sp.get("q")?.slice(0, 60) || undefined,
    categoria: sp.get("categoria") || undefined,
    ordem: (sp.get("ordem") as SortKey) || undefined,
  });
  return json({ products: list }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
});
