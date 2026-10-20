import { api, json, parseBody } from "@/lib/server/api";
import { contactSchema } from "@/lib/validators";
import { prisma, hasDatabase } from "@/lib/db";
import { getSettings } from "@/lib/data/settings";
import { mails, sendMail } from "@/lib/server/mail";

export const POST = api(
  async (req) => {
    const data = await parseBody(req, contactSchema);
    if (data.website) return json({ ok: true }); // honeypot preenchido: finge sucesso
    if (hasDatabase) await prisma.contactMessage.create({ data: { name: data.name, email: data.email, message: data.message } });
    const settings = await getSettings();
    await sendMail({ to: settings.contactEmail, replyTo: data.email, ...mails.contact(data.name, data.email, data.message) });
    return json({ ok: true });
  },
  { rate: { limit: 5, windowMs: 60_000 } },
);
