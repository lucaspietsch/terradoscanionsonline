import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/account/auth-form";

export const metadata: Metadata = { title: "Criar conta", robots: { index: false } };

export default function Page() {
  return (
    <div className="container flex justify-center py-16 md:py-24">
      <div className="w-full max-w-md">
        <p className="eyebrow">Minha conta</p>
        <h1 className="mt-3 font-serif text-4xl font-light">Criar conta</h1>
        <p className="mt-3 mb-8 text-secundario">Salve seus endereços e acompanhe seus pedidos.</p>
        <Suspense><AuthForm mode="signup" /></Suspense>
      </div>
    </div>
  );
}
