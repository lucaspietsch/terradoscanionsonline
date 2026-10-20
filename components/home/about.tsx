import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";

export function About() {
  return (
    <section className="section-y bg-pedra" aria-labelledby="about-title">
      <div className="container grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="grid grid-cols-5 gap-4 lg:col-span-6">
          <div className="relative col-span-3 aspect-[4/5] overflow-hidden rounded bg-nevoa">
            <Image src="/images/sobre-1.webp" alt="Prateleiras de madeira com vasos de cimento de formatos e cores variados secando e curando" fill sizes="(min-width: 1024px) 28vw, 60vw" className="object-cover" />
          </div>
          <div className="relative col-span-2 mt-12 aspect-[3/5] overflow-hidden rounded bg-nevoa">
            <Image src="/images/sobre-2.webp" alt="Bancada de trabalho com moldes e um vaso alto de cimento já finalizado com folhagem" fill sizes="(min-width: 1024px) 20vw, 40vw" className="object-cover" />
          </div>
        </Reveal>
        <Reveal delay={0.1} className="lg:col-span-5 lg:col-start-8">
          <p className="eyebrow">Sobre a Cambará</p>
          <h2 id="about-title" className="h2-section mt-3">Cimento com tempo e cuidado</h2>
          <div className="prose-cb mt-6 !text-secundario">
            <p>
              Cada vaso nasce de uma mistura preparada à mão, moldada com paciência e curada sem pressa. Não há dois iguais: os poros, os tons e as pequenas marcas do cimento contam o caminho da peça até a sua casa.
            </p>
            <p>
              Trabalhamos com formas simples e acabamentos naturais para que a planta seja a protagonista — e o concreto, o abrigo silencioso que ela merece.
            </p>
          </div>
          <Button asChild variant="secondary" className="mt-8">
            <Link href="/sobre">Conheça nossa história</Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
