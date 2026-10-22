/**
 * Catálogo inicial. É a única fonte para:
 *  - `prisma/seed.ts` (popula o banco)
 *  - o "modo demonstração" (site navegável sem banco configurado)
 * Preços em centavos. Medidas/pesos são sugestões — o admin pode editar.
 */

export interface SeedFinish {
  name: string;
  slug: string;
  hex: string;
  /** segunda cor: o seletor mostra o círculo dividido ao meio */
  hex2?: string;
}

export interface SeedCategory {
  name: string;
  slug: string;
  imageUrl: string;
  imageAlt: string;
  order: number;
}

export interface SeedProduct {
  name: string;
  slug: string;
  category: string;
  priceCents: number;
  heightCm: number;
  widthCm: number;
  depthCm: number | null;
  round: boolean;
  weightGrams: number;
  hasDrainage: boolean;
  badge: string | null;
  plants: string[];
  shortDescription: string;
  longDescription: string;
  images: { url: string; alt: string }[];
  stockPerFinish: number;
  sortOrder: number;
  /** Slugs dos acabamentos oferecidos. Omitido = BASE_FINISH_SLUGS. */
  finishes?: string[];
  /** opções ainda não produzidas ("em breve"): slug do acabamento → foto ilustrativa. Não podem ser compradas. */
  /** foto de cada acabamento à venda (a galeria mostra ao escolher a cor): slug do acabamento → url */
  finishImages?: Record<string, string>;
  comingSoonFinishes?: Record<string, { url: string; alt: string }>;
}

export const SEED_FINISHES: SeedFinish[] = [
  { name: "Cimento Natural", slug: "cimento-natural", hex: "#A8A59E" },
  { name: "Grafite", slug: "grafite", hex: "#4B4F4A" },
  { name: "Areia", slug: "areia", hex: "#CDBFA6" },
  { name: "Branco Pedra", slug: "branco-pedra", hex: "#E6E3DB" },
  { name: "Lavanda", slug: "lavanda", hex: "#A89CC4" },
  // Verde (Listrado Luxuoso) e versões premium com folha de ouro, ainda não produzidas — "em breve" (hex2 = dourado).
  { name: "Verde", slug: "verde", hex: "#4B5A2A" },
  { name: "Preto e dourado (premium, com folha de ouro)", slug: "preto-dourado", hex: "#17171A", hex2: "#C39A2B" },
  { name: "Vermelho e dourado (premium, com folha de ouro)", slug: "vermelho-dourado", hex: "#9E1620", hex2: "#C39A2B" },
  { name: "Mármore (premium, com folha de ouro)", slug: "marmore-dourado", hex: "#E9E6E0", hex2: "#C39A2B" },
  { name: "Branco Pedra + Lavanda", slug: "branco-lavanda", hex: "#E6E3DB", hex2: "#A89CC4" }, // Kit Floral + Lavanda
  // Cores do Vaso Floral Luxo (ainda não produzidas — "em breve"). hex = vaso/pétala, hex2 = miolo/bordas.
  { name: "Rosa nas flores com branco", slug: "rosa-flores-branco", hex: "#E58FB0", hex2: "#F4F1EA" },
  { name: "Roxo nas flores com branco", slug: "roxo-flores-branco", hex: "#8E5DB5", hex2: "#F4F1EA" },
  { name: "Amarelo nas flores com branco", slug: "amarelo-flores-branco", hex: "#F2C230", hex2: "#F4F1EA" },
  { name: "Verde no vaso, branco dentro da pétala e roxo nas bordas", slug: "verde-branco-roxo", hex: "#4F7D4B", hex2: "#7B4AA8" },
  { name: "Preto fosco no vaso e vermelho vibrante nas pétalas", slug: "preto-vermelho", hex: "#1C1C1C", hex2: "#D3202A" },
  { name: "Branco com sombreado cinza no vaso e vermelho vibrante nas pétalas", slug: "branco-cinza-vermelho", hex: "#D9D6D1", hex2: "#D3202A" },
];

/** Acabamentos dos vasos originais; produtos sem `finishes` próprio usam estes. */
export const BASE_FINISH_SLUGS = ["cimento-natural", "grafite", "areia", "branco-pedra"];

export const SEED_CATEGORIES: SeedCategory[] = [
  { name: "Pequenos", slug: "pequenos", imageUrl: "/images/products/lavanda-1.webp", imageAlt: "Mão segurando um vaso de concreto lavanda com relevo 3D de folhas e íris roxas", order: 1 },
  { name: "Médios", slug: "medios", imageUrl: "/images/products/listrado-2.webp", imageAlt: "Vaso de concreto listrado verde com flores amarelas", order: 2 },
  { name: "Aromaterapia", slug: "aromaterapia", imageUrl: "/images/categorias/aromaterapia.webp", imageAlt: "Três vasos de concreto com relevo de anéis, em tons de areia, com espigas secas", order: 3 },
];

const FEITO_A_MAO =
  "Cada peça é moldada e desmoldada à mão, curada com calma e finalizada uma a uma. Pequenas variações de cor, poros e textura fazem parte do material e tornam cada vaso único.";

export const SEED_PRODUCTS: SeedProduct[] = [
  // ---- Linha Ripples (aromaterapia) ----
  // Medidas do Redondo e do Alto vêm das fotos do fornecedor; as do Gota e os pesos são ESTIMATIVAS — ajuste no admin.
  {
    name: "Kit 3 Vasos Ripples", slug: "kit-3-vasos-ripples", category: "aromaterapia", priceCents: 6490,
    heightCm: 13.8, widthCm: 25, depthCm: 9, round: false, weightGrams: 1500, hasDrainage: false, badge: "Novo",
    plants: ["Aromaterapia", "Flores secas", "Ramos e espigas"], sortOrder: 31, stockPerFinish: 10,
    finishes: ["areia", "grafite", "branco-pedra"],
    shortDescription: "Kit com 3 vasos de concreto para aromaterapia, com relevo de anéis.",
    longDescription: `O Kit 3 Vasos Ripples reúne os três formatos da linha — redondo (8,6 cm de altura), gota e alto (13,8 cm) — em concreto com relevo de anéis concêntricos. São vasos decorativos, sem furo de drenagem, pensados para aromaterapia e para flores e espigas secas. ${FEITO_A_MAO}`,
    images: [
      { url: "/images/products/aromaterapia-kit-areia.webp", alt: "Kit com três vasos Ripples de concreto em tom areia, com relevo de anéis e espigas secas" },
      { url: "/images/products/aromaterapia-kit-grafite.webp", alt: "Kit com três vasos Ripples de concreto em grafite, um deles segurado na mão" },
      { url: "/images/products/aromaterapia-kit-branco.webp", alt: "Kit com três vasos Ripples de concreto brancos sobre uma tábua de madeira, com ramos secos" },
    ],
  },
  {
    name: "Vaso Ripples Redondo", slug: "vaso-ripples-redondo", category: "aromaterapia", priceCents: 2490,
    heightCm: 8.6, widthCm: 8.2, depthCm: 8.2, round: true, weightGrams: 450, hasDrainage: false, badge: null,
    plants: ["Aromaterapia", "Flores secas"], sortOrder: 32, stockPerFinish: 10,
    finishes: ["areia", "grafite", "branco-pedra"],
    shortDescription: "Vaso de concreto para aromaterapia, formato redondo (8,6 × Ø8,2 cm).",
    longDescription: `O modelo redondo da linha Ripples: pequeno, com relevo de anéis e boca estreita. Decorativo e sem furo de drenagem, combina com aromaterapia (varetas e óleos essenciais) e com flores secas. ${FEITO_A_MAO}`,
    images: [
      { url: "/images/products/aromaterapia-redondo-1.webp", alt: "Vaso Ripples redondo de concreto branco com relevo de anéis, vista frontal" },
      { url: "/images/products/aromaterapia-redondo-2.webp", alt: "Vaso Ripples redondo com as medidas: 8,6 cm de altura e 8,2 cm de largura" },
      { url: "/images/products/aromaterapia-kit-areia.webp", alt: "Vasos Ripples em tom areia, com o modelo redondo à direita" },
      { url: "/images/products/aromaterapia-kit-grafite.webp", alt: "Vasos Ripples em grafite, com o modelo redondo à esquerda" },
    ],
  },
  {
    name: "Vaso Ripples Alto", slug: "vaso-ripples-alto", category: "aromaterapia", priceCents: 2490,
    heightCm: 13.8, widthCm: 6.9, depthCm: 6.9, round: true, weightGrams: 550, hasDrainage: false, badge: null,
    plants: ["Aromaterapia", "Flores secas", "Espigas"], sortOrder: 33, stockPerFinish: 10,
    finishes: ["areia", "grafite", "branco-pedra"],
    shortDescription: "Vaso de concreto para aromaterapia, formato alto (13,8 × Ø6,9 cm).",
    longDescription: `O modelo alto da linha Ripples: silhueta esguia com relevo de anéis, ótima para espigas e ramos secos ou para um difusor de varetas. Decorativo, sem furo de drenagem. ${FEITO_A_MAO}`,
    images: [
      { url: "/images/products/aromaterapia-alto-1.webp", alt: "Vaso Ripples alto de concreto branco com relevo de anéis, vista frontal" },
      { url: "/images/products/aromaterapia-alto-2.webp", alt: "Vaso Ripples alto com as medidas: 13,8 cm de altura e 6,9 cm de largura" },
      { url: "/images/products/aromaterapia-kit-areia.webp", alt: "Vasos Ripples em tom areia, com o modelo alto ao centro" },
      { url: "/images/products/aromaterapia-kit-grafite.webp", alt: "Vasos Ripples em grafite, com o modelo alto ao centro" },
    ],
  },
  {
    name: "Vaso Ripples Gota", slug: "vaso-ripples-gota", category: "aromaterapia", priceCents: 2490,
    heightCm: 11.5, widthCm: 8, depthCm: 8, round: true, weightGrams: 500, hasDrainage: false, badge: null,
    plants: ["Aromaterapia", "Flores secas", "Ramos"], sortOrder: 34, stockPerFinish: 10,
    finishes: ["areia", "grafite", "branco-pedra"],
    shortDescription: "Vaso de concreto para aromaterapia, formato gota (medidas aproximadas).",
    longDescription: `O modelo gota da linha Ripples: base larga e boca estreita, com relevo de anéis. Decorativo, sem furo de drenagem; bom para aromaterapia e flores secas. Medidas aproximadas — confirme pelo WhatsApp. ${FEITO_A_MAO}`,
    images: [
      { url: "/images/products/aromaterapia-kit-areia.webp", alt: "Vasos Ripples em tom areia, com o modelo gota à esquerda" },
      { url: "/images/products/aromaterapia-kit-grafite.webp", alt: "Vasos Ripples em grafite, com o modelo gota à direita" },
      { url: "/images/products/aromaterapia-kit-branco.webp", alt: "Vasos Ripples brancos, com o modelo gota à direita" },
    ],
  },
  // ---- Vaso Floral (relevo 3D) ----
  // Medidas (8,0 × Ø8,5 cm) vêm da foto do fornecedor; peso e estoque são ESTIMATIVAS — ajuste no admin.
  // As cores "em breve" usam fotos ILUSTRATIVAS (scripts/process-floral-cores.py): troque pelas fotos reais quando produzir.
  {
    name: "Vaso Floral Luxo - Relevo em 3D", slug: "vaso-floral-luxo-relevo-3d", category: "pequenos", priceCents: 4590,
    heightCm: 8, widthCm: 8.5, depthCm: 8.5, round: true, weightGrams: 600, hasDrainage: false, badge: "Novo",
    plants: ["Samambaia", "Folhagens pequenas", "Flores secas"], sortOrder: 15, stockPerFinish: 10,
    finishes: ["branco-pedra"],
    comingSoonFinishes: {
      "rosa-flores-branco": { url: "/images/products/floral-luxo-rosa.webp", alt: "Ilustração: vaso floral com as flores pintadas de rosa, com o miolo branco" },
      "roxo-flores-branco": { url: "/images/products/floral-luxo-roxo.webp", alt: "Ilustração: vaso floral com as flores pintadas de roxo, com o miolo branco" },
      "amarelo-flores-branco": { url: "/images/products/floral-luxo-amarelo.webp", alt: "Ilustração: vaso floral com as flores pintadas de amarelo, com o miolo branco" },
      "verde-branco-roxo": { url: "/images/products/floral-luxo-verde-roxo.webp", alt: "Ilustração: vaso floral verde, com pétalas brancas por dentro e roxas nas bordas" },
      "preto-vermelho": { url: "/images/products/floral-luxo-preto-vermelho.webp", alt: "Ilustração: vaso floral preto fosco com pétalas vermelho vibrante" },
      "branco-cinza-vermelho": { url: "/images/products/floral-luxo-branco-vermelho.webp", alt: "Ilustração: vaso floral branco com sombreado cinza e pétalas vermelho vibrante" },
    },
    shortDescription: "Vaso de Concreto (Leve)",
    longDescription: `Vaso redondo de concreto leve coberto por flores em alto-relevo 3D. Pequeno e delicado, fica bem em bancadas, mesas de cabeceira e banheiros, com folhagens pequenas como samambaia e hera ou com flores secas. Pode ser presenteado: uma das fotos mostra o vaso em caixa de presente. Além do branco, vêm aí novas cores pintadas à mão, principalmente nas flores — as opções marcadas como "em breve" ainda não foram produzidas e as fotos delas são ilustrações de como vão ficar. Vendido apenas o vaso: a planta que aparece nas fotos não acompanha o produto. ${FEITO_A_MAO}`,
    images: [
      { url: "/images/products/floral-luxo-1.webp", alt: "Vaso de concreto branco com flores em relevo 3D e samambaia, sobre uma bandeja ao lado de vela e sabonete líquido" },
      { url: "/images/products/floral-luxo-3.webp", alt: "Vaso de concreto branco com flores em relevo 3D e samambaia, em fundo claro" },
      { url: "/images/products/floral-luxo-2.webp", alt: "Vaso de concreto branco com flores em relevo 3D dentro de uma caixa de presente com papel de seda" },
      { url: "/images/products/floral-luxo-rosa.webp", alt: "Ilustração: vaso floral com as flores pintadas de rosa, com o miolo branco" },
      { url: "/images/products/floral-luxo-roxo.webp", alt: "Ilustração: vaso floral com as flores pintadas de roxo, com o miolo branco" },
      { url: "/images/products/floral-luxo-amarelo.webp", alt: "Ilustração: vaso floral com as flores pintadas de amarelo, com o miolo branco" },
      { url: "/images/products/floral-luxo-verde-roxo.webp", alt: "Ilustração: vaso floral verde, com pétalas brancas por dentro e roxas nas bordas" },
      { url: "/images/products/floral-luxo-preto-vermelho.webp", alt: "Ilustração: vaso floral preto fosco com pétalas vermelho vibrante" },
      { url: "/images/products/floral-luxo-branco-vermelho.webp", alt: "Ilustração: vaso floral branco com sombreado cinza e pétalas vermelho vibrante" },
    ],
  },
  // ---- Vaso Lavanda (relevo 3D, tema jardim) ----
  // Medidas (7,6 × Ø8,0 cm) vêm da foto do fornecedor; peso e estoque são ESTIMATIVAS — ajuste no admin.
  {
    name: "Vaso de Concreto Lavanda Relevo 3D", slug: "vaso-concreto-lavanda-relevo-3d", category: "pequenos", priceCents: 4590,
    heightCm: 7.6, widthCm: 8, depthCm: 8, round: true, weightGrams: 550, hasDrainage: false, badge: "Novo",
    plants: ["Lavanda seca", "Samambaia", "Hera"], sortOrder: 16, stockPerFinish: 10,
    finishes: ["lavanda"],
    shortDescription: "Vaso de concreto lilás com relevo 3D de folhas, de tema jardim.",
    longDescription: `Vaso redondo de concreto na cor lavanda, com relevo 3D de folhas em tema jardim. Pequeno e delicado, combina com bancadas, criados-mudos e mesas de apoio, com folhagens pequenas, flores secas ou ramos de lavanda. Vendido apenas o vaso: a planta que aparece nas fotos não acompanha o produto. ${FEITO_A_MAO}`,
    images: [
      { url: "/images/products/lavanda-1.webp", alt: "Mão segurando o vaso de concreto lavanda com relevo 3D de folhas e íris roxas" },
      { url: "/images/products/lavanda-2.webp", alt: "Vaso de concreto lavanda com relevo 3D de folhas e íris roxas, sobre uma pedra no jardim" },
      { url: "/images/products/lavanda-4.webp", alt: "Vaso de concreto lilás com ramos de lavanda e as medidas: 7,6 cm de altura por 8 cm de largura" },
      { url: "/images/products/lavanda-3.webp", alt: "Vaso de concreto roxo com margaridas e as medidas: 7,6 cm de altura por 8 cm de largura" },
      { url: "/images/products/lavanda-5.webp", alt: "Vaso de concreto lavanda com relevo 3D de folhas e íris roxas, sobre mesa com renda" },
    ],
  },
  // ---- Kit Floral + Lavanda: 2 vasos, preço = 2 × R$ 45,90 com 2% de desconto (R$ 91,80 → R$ 89,96) ----
  // Peso = soma das estimativas dos dois vasos — ajuste no admin.
  {
    name: "Kit 2 Vasos Relevo 3D: Floral e Lavanda", slug: "kit-2-vasos-floral-lavanda-relevo-3d", category: "pequenos", priceCents: 8996,
    heightCm: 8, widthCm: 17, depthCm: 8.5, round: false, weightGrams: 1150, hasDrainage: false, badge: "Oferta",
    plants: ["Samambaia", "Folhagens pequenas", "Flores secas"], sortOrder: 17, stockPerFinish: 10,
    finishes: ["branco-lavanda"],
    shortDescription: "Dois vasos de concreto com relevo 3D — Floral (branco) e Lavanda — com 2% de desconto.",
    longDescription: `Kit com dois vasos de concreto com relevo 3D: o Vaso Floral Luxo (branco, 8 × Ø8,5 cm) e o Vaso de Concreto Lavanda (lilás, 7,6 × Ø8 cm). Juntos saem por R$ 89,96 — 2% a menos do que comprar os dois separados (R$ 45,90 cada). Ficam lindos lado a lado em bancadas, aparadores e mesas de cabeceira. Vendido apenas os vasos: as plantas que aparecem nas fotos não acompanham o produto. ${FEITO_A_MAO}`,
    images: [
      { url: "/images/products/kit-floral-lavanda.webp", alt: "Kit com dois vasos de concreto com relevo 3D lado a lado: o Floral branco e o Lavanda lilás" },
      { url: "/images/products/floral-luxo-1.webp", alt: "Vaso de concreto branco com flores em relevo 3D e samambaia, sobre uma bandeja ao lado de vela e sabonete líquido" },
      { url: "/images/products/lavanda-1.webp", alt: "Mão segurando o vaso de concreto lavanda com relevo 3D de folhas e íris roxas" },
      { url: "/images/products/lavanda-2.webp", alt: "Vaso de concreto lavanda com relevo 3D de folhas e íris roxas, sobre uma pedra no jardim" },
    ],
  },
  // ---- Vasos Redondos Luxuosos ----
  // Medidas lidas da imagem de medidas do fornecedor (largura × altura): 7,7 × 5,3 · 8,6 × 5,5 · 10 × 6,2 cm.
  // Pesos e estoques são ESTIMATIVAS — ajuste no admin. O tamanho "Grande" assume o preço R$ 29,90.
  {
    name: "Vaso de Concreto Redondo Luxuoso Pequeno", slug: "vaso-concreto-redondo-luxuoso-pequeno", category: "pequenos", priceCents: 2590,
    heightCm: 5.3, widthCm: 7.7, depthCm: 7.7, round: true, weightGrams: 400, hasDrainage: false, badge: null,
    plants: ["Suculentas", "Cactos", "Flores secas"], sortOrder: 17, stockPerFinish: 10,
    finishes: ["branco-pedra"],
    shortDescription: "Vaso de concreto redondo, tamanho pequeno (7,7 × 5,3 cm).",
    longDescription: `O menor da linha Redondo Luxuoso: esfera achatada de concreto liso, com boca larga. Bom para suculentas e cactos pequenos, velas ou como decoração sozinho. Vendido apenas o vaso: a planta que aparece nas fotos não acompanha o produto. ${FEITO_A_MAO}`,
    images: [
      { url: "/images/products/redondo-mao.webp", alt: "Vaso redondo de concreto branco segurado na mão, para dar noção de tamanho" },
      { url: "/images/products/redondo-medidas-pequeno.webp", alt: "Ilustração do vaso redondo pequeno com as medidas: 7,7 cm de largura e 5,3 cm de altura" },
      { url: "/images/products/redondo-trio-suculentas.webp", alt: "Três vasos redondos de concreto branco em uma bandeja; o pequeno é o da esquerda" },
    ],
  },
  {
    name: "Vaso de Concreto Redondo Luxuoso Médio", slug: "vaso-concreto-redondo-luxuoso-medio", category: "pequenos", priceCents: 2790,
    heightCm: 5.5, widthCm: 8.6, depthCm: 8.6, round: true, weightGrams: 500, hasDrainage: false, badge: null,
    plants: ["Suculentas", "Cactos", "Flores secas"], sortOrder: 18, stockPerFinish: 10,
    finishes: ["branco-pedra"],
    shortDescription: "Vaso de concreto redondo, tamanho médio (8,6 × 5,5 cm).",
    longDescription: `O tamanho médio da linha Redondo Luxuoso: esfera achatada de concreto liso, com boca larga. Combina com suculentas, arranjos pequenos e velas. Vendido apenas o vaso: a planta que aparece nas fotos não acompanha o produto. ${FEITO_A_MAO}`,
    images: [
      { url: "/images/products/redondo-mao.webp", alt: "Vaso redondo de concreto branco segurado na mão, para dar noção de tamanho" },
      { url: "/images/products/redondo-medidas-medio.webp", alt: "Ilustração do vaso redondo médio com as medidas: 8,6 cm de largura e 5,5 cm de altura" },
      { url: "/images/products/redondo-trio-suculentas.webp", alt: "Três vasos redondos de concreto branco em uma bandeja; o médio é o do centro" },
    ],
  },
  {
    name: "Vaso de Concreto Redondo Luxuoso Grande", slug: "vaso-concreto-redondo-luxuoso-grande", category: "pequenos", priceCents: 2990,
    heightCm: 6.2, widthCm: 10, depthCm: 10, round: true, weightGrams: 650, hasDrainage: false, badge: null,
    plants: ["Suculentas", "Cactos", "Flores secas"], sortOrder: 19, stockPerFinish: 10,
    finishes: ["branco-pedra"],
    shortDescription: "Vaso de concreto redondo, tamanho grande (10 × 6,2 cm).",
    longDescription: `O maior da linha Redondo Luxuoso: esfera achatada de concreto liso, com boca larga, que acomoda arranjos de suculentas e velas maiores. Vendido apenas o vaso: a planta que aparece nas fotos não acompanha o produto. ${FEITO_A_MAO}`,
    images: [
      { url: "/images/products/redondo-mao.webp", alt: "Vaso redondo de concreto branco segurado na mão, para dar noção de tamanho" },
      { url: "/images/products/redondo-medidas-grande.webp", alt: "Ilustração do vaso redondo grande com as medidas: 10 cm de largura e 6,2 cm de altura" },
      { url: "/images/products/redondo-trio-suculentas.webp", alt: "Três vasos redondos de concreto branco em uma bandeja; o grande é o da direita" },
    ],
  },
  {
    name: "Kit 3 Vasos de Concreto Redondos Luxuosos", slug: "kit-3-vasos-concreto-redondos-luxuosos", category: "pequenos", priceCents: 7490,
    heightCm: 6.2, widthCm: 26.3, depthCm: 10, round: false, weightGrams: 1550, hasDrainage: false, badge: "Novo",
    plants: ["Suculentas", "Cactos", "Flores secas"], sortOrder: 20, stockPerFinish: 10,
    finishes: ["branco-pedra"],
    shortDescription: "Kit com 3 vasos redondos de concreto, nos três tamanhos da linha.",
    longDescription: `O Kit 3 Vasos de Concreto Redondos Luxuosos reúne os três tamanhos da linha — pequeno (7,7 × 5,3 cm), médio (8,6 × 5,5 cm) e grande (10 × 6,2 cm) — em esfera achatada de concreto liso. Fica lindo em fileira sobre uma bandeja ou bancada. Vendido apenas os vasos: as plantas que aparecem nas fotos não acompanham o produto. ${FEITO_A_MAO}`,
    images: [
      { url: "/images/products/redondo-trio-suculentas.webp", alt: "Três vasos redondos de concreto branco de tamanhos diferentes sobre uma bandeja, com suculentas" },
      { url: "/images/products/redondo-mao.webp", alt: "Vaso redondo de concreto branco segurado na mão, para dar noção de tamanho" },
      { url: "/images/products/redondo-medidas-kit.webp", alt: "Ilustração dos três vasos redondos do kit com as medidas: 7,7 × 5,3, 8,6 × 5,5 e 10 × 6,2 cm" },
    ],
  },
  // ---- Vasos Listrados Luxuosos ----
  // Medidas lidas das imagens do fornecedor. PESO: weightGrams = 0 significa "a informar" (o peso das imagens é do molde):
  // pese a peça pronta e atualize no admin (Produtos → editar). Até lá o frete usa o peso mínimo da cotação.
  {
    name: "Vaso de Concreto Listrado Luxuoso", slug: "vaso-concreto-listrado-luxuoso", category: "medios", priceCents: 4990,
    heightCm: 12.7, widthCm: 10.4, depthCm: 10.4, round: true, weightGrams: 0, hasDrainage: false, badge: "Novo",
    plants: ["Flores secas", "Ramos e espigas"], sortOrder: 21, stockPerFinish: 10,
    finishes: ["branco-pedra", "verde"],
    finishImages: { "branco-pedra": "/images/products/listrado-1.webp", "verde": "/images/products/listrado-2.webp" },
    shortDescription: "Vaso de concreto com relevo listrado vertical (12,7 × Ø10,4 cm).",
    longDescription: `Vaso de concreto com listras verticais em relevo e formato de gota, de boca larga. Fica bonito sozinho, com flores e ramos secos. Disponível em branco e verde. Veja também o Listrado Luxuoso Premium, com folha de ouro. Vendido apenas o vaso: as flores e os objetos que aparecem nas fotos não acompanham o produto. ${FEITO_A_MAO}`,
    images: [
      { url: "/images/products/listrado-1.webp", alt: "Vaso de concreto listrado branco e vaso ampulheta, com flores secas e pampas, sobre um fundo rosa" },
      { url: "/images/products/listrado-2.webp", alt: "Vaso de concreto listrado verde com flores amarelas, em fundo rosa" },
      { url: "/images/products/listrado-3.webp", alt: "Vaso de concreto ampulheta listrado branco com flores secas, sobre um livro" },
    ],
  },
  // ---- Listrado Luxuoso Premium (folha de ouro): R$ 59,90, tudo "em breve" com imagens ILUSTRATIVAS (scripts/process-listrado-cores.py) ----
  {
    name: "Vaso de Concreto Listrado Luxuoso Premium", slug: "vaso-concreto-listrado-luxuoso-premium", category: "medios", priceCents: 5990,
    heightCm: 12.7, widthCm: 10.4, depthCm: 10.4, round: true, weightGrams: 0, hasDrainage: false, badge: "Em breve",
    plants: ["Flores secas", "Ramos e espigas"], sortOrder: 1, stockPerFinish: 10,
    finishes: [],
    comingSoonFinishes: {
      "preto-dourado": { url: "/images/products/listrado-premium-preto-dourado.webp", alt: "Ilustração: vaso listrado luxuoso preto com folha de ouro (versão premium)" },
      "vermelho-dourado": { url: "/images/products/listrado-premium-vermelho-dourado.webp", alt: "Ilustração: vaso listrado luxuoso vermelho com folha de ouro (versão premium)" },
      "marmore-dourado": { url: "/images/products/listrado-premium-marmore.webp", alt: "Ilustração: vaso listrado luxuoso em mármore com folha de ouro (versão premium)" },
    },
    shortDescription: "Versão premium do Listrado, com folha de ouro (12,7 × Ø10,4 cm). Em breve.",
    longDescription: `Versão premium do Vaso de Concreto Listrado Luxuoso, com acabamento em folha de ouro, nas cores preto e dourado, vermelho e dourado e mármore. Ainda não foi produzido: as fotos são ilustrações de como vai ficar e o vaso só poderá ser comprado quando for lançado — chame no WhatsApp para ser avisado. Vendido apenas o vaso: as flores e os objetos das fotos não acompanham o produto. ${FEITO_A_MAO}`,
    images: [
      { url: "/images/products/listrado-premium-preto-dourado.webp", alt: "Ilustração: vaso listrado luxuoso preto com folha de ouro (versão premium)" },
      { url: "/images/products/listrado-premium-vermelho-dourado.webp", alt: "Ilustração: vaso listrado luxuoso vermelho com folha de ouro (versão premium)" },
      { url: "/images/products/listrado-premium-marmore.webp", alt: "Ilustração: vaso listrado luxuoso em mármore com folha de ouro (versão premium)" },
    ],
  },
];

export const FAQ = [
  {
    q: "O vaso tem furo de drenagem?",
    a: "Depende do modelo — a informação está na ficha de cada produto (aba Medidas e peso). Vasos sem furo são decorativos: use para flores secas, velas e aromaterapia, ou como cachepô de um vaso com furo.",
  },
  {
    q: "O vaso acompanha planta?",
    a: "Não. Vendemos apenas os vasos. As plantas e os objetos que aparecem nas fotos são para ilustrar o uso e não acompanham o produto.",
  },
  {
    q: "Pode ficar ao sol e na chuva?",
    a: "Pode. O cimento é resistente ao tempo, mas para preservar a cor e a textura por mais tempo indicamos aplicar um impermeabilizante incolor à base de água, principalmente em áreas externas. Veja a página de cuidados.",
  },
  {
    q: "Como limpar?",
    a: "Com pano úmido e sabão neutro, sem buchas abrasivas nem produtos ácidos. Pequenas manchas de umidade e variações de tom são naturais do cimento.",
  },
  {
    q: "Qual o prazo de produção?",
    a: "Peças em estoque saem em poucos dias úteis. Como tudo é feito à mão, a cura do concreto leva tempo e, em períodos de muita procura, o prazo pode aumentar — avisamos você antes de qualquer atraso.",
  },
  {
    q: "Como funciona o frete grátis?",
    a: "Em compras com subtotal acima de R$ 160,00, a opção de frete mais econômica sai grátis. A regra considera o valor dos produtos, antes de cupons de desconto. Você também pode retirar no local sem custo.",
  },
  {
    q: "Trocas e devoluções?",
    a: "Você tem 7 dias após o recebimento para desistir da compra (CDC, art. 49). Em caso de peça danificada no transporte, avise em até 7 dias com fotos e fazemos a troca. Detalhes na página de trocas e devoluções.",
  },
];
