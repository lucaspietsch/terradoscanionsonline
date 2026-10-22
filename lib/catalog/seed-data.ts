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
}

export const SEED_FINISHES: SeedFinish[] = [
  { name: "Cimento Natural", slug: "cimento-natural", hex: "#A8A59E" },
  { name: "Grafite", slug: "grafite", hex: "#4B4F4A" },
  { name: "Areia", slug: "areia", hex: "#CDBFA6" },
  { name: "Branco Pedra", slug: "branco-pedra", hex: "#E6E3DB" },
  { name: "Lavanda", slug: "lavanda", hex: "#A89CC4" },
];

/** Acabamentos dos vasos originais; produtos sem `finishes` próprio usam estes. */
export const BASE_FINISH_SLUGS = ["cimento-natural", "grafite", "areia", "branco-pedra"];

export const SEED_CATEGORIES: SeedCategory[] = [
  { name: "Pequenos", slug: "pequenos", imageUrl: "/images/categorias/pequenos.webp", imageAlt: "Três vasos pequenos de cimento com suculentas sobre uma bancada clara", order: 1 },
  { name: "Médios", slug: "medios", imageUrl: "/images/categorias/medios.webp", imageAlt: "Vaso médio de cimento com zamioculca ao lado de uma janela", order: 2 },
  { name: "Grandes", slug: "grandes", imageUrl: "/images/categorias/grandes.webp", imageAlt: "Vaso grande de cimento com costela-de-adão em canto de sala", order: 3 },
  { name: "Jardineiras", slug: "jardineiras", imageUrl: "/images/categorias/jardineiras.webp", imageAlt: "Jardineira retangular de cimento com temperos sobre uma bancada", order: 4 },
  { name: "Aromaterapia", slug: "aromaterapia", imageUrl: "/images/categorias/aromaterapia.webp", imageAlt: "Três vasos de concreto com relevo de anéis, em tons de areia, com espigas secas", order: 5 },
];

const FEITO_A_MAO =
  "Cada peça é moldada e desmoldada à mão, curada com calma e finalizada uma a uma. Pequenas variações de cor, poros e textura fazem parte do material e tornam cada vaso único.";

const img = (slug: string, name: string) => [
  { url: `/images/products/${slug}-1.webp`, alt: `${name} de cimento vazio, vista frontal com luz natural` },
  { url: `/images/products/${slug}-2.webp`, alt: `${name} de cimento com planta, em primeiro plano` },
  { url: `/images/products/${slug}-3.webp`, alt: `${name} de cimento com planta decorando um ambiente interno` },
  { url: `/images/products/${slug}-4.webp`, alt: `${name} de cimento ao lado de uma régua mostrando a escala em centímetros` },
];

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    name: "Vaso Semente", slug: "vaso-semente", category: "pequenos", priceCents: 3500,
    heightCm: 12, widthCm: 14, depthCm: 14, round: true, weightGrams: 900, hasDrainage: true, badge: null,
    plants: ["Suculentas", "Cactos"], sortOrder: 1, stockPerFinish: 12,
    shortDescription: "Bolinha de cimento, do tamanho ideal para suculentas e cactos.",
    longDescription: `Pequeno, redondo e acolhedor, o Vaso Semente é o ponto de partida de qualquer cantinho verde. Cabe em prateleira, mesa de trabalho e parapeito, e combina muito bem em grupos de três. ${FEITO_A_MAO}`,
    images: img("vaso-semente", "Vaso Semente"),
  },
  {
    name: "Vaso Broto", slug: "vaso-broto", category: "pequenos", priceCents: 3500,
    heightCm: 12, widthCm: 12, depthCm: 12, round: true, weightGrams: 800, hasDrainage: true, badge: null,
    plants: ["Mini suculentas", "Ervas"], sortOrder: 2, stockPerFinish: 12,
    shortDescription: "Cilindro mini com linhas retas, perfeito para ervas e mini suculentas.",
    longDescription: `Um cilindro compacto de linhas limpas. O Vaso Broto fica ótimo na janela da cozinha com uma erva fresca ou em fileira com outras peças da coleção. ${FEITO_A_MAO}`,
    images: img("vaso-broto", "Vaso Broto"),
  },
  {
    name: "Vaso Cuia", slug: "vaso-cuia", category: "pequenos", priceCents: 3500,
    heightCm: 8, widthCm: 18, depthCm: 18, round: true, weightGrams: 1100, hasDrainage: true, badge: null,
    plants: ["Mini jardins", "Terrários abertos"], sortOrder: 3, stockPerFinish: 10,
    shortDescription: "Tigela baixa e larga para mini jardins e terrários abertos.",
    longDescription: `Baixa e generosa, a Cuia convida a montar pequenos jardins com pedras, musgo e suculentas de formatos diferentes. ${FEITO_A_MAO}`,
    images: img("vaso-cuia", "Vaso Cuia"),
  },
  {
    name: "Vaso Seixo", slug: "vaso-seixo", category: "medios", priceCents: 5000,
    heightCm: 16, widthCm: 20, depthCm: 20, round: true, weightGrams: 2200, hasDrainage: true, badge: null,
    plants: ["Peperômia", "Jiboia"], sortOrder: 4, stockPerFinish: 10,
    shortDescription: "Forma oval e orgânica, como uma pedra de rio.",
    longDescription: `Inspirado nas pedras lisas de rio, o Vaso Seixo tem curvas suaves e boa estabilidade. Recebe bem folhagens que caem pelas bordas, como a jiboia e a peperômia. ${FEITO_A_MAO}`,
    images: img("vaso-seixo", "Vaso Seixo"),
  },
  {
    name: "Vaso Ipê", slug: "vaso-ipe", category: "medios", priceCents: 5000,
    heightCm: 20, widthCm: 18, depthCm: 18, round: true, weightGrams: 2400, hasDrainage: true, badge: null,
    plants: ["Zamioculca", "Lírio-da-paz"], sortOrder: 5, stockPerFinish: 10,
    shortDescription: "Cone elegante que abre para cima e valoriza folhagens volumosas.",
    longDescription: `O Vaso Ipê estreita na base e se abre no topo, dando destaque à planta. É uma ótima escolha para mesas laterais, aparadores e cantos de sala. ${FEITO_A_MAO}`,
    images: img("vaso-ipe", "Vaso Ipê"),
  },
  {
    name: "Vaso Ripado", slug: "vaso-ripado", category: "medios", priceCents: 5000,
    heightCm: 18, widthCm: 18, depthCm: 18, round: true, weightGrams: 2600, hasDrainage: true, badge: null,
    plants: ["Calathea", "Maranta"], sortOrder: 6, stockPerFinish: 10,
    shortDescription: "Cilindro com frisos verticais que brincam com a luz.",
    longDescription: `Os frisos do Vaso Ripado criam sombras suaves ao longo do dia e dão textura ao ambiente sem perder a discrição. Combina com folhagens de folhas largas e desenhadas. ${FEITO_A_MAO}`,
    images: img("vaso-ripado", "Vaso Ripado"),
  },
  {
    name: "Vaso Restinga", slug: "vaso-restinga", category: "medios", priceCents: 5000,
    heightCm: 14, widthCm: 20, depthCm: 20, round: false, weightGrams: 3200, hasDrainage: true, badge: null,
    plants: ["Bromélias", "Suculentas"], sortOrder: 7, stockPerFinish: 8,
    shortDescription: "Quadrado e baixo, firme como uma pedra, para bromélias e suculentas.",
    longDescription: `Geometria simples, presença forte. O Vaso Restinga tem base larga e estável, ideal para arranjos de suculentas e bromélias em mesas de centro e bancadas. ${FEITO_A_MAO}`,
    images: img("vaso-restinga", "Vaso Restinga"),
  },
  {
    name: "Vaso Cambará", slug: "vaso-cambara", category: "grandes", priceCents: 8000,
    heightCm: 35, widthCm: 22, depthCm: 22, round: true, weightGrams: 7500, hasDrainage: true, badge: null,
    plants: ["Espada-de-são-jorge", "Dracena"], sortOrder: 8, stockPerFinish: 6,
    shortDescription: "Cilindro alto que leva o nome da casa, para plantas de porte.",
    longDescription: `O Vaso Cambará é a peça de assinatura da marca: alto, firme e sereno. Sustenta espadas-de-são-jorge e dracenas com folga e funciona muito bem ao lado de sofás, estantes e portas. ${FEITO_A_MAO}`,
    images: img("vaso-cambara", "Vaso Cambará"),
  },
  {
    name: "Vaso Lua", slug: "vaso-lua", category: "grandes", priceCents: 8000,
    heightCm: 28, widthCm: 32, depthCm: 32, round: true, weightGrams: 9000, hasDrainage: true, badge: "Novo",
    plants: ["Costela-de-adão", "Palmeira-ráfis"], sortOrder: 9, stockPerFinish: 6,
    shortDescription: "Bola grande e macia, para uma planta que domina o canto da sala.",
    longDescription: `Redondo e volumoso, o Vaso Lua dá lugar para raízes de plantas grandes crescerem tranquilas. Pede um canto livre onde a folhagem possa se espalhar. ${FEITO_A_MAO}`,
    images: img("vaso-lua", "Vaso Lua"),
  },
  {
    name: "Jardineira Mata", slug: "jardineira-mata", category: "jardineiras", priceCents: 8000,
    heightCm: 15, widthCm: 45, depthCm: 18, round: false, weightGrams: 6000, hasDrainage: true, badge: "Novo",
    plants: ["Temperos", "Flores", "Folhagens pendentes"], sortOrder: 10, stockPerFinish: 6,
    shortDescription: "Retangular e comprida: temperos, flores e folhagens que caem pela borda.",
    longDescription: `Ocupa o peitoril, a bancada ou a varanda com uma faixa de verde. A Jardineira Mata comporta várias mudas lado a lado, do manjericão às folhagens pendentes. ${FEITO_A_MAO}`,
    images: img("jardineira-mata", "Jardineira Mata"),
  },
  // ---- Linha Ripples (aromaterapia) ----
  // Medidas do Redondo e do Alto vêm das fotos do fornecedor; as do Gota e os pesos são ESTIMATIVAS — ajuste no admin.
  {
    name: "Kit 3 Vasos Ripples", slug: "kit-3-vasos-ripples", category: "aromaterapia", priceCents: 6490,
    heightCm: 13.8, widthCm: 25, depthCm: 9, round: false, weightGrams: 1500, hasDrainage: false, badge: "Novo",
    plants: ["Aromaterapia", "Flores secas", "Ramos e espigas"], sortOrder: 11, stockPerFinish: 10,
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
    plants: ["Aromaterapia", "Flores secas"], sortOrder: 12, stockPerFinish: 10,
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
    plants: ["Aromaterapia", "Flores secas", "Espigas"], sortOrder: 13, stockPerFinish: 10,
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
    plants: ["Aromaterapia", "Flores secas", "Ramos"], sortOrder: 14, stockPerFinish: 10,
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
  {
    name: "Vaso de Concreto Floral Relevo 3D", slug: "vaso-concreto-floral-relevo-3d", category: "pequenos", priceCents: 4590,
    heightCm: 8, widthCm: 8.5, depthCm: 8.5, round: true, weightGrams: 600, hasDrainage: false, badge: "Novo",
    plants: ["Samambaia", "Folhagens pequenas", "Flores secas"], sortOrder: 15, stockPerFinish: 10,
    finishes: ["branco-pedra"],
    shortDescription: "Vaso de concreto com flores em relevo 3D, de tema florestal.",
    longDescription: `Vaso redondo de concreto coberto por flores em alto-relevo, com tema florestal. Pequeno e delicado, fica bem em bancadas, mesas de cabeceira e banheiros, com folhagens pequenas como samambaia e hera ou com flores secas. Pode ser presenteado: as fotos mostram o vaso em caixa de presente. Vendido apenas o vaso: a planta que aparece nas fotos não acompanha o produto. ${FEITO_A_MAO}`,
    images: [
      { url: "/images/products/floral-1.webp", alt: "Vaso de concreto branco com flores em relevo 3D e samambaia, sobre uma bandeja ao lado de vela e sabonete líquido" },
      { url: "/images/products/floral-3.webp", alt: "Vaso de concreto branco com flores em relevo 3D e samambaia, em fundo claro" },
      { url: "/images/products/floral-2.webp", alt: "Vaso de concreto branco com flores em relevo 3D dentro de uma caixa de presente com papel de seda" },
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
    longDescription: `Vaso redondo de concreto na cor lavanda, com relevo 3D de folhas em tema jardim. Pequeno e delicado, combina com bancadas, criados-mudos e mesas de apoio, com folhagens pequenas como samambaia e hera ou com lavanda seca. Pode ser presenteado: as fotos mostram o vaso em caixa de presente. Vendido apenas o vaso: a planta que aparece nas fotos não acompanha o produto. ${FEITO_A_MAO}`,
    images: [
      { url: "/images/products/lavanda-2.webp", alt: "Vaso de concreto lavanda com relevo 3D de folhas e uma plantinha de samambaia e hera, sobre uma mesa clara" },
      { url: "/images/products/lavanda-4.webp", alt: "Vaso de concreto lavanda com relevo 3D de folhas e ramos de lavanda seca" },
      { url: "/images/products/lavanda-5.webp", alt: "Vaso de concreto lavanda com relevo 3D de folhas e plantinha, em primeiro plano" },
      { url: "/images/products/lavanda-3.webp", alt: "Vaso de concreto lavanda com plantinha dentro de uma caixa de presente com palha" },
      { url: "/images/products/lavanda-1.webp", alt: "Vaso de concreto lavanda com plantinha sobre uma cama, ao lado de almofadas lilás" },
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
      { url: "/images/products/redondo-trio-concreto.webp", alt: "Três vasos redondos de concreto branco lado a lado sobre uma mureta; o pequeno é o da direita" },
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
      { url: "/images/products/redondo-trio-concreto.webp", alt: "Três vasos redondos de concreto branco lado a lado sobre uma mureta; o médio é o do centro" },
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
      { url: "/images/products/redondo-trio-concreto.webp", alt: "Três vasos redondos de concreto branco lado a lado sobre uma mureta; o grande é o da esquerda" },
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
      { url: "/images/products/redondo-trio-concreto.webp", alt: "Três vasos redondos de concreto branco de tamanhos diferentes lado a lado sobre uma mureta" },
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
    finishes: ["cimento-natural", "branco-pedra"],
    shortDescription: "Vaso de concreto com relevo listrado vertical (12,7 × Ø10,4 cm).",
    longDescription: `Vaso de concreto com listras verticais em relevo e formato de gota, de boca larga. Fica bonito sozinho ou em dupla com a Ampulheta Listrada, com flores e ramos secos. Vendido apenas o vaso: as flores e os objetos que aparecem nas fotos não acompanham o produto. ${FEITO_A_MAO}`,
    images: [
      { url: "/images/products/listrado-cinza.webp", alt: "Vaso de concreto listrado em cinza com flores secas, ao lado de uma vela, sobre uma bandeja de madeira" },
      { url: "/images/products/listrado-branco-1.webp", alt: "Vaso de concreto listrado branco com relevo de listras verticais, vista frontal" },
      { url: "/images/products/listrado-branco-2.webp", alt: "Vaso de concreto listrado branco com as medidas: 12,7 cm de altura e 10,4 cm de largura" },
      { url: "/images/products/listrados-par-branco.webp", alt: "Vaso listrado (à direita) e vaso ampulheta listrado (à esquerda), brancos, com flores secas sobre um livro" },
    ],
  },
  {
    name: "Vaso de Concreto Ampulheta Listrada Luxuoso", slug: "vaso-concreto-ampulheta-listrada-luxuoso", category: "medios", priceCents: 4990,
    heightCm: 15.1, widthCm: 10.7, depthCm: 10.7, round: true, weightGrams: 0, hasDrainage: false, badge: "Novo",
    plants: ["Flores secas", "Ramos e espigas"], sortOrder: 22, stockPerFinish: 10,
    finishes: ["cimento-natural", "branco-pedra"],
    shortDescription: "Vaso de concreto em formato de ampulheta, com listras em relevo (15,1 × Ø10,7 cm).",
    longDescription: `Vaso de concreto em formato de ampulheta, com listras verticais que ondulam na parte mais larga. Uma peça de destaque para aparadores e mesas, com flores e ramos secos. Vendido apenas o vaso: as flores e os objetos que aparecem nas fotos não acompanham o produto. ${FEITO_A_MAO}`,
    images: [
      { url: "/images/products/ampulheta-cinza.webp", alt: "Vaso de concreto ampulheta listrado em cinza com flores secas, ao lado de uma vela, sobre uma bandeja de madeira" },
      { url: "/images/products/ampulheta-branca-1.webp", alt: "Vaso de concreto ampulheta listrado branco, vista frontal" },
      { url: "/images/products/ampulheta-branca-2.webp", alt: "Vaso de concreto ampulheta listrado branco com as medidas: 15,1 cm de altura e 10,7 cm de largura" },
      { url: "/images/products/listrados-par-branco.webp", alt: "Vaso ampulheta listrado (à esquerda) e vaso listrado (à direita), brancos, com flores secas sobre um livro" },
    ],
  },
];

export const FAQ = [
  {
    q: "O vaso tem furo de drenagem?",
    a: "Os vasos e jardineiras de plantio saem com furo de drenagem, para evitar água acumulada e raízes apodrecidas; use um pratinho ou cachepô sobre móveis. Os vasos Ripples (aromaterapia e flores secas) são decorativos e não têm furo — não plante diretamente neles.",
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
