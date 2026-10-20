"use client";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">Algo deu errado</p>
      <h1 className="mt-3 font-serif text-4xl font-light">Não conseguimos carregar esta página</h1>
      <p className="mt-4 max-w-md text-secundario">Tente novamente em instantes. Se o problema continuar, fale com a gente pelo WhatsApp.</p>
      <button onClick={reset} className="mt-8 inline-flex h-12 items-center rounded bg-musgo px-8 text-pedra hover:bg-musgo-claro">Tentar de novo</button>
    </div>
  );
}
