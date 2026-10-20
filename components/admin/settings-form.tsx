"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { centsToInput, parseBRLToCents } from "@/lib/money";
import { maskCep } from "@/lib/utils";
import type { SiteSettings, TestimonialDTO } from "@/types";

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [v, setV] = useState({
    threshold: centsToInput(settings.freeShippingThresholdCents), cep: maskCep(settings.originCep), whatsapp: settings.whatsapp, instagram: settings.instagram,
    announcement: settings.announcement, pickup: settings.pickupEnabled, pickupAddress: settings.pickupAddress, email: settings.contactEmail,
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ free_shipping_threshold: parseBRLToCents(v.threshold), origin_cep: v.cep, whatsapp: v.whatsapp, instagram: v.instagram, announcement: v.announcement, pickup_enabled: v.pickup, pickup_address: v.pickupAddress, contact_email: v.email }),
    });
    const data = await res.json();
    setLoading(false);
    setMsg(res.ok ? { ok: true, text: "Configurações salvas — a loja já usa os novos valores." } : { ok: false, text: data.issues?.[0] ? `${data.issues[0].path}: ${data.issues[0].message}` : (data.error ?? "Erro ao salvar.") });
    if (res.ok) router.refresh();
  }

  return (
    <form onSubmit={save} className="grid max-w-3xl gap-4 sm:grid-cols-2">
      <Field label="Frete grátis acima de (R$)" htmlFor="st-th" hint="Regra estrita: o subtotal precisa ser MAIOR que este valor. Padrão: 160,00." className="sm:col-span-2"><Input id="st-th" inputMode="decimal" value={v.threshold} onChange={(e) => setV({ ...v, threshold: e.target.value })} /></Field>
      <Field label="CEP de origem (cotação de frete)" htmlFor="st-cep"><Input id="st-cep" inputMode="numeric" maxLength={9} value={v.cep} onChange={(e) => setV({ ...v, cep: maskCep(e.target.value) })} /></Field>
      <Field label="WhatsApp (DDI + DDD + número)" htmlFor="st-wa" hint="Ex.: 5541999999999"><Input id="st-wa" inputMode="numeric" value={v.whatsapp} onChange={(e) => setV({ ...v, whatsapp: e.target.value.replace(/\D/g, "") })} /></Field>
      <Field label="Instagram (@)" htmlFor="st-ig"><Input id="st-ig" value={v.instagram} onChange={(e) => setV({ ...v, instagram: e.target.value })} /></Field>
      <Field label="E-mail de contato" htmlFor="st-mail"><Input id="st-mail" type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} /></Field>
      <Field label="Texto da faixa de anúncio" htmlFor="st-ann" hint="Deixe vazio para usar “Frete grátis em compras acima de R$ …” automaticamente." className="sm:col-span-2"><Input id="st-ann" value={v.announcement} onChange={(e) => setV({ ...v, announcement: e.target.value })} maxLength={160} /></Field>
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" className="h-4 w-4 accent-musgo" checked={v.pickup} onChange={(e) => setV({ ...v, pickup: e.target.checked })} /> Oferecer “Retirar no local” (frete R$ 0)</label>
      <Field label="Endereço de retirada" htmlFor="st-pick" className="sm:col-span-2"><Input id="st-pick" value={v.pickupAddress} onChange={(e) => setV({ ...v, pickupAddress: e.target.value })} /></Field>
      <div className="flex items-center gap-4 sm:col-span-2">
        <Button type="submit" size="lg" loading={loading}>Salvar configurações</Button>
        {msg && <p role="status" className={msg.ok ? "text-sm text-musgo" : "text-sm text-erro"}>{msg.text}</p>}
      </div>
    </form>
  );
}

export function TestimonialManager({ items }: { items: (TestimonialDTO & { published: boolean })[] }) {
  const router = useRouter();
  const [f, setF] = useState({ author: "", location: "", text: "" });
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/testimonials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ author: f.author, location: f.location || null, text: f.text, published: true }) });
    const data = await res.json();
    if (!res.ok) return setError(data.issues?.[0]?.message ?? data.error ?? "Erro.");
    setF({ author: "", location: "", text: "" });
    router.refresh();
  }
  async function toggle(t: { id: string; author: string; location: string | null; text: string; published: boolean }) {
    await fetch(`/api/admin/testimonials/${t.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ author: t.author, location: t.location, text: t.text, published: !t.published }) });
    router.refresh();
  }
  async function remove(id: string) {
    if (!confirm("Excluir este depoimento?")) return;
    await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="max-w-3xl space-y-8">
      <p className="text-sm text-secundario">Cadastre apenas depoimentos reais de clientes, com autorização. Sem depoimentos publicados, a seção some da página inicial.</p>
      <form onSubmit={add} className="grid gap-4 rounded border border-concreto bg-pedra p-5 sm:grid-cols-2">
        <Field label="Nome" htmlFor="tm-a"><Input id="tm-a" required value={f.author} onChange={(e) => setF({ ...f, author: e.target.value })} /></Field>
        <Field label="Cidade (opcional)" htmlFor="tm-l"><Input id="tm-l" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></Field>
        <Field label="Depoimento" htmlFor="tm-t" className="sm:col-span-2"><Textarea id="tm-t" rows={3} required value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /></Field>
        {error && <p role="alert" className="text-sm text-erro sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2"><Button type="submit">Adicionar depoimento</Button></div>
      </form>
      <ul className="space-y-3">
        {items.map((t) => (
          <li key={t.id} className="flex items-start justify-between gap-4 rounded border border-concreto bg-pedra p-4 text-sm">
            <div><p className="leading-relaxed">“{t.text}”</p><p className="mt-2 text-secundario">{t.author}{t.location ? ` · ${t.location}` : ""}</p></div>
            <div className="flex shrink-0 items-center gap-3">
              <button onClick={() => toggle(t)} className="text-musgo underline underline-offset-4">{t.published ? "Ocultar" : "Publicar"}</button>
              <button onClick={() => remove(t.id)} className="rounded p-1.5 text-erro hover:bg-erro/10" aria-label="Excluir depoimento"><Trash2 className="h-4 w-4" strokeWidth={1.5} /></button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
