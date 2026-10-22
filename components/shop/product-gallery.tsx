"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import type { ProductImageDTO } from "@/types";

export function ProductGallery({ images, name, focusUrl = null }: { images: ProductImageDTO[]; name: string; focusUrl?: string | null }) {
  const [index, setIndex] = useState(0);
  // ao escolher uma cor, mostra a foto dela; sem foto própria, volta para a capa
  useEffect(() => {
    const i = images.findIndex((img) => img.url === focusUrl);
    setIndex(i >= 0 ? i : 0);
  }, [focusUrl, images]);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [open, setOpen] = useState(false);
  const current = images[index] ?? images[0];
  if (!current) return <div className="aspect-square rounded bg-pedra" />;

  const go = (d: number) => setIndex((i) => (i + d + images.length) % images.length);

  return (
    <div className="grid gap-4 lg:grid-cols-[88px_1fr]">
      <ul className="order-2 flex gap-3 overflow-x-auto lg:order-1 lg:flex-col" aria-label={`Fotos de ${name}`}>
        {images.map((img, i) => (
          <li key={img.url} className="shrink-0">
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1} de ${images.length}`}
              aria-current={i === index}
              className={cn("relative block h-20 w-20 overflow-hidden rounded border bg-pedra transition-opacity", i === index ? "border-musgo" : "border-transparent opacity-70 hover:opacity-100")}
            >
              <Image src={img.url} alt={img.alt} fill sizes="80px" className="object-cover" />
            </button>
          </li>
        ))}
      </ul>

      <div className="order-1 lg:order-2">
        <div
          className="group relative aspect-square cursor-zoom-in overflow-hidden rounded bg-pedra"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseLeave={() => setZoom(null)}
          onClick={() => setOpen(true)}
        >
          <Image
            key={current.url}
            src={current.url}
            alt={current.alt}
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover transition-transform duration-200 ease-out"
            style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
          {current.alt.startsWith("Ilustração") && (
            <span className="absolute left-3 top-3 rounded bg-sombra/75 px-2.5 py-1 text-xs text-pedra">Imagem ilustrativa — em breve</span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
            className="absolute right-3 top-3 rounded bg-pedra/90 p-2 text-musgo opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
            aria-label="Ampliar foto"
          >
            <Maximize2 className="h-4 w-4" strokeWidth={1.5} />
          </button>
          {images.length > 1 && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Foto anterior" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-pedra/90 p-2 text-musgo lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100 lg:focus-visible:opacity-100">
                <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Próxima foto" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-pedra/90 p-2 text-musgo lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100 lg:focus-visible:opacity-100">
                <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </>
          )}
        </div>
        <p className="mt-2 text-xs text-secundario">{current.alt}</p>
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-sombra/80 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed inset-4 z-[61] flex items-center justify-center outline-none md:inset-10">
            <Dialog.Title className="sr-only">{name} — foto ampliada</Dialog.Title>
            <Dialog.Description className="sr-only">{current.alt}</Dialog.Description>
            <div className="relative h-full max-h-[90vh] w-full max-w-[90vh]">
              <Image src={current.url} alt={current.alt} fill sizes="90vh" className="rounded object-contain" />
            </div>
            <Dialog.Close className="absolute right-0 top-0 rounded bg-pedra p-2 text-musgo" aria-label="Fechar">✕</Dialog.Close>
            {images.length > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} aria-label="Foto anterior" className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-pedra p-2.5 text-musgo"><ChevronLeft className="h-5 w-5" /></button>
                <button type="button" onClick={() => go(1)} aria-label="Próxima foto" className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-pedra p-2.5 text-musgo"><ChevronRight className="h-5 w-5" /></button>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
