"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useSiteConfig } from "@/components/site-config";
import { createClient } from "@/lib/supabase/client";

const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/conta");

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const sp = useSearchParams();
  const next = safeNext(sp.get("next"));
  const { authEnabled } = useSiteConfig();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const isLogin = mode === "login";

  if (!authEnabled) {
    return (
      <p role="alert" className="rounded border border-concreto bg-pedra p-5 text-sm text-secundario">
        {sp.get("aviso") === "config" ? "A área restrita exige login, mas o Supabase ainda não está configurado. " : "O login ainda não está configurado neste ambiente. "}
        Defina <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (veja o README).
      </p>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message);
        router.replace(next);
        router.refresh();
      } else {
        if (password.length < 8) throw new Error("A senha precisa ter pelo menos 8 caracteres.");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
        });
        if (error) throw new Error(error.message);
        if (data.session) {
          router.replace(next);
          router.refresh();
        } else setInfo("Enviamos um link de confirmação para o seu e-mail. Confirme para entrar.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível continuar.");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
  }

  async function reset() {
    if (!email) return setError("Informe seu e-mail para receber o link de redefinição.");
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/conta` });
    setError(null);
    setInfo("Se este e-mail tiver cadastro, enviamos um link para redefinir a senha.");
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {!isLogin && <Field label="Nome" htmlFor="auth-name"><Input id="auth-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required /></Field>}
        <Field label="E-mail" htmlFor="auth-email"><Input id="auth-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        <Field label="Senha" htmlFor="auth-password" hint={isLogin ? undefined : "Mínimo de 8 caracteres."}>
          <Input id="auth-password" type="password" autoComplete={isLogin ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {error && <p role="alert" className="text-sm text-erro">{error}</p>}
        {info && <p role="status" className="text-sm text-musgo">{info}</p>}
        <Button type="submit" size="lg" className="w-full" loading={loading}>{isLogin ? "Entrar" : "Criar conta"}</Button>
        {isLogin && <button type="button" onClick={reset} className="text-sm text-secundario underline underline-offset-4 hover:text-musgo">Esqueci minha senha</button>}
      </form>
      <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-secundario"><span className="h-px flex-1 bg-concreto" />ou<span className="h-px flex-1 bg-concreto" /></div>
      <Button type="button" variant="secondary" size="lg" className="w-full" onClick={google}>Continuar com Google</Button>
      <p className="text-center text-sm text-secundario">
        {isLogin ? <>Ainda não tem conta? <Link href={`/cadastro?next=${encodeURIComponent(next)}`} className="text-musgo underline underline-offset-4">Criar conta</Link></> : <>Já tem conta? <Link href={`/entrar?next=${encodeURIComponent(next)}`} className="text-musgo underline underline-offset-4">Entrar</Link></>}
      </p>
    </div>
  );
}
