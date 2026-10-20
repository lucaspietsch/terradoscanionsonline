"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/reveal";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível concluir a inscrição.");
      setState("ok");
      setMessage("Pronto! Você vai receber nossas dicas e novidades.");
      setEmail("");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Erro ao inscrever.");
    }
  }

  return (
    <section className="section-y" aria-labelledby="news-title">
      <Reveal className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Newsletter</p>
          <h2 id="news-title" className="h2-section mt-3">Receba dicas de plantas e novidades</h2>
          <p className="mt-4 text-secundario">Cuidados, combinações e lançamentos — sem excesso, um e-mail de vez em quando.</p>
          <form onSubmit={submit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row" noValidate>
            <label htmlFor="newsletter-email" className="sr-only">Seu e-mail</label>
            <Input id="newsletter-email" type="email" required autoComplete="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button type="submit" loading={state === "loading"} className="shrink-0">Inscrever</Button>
          </form>
          <p role="status" aria-live="polite" className={`mt-3 min-h-5 text-sm ${state === "error" ? "text-erro" : "text-musgo"}`}>
            {state === "ok" || state === "error" ? message : ""}
          </p>
          <p className="mt-1 text-xs text-secundario">Ao se inscrever você concorda com a nossa política de privacidade. Cancele quando quiser.</p>
        </div>
      </Reveal>
    </section>
  );
}
