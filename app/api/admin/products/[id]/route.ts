import { revalidatePath } from "next/cache";
import { api, json, parseBody } from "@/lib/server/api";
import { prisma } from "@/lib/db";
import { productInputSchema } from "@/lib/validators";
import { saveProduct } from "@/lib/server/products";

export const PUT = api<{ params: Promise<{ id: string }> }>(
  async (req, { params }) => {
    const { id } = await params;
    const input = await parseBody(req, productInputSchema);
    await saveProduct(id, input);
    revalidatePath("/", "layout");
    return json({ ok: true });
  },
  { admin: true },
);

export const DELETE = api<{ params: Promise<{ id: string }> }>(
  async (_req, { params }) => {
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    revalidatePath("/", "layout");
    return json({ ok: true });
  },
  { admin: true },
);
