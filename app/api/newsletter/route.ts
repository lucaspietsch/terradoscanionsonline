import { api, json, parseBody } from "@/lib/server/api";
import { newsletterSchema } from "@/lib/validators";
import { prisma, hasDatabase } from "@/lib/db";
import { HttpError } from "@/lib/server/auth";

export const POST = api(
  async (req) => {
    const { email } = await parseBody(req, newsletterSchema);
    if (!hasDatabase) throw new HttpError(503, "Inscrição indisponível no momento.");
    await prisma.newsletterSubscriber.upsert({ where: { email }, create: { email }, update: {} });
    return json({ ok: true });
  },
  { rate: { limit: 5, windowMs: 60_000 } },
);
