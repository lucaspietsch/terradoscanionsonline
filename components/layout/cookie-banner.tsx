"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CONSENT_KEY, readConsent, type Consent } from "@/lib/analytics";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readConsent() === null);
  }, []);

  function choose(c: Consent) {
    try {
      localStorage.setItem(CONSENT_KEY, c);
    } catch {
      /* modo privado */
    }
    window.dispatchEvent(new CustomEvent("cambara-consent", { detail: c }));
    setVisible(false);
  }

  if (!visible) return null;
  return (
    <div role="dialog" aria-label="Consentimento de cookies" className="fixed inset-x-3 bottom-3 z-[55] mx-auto max-w-2xl rounded border border-concreto bg-pedra p-5 shadow-xl md:bottom-6 md:left-6 md:right-auto md:mx-0">
      <p className="text-sm leading-relaxed text-sombra">
        Usamos cookies essenciais para o funcionamento da loja e, com a sua permissão, cookies de análise (Google Analytics e Meta) para entender como o site é usado. Saiba mais na{" "}
        <Link href="/privacidade" className="underline underline-offset-4 hover:text-musgo">Política de privacidade</Link>.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button size="sm" onClick={() => choose("all")}>Aceitar todos</Button>
        <Button size="sm" variant="secondary" onClick={() => choose("essential")}>Apenas essenciais</Button>
      </div>
    </div>
  );
}
