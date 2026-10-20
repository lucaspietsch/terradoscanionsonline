import "server-only";

/**
 * Rate limit por chave (IP + rota).
 * - Com UPSTASH_REDIS_REST_URL/TOKEN: contador distribuído (recomendado na Vercel).
 * - Sem: janela em memória por instância (suficiente em dev / baixo tráfego, mas NÃO compartilhada entre lambdas).
 */
const memory = new Map<string, { count: number; resetAt: number }>();

async function upstash(key: string, windowMs: number): Promise<number | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([["INCR", key], ["PEXPIRE", key, windowMs, "NX"]]),
      cache: "no-store",
    });
    const json = (await res.json()) as { result: number }[];
    return json[0]?.result ?? null;
  } catch {
    return null;
  }
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const remote = await upstash(`rl:${key}`, windowMs);
  if (remote !== null) return remote <= limit;

  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    if (memory.size > 5000) for (const [k, v] of memory) if (v.resetAt < now) memory.delete(k);
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}
