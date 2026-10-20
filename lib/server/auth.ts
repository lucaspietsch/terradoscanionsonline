import "server-only";
import { prisma, hasDatabase } from "@/lib/db";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
}

/** Usuário autenticado (Supabase Auth) + role vinda do banco. null se anônimo. */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!env.hasSupabase) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const name = (user.user_metadata?.full_name as string | undefined) ?? (user.user_metadata?.name as string | undefined) ?? null;
  let isAdmin = false;

  if (hasDatabase) {
    const row = await prisma.user.upsert({
      where: { id: user.id },
      create: { id: user.id, email: user.email, name },
      update: {},
      select: { role: true, name: true },
    });
    isAdmin = row.role === "ADMIN" && user.app_metadata?.role === "admin";
    return { id: user.id, email: user.email, name: row.name ?? name, isAdmin };
  }
  return { id: user.id, email: user.email, name, isAdmin: user.app_metadata?.role === "admin" };
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public extra?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) throw new HttpError(401, "Faça login para continuar.");
  return u;
}

export async function requireAdmin(): Promise<SessionUser> {
  const u = await requireUser();
  if (!u.isAdmin) throw new HttpError(403, "Acesso negado.");
  return u;
}
