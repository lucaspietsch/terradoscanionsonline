import { api, json, parseBody } from "@/lib/server/api";
import { quoteSchema } from "@/lib/validators";
import { resolveCartLines } from "@/lib/data/catalog";
import { getSettings } from "@/lib/data/settings";
import { quoteShipping } from "@/lib/server/quote";
import { HttpError } from "@/lib/server/auth";
import { regionFromCep } from "@/lib/shipping";

export const POST = api(
  async (req) => {
    const { cep, items } = await parseBody(req, quoteSchema);
    if (!regionFromCep(cep)) throw new HttpError(400, "CEP não encontrado.");
    const { lines } = await resolveCartLines(items);
    if (!lines.length) throw new HttpError(400, "Nenhum item válido para cotar.");
    const settings = await getSettings();
    const quote = await quoteShipping(cep, lines, settings);
    if (!quote.options.length) throw new HttpError(422, "Não foi possível calcular o frete para este CEP.");
    return json(quote);
  },
  { rate: { limit: 30, windowMs: 60_000 } },
);
