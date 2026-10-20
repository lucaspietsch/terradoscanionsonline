import { z } from "zod";
import { api, json, parseBody } from "@/lib/server/api";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/server/auth";
import { isValidCpf, onlyDigits } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().transform(onlyDigits).refine((v) => v === "" || v.length === 10 || v.length === 11, "Telefone inválido"),
  cpf: z.string().transform(onlyDigits).refine((v) => v === "" || isValidCpf(v), "CPF inválido"),
});

export const PUT = api(async (req) => {
  const user = await requireUser();
  const d = await parseBody(req, schema);
  await prisma.user.update({ where: { id: user.id }, data: { name: d.name, phone: d.phone || null, cpf: d.cpf || null } });
  return json({ ok: true });
});
