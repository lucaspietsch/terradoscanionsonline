import Image from "next/image";
import { Instagram } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { instagramUrl } from "@/lib/site";

const photos = [
  "Vaso Lua com costela-de-adão ao lado de uma janela, em sala clara",
  "Vaso Cambará alto com espada-de-são-jorge sobre aparador de madeira",
  "Vaso Seixo com jiboia caindo pela borda, em prateleira",
  "Jardineira Mata com temperos em bancada de cozinha",
  "Vaso Ripado com calathea em canto iluminado",
  "Vaso Ipê branco com zamioculca em mesa lateral",
];

export function InstagramGallery({ handle }: { handle: string }) {
  const clean = handle.replace(/^@/, "");
  return (
    <section className="pb-20 md:pb-28" aria-labelledby="ig-title">
      <div className="container">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Instagram</p>
            <h2 id="ig-title" className="h2-section mt-3">Na casa de quem já tem</h2>
          </div>
          <a href={instagramUrl(clean)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-musgo underline underline-offset-4 hover:text-salvia">
            <Instagram className="h-4 w-4" strokeWidth={1.5} aria-hidden /> @{clean}
          </a>
        </Reveal>
        <ul className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 lg:grid-cols-6">
          {photos.map((alt, i) => (
            <li key={alt}>
              <a href={instagramUrl(clean)} target="_blank" rel="noopener noreferrer" className="group relative block aspect-square overflow-hidden rounded bg-pedra" aria-label={`Ver no Instagram: ${alt}`}>
                <Image src={`/images/galeria/${i + 1}.webp`} alt={alt} fill sizes="(min-width: 1024px) 16vw, (min-width: 768px) 33vw, 50vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
                <span className="absolute inset-0 flex items-center justify-center bg-sombra/35 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden>
                  <Instagram className="h-6 w-6 text-pedra" strokeWidth={1.5} />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
