import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoNotice, PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { getCategories, getFinishes, getProductById } from "@/lib/data/catalog";
import { dbReady } from "@/lib/server/admin-page";

export const metadata: Metadata = { title: "Editar produto" };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  if (!dbReady()) return <DemoNotice />;
  const { id } = await params;
  const [p, categories, finishes] = await Promise.all([getProductById(id), getCategories(), getFinishes()]);
  if (!p) notFound();
  return (
    <>
      <PageHeader title={p.name} />
      <ProductForm
        categories={categories}
        finishes={finishes}
        initial={{
          id: p.id, name: p.name, slug: p.slug, categoryId: p.category.id, shortDescription: p.shortDescription, longDescription: p.longDescription,
          priceCents: p.priceCents, heightCm: p.heightCm, widthCm: p.widthCm, depthCm: p.depthCm, round: p.round, weightGrams: p.weightGrams,
          hasDrainage: p.hasDrainage, featured: p.featured, active: p.active, badge: p.badge, plants: p.plants, sortOrder: p.sortOrder,
          stocks: Object.fromEntries(finishes.map((f) => [f.id, p.variants.find((v) => v.finish.id === f.id)?.stock ?? 0])),
          images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
        }}
      />
    </>
  );
}
