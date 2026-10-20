/** Combinações da seção "Monte seu jardim". Os preços vêm do catálogo (nada fixo aqui). */
export interface Combo {
  id: string;
  name: string;
  description: string;
  slugs: string[];
}

export const COMBOS: Combo[] = [
  { id: "trio-mesa", name: "Trio de mesa", description: "Três peças pequenas em alturas e formas diferentes, para bancadas e prateleiras.", slugs: ["vaso-semente", "vaso-broto", "vaso-cuia"] },
  { id: "dupla-sala", name: "Dupla de sala", description: "Uma bola grande e um cilindro alto para compor um canto inteiro.", slugs: ["vaso-lua", "vaso-cambara"] },
  { id: "estante-verde", name: "Estante verde", description: "Três médios com texturas diferentes para aparadores e estantes.", slugs: ["vaso-seixo", "vaso-ipe", "vaso-ripado"] },
  { id: "bancada-temperos", name: "Bancada de temperos", description: "Jardineira para ervas, com um mini vaso para a muda do dia.", slugs: ["jardineira-mata", "vaso-broto"] },
];
