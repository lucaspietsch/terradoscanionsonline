"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Input } from "@/components/ui/input";
import { formatBRL } from "@/lib/money";
import { useDebounced } from "@/lib/hooks";
import type { ProductCardDTO } from "@/types";

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ProductCardDTO[] | null>(null);
  const debounced = useDebounced(q, 200);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    fetch(`/api/products?q=${encodeURIComponent(debounced)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setResults(d.products))
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [debounced, open]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="inline-flex h-10 w-10 items-center justify-center rounded text-musgo hover:bg-musgo/10" aria-label="Buscar">
        <Search className="h-5 w-5" strokeWidth={1.5} />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-sombra/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-x-0 top-0 z-[61] max-h-[85vh] overflow-y-auto bg-nevoa shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-top">
          <div className="container py-6 md:py-8">
            <Dialog.Title className="sr-only">Buscar vasos</Dialog.Title>
            <Dialog.Description className="sr-only">Digite o nome do vaso ou da categoria.</Dialog.Description>
            <div className="relative mx-auto max-w-2xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-secundario" strokeWidth={1.5} aria-hidden />
              <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por vaso, categoria…" className="h-14 pl-12 text-base" aria-label="Buscar" />
              <Dialog.Close className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-2 text-musgo hover:bg-musgo/10" aria-label="Fechar busca">
                <X className="h-5 w-5" strokeWidth={1.5} />
              </Dialog.Close>
            </div>
            <ul className="mx-auto mt-6 max-w-2xl divide-y divide-concreto">
              {results?.slice(0, 8).map((p) => (
                <li key={p.id}>
                  <Link href={`/vasos/${p.slug}`} onClick={() => setOpen(false)} className="flex items-center gap-4 py-3 hover:bg-pedra">
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-pedra">
                      {p.images[0] && <Image src={p.images[0].url} alt={p.images[0].alt} fill sizes="56px" className="object-cover" />}
                    </span>
                    <span className="flex-1">
                      <span className="block font-serif text-lg font-light">{p.name}</span>
                      <span className="text-sm text-secundario">{p.categoryName}</span>
                    </span>
                    <span className="text-sm">{formatBRL(p.priceCents)}</span>
                  </Link>
                </li>
              ))}
              {results && results.length === 0 && <li className="py-8 text-center text-secundario">Nenhum vaso encontrado para “{q}”.</li>}
            </ul>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
