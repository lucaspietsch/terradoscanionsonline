import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[calc(100svh-108px)] items-end overflow-hidden bg-sombra md:items-center" data-dark>
      <Image
        src="/images/hero.webp"
        alt="Ilustração de uma sala com luz natural e vasos de cimento com plantas ao lado de uma janela"
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-[70%_center]"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-sombra/90 via-sombra/55 to-sombra/10 md:bg-gradient-to-r md:from-sombra/85 md:via-sombra/55 md:to-transparent" aria-hidden />
      <div className="container py-16 md:py-24">
        <p className="eyebrow !text-salvia-clara">Cimento feito à mão</p>
        <h1 className="h1-display mt-5 max-w-2xl !text-pedra">Concreto que acolhe a natureza</h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-nevoa/90 md:text-xl">
          Vasos de cimento feitos à mão para trazer o jardim para dentro de casa.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button asChild size="lg" variant="light">
            <Link href="/vasos#produtos">Ver coleção</Link>
          </Button>
          <Button asChild size="lg" variant="outlineLight">
            <Link href="/sobre">Conheça nossa história</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
