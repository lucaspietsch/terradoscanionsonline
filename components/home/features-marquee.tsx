import { Hand, Leaf, Package, Sparkles } from "lucide-react";

export function FeaturesMarquee({ thresholdLabel }: { thresholdLabel: string }) {
  const items = [
    { icon: Hand, text: "Feito à mão" },
    { icon: Sparkles, text: "Peças únicas" },
    { icon: Package, text: "Embalagem reforçada" },
    { icon: Leaf, text: `Frete grátis acima de ${thresholdLabel}` },
  ];
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-14 pr-14" aria-hidden={hidden || undefined}>
      {items.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-center gap-3 whitespace-nowrap text-sm uppercase tracking-[0.22em] text-musgo">
          <Icon className="h-4 w-4 text-salvia" strokeWidth={1.5} aria-hidden /> {text}
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label="Diferenciais" className="border-y border-concreto bg-pedra py-5">
      <div className="group flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <div className="flex animate-marquee motion-reduce:animate-none group-hover:[animation-play-state:paused]">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </section>
  );
}
