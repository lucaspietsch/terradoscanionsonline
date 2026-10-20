import { api, json } from "@/lib/server/api";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/server/auth";

export const DELETE = api<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  await prisma.address.deleteMany({ where: { id, userId: user.id } });
  return json({ ok: true });
});
