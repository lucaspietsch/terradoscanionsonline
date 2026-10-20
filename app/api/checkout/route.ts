import { api, json, parseBody } from "@/lib/server/api";
import { checkoutSchema } from "@/lib/validators";
import { createOrderAndPay } from "@/lib/server/orders";
import { getSessionUser, HttpError } from "@/lib/server/auth";
import { hasDatabase } from "@/lib/db";
import { env } from "@/lib/env";

export const POST = api(
  async (req) => {
    if (!hasDatabase || !env.hasMercadoPago) throw new HttpError(503, "A loja ainda não está configurada para receber pedidos.");
    const input = await parseBody(req, checkoutSchema);
    const user = await getSessionUser();
    const result = await createOrderAndPay(input, user);
    return json(result, { status: 201 });
  },
  { rate: { limit: 10, windowMs: 60_000 } },
);
