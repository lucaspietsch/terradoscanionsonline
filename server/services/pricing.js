// Motor de preços. Regras:
//  - Valores em centavos inteiros; percentuais arredondam para BAIXO o desconto (favorece o negócio por no máx. 1 centavo).
//  - Apenas UMA oferta é aplicada: a que der o maior desconto (cupom/placa QR ou regra de grupo). Nada acumula.
//  - O total nunca fica negativo.

export class PricingError extends Error {
  constructor(message, code = 'invalid_coupon') {
    super(message);
    this.code = code;
  }
}

export function checkCoupon(coupon, { qty, now = new Date(), productId = null }) {
  if (!coupon || !coupon.active) throw new PricingError('Cupom inválido ou inativo.');
  const today = now.toISOString();
  if (coupon.valid_from && today < coupon.valid_from) throw new PricingError('Este cupom ainda não está válido.');
  if (coupon.valid_until && today > coupon.valid_until) throw new PricingError('Este cupom expirou.');
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) throw new PricingError('Este cupom esgotou.');
  if (qty < coupon.min_qty) throw new PricingError(`Este cupom exige ao menos ${coupon.min_qty} ingressos.`);
  void productId;
}

export function couponDiscount(coupon, unit, qty) {
  const subtotal = unit * qty;
  const raw = coupon.kind === 'percent' ? Math.floor((subtotal * coupon.value) / 100) : coupon.value * qty;
  return Math.min(raw, subtotal);
}

export function computeQuote({ unitPriceCents, qty, coupon = null, groupRules = [], now = new Date() }) {
  if (!Number.isInteger(qty) || qty < 1) throw new PricingError('Quantidade inválida.', 'invalid_qty');
  const subtotal = unitPriceCents * qty;
  const candidates = [];

  if (coupon) {
    checkCoupon(coupon, { qty, now });
    candidates.push({
      discount: couponDiscount(coupon, unitPriceCents, qty),
      label: coupon.label || `Cupom ${coupon.code}`,
      couponId: coupon.id,
      kind: 'coupon',
    });
  }
  for (const r of groupRules) {
    if (r.active && qty >= r.min_qty) {
      candidates.push({
        discount: Math.floor((subtotal * r.percent) / 100),
        label: r.label,
        couponId: null,
        kind: 'group',
      });
    }
  }

  const best = candidates.sort((a, b) => b.discount - a.discount)[0];
  const discount = best ? Math.min(best.discount, subtotal) : 0;
  return {
    unitPriceCents,
    qty,
    subtotalCents: subtotal,
    discountCents: discount,
    totalCents: subtotal - discount,
    discountLabel: best && discount > 0 ? best.label : '',
    // Só consome o cupom se ele de fato venceu a disputa.
    couponId: best && discount > 0 && best.kind === 'coupon' ? best.couponId : null,
  };
}
