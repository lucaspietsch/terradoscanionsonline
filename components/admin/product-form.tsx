"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { centsToInput, parseBRLToCents } from "@/lib/money";
import { slugify } from "@/lib/utils";
import type { ProductFormValues } from "@/lib/admin/product-defaults";

interface Opt { id: string; name: string; slug?: string }
const num = (v: string) => (v === "" ? 0 : Number(v.replace(",", ".")));

export function ProductForm({ initial, categories, finishes }: { initial: ProductFormValues; categories: Opt[]; finishes: Opt[] }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [price, setPrice] = useState(centsToInput(initial.priceCents));
  const [plants, setPlants] = useState(initial.plants.join(", "));
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof ProductFormValues>(k: K, val: ProductFormValues[K]) => setV((p) => ({ ...p, [k]: val }));

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setMsg(null);
    const fd = new FormData();
    [...files].forEach((f) => fd.append("files", f));
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) return setMsg({ ok: false, text: data.error ?? "Falha no upload." });
    setV((p) => ({ ...p, images: [...p.images, ...(data.urls as string[]).map((url) => ({ url, alt: `${p.name || "Vaso"} de cimento` }))] }));
    if (fileRef.current) fileRef.current.value = "";
  }

  const move = (i: number, d: number) =>
    setV((p) => {
      const imgs = [...p.images];
      const j = i + d;
      if (j < 0 || j >= imgs.length) return p;
      [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
      return { ...p, images: imgs };
    });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const body = {
      name: v.name, slug: v.slug, categoryId: v.categoryId, shortDescription: v.shortDescription, longDescription: v.longDescription,
      priceCents: parseBRLToCents(price), heightCm: v.heightCm, widthCm: v.widthCm, depthCm: v.depthCm, round: v.round,
      weightGrams: Math.round(v.weightGrams), hasDrainage: v.hasDrainage, featured: v.featured, active: v.active,
      badge: v.badge || null, plants: plants.split(",").map((p) => p.trim()).filter(Boolean), sortOrder: Math.round(v.sortOrder),
      variants: finishes
        .filter((f) => v.options[f.id] || (v.stocks[f.id] ?? 0) > 0)
        .map((f) => ({ finishId: f.id, stock: v.options[f.id]?.comingSoon ? 0 : Math.max(0, Math.round(v.stocks[f.id] ?? 0)), comingSoon: v.options[f.id]?.comingSoon ?? false, imageUrl: v.options[f.id]?.imageUrl ?? null })),
      images: v.images,
    };
    const res = await fetch(v.id ? `/api/admin/products/${v.id}` : "/api/admin/products", { method: v.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setMsg({ ok: false, text: data.issues?.[0] ? `${data.issues[0].path}: ${data.issues[0].message}` : (data.error ?? "Erro ao salvar.") });
    setMsg({ ok: true, text: "Produto salvo." });
    if (!v.id) router.replace(`/admin/produtos/${data.id}`);
    router.refresh();
  }

  async function remove() {
    if (!v.id || !confirm(`Excluir “${v.name}” definitivamente? Pedidos antigos continuam guardados.`)) return;
    const res = await fetch(`/api/admin/products/${v.id}`, { method: "DELETE" });
    if (res.ok) {
      router.replace("/admin/produtos");
      router.refresh();
    } else setMsg({ ok: false, text: "Não foi possível excluir." });
  }

  return (
    <form onSubmit={save} className="max-w-4xl space-y-10">
      <section className="grid gap-4 sm:grid-cols-2" aria-label="Informações básicas">
        <Field label="Nome" htmlFor="pf-name"><Input id="pf-name" required value={v.name} onChange={(e) => { set("name", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} /></Field>
        <Field label="Slug (URL)" htmlFor="pf-slug"><Input id="pf-slug" required value={v.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} /></Field>
        <Field label="Categoria" htmlFor="pf-cat"><Select id="pf-cat" value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="Preço (R$)" htmlFor="pf-price"><Input id="pf-price" inputMode="decimal" required value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        <Field label="Descrição curta" htmlFor="pf-short" className="sm:col-span-2"><Input id="pf-short" required value={v.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} /></Field>
        <Field label="Descrição longa" htmlFor="pf-long" className="sm:col-span-2"><Textarea id="pf-long" rows={5} required value={v.longDescription} onChange={(e) => set("longDescription", e.target.value)} /></Field>
        <Field label="Plantas indicadas (separe por vírgula)" htmlFor="pf-plants" className="sm:col-span-2"><Input id="pf-plants" value={plants} onChange={(e) => setPlants(e.target.value)} placeholder="Zamioculca, Lírio-da-paz" /></Field>
      </section>

      <section aria-label="Medidas" className="grid gap-4 sm:grid-cols-4">
        <Field label="Altura (cm)" htmlFor="pf-h"><Input id="pf-h" inputMode="decimal" value={v.heightCm} onChange={(e) => set("heightCm", num(e.target.value))} /></Field>
        <Field label={v.round ? "Diâmetro (cm)" : "Largura (cm)"} htmlFor="pf-w"><Input id="pf-w" inputMode="decimal" value={v.widthCm} onChange={(e) => set("widthCm", num(e.target.value))} /></Field>
        <Field label="Profundidade (cm)" htmlFor="pf-d"><Input id="pf-d" inputMode="decimal" value={v.depthCm ?? ""} onChange={(e) => set("depthCm", e.target.value ? num(e.target.value) : null)} /></Field>
        <Field label="Peso (g)" htmlFor="pf-g"><Input id="pf-g" inputMode="numeric" value={v.weightGrams} onChange={(e) => set("weightGrams", num(e.target.value))} /></Field>
        <label className="flex items-center gap-2 text-sm sm:col-span-4"><input type="checkbox" className="h-4 w-4 accent-musgo" checked={v.round} onChange={(e) => set("round", e.target.checked)} /> Peça redonda (mostrar “A × Ø D”)</label>
      </section>

      <section aria-label="Estoque por acabamento">
        <h2 className="mb-3 font-serif text-xl font-light">Estoque por acabamento</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          {finishes.map((f) => (
            <div key={f.id}>
              <Field label={f.name} htmlFor={`pf-s-${f.id}`}><Input id={`pf-s-${f.id}`} type="number" min={0} disabled={v.options[f.id]?.comingSoon} value={v.stocks[f.id] ?? 0} onChange={(e) => set("stocks", { ...v.stocks, [f.id]: Number(e.target.value), })} /></Field>
              {v.options[f.id] && (
                <label className="mt-1.5 flex items-center gap-2 text-xs text-secundario">
                  <input type="checkbox" className="h-3.5 w-3.5 accent-musgo" checked={v.options[f.id].comingSoon} onChange={(e) => set("options", { ...v.options, [f.id]: { ...v.options[f.id], comingSoon: e.target.checked } })} /> Em breve (não vendável)
                </label>
              )}
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Opções" className="grid gap-4 sm:grid-cols-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-musgo" checked={v.hasDrainage} onChange={(e) => set("hasDrainage", e.target.checked)} /> Possui furo de drenagem</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-musgo" checked={v.featured} onChange={(e) => set("featured", e.target.checked)} /> Destaque na home</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-musgo" checked={v.active} onChange={(e) => set("active", e.target.checked)} /> Ativo (visível na loja)</label>
        <Field label="Selo" htmlFor="pf-badge"><Select id="pf-badge" value={v.badge ?? ""} onChange={(e) => set("badge", e.target.value || null)}><option value="">Nenhum</option><option>Novo</option><option>Mais vendido</option></Select></Field>
        <Field label="Ordem" htmlFor="pf-order"><Input id="pf-order" type="number" value={v.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} /></Field>
      </section>

      <section aria-label="Fotos">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-xl font-light">Fotos <span className="text-sm text-secundario">(mín. 3 — a primeira é a capa)</span></h2>
          <div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => upload(e.target.files)} />
            <Button type="button" variant="secondary" size="sm" loading={uploading} onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" aria-hidden /> Enviar fotos</Button>
          </div>
        </div>
        {v.images.length < 3 && <p className="mb-3 text-sm text-erro">Adicione pelo menos 3 fotos (vazio, com planta, em ambiente, com régua).</p>}
        <ul className="space-y-3">
          {v.images.map((img, i) => (
            <li key={img.url + i} className="flex items-center gap-4 rounded border border-concreto bg-pedra p-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-nevoa"><Image src={img.url} alt={img.alt} fill sizes="64px" className="object-cover" /></div>
              <Input aria-label={`Texto alternativo da foto ${i + 1}`} value={img.alt} onChange={(e) => set("images", v.images.map((x, k) => (k === i ? { ...x, alt: e.target.value } : x)))} placeholder="Texto alternativo (descreva a foto)" />
              <div className="flex shrink-0">
                <button type="button" onClick={() => move(i, -1)} className="rounded p-2 hover:bg-musgo/10" aria-label="Mover para cima"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => move(i, 1)} className="rounded p-2 hover:bg-musgo/10" aria-label="Mover para baixo"><ArrowDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => set("images", v.images.filter((_, k) => k !== i))} className="rounded p-2 text-erro hover:bg-erro/10" aria-label="Remover foto"><Trash2 className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap items-center gap-4 border-t border-concreto pt-6">
        <Button type="submit" size="lg" loading={saving}>Salvar produto</Button>
        <Button asChild variant="ghost"><Link href="/admin/produtos">Cancelar</Link></Button>
        {v.id && <Button type="button" variant="danger" onClick={remove} className="ml-auto">Excluir</Button>}
        {msg && <p role="status" className={msg.ok ? "text-sm text-musgo" : "text-sm text-erro"}>{msg.text}</p>}
      </div>
    </form>
  );
}
