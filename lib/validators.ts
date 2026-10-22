import { z } from "zod";
import { isValidCpf, onlyDigits } from "@/lib/utils";

export const cartLineSchema = z.object({
  productId: z.string().min(1).max(64),
  finishId: z.string().min(1).max(64),
  quantity: z.number().int().min(1, "Quantidade inválida").max(99, "Quantidade máxima: 99"),
});

export const cartItemsSchema = z.array(cartLineSchema).min(1, "Seu carrinho está vazio.").max(40);

export const cepSchema = z
  .string()
  .transform(onlyDigits)
  .refine((v) => v.length === 8, "CEP inválido");

export const emailSchema = z.string().trim().toLowerCase().email("E-mail inválido").max(160);

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe seu nome completo")
    .max(120)
    .refine((v) => v.split(/\s+/).length >= 2, "Informe nome e sobrenome"),
  email: emailSchema,
  cpf: z.string().refine(isValidCpf, "CPF inválido").transform(onlyDigits),
  phone: z
    .string()
    .transform(onlyDigits)
    .refine((v) => v.length === 10 || v.length === 11, "Telefone inválido"),
});

export const addressSchema = z.object({
  cep: cepSchema,
  street: z.string().trim().min(2, "Informe a rua").max(160),
  number: z.string().trim().min(1, "Informe o número").max(20),
  complement: z.string().trim().max(80).optional().or(z.literal("")),
  neighborhood: z.string().trim().min(2, "Informe o bairro").max(100),
  city: z.string().trim().min(2, "Informe a cidade").max(100),
  state: z.string().trim().length(2, "UF inválida").toUpperCase(),
});

export const quoteSchema = z.object({
  cep: cepSchema,
  items: cartItemsSchema,
});

export const couponCheckSchema = z.object({
  code: z.string().trim().min(1, "Informe o cupom").max(40),
  items: cartItemsSchema,
});

export const paymentSchema = z.discriminatedUnion("method", [
  z.object({ method: z.literal("PIX") }),
  z.object({ method: z.literal("BOLETO") }),
  z.object({
    method: z.literal("CREDIT_CARD"),
    token: z.string().min(8).max(200),
    paymentMethodId: z.string().min(1).max(40),
    issuerId: z.string().max(40).optional(),
    installments: z.number().int().min(1).max(3),
  }),
]);

export const checkoutSchema = z.object({
  customer: customerSchema,
  address: addressSchema,
  items: cartItemsSchema,
  shippingOptionId: z.string().min(1).max(60),
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
  payment: paymentSchema,
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const newsletterSchema = z.object({ email: emailSchema });

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(100),
  email: emailSchema,
  message: z.string().trim().min(10, "Escreva uma mensagem um pouco maior").max(2000),
  /** honeypot: bots preenchem */
  website: z.string().max(0).optional().or(z.literal("")),
});

// ---------- admin ----------
export const productInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/, "Slug: apenas letras minúsculas, números e hífen"),
  categoryId: z.string().min(1),
  shortDescription: z.string().trim().min(2).max(300),
  longDescription: z.string().trim().min(2).max(5000),
  priceCents: z.number().int().min(0).max(10_000_000),
  heightCm: z.number().positive().max(500),
  widthCm: z.number().positive().max(500),
  depthCm: z.number().positive().max(500).nullable(),
  round: z.boolean(),
  weightGrams: z.number().int().positive().max(200_000),
  hasDrainage: z.boolean(),
  featured: z.boolean(),
  active: z.boolean(),
  badge: z.string().trim().max(30).nullable(),
  plants: z.array(z.string().trim().min(1).max(60)).max(12),
  sortOrder: z.number().int().min(0).max(9999),
  variants: z.array(z.object({ finishId: z.string().min(1), stock: z.number().int().min(0).max(100_000), comingSoon: z.boolean().default(false), imageUrl: z.string().max(500).nullable().default(null) })).max(30),
  images: z.array(z.object({ url: z.string().min(1).max(500), alt: z.string().trim().min(1).max(200) })).max(20),
});
export type ProductInput = z.infer<typeof productInputSchema>;

export const orderUpdateSchema = z.object({
  status: z.enum(["AWAITING_PAYMENT", "PAID", "IN_PRODUCTION", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
  trackingCode: z.string().trim().max(60).nullable().optional(),
});

export const couponInputSchema = z
  .object({
    code: z.string().trim().min(3).max(40).transform((v) => v.toUpperCase().replace(/\s+/g, "")),
    type: z.enum(["PERCENT", "FIXED"]),
    value: z.number().int().min(1),
    startsAt: z.string().datetime().nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    maxUses: z.number().int().min(1).nullable().optional(),
    minSubtotalCents: z.number().int().min(0).nullable().optional(),
    active: z.boolean().default(true),
  })
  .refine((c) => c.type !== "PERCENT" || c.value <= 100, { message: "Percentual máximo: 100", path: ["value"] });

export const settingsInputSchema = z.object({
  free_shipping_threshold: z.number().int().min(0).max(10_000_000),
  origin_cep: cepSchema,
  whatsapp: z.string().transform(onlyDigits).refine((v) => v.length >= 12 && v.length <= 13, "WhatsApp com DDI+DDD, ex.: 5541999999999"),
  instagram: z.string().trim().max(60),
  announcement: z.string().trim().max(160),
  pickup_enabled: z.boolean(),
  pickup_address: z.string().trim().max(200),
  contact_email: emailSchema,
});

export const testimonialInputSchema = z.object({
  author: z.string().trim().min(2).max(80),
  location: z.string().trim().max(80).nullable().optional(),
  text: z.string().trim().min(10).max(600),
  published: z.boolean().default(true),
  order: z.number().int().default(0),
});
