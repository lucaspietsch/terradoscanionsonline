import { api, json, parseBody } from "@/lib/server/api";
import { orderUpdateSchema } from "@/lib/validators";
import { adminUpdateOrder } from "@/lib/server/orders";

export const PATCH = api<{ params: Promise<{ id: string }> }>(
  async (req, { params }) => {
    const { id } = await params;
    const patch = await parseBody(req, orderUpdateSchema);
    const order = await adminUpdateOrder(id, patch);
    return json({ status: order.status, trackingCode: order.trackingCode });
  },
  { admin: true },
);
