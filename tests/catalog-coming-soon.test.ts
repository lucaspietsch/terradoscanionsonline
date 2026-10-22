import { describe, expect, it } from "vitest";
import { staticProducts } from "@/lib/catalog/static";
import { toCard } from "@/lib/catalog/format";

describe("opções 'em breve' do Vaso Floral Luxo", () => {
  const p = staticProducts.find((x) => x.slug === "vaso-floral-luxo-relevo-3d")!;

  it("tem 1 cor vendável e 6 em breve, sem estoque e com foto que existe na galeria", () => {
    const soon = p.variants.filter((v) => v.comingSoon);
    expect(p.variants.filter((v) => !v.comingSoon)).toHaveLength(1);
    expect(soon).toHaveLength(6);
    for (const v of soon) {
      expect(v.stock).toBe(0);
      expect(p.images.some((i) => i.url === v.imageUrl)).toBe(true);
    }
  });

  it("o cartão usa sempre uma cor vendável como padrão", () => {
    const card = toCard(p);
    const def = card.finishes.find((f) => f.id === card.defaultFinishId)!;
    expect(def.comingSoon).toBe(false);
    expect(card.inStock).toBe(true);
  });
});
