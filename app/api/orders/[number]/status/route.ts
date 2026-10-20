import { api, json } from "@/lib/server/api";
import { prisma, hasDatabase } from "@/lib/db";
import { HttpError } from "@/lib/server/auth";
import { parseOrderNumber } from "@/lib/totals";

/** Polling do Pix: exige o accessToken do pedido (impede enumerar pedidos pelo número). */
export const GET = api<{ params: Promise<{ number: string }> }>(
  async (req, { params }) => {
    const { number } = await params;
    const token = new URL(req.url).searchParams.get("token") ?? "";
    const seq = parseOrderNumber(number);
    if (!hasDatabase || !seq || !token) throw new HttpError(404, "Pedido não encontrado.");
    const order = await prisma.order.findUnique({ where: { seq }, select: { status: true, accessToken: true, paymentStatus: true } });
    if (!order || order.accessToken !== token) throw new HttpError(404, "Pedido não encontrado.");
    return json({ status: order.status, paymentStatus: order.paymentStatus }, { headers: { "Cache-Control": "no-store" } });
  },
  { rate: { limit: 60, windowMs: 60_000 } },
);
