import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodTypeAny, z } from "zod";
import { HttpError, requireAdmin } from "@/lib/server/auth";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";

interface Options {
  /** Limite de requisições por IP nesta rota (padrão: sem limite). */
  rate?: { limit: number; windowMs: number };
  /** Exige usuário admin (além do middleware). */
  admin?: boolean;
  /** Pula a checagem de origem (webhooks de terceiros). */
  skipOriginCheck?: boolean;
}

/** Proteção CSRF para rotas autenticadas por cookie: o Origin de requests mutáveis precisa ser o próprio site. */
function sameOrigin(req: Request): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return true;
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

export function api<C = unknown>(handler: Handler<C>, opts: Options = {}): Handler<C> {
  return async (req, ctx) => {
    try {
      if (!opts.skipOriginCheck && !sameOrigin(req)) throw new HttpError(403, "Origem não permitida.");
      if (opts.rate) {
        const url = new URL(req.url);
        const ok = await rateLimit(`${clientIp(req)}:${url.pathname}`, opts.rate.limit, opts.rate.windowMs);
        if (!ok) throw new HttpError(429, "Muitas tentativas. Aguarde um instante e tente de novo.");
      }
      if (opts.admin) await requireAdmin();
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) return NextResponse.json({ error: err.message, ...err.extra }, { status: err.status });
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: err.issues[0]?.message ?? "Dados inválidos.", issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
          { status: 400 },
        );
      }
      console.error(`[api] ${req.method} ${new URL(req.url).pathname}`, err);
      return NextResponse.json({ error: "Erro interno. Tente novamente em instantes." }, { status: 500 });
    }
  };
}

export async function parseBody<S extends ZodTypeAny>(req: Request, schema: S): Promise<z.infer<S>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "Corpo da requisição inválido.");
  }
  return schema.parse(body);
}
