/**
 * Cria (ou promove) o usuário administrador inicial.
 *
 *   ADMIN_EMAIL=voce@exemplo.com ADMIN_PASSWORD='senha-forte-12+' npm run admin:create
 *   # ou: npm run admin:create -- voce@exemplo.com 'senha-forte-12+'
 *
 * Usa a service role do Supabase (nunca exposta ao navegador): cria o usuário no Supabase Auth com
 * app_metadata.role = "admin" (lida pelo middleware) e grava User.role = ADMIN no banco (lida pelos handlers).
 */
import "./load-env";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const email = (process.argv[2] ?? process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = process.argv[3] ?? process.env.ADMIN_PASSWORD ?? "";
const name = process.env.ADMIN_NAME ?? "Administração";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  if (!email || !email.includes("@")) throw new Error("Informe ADMIN_EMAIL.");
  if (password.length < 12) throw new Error("ADMIN_PASSWORD precisa ter 12 caracteres ou mais.");

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const prisma = new PrismaClient();

  let userId: string | undefined;
  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
    app_metadata: { role: "admin" },
  });

  if (created.error) {
    // já existe: promove e atualiza a senha
    const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = list.data.users.find((u) => u.email?.toLowerCase() === email);
    if (!existing) throw created.error;
    const upd = await supabase.auth.admin.updateUserById(existing.id, { password, app_metadata: { ...existing.app_metadata, role: "admin" } });
    if (upd.error) throw upd.error;
    userId = existing.id;
    console.log("Usuário já existia: promovido a admin e senha atualizada.");
  } else {
    userId = created.data.user.id;
    console.log("Usuário admin criado no Supabase Auth.");
  }

  await prisma.user.upsert({
    where: { id: userId! },
    create: { id: userId!, email, name, role: "ADMIN" },
    update: { role: "ADMIN" },
  });
  await prisma.$disconnect();
  console.log(`Pronto! Entre em /entrar com ${email} e acesse /admin.`);
}

main().catch((e) => {
  console.error("Erro:", e.message ?? e);
  process.exit(1);
});
