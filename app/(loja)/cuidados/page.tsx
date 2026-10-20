import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "Cuidados com vasos de cimento",
  description: "Como impermeabilizar, limpar e usar vasos de cimento em áreas internas e externas, e como cuidar da planta dentro deles.",
  alternates: { canonical: "/cuidados" },
};

export default function Page() {
  return (
    <PageShell eyebrow="Guia" title="Cuidados com vasos de cimento" intro="O cimento é um material vivo e resistente. Com alguns cuidados simples, o vaso envelhece bem — e a planta agradece.">
      <h2>Impermeabilização</h2>
      <p>O cimento é poroso. Para áreas internas, ele pode ser usado como vem. Em varandas, jardins e locais com chuva ou muita umidade, recomendamos aplicar uma ou duas demãos de <strong>impermeabilizante incolor à base de água</strong> (do tipo hidrofugante), por fora e, se quiser, também por dentro.</p>
      <ul>
        <li>Aplique com o vaso limpo e seco, com pincel ou rolo, em camadas finas.</li>
        <li>Respeite o tempo de secagem do fabricante entre as demãos.</li>
        <li>Refaça a cada 1 ou 2 anos em áreas externas.</li>
      </ul>
      <h2>Limpeza</h2>
      <ul>
        <li>Use pano úmido e sabão neutro. Evite buchas abrasivas, ácidos e produtos com cloro.</li>
        <li>Manchas esbranquiçadas (eflorescência) são sais do próprio cimento e saem com um pano úmido.</li>
        <li>Variações de tom e pequenos poros são características do material — não são defeitos.</li>
      </ul>
      <h2>Uso interno e externo</h2>
      <p>Os vasos aguentam sol e chuva, mas o ideal é protegê-los de alagamentos prolongados. Em climas frios, evite deixar água parada dentro do vaso, pois ela pode congelar e trincar a peça.</p>
      <h2>Drenagem e móveis</h2>
      <p>Todos os vasos têm furo de drenagem. Sobre móveis de madeira, use um pratinho ou cachepô: a água que escorre pode deixar marcas. Em pisos claros, uma base protetora evita manchas.</p>
      <h2>Cuidando da planta</h2>
      <ul>
        <li>Coloque uma camada de argila expandida ou pedrinhas no fundo antes do substrato.</li>
        <li>Cimento novo pode ser levemente alcalino: deixe o vaso &ldquo;curar&rdquo; por alguns dias com água antes de plantar espécies sensíveis (opcional).</li>
        <li>Regue quando o substrato estiver seco ao toque — o cimento perde água devagar e mantém a raiz fresca.</li>
      </ul>
      <h2>Peso e transporte</h2>
      <p>Vasos de cimento são pesados, principalmente depois de plantados e regados. Levante sempre pela base, nunca pela borda, e planeje o lugar antes de encher de terra.</p>
    </PageShell>
  );
}
