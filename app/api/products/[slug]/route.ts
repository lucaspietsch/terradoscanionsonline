import { api, json } from "@/lib/server/api";
import { getProductBySlug } from "@/lib/data/catalog";
import { HttpError } from "@/lib/server/auth";

export const GET = api<{ params: Promise<{ slug: string }> }>(async (_req, { params }) => {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) throw new HttpError(404, "Produto não encontrado.");
  return json({ product });
});
