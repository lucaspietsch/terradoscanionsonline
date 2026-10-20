"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { maskCep, maskCpf, maskPhone, onlyDigits } from "@/lib/utils";
import { fetchCep } from "@/lib/viacep";

export function ProfileForm({ initial }: { initial: { name: string; email: string; phone: string; cpf: string } }) {
  const [v, setV] = useState({ name: initial.name, phone: maskPhone(initial.phone), cpf: maskCpf(initial.cpf) });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/account/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
    const data = await res.json();
    setMsg(res.ok ? { ok: true, text: "Dados salvos." } : { ok: false, text: data.error ?? "Erro ao salvar." });
    setLoading(false);
  }

  return (
    <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
      <Field label="Nome" htmlFor="p-name" className="sm:col-span-2"><Input id="p-name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} required /></Field>
      <Field label="E-mail" htmlFor="p-email" className="sm:col-span-2" hint="O e-mail é o seu login e não pode ser alterado aqui."><Input id="p-email" value={initial.email} readOnly /></Field>
      <Field label="Telefone" htmlFor="p-phone"><Input id="p-phone" inputMode="tel" value={v.phone} onChange={(e) => setV({ ...v, phone: maskPhone(e.target.value) })} /></Field>
      <Field label="CPF" htmlFor="p-cpf"><Input id="p-cpf" inputMode="numeric" value={v.cpf} onChange={(e) => setV({ ...v, cpf: maskCpf(e.target.value) })} /></Field>
      <div className="flex items-center gap-4 sm:col-span-2">
        <Button type="submit" loading={loading}>Salvar</Button>
        {msg && <p role="status" className={msg.ok ? "text-sm text-musgo" : "text-sm text-erro"}>{msg.text}</p>}
      </div>
    </form>
  );
}

interface Addr { id: string; cep: string; street: string; number: string; complement: string | null; neighborhood: string; city: string; state: string }

export function AddressManager({ initial }: { initial: Addr[] }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" });
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/account/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "Verifique os campos.");
    setList([data.address, ...list]);
    setAdding(false);
    setF({ cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" });
    router.refresh();
  }
  async function remove(id: string) {
    await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    setList(list.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-4">
      {list.length === 0 && !adding && <p className="text-secundario">Nenhum endereço salvo.</p>}
      <ul className="grid gap-4 sm:grid-cols-2">
        {list.map((a) => (
          <li key={a.id} className="flex justify-between gap-3 rounded border border-concreto bg-pedra p-4 text-sm">
            <address className="not-italic leading-relaxed">
              {a.street}, {a.number}{a.complement ? ` — ${a.complement}` : ""}<br />
              <span className="text-secundario">{a.neighborhood} · {a.city}/{a.state} · CEP {maskCep(a.cep)}</span>
            </address>
            <button onClick={() => remove(a.id)} className="self-start rounded p-1.5 text-secundario hover:text-erro" aria-label="Remover endereço"><Trash2 className="h-4 w-4" strokeWidth={1.5} /></button>
          </li>
        ))}
      </ul>
      {adding ? (
        <form onSubmit={add} className="grid gap-4 rounded border border-concreto bg-pedra p-5 sm:grid-cols-6">
          <Field label="CEP" htmlFor="a-cep" className="sm:col-span-2"><Input id="a-cep" inputMode="numeric" maxLength={9} value={f.cep} onChange={async (e) => { const cep = maskCep(e.target.value); setF((p) => ({ ...p, cep })); if (onlyDigits(cep).length === 8) { const r = await fetchCep(cep); if (r) setF((p) => ({ ...p, ...r })); } }} required /></Field>
          <Field label="Rua" htmlFor="a-street" className="sm:col-span-4"><Input id="a-street" value={f.street} onChange={(e) => setF({ ...f, street: e.target.value })} required /></Field>
          <Field label="Número" htmlFor="a-num" className="sm:col-span-2"><Input id="a-num" value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} required /></Field>
          <Field label="Complemento" htmlFor="a-comp" className="sm:col-span-4"><Input id="a-comp" value={f.complement} onChange={(e) => setF({ ...f, complement: e.target.value })} /></Field>
          <Field label="Bairro" htmlFor="a-nb" className="sm:col-span-3"><Input id="a-nb" value={f.neighborhood} onChange={(e) => setF({ ...f, neighborhood: e.target.value })} required /></Field>
          <Field label="Cidade" htmlFor="a-city" className="sm:col-span-2"><Input id="a-city" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} required /></Field>
          <Field label="UF" htmlFor="a-uf" className="sm:col-span-1"><Input id="a-uf" maxLength={2} value={f.state} onChange={(e) => setF({ ...f, state: e.target.value.toUpperCase() })} required /></Field>
          {error && <p role="alert" className="text-sm text-erro sm:col-span-6">{error}</p>}
          <div className="flex gap-3 sm:col-span-6"><Button type="submit">Salvar endereço</Button><Button type="button" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button></div>
        </form>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>Adicionar endereço</Button>
      )}
    </div>
  );
}
