import { Reveal } from "@/components/reveal";

export function PageShell({ eyebrow, title, intro, children, narrow = true }: { eyebrow: string; title: string; intro?: string; children: React.ReactNode; narrow?: boolean }) {
  return (
    <article className="container py-14 md:py-24">
      <Reveal className={narrow ? "max-w-3xl" : "max-w-4xl"}>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="h1-display mt-4 !text-5xl md:!text-6xl">{title}</h1>
        {intro && <p className="mt-6 text-xl leading-relaxed text-secundario">{intro}</p>}
      </Reveal>
      <div className={`prose-cb mt-12 ${narrow ? "max-w-3xl" : "max-w-4xl"}`}>{children}</div>
    </article>
  );
}
