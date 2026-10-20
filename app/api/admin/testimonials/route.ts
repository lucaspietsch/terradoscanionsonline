import { revalidatePath } from "next/cache";
import { api, json, parseBody } from "@/lib/server/api";
import { prisma } from "@/lib/db";
import { testimonialInputSchema } from "@/lib/validators";

export const GET = api(async () => json({ testimonials: await prisma.testimonial.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] }) }), { admin: true });

export const POST = api(
  async (req) => {
    const t = await parseBody(req, testimonialInputSchema);
    const created = await prisma.testimonial.create({ data: { author: t.author, location: t.location || null, text: t.text, published: t.published, order: t.order } });
    revalidatePath("/");
    return json({ testimonial: created }, { status: 201 });
  },
  { admin: true },
);
