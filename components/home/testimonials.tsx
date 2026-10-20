import { Quote } from "lucide-react";
import { Reveal } from "@/components/reveal";
import type { TestimonialDTO } from "@/types";

/** Alimentado pelo admin. Sem depoimentos cadastrados, a seção simplesmente não aparece. */
export function Testimonials({ items }: { items: TestimonialDTO[] }) {
  if (!items.length) return null;
  return (
    <section className="section-y bg-pedra" aria-labelledby="dep-title">
      <div className="container">
        <Reveal className="mb-12 max-w-xl">
          <p className="eyebrow">Depoimentos</p>
          <h2 id="dep-title" className="h2-section mt-3">Quem recebeu, contou</h2>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((t, i) => (
            <Reveal key={t.id} delay={(i % 3) * 0.08}>
              <figure className="flex h-full flex-col rounded border border-concreto bg-nevoa p-7">
                <Quote className="h-6 w-6 text-salvia" strokeWidth={1.5} aria-hidden />
                <blockquote className="mt-4 flex-1 font-serif text-lg font-light leading-relaxed">“{t.text}”</blockquote>
                <figcaption className="mt-6 text-sm text-secundario">
                  <span className="text-sombra">{t.author}</span>
                  {t.location ? ` · ${t.location}` : ""}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
