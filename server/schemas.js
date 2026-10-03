import { z } from 'zod';

const trimmed = (min, max) => z.string().trim().min(min).max(max);
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeStr = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(60);

// Telefone BR: aceita máscara, guarda só dígitos (DDD + número, com ou sem 55).
const phone = z
  .string()
  .transform((s) => s.replace(/\D/g, ''))
  .refine((d) => d.length >= 10 && d.length <= 13, 'Telefone inválido');

export const quoteBody = z.object({
  qty: z.number().int().min(1).max(50),
  coupon: z.string().trim().max(40).optional().nullable(),
  qr: z.string().trim().max(40).optional().nullable(),
}).strict();

export const orderBody = z.object({
  slotId: z.number().int().positive(),
  qty: z.number().int().min(1).max(50),
  coupon: z.string().trim().max(40).optional().nullable(),
  qr: z.string().trim().max(40).optional().nullable(),
  paymentMethod: z.enum(['pix', 'card']).default('pix'),
  buyer: z.object({ name: trimmed(3, 100), email: z.string().trim().toLowerCase().email().max(160), phone }).strict(),
  participants: z.array(z.object({
    name: trimmed(3, 100),
    birthDate: dateStr,
    weightKg: z.number().int().min(10).max(300),
  }).strict()).min(1).max(50),
  acceptedWaiver: z.literal(true),
  acceptedPrivacy: z.literal(true),
}).strict();

export const resendBody = z.object({ email: z.string().trim().toLowerCase().email().max(160), orderCode: z.string().trim().max(20) }).strict();

export const loginBody = z.object({
  email: z.string().trim().max(160),
  password: z.string().min(1).max(200),
  totp: z.string().trim().max(10).optional(),
}).strict();

export const checkinBody = z.object({ code: z.string().trim().min(8).max(60), force: z.boolean().optional() }).strict();

export const slotsBulkBody = z.object({
  from: dateStr,
  to: dateStr,
  weekdays: z.array(z.number().int().min(0).max(6)).min(1),
  times: z.array(timeStr).min(1).max(24),
  capacity: z.number().int().min(0).max(1000),
}).strict();

export const slotPatch = z.object({
  capacity: z.number().int().min(0).max(1000).optional(),
  status: z.enum(['open', 'closed']).optional(),
  note: z.string().trim().max(200).optional(),
}).strict();

export const productPatch = z.object({
  name: trimmed(3, 120).optional(),
  summary: z.string().trim().max(600).optional(),
  priceCents: z.number().int().min(0).max(5_000_000).optional(),
  minWeightKg: z.number().int().min(0).max(300).optional(),
  maxWeightKg: z.number().int().min(1).max(400).optional(),
  minAge: z.number().int().min(0).max(30).optional(),
  active: z.boolean().optional(),
}).strict();

export const couponBody = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/),
  label: z.string().trim().max(100).default(''),
  kind: z.enum(['percent', 'fixed']),
  value: z.number().int().positive(),
  minQty: z.number().int().min(1).max(50).default(1),
  maxUses: z.number().int().positive().nullable().default(null),
  validFrom: z.string().datetime().nullable().default(null),
  validUntil: z.string().datetime().nullable().default(null),
  partnerId: z.number().int().positive().nullable().default(null),
  active: z.boolean().default(true),
}).strict().refine((c) => c.kind !== 'percent' || c.value <= 100, { message: 'Percentual máximo é 100', path: ['value'] });

export const couponPatch = z.object({
  label: z.string().trim().max(100).optional(),
  active: z.boolean().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  validUntil: z.string().datetime().nullable().optional(),
}).strict();

export const ruleBody = z.object({
  label: trimmed(3, 100),
  minQty: z.number().int().min(2).max(50),
  percent: z.number().int().min(1).max(100),
  active: z.boolean().default(true),
}).strict();

export const qrBody = z.object({
  code: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{3,30}$/),
  label: trimmed(2, 100),
  location: z.string().trim().max(160).default(''),
  target: z.enum(['/tirolesa', '/', '/atrativos', '/parceiros']).default('/tirolesa'),
  couponId: z.number().int().positive().nullable().default(null),
  partnerId: z.number().int().positive().nullable().default(null),
  active: z.boolean().default(true),
}).strict();

export const qrPatch = z.object({
  label: trimmed(2, 100).optional(),
  location: z.string().trim().max(160).optional(),
  couponId: z.number().int().positive().nullable().optional(),
  partnerId: z.number().int().positive().nullable().optional(),
  active: z.boolean().optional(),
}).strict();

const safeUrl = z.string().trim().max(200).refine((u) => u === '' || /^https:\/\/[^\s]+$/i.test(u), 'Use um link https://');
const partnerFields = {
  tagline: z.string().trim().max(140),
  description: z.string().trim().max(1500),
  whatsapp: z.string().transform((s) => s.replace(/\D/g, '')).refine((d) => d === '' || (d.length >= 10 && d.length <= 13), 'WhatsApp inválido'),
  phone: z.string().transform((s) => s.replace(/\D/g, '')).refine((d) => d === '' || (d.length >= 8 && d.length <= 13), 'Telefone inválido'),
  website: safeUrl,
  instagram: z.string().trim().max(60).regex(/^@?[A-Za-z0-9._]*$/),
  address: z.string().trim().max(200),
};

export const partnerBody = z.object({
  slug,
  name: trimmed(2, 100),
  category: z.enum(['atrativo', 'guia', 'agencia', 'hospedagem', 'gastronomia', 'servico']),
  plan: z.enum(['fundador', 'gratuito', 'pago']).default('fundador'),
  freeUntil: dateStr.nullable().default(null),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10000).default(100),
}).extend(Object.fromEntries(Object.entries(partnerFields).map(([k, v]) => [k, v.default('')]))).strict();

export const partnerPatch = z.object({
  name: trimmed(2, 100),
  category: z.enum(['atrativo', 'guia', 'agencia', 'hospedagem', 'gastronomia', 'servico']),
  plan: z.enum(['fundador', 'gratuito', 'pago']),
  freeUntil: dateStr.nullable(),
  featured: z.boolean(),
  published: z.boolean(),
  sortOrder: z.number().int().min(0).max(10000),
  ...partnerFields,
}).partial().strict();

// O que o próprio parceiro pode editar na sua vitrine.
export const partnerSelfPatch = z.object(partnerFields).partial().strict();

export const userBody = z.object({
  email: z.string().trim().toLowerCase().email().max(160),
  name: trimmed(2, 100),
  role: z.enum(['admin', 'checkin', 'partner']),
  partnerId: z.number().int().positive().nullable().default(null),
  password: z.string().min(12).max(128),
}).strict().refine((u) => u.role !== 'partner' || u.partnerId, { message: 'partnerId obrigatório', path: ['partnerId'] });

export const orderListQuery = z.object({
  status: z.enum(['pending', 'paid', 'expired', 'cancelled', 'refunded']).optional(),
  day: dateStr.optional(),
  q: z.string().trim().max(160).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
}).strict();
