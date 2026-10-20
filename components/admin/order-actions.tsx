"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { ORDER_STATUS_LABEL, STATUS_OPTIONS } from "@/lib/order-status";

export function OrderActions({ id, status, trackingCode, deliveryMethod }: { id: string; status: string; trackingCode: string | null; deliveryMethod: "SHIPPING" | "PICKUP" }) {
  const router = useRouter();
  const [s, setS] = useState(status);
  const [code, setCode] = useState(trackingCode ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMsg(null);
    const res = await fetch(`/api/admin/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: s, trackingCode: code.trim() || null }) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setMsg({ ok: false, text: data.error ?? "Erro ao salvar." });
    setMsg({ ok: true, text: s === "SHIPPED" ? "Salvo — e-mail de envio disparado ao cliente." : "Salvo." });
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded border border-concreto bg-pedra p-5">
      <Field label="Status" htmlFor="o-status">
        <Select id="o-status" value={s} onChange={(e) => setS(e.target.value)}>
          {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{ORDER_STATUS_LABEL(o, deliveryMethod)}</option>)}
        </Select>
      </Field>
      {deliveryMethod === "SHIPPING" && (
        <Field label="Código de rastreio" htmlFor="o-track" hint="Ao marcar como Enviado, o cliente recebe um e-mail com o código.">
          <Input id="o-track" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Ex.: AA123456789BR" />
        </Field>
      )}
      <div className="flex items-center gap-4">
        <Button onClick={save} loading={loading}>Salvar</Button>
        {msg && <p role="status" className={msg.ok ? "text-sm text-musgo" : "text-sm text-erro"}>{msg.text}</p>}
      </div>
    </div>
  );
}
