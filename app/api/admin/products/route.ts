import { revalidatePath } from "next/cache";
import { api, json, parseBody } from "@/lib/server/api";
import { getProducts } from "@/lib/data/catalog";
import { productInputSchema } from "@/lib/validators";
import { saveProduct } from "@/lib/server/products";

export const GET = api(async () => json({ products: await getProducts({ includeInactive: true }) }), { admin: true });

export const POST = api(
  async (req) => {
    const input = await parseBody(req, productInputSchema);
    const id = await saveProduct(null, input);
    revalidatePath("/", "layout");
    return json({ id }, { status: 201 });
  },
  { admin: true },
);

export const dynamic = "force-dynamic";
