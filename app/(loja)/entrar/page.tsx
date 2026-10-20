import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/account/auth-form";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default function Page() {
  return (
    <div className="container flex justify-center py-16 md:py-24">
      <div className="w-full max-w-md">
        <p className="eyebrow">Minha conta</p>
        <h1 className="mt-3 font-serif text-4xl font-light">Entrar</h1>
        <p className="mt-3 mb-8 text-secundario">Acesse seus pedidos, endereços e favoritos.</p>
        <Suspense><AuthForm mode="login" /></Suspense>
      </div>
    </div>
  );
}
