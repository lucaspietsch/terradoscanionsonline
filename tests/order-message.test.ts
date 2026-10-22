import { describe, expect, it } from "vitest";
import { buildOrderMessage } from "@/lib/order-message";
import { whatsappUrl } from "@/lib/site";

const LIMIT = 16000;
const kit = { name: "Kit 3 Vasos Ripples", finishName: "Areia", quantity: 1, unitPriceCents: 6490 };
const redondo = { name: "Vaso Ripples Redondo", finishName: "Grafite", quantity: 2, unitPriceCents: 2490 };

describe("mensagem de pedido para o WhatsApp", () => {
  it("lista itens, valores por item, subtotal e total dos produtos", () => {
    const m = buildOrderMessage([kit, redondo], { thresholdCents: LIMIT });
    expect(m).toContain("• 1x Kit 3 Vasos Ripples (Areia) — R$ 64,90 cada = R$ 64,90");
    expect(m).toContain("• 2x Vaso Ripples Redondo (Grafite) — R$ 24,90 cada = R$ 49,80");
    expect(m).toContain("Subtotal: R$ 114,70");
    expect(m).toContain("*Total dos produtos: R$ 114,70* (+ frete)");
    expect(m).toContain("Frete: a combinar");
  });
  it("com frete escolhido, cupom e CEP", () => {
    const m = buildOrderMessage([kit], { thresholdCents: LIMIT, shipping: { label: "Correios PAC", priceCents: 2200 }, discountCents: 500, couponCode: "OI5", cep: "54999000" });
    expect(m).toContain("Cupom OI5: − R$ 5,00");
    expect(m).toContain("Frete (Correios PAC): R$ 22,00");
    expect(m).toContain("*Total: R$ 81,90*");
    expect(m).toContain("CEP para entrega: 54999-000");
  });
  it("acima de R$ 160 avisa frete grátis; exatamente R$ 160 não", () => {
    const big = { name: "Vaso Lua", finishName: "Grafite", quantity: 1, unitPriceCents: 16001 };
    expect(buildOrderMessage([big], { thresholdCents: LIMIT })).toContain("Frete: grátis");
    expect(buildOrderMessage([{ ...big, unitPriceCents: 16000 }], { thresholdCents: LIMIT })).toContain("Frete: a combinar");
  });
  it("gera link do WhatsApp para o número da loja com o texto codificado", () => {
    const url = whatsappUrl("Olá *teste*\nlinha 2", "5554999197178");
    expect(url.startsWith("https://wa.me/5554999197178?text=")).toBe(true);
    expect(decodeURIComponent(url.split("text=")[1])).toBe("Olá *teste*\nlinha 2");
  });
});
