"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

/** Usuário do Supabase no navegador. `undefined` enquanto carrega. */
export function useAuthUser(enabled: boolean): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(enabled ? undefined : null);
  useEffect(() => {
    if (!enabled) return;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    // import dinâmico: o SDK do Supabase sai do bundle inicial (carrega após a hidratação)
    import("@/lib/supabase/client").then(({ createClient }) => {
      if (cancelled) return;
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => !cancelled && setUser(data.user ?? null));
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
      unsubscribe = () => sub.subscription.unsubscribe();
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [enabled]);
  return user;
}

export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

export function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
