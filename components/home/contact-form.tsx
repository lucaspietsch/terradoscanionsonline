"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";

export function ContactForm() {
  const [v, setV] = useState({ name: "", email: "", message: "", website: "" });
  const [state, setState] = useState<{ kind: "idle" | "loading" | "ok" | "error"; text?: string }>({ kind: "idle" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível enviar.");
      setState({ kind: "ok", text: "Mensagem enviada! Respondemos em até 2 dias úteis." });
      setV({ name: "", email: "", message: "", website: "" });
    } catch (err) {
      setState({ kind: "error", text: err instanceof Error ? err.message : "Erro ao enviar." });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Nome" htmlFor="c-name"><Input id="c-name" autoComplete="name" required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></Field>
      <Field label="E-mail" htmlFor="c-email"><Input id="c-email" type="email" autoComplete="email" required value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} /></Field>
      <Field label="Mensagem" htmlFor="c-msg"><Textarea id="c-msg" rows={6} required value={v.message} onChange={(e) => setV({ ...v, message: e.target.value })} /></Field>
      {/* honeypot anti-spam: invisível para pessoas */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label>Não preencha <input tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => setV({ ...v, website: e.target.value })} /></label>
      </div>
      <Button type="submit" size="lg" loading={state.kind === "loading"}>Enviar mensagem</Button>
      <p role="status" aria-live="polite" className={state.kind === "error" ? "text-sm text-erro" : "text-sm text-musgo"}>{state.text}</p>
    </form>
  );
}
