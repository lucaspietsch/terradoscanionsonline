import { revalidatePath } from "next/cache";
import { api, json, parseBody } from "@/lib/server/api";
import { prisma } from "@/lib/db";
import { testimonialInputSchema } from "@/lib/validators";

export const PUT = api<{ params: Promise<{ id: string }> }>(
  async (req, { params }) => {
    const { id } = await params;
    const t = await parseBody(req, testimonialInputSchema);
    await prisma.testimonial.update({ where: { id }, data: { author: t.author, location: t.location || null, text: t.text, published: t.published, order: t.order } });
    revalidatePath("/");
    return json({ ok: true });
  },
  { admin: true },
);

export const DELETE = api<{ params: Promise<{ id: string }> }>(
  async (_req, { params }) => {
    const { id } = await params;
    await prisma.testimonial.delete({ where: { id } });
    revalidatePath("/");
    return json({ ok: true });
  },
  { admin: true },
);
