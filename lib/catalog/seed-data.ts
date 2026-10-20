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
}

export const SEED_FINISHES: SeedFinish[] = [
  { name: "Cimento Natural", slug: "cimento-natural", hex: "#A8A59E" },
  { name: "Grafite", slug: "grafite", hex: "#4B4F4A" },
  { name: "Areia", slug: "areia", hex: "#CDBFA6" },
  { name: "Branco Pedra", slug: "branco-pedra", hex: "#E6E3DB" },
];

export const SEED_CATEGORIES: SeedCategory[] = [
  { name: "Pequenos", slug: "pequenos", imageUrl: "/images/categorias/pequenos.webp", imageAlt: "Três vasos pequenos de cimento com suculentas sobre uma bancada clara", order: 1 },
  { name: "Médios", slug: "medios", imageUrl: "/images/categorias/medios.webp", imageAlt: "Vaso médio de cimento com zamioculca ao lado de uma janela", order: 2 },
  { name: "Grandes", slug: "grandes", imageUrl: "/images/categorias/grandes.webp", imageAlt: "Vaso grande de cimento com costela-de-adão em canto de sala", order: 3 },
  { name: "Jardineiras", slug: "jardineiras", imageUrl: "/images/categorias/jardineiras.webp", imageAlt: "Jardineira retangular de cimento com temperos sobre uma bancada", order: 4 },
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
];

export const FAQ = [
  {
    q: "O vaso tem furo de drenagem?",
    a: "Sim. Todos os vasos saem com furo de drenagem para evitar o acúmulo de água e o apodrecimento das raízes. Recomendamos usar um pratinho ou cachepô quando o vaso ficar sobre móveis.",
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
