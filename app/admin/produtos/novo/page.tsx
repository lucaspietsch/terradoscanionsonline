import type { Metadata } from "next";
import { DemoNotice, PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { emptyProduct } from "@/lib/admin/product-defaults";
import { getCategories, getFinishes } from "@/lib/data/catalog";
import { dbReady } from "@/lib/server/admin-page";

export const metadata: Metadata = { title: "Novo produto" };

export default async function NewProduct() {
  if (!dbReady()) return <DemoNotice />;
  const [categories, finishes] = await Promise.all([getCategories(), getFinishes()]);
  return (
    <>
      <PageHeader title="Novo produto" />
      <ProductForm initial={emptyProduct(categories[0]?.id ?? "", finishes)} categories={categories} finishes={finishes} />
    </>
  );
}
