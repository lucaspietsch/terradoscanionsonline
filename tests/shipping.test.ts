import { describe, expect, it } from "vitest";
import {
  DEFAULT_FREE_SHIPPING_THRESHOLD_CENTS as LIMIT,
  applyFreeShippingRule,
  buildPackage,
  fallbackTableOptions,
  freeShippingProgress,
  isFreeShipping,
  pickupOption,
  regionFromCep,
  remainingForFreeShipping,
  type ShippingOption,
} from "@/lib/shipping";

const carrier = (id: string, name: string, priceCents: number, days: number): ShippingOption => ({
  id, kind: "CARRIER", carrier: "Correios", name, priceCents, days, free: false,
});
const quote = () => [carrier("pac", "PAC", 2400, 8), carrier("sedex", "SEDEX", 4100, 3), pickupOption()];

describe("regra de frete grátis (limite R$ 160,00)", () => {
  it("abaixo de R$ 160,00 não tem frete grátis", () => {
    expect(isFreeShipping(15999, LIMIT)).toBe(false);
    const out = applyFreeShippingRule(quote(), 15999, LIMIT);
    expect(out.find((o) => o.id === "pac")).toMatchObject({ priceCents: 2400, free: false });
    expect(out.find((o) => o.id === "sedex")).toMatchObject({ priceCents: 4100, free: false });
  });

  it("exatamente R$ 160,00 NÃO ganha frete grátis (regra é subtotal > 160)", () => {
    expect(isFreeShipping(16000, LIMIT)).toBe(false);
    const out = applyFreeShippingRule(quote(), 16000, LIMIT);
    expect(out.find((o) => o.id === "pac")!.priceCents).toBe(2400);
    expect(out.some((o) => o.free && o.kind === "CARRIER")).toBe(false);
  });

  it("R$ 160,01 já ganha: opção econômica fica grátis e as demais mantêm o valor", () => {
    expect(isFreeShipping(16001, LIMIT)).toBe(true);
    const out = applyFreeShippingRule(quote(), 16001, LIMIT);
    const pac = out.find((o) => o.id === "pac")!;
    expect(pac).toMatchObject({ priceCents: 0, free: true, originalPriceCents: 2400 });
    expect(out.find((o) => o.id === "sedex")).toMatchObject({ priceCents: 4100, free: false });
  });

  it("acima de R$ 160,00 escolhe a transportadora mais barata, mesmo fora de ordem", () => {
    const out = applyFreeShippingRule([carrier("a", "A", 5000, 2), carrier("b", "B", 1900, 9), carrier("c", "C", 3000, 5)], 20000, LIMIT);
    expect(out.filter((o) => o.free).map((o) => o.id)).toEqual(["b"]);
  });

  it("retirada no local continua R$ 0 e nunca é marcada como a 'opção econômica'", () => {
    const out = applyFreeShippingRule(quote(), 30000, LIMIT);
    const pickup = out.find((o) => o.kind === "PICKUP")!;
    expect(pickup.priceCents).toBe(0);
    expect(pickup.originalPriceCents).toBeUndefined();
    expect(out.find((o) => o.id === "pac")!.free).toBe(true);
  });

  it("não altera o array original", () => {
    const original = quote();
    applyFreeShippingRule(original, 99999, LIMIT);
    expect(original[0].priceCents).toBe(2400);
  });

  it("respeita limite configurável no admin", () => {
    expect(isFreeShipping(10001, 10000)).toBe(true);
    expect(isFreeShipping(10000, 10000)).toBe(false);
  });
});

describe("barra de progresso do frete grátis", () => {
  it("calcula quanto falta", () => {
    expect(remainingForFreeShipping(10500, LIMIT)).toBe(5501); // faltam R$ 55,01 para PASSAR de 160
    expect(remainingForFreeShipping(0, LIMIT)).toBe(16001);
  });
  it("exatamente no limite ainda falta 1 centavo", () => {
    expect(remainingForFreeShipping(16000, LIMIT)).toBe(1);
  });
  it("zera quando ganhou", () => {
    expect(remainingForFreeShipping(16001, LIMIT)).toBe(0);
    expect(freeShippingProgress(16001, LIMIT)).toBe(1);
  });
  it("progresso fica entre 0 e <1 antes de ganhar", () => {
    expect(freeShippingProgress(8000, LIMIT)).toBeCloseTo(0.5);
    expect(freeShippingProgress(16000, LIMIT)).toBeLessThan(1);
  });
});

describe("pacote: peso + 10% de embalagem reforçada", () => {
  it("soma pesos, aplica +10% e empilha alturas", () => {
    const pkg = buildPackage([
      { quantity: 2, weightGrams: 1000, heightCm: 12, widthCm: 14, depthCm: 14 },
      { quantity: 1, weightGrams: 500, heightCm: 8, widthCm: 18, depthCm: 18 },
    ]);
    expect(pkg.weightGrams).toBe(2750); // (2*1000+500) * 1.1
    expect(pkg.heightCm).toBe(2 * 12 + 8 + 2);
    expect(pkg.widthCm).toBe(20);
    expect(pkg.lengthCm).toBe(20);
  });
  it("respeita dimensões mínimas dos Correios", () => {
    const pkg = buildPackage([{ quantity: 1, weightGrams: 100, heightCm: 1, widthCm: 1, depthCm: 1 }]);
    expect(pkg.widthCm).toBeGreaterThanOrEqual(11);
    expect(pkg.lengthCm).toBeGreaterThanOrEqual(16);
  });
});

describe("tabela fixa por região (fallback)", () => {
  it("identifica região pelo CEP", () => {
    expect(regionFromCep("01310-100")).toBe("SE");
    expect(regionFromCep("80010000")).toBe("S");
    expect(regionFromCep("40020000")).toBe("NE");
    expect(regionFromCep("69900000")).toBe("N");
    expect(regionFromCep("70040010")).toBe("CO");
    expect(regionFromCep("123")).toBeNull();
  });
  it("destino mais distante custa mais e demora mais", () => {
    const pkg = buildPackage([{ quantity: 1, weightGrams: 2000, heightCm: 20, widthCm: 20, depthCm: 20 }]);
    const near = fallbackTableOptions("80010000", "80010000", pkg).find((o) => o.id === "table:pac")!;
    const far = fallbackTableOptions("69900000", "80010000", pkg).find((o) => o.id === "table:pac")!;
    expect(far.priceCents).toBeGreaterThan(near.priceCents);
    expect(far.days).toBeGreaterThan(near.days);
  });
  it("CEP inválido não retorna opções", () => {
    expect(fallbackTableOptions("00000000", "80010000", buildPackage([]))).toEqual([]);
  });
});
