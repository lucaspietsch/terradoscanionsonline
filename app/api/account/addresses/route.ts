import { api, json, parseBody } from "@/lib/server/api";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/server/auth";
import { addressSchema } from "@/lib/validators";

export const GET = api(async () => {
  const user = await requireUser();
  return json({ addresses: await prisma.address.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }) });
});

export const POST = api(async (req) => {
  const user = await requireUser();
  const a = await parseBody(req, addressSchema);
  const count = await prisma.address.count({ where: { userId: user.id } });
  if (count >= 10) return json({ error: "Limite de 10 endereços." }, { status: 400 });
  const created = await prisma.address.create({
    data: { userId: user.id, cep: a.cep, street: a.street, number: a.number, complement: a.complement || null, neighborhood: a.neighborhood, city: a.city, state: a.state, isDefault: count === 0 },
  });
  return json({ address: created }, { status: 201 });
});
