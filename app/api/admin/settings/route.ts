import { revalidatePath } from "next/cache";
import { api, json, parseBody } from "@/lib/server/api";
import { settingsInputSchema } from "@/lib/validators";
import { saveSettings } from "@/lib/data/settings";

export const PUT = api(
  async (req) => {
    const s = await parseBody(req, settingsInputSchema);
    await saveSettings({
      free_shipping_threshold: String(s.free_shipping_threshold),
      origin_cep: s.origin_cep,
      whatsapp: s.whatsapp,
      instagram: s.instagram,
      announcement: s.announcement,
      pickup_enabled: String(s.pickup_enabled),
      pickup_address: s.pickup_address,
      contact_email: s.contact_email,
    });
    revalidatePath("/", "layout");
    return json({ ok: true });
  },
  { admin: true },
);
