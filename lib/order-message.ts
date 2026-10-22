import { formatBRL } from "@/lib/money";
import { isFreeShipping } from "@/lib/shipping";

export interface OrderMessageLine {
  name: string;
  finishName: string;
  quantity: number;
  unitPriceCents: number;
}

export interface OrderMessageOptions {
  cep?: string;
  /** Opção de frete escolhida (carrinho). Sem ela, o frete fica "a combinar". */
  shipping?: { label: string; priceCents: number } | null;
  discountCents?: number;
  couponCode?: string | null;
  thresholdCents: number;
}

const maskCep = (v: string) => (v.length === 8 ? `${v.slice(0, 5)}-${v.slice(5)}` : v);

/** Texto do pedido enviado ao WhatsApp da loja: itens, valores e frete. Texto puro (o WhatsApp aplica *negrito*). */
export function buildOrderMessage(lines: OrderMessageLine[], opts: OrderMessageOptions): string {
  const subtotal = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  const out: string[] = ["Olá! Gostaria de fazer um pedido pelo site da Cambará Ornamentais:", "", "*Meu pedido*"];

  for (const l of lines) {
    const total = l.unitPriceCents * l.quantity;
    out.push(`• ${l.quantity}x ${l.name} (${l.finishName}) — ${formatBRL(l.unitPriceCents)} cada = ${formatBRL(total)}`);
  }

  out.push("", `Subtotal: ${formatBRL(subtotal)}`);
  const discount = Math.min(opts.discountCents ?? 0, subtotal);
  if (discount > 0) out.push(`Cupom${opts.couponCode ? ` ${opts.couponCode}` : ""}: − ${formatBRL(discount)}`);

  let shippingCents: number | null = null;
  if (opts.shipping) {
    shippingCents = opts.shipping.priceCents;
    out.push(`Frete (${opts.shipping.label}): ${shippingCents === 0 ? "Grátis" : formatBRL(shippingCents)}`);
  } else if (isFreeShipping(subtotal, opts.thresholdCents)) {
    out.push("Frete: grátis na opção mais econômica (compra acima de " + formatBRL(opts.thresholdCents).replace(",00", "") + ")");
  } else {
    out.push("Frete: a combinar");
  }

  if (shippingCents !== null) out.push(`*Total: ${formatBRL(subtotal - discount + shippingCents)}*`);
  else out.push(`*Total dos produtos: ${formatBRL(subtotal - discount)}* (+ frete)`);

  if (opts.cep) out.push("", `CEP para entrega: ${maskCep(opts.cep.replace(/\D/g, ""))}`);
  out.push("", "Pode confirmar a disponibilidade e a forma de pagamento?");
  return out.join("\n");
}
