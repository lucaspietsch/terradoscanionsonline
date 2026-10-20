import crypto from "node:crypto";
import { api, json } from "@/lib/server/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { HttpError } from "@/lib/server/auth";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 6 * 1024 * 1024;

/** Upload múltiplo de fotos para o bucket público `products` do Supabase Storage. */
export const POST = api(
  async (req) => {
    const form = await req.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    if (!files.length) throw new HttpError(400, "Nenhum arquivo enviado.");
    if (files.length > 12) throw new HttpError(400, "Envie no máximo 12 fotos por vez.");

    const supabase = createAdminClient();
    const urls: string[] = [];
    for (const file of files) {
      const ext = TYPES[file.type];
      if (!ext) throw new HttpError(400, `Formato não suportado: ${file.name}. Use JPG, PNG ou WebP.`);
      if (file.size > MAX_BYTES) throw new HttpError(400, `${file.name} passa de 6 MB.`);
      const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("products").upload(path, await file.arrayBuffer(), { contentType: file.type, cacheControl: "31536000" });
      if (error) throw new HttpError(502, `Falha ao enviar ${file.name}: ${error.message}`);
      urls.push(supabase.storage.from("products").getPublicUrl(path).data.publicUrl);
    }
    return json({ urls }, { status: 201 });
  },
  { admin: true, rate: { limit: 30, windowMs: 60_000 } },
);
