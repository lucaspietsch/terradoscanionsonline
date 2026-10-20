"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Table, Td, Th } from "@/components/admin/ui";
import { centsToInput, formatBRL, parseBRLToCents } from "@/lib/money";

export interface CouponRow {
  id: string; code: string; type: "PERCENT" | "FIXED"; value: number; startsAt: string | null; expiresAt: string | null;
  maxUses: number | null; usedCount: number; minSubtotalCents: number | null; active: boolean;
}

const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
const empty = { id: "", code: "", type: "PERCENT" as "PERCENT" | "FIXED", value: "10", startsAt: "", expiresAt: "", maxUses: "", minSubtotal: "", active: true };

export function CouponManager({ coupons }: { coupons: CouponRow[] }) {
  const router = useRouter();
  const [f, setF] = useState(empty);
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  function edit(c: CouponRow) {
    setEditing(true);
    setMsg(null);
    setF({ id: c.id, code: c.code, type: c.type, value: c.type === "FIXED" ? centsToInput(c.value) : String(c.value), startsAt: toLocal(c.startsAt), expiresAt: toLocal(c.expiresAt), maxUses: c.maxUses?.toString() ?? "", minSubtotal: c.minSubtotalCents ? centsToInput(c.minSubtotalCents) : "", active: c.active });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const body = {
      code: f.code,
      type: f.type,
      value: f.type === "FIXED" ? parseBRLToCents(f.value) : Math.round(Number(f.value)),
      startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : null,
      expiresAt: f.expiresAt ? new Date(f.expiresAt).toISOString() : null,
      maxUses: f.maxUses ? Math.round(Number(f.maxUses)) : null,
      minSubtotalCents: f.minSubtotal ? parseBRLToCents(f.minSubtotal) : null,
      active: f.active,
    };
    const res = await fetch(f.id ? `/api/admin/coupons/${f.id}` : "/api/admin/coupons", { method: f.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setMsg({ ok: false, text: data.error ?? "Erro ao salvar." });
    setF(empty);
    setEditing(false);
    setMsg({ ok: true, text: "Cupom salvo." });
    router.refresh();
  }

  async function remove(c: CouponRow) {
    if (!confirm(`Excluir o cupom ${c.code}?`)) return;
    await fetch(`/api/admin/coupons/${c.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <form onSubmit={save} className="grid max-w-4xl gap-4 rounded border border-concreto bg-pedra p-6 sm:grid-cols-4" aria-label={editing ? "Editar cupom" : "Novo cupom"}>
        <h2 className="font-serif text-xl font-light sm:col-span-4">{editing ? "Editar cupom" : "Novo cupom"}</h2>
        <Field label="Código" htmlFor="cp-code"><Input id="cp-code" required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, "") })} placeholder="BEMVINDO10" /></Field>
        <Field label="Tipo" htmlFor="cp-type"><Select id="cp-type" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as "PERCENT" | "FIXED", value: "" })}><option value="PERCENT">Percentual (%)</option><option value="FIXED">Valor fixo (R$)</option></Select></Field>
        <Field label={f.type === "PERCENT" ? "Desconto (%)" : "Desconto (R$)"} htmlFor="cp-val"><Input id="cp-val" required inputMode="decimal" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></Field>
        <Field label="Subtotal mínimo (R$)" htmlFor="cp-min"><Input id="cp-min" inputMode="decimal" value={f.minSubtotal} onChange={(e) => setF({ ...f, minSubtotal: e.target.value })} placeholder="opcional" /></Field>
        <Field label="Válido a partir de" htmlFor="cp-start"><Input id="cp-start" type="datetime-local" value={f.startsAt} onChange={(e) => setF({ ...f, startsAt: e.target.value })} /></Field>
        <Field label="Validade" htmlFor="cp-end"><Input id="cp-end" type="datetime-local" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} /></Field>
        <Field label="Uso máximo" htmlFor="cp-max"><Input id="cp-max" type="number" min={1} value={f.maxUses} onChange={(e) => setF({ ...f, maxUses: e.target.value })} placeholder="ilimitado" /></Field>
        <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-musgo" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Ativo</label>
        <div className="flex items-center gap-3 sm:col-span-4">
          <Button type="submit" loading={loading}>{editing ? "Salvar alterações" : "Criar cupom"}</Button>
          {editing && <Button type="button" variant="ghost" onClick={() => { setF(empty); setEditing(false); }}>Cancelar</Button>}
          {msg && <p role="status" className={msg.ok ? "text-sm text-musgo" : "text-sm text-erro"}>{msg.text}</p>}
        </div>
      </form>

      {coupons.length === 0 ? <p className="text-secundario">Nenhum cupom criado.</p> : (
        <Table>
          <thead><tr><Th>Código</Th><Th>Desconto</Th><Th>Validade</Th><Th className="text-right">Usos</Th><Th>Status</Th><Th /></tr></thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id}>
                <Td className="font-medium">{c.code}</Td>
                <Td>{c.type === "PERCENT" ? `${c.value}%` : formatBRL(c.value)}{c.minSubtotalCents ? <span className="block text-xs text-secundario">mín. {formatBRL(c.minSubtotalCents)}</span> : null}</Td>
                <Td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("pt-BR") : "Sem validade"}</Td>
                <Td className="text-right">{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}</Td>
                <Td>{c.active ? "Ativo" : "Inativo"}</Td>
                <Td className="whitespace-nowrap text-right">
                  <button className="mr-3 text-musgo underline underline-offset-4" onClick={() => edit(c)}>Editar</button>
                  <button className="text-erro underline underline-offset-4" onClick={() => remove(c)}>Excluir</button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
