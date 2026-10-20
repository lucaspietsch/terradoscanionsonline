import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * - Renova a sessão Supabase.
 * - /conta exige login.
 * - /admin e /api/admin exigem role admin (claim em app_metadata, definida pelo script admin:create).
 *   A checagem definitiva contra o banco (User.role) é refeita em cada handler via requireAdmin().
 */
export async function middleware(request: NextRequest) {
  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { pathname } = request.nextUrl;
  const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const needsLogin = pathname.startsWith("/conta") || isAdminArea;

  if (!hasSupabase) {
    if (!needsLogin) return NextResponse.next();
    return pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Autenticação não configurada." }, { status: 503 })
      : NextResponse.redirect(new URL("/entrar?aviso=config", request.url));
  }

  const { response, user } = await updateSession(request);

  if (needsLogin && !user) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const url = new URL("/entrar", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAdminArea && user?.app_metadata?.role !== "admin") {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

/**
 * O middleware só roda onde há sessão no servidor (área logada, admin, pedido, checkout e APIs que leem o usuário).
 * Páginas públicas continuam 100% estáticas/ISR — o navegador renova o token sozinho via SDK do Supabase.
 */
export const config = {
  matcher: [
    "/conta/:path*",
    "/admin/:path*",
    "/pedido/:path*",
    "/checkout",
    "/api/admin/:path*",
    "/api/cart",
    "/api/wishlist",
    "/api/account/:path*",
    "/api/checkout",
  ],
};
