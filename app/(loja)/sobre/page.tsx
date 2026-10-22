import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sobre nós",
  description: "A história da Cambará Ornamentais: vasos de cimento feitos à mão, um a um, com tempo, cuidado e respeito pelo material.",
  alternates: { canonical: "/sobre" },
};

export default function Page() {
  return (
    <PageShell eyebrow="Sobre nós" title="Concreto que acolhe a natureza" intro="A Cambará nasceu do desejo de ter plantas em casa dentro de vasos que combinassem com elas: simples, firmes e silenciosos.">
      <div className="grid gap-6 sm:grid-cols-2 !max-w-none">
        <div className="relative aspect-[4/5] overflow-hidden rounded bg-pedra"><Image src="/images/sobre-1.webp" alt="Prateleiras com vasos de cimento de formatos variados secando" fill sizes="(min-width: 640px) 40vw, 100vw" className="object-cover" /></div>
        <div className="relative aspect-[4/5] overflow-hidden rounded bg-pedra"><Image src="/images/sobre-2.webp" alt="Bancada de trabalho com moldes e um vaso alto pronto" fill sizes="(min-width: 640px) 40vw, 100vw" className="object-cover" /></div>
      </div>
      <h2>Feito à mão, do começo ao fim</h2>
      <p>Cada vaso é preparado em pequenas quantidades: misturamos o cimento, moldamos, desmoldamos com cuidado e deixamos curar sem pressa. Só depois vêm o lixamento, o acabamento e a conferência final — peça por peça.</p>
      <p>Por isso não existem dois vasos idênticos. Os poros, as pequenas marcas e as variações de tom são o jeito do cimento mostrar que foi feito por gente, e não por uma máquina.</p>
      <h2>Para decorar com natureza</h2>
      <p>Nossos vasos foram pensados para acolher flores secas, folhagens e arranjos, e para compor a casa com formas simples e acabamentos naturais. Em cada produto indicamos o que combina com o tamanho e se o vaso tem furo de drenagem.</p>
      <h2>Um jeito calmo de decorar</h2>
      <p>Acreditamos em casas com mais respiro. Poucas peças, bem escolhidas, e muita luz natural. Nosso desejo é que entrar na sua sala seja como entrar num jardim interno bonito e silencioso.</p>
      <div className="flex flex-wrap gap-4 pt-4">
        <Button asChild><Link href="/vasos">Ver coleção</Link></Button>
        <Button asChild variant="secondary"><Link href="/contato">Fale com a gente</Link></Button>
      </div>
    </PageShell>
  );
}
