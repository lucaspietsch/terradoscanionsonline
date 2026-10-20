import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Reveal } from "@/components/reveal";
import { FAQ } from "@/lib/catalog/seed-data";

export function FaqSection({ thresholdLabel }: { thresholdLabel: string }) {
  const items = FAQ.map((f) => ({ ...f, a: f.a.replace("R$ 160,00", thresholdLabel) }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <section className="section-y bg-pedra" aria-labelledby="faq-title">
      <div className="container grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <p className="eyebrow">Perguntas frequentes</p>
          <h2 id="faq-title" className="h2-section mt-3">Antes de escolher</h2>
          <p className="mt-4 text-secundario">Não achou o que procurava? Chame a gente no WhatsApp.</p>
        </Reveal>
        <Reveal delay={0.1} className="lg:col-span-7 lg:col-start-6">
          <Accordion type="single" collapsible className="border-t border-concreto">
            {items.map((f, i) => (
              <AccordionItem key={f.q} value={`q${i}`}>
                <AccordionTrigger>{f.q}</AccordionTrigger>
                <AccordionContent>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
}
