/** Combinações da seção "Monte seu jardim". Os preços vêm do catálogo (nada fixo aqui). */
export interface Combo {
  id: string;
  name: string;
  description: string;
  slugs: string[];
}

export const COMBOS: Combo[] = [
  { id: "dupla-textura", name: "Dupla de texturas", description: "O Listrado e o Floral Luxo juntos: listras verticais e flores em relevo, na mesma bancada.", slugs: ["vaso-concreto-listrado-luxuoso", "vaso-floral-luxo-relevo-3d"] },
  { id: "dupla-relevo", name: "Dupla relevo 3D", description: "Os vasos Floral e Lavanda lado a lado, para uma bancada delicada.", slugs: ["vaso-floral-luxo-relevo-3d", "vaso-concreto-lavanda-relevo-3d"] },
  { id: "colecao-bancada", name: "Coleção de bancada", description: "Os dois kits de três vasos para montar uma fileira completa.", slugs: ["kit-3-vasos-concreto-redondos-luxuosos", "kit-3-vasos-ripples"] },
];
