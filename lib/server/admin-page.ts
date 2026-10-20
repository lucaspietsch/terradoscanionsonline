import "server-only";
import { redirect } from "next/navigation";
import { hasDatabase } from "@/lib/db";
import { getSessionUser, type SessionUser } from "@/lib/server/auth";

/** Guarda das páginas /admin (o middleware já barra; aqui confirmamos o role no banco). */
export async function requireAdminPage(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/entrar?next=/admin");
  if (!user.isAdmin) redirect("/");
  return user;
}

export const dbReady = () => hasDatabase;

/** Início do dia/mês no horário de Brasília (UTC-3), independente do fuso do servidor. */
export function brtBoundaries(now = new Date()) {
  const shifted = new Date(now.getTime() - 3 * 3600_000);
  const day = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) + 3 * 3600_000;
  const month = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), 1) + 3 * 3600_000;
  return { startOfDay: new Date(day), startOfMonth: new Date(month) };
}
