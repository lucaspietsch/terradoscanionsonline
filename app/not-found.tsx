import Link from "next/link";
import { LogoSymbol } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <LogoSymbol size={56} />
      <p className="eyebrow mt-8">Erro 404</p>
      <h1 className="mt-3 font-serif text-5xl font-light">Esta página não brotou por aqui</h1>
      <p className="mt-4 max-w-md text-secundario">O endereço pode ter mudado ou nunca ter existido. Que tal voltar para o jardim?</p>
      <Link href="/" className="mt-8 inline-flex h-12 items-center rounded bg-musgo px-8 text-pedra hover:bg-musgo-claro">Ir para a página inicial</Link>
    </div>
  );
}
