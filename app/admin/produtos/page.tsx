import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DemoNotice, PageHeader, Table, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProducts } from "@/lib/data/catalog";
import { dimensionsLabel } from "@/lib/catalog/format";
import { formatBRL } from "@/lib/money";
import { dbReady } from "@/lib/server/admin-page";

export const metadata: Metadata = { title: "Produtos" };

export default async function ProductsAdmin() {
  if (!dbReady()) return <><PageHeader title="Produtos" /><DemoNotice /></>;
  const products = await getProducts({ includeInactive: true });
  return (
    <>
      <PageHeader title="Produtos" actions={<Button asChild><Link href="/admin/produtos/novo">Novo produto</Link></Button>} />
      <Table>
        <thead><tr><Th>Produto</Th><Th>Categoria</Th><Th>Medidas</Th><Th className="text-right">Preço</Th><Th className="text-right">Estoque</Th><Th>Status</Th></tr></thead>
        <tbody>
          {products.map((p) => {
            const stock = p.variants.reduce((n, v) => n + v.stock, 0);
            return (
              <tr key={p.id}>
                <Td>
                  <Link href={`/admin/produtos/${p.id}`} className="flex items-center gap-3 hover:text-musgo">
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-nevoa">{p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="40px" className="object-cover" />}</span>
                    {p.name}
                  </Link>
                </Td>
                <Td>{p.category.name}</Td>
                <Td>{dimensionsLabel(p)}</Td>
                <Td className="text-right">{formatBRL(p.priceCents)}</Td>
                <Td className="text-right">{stock}</Td>
                <Td>{p.active ? <Badge tone="sage">Ativo</Badge> : <Badge tone="outline">Inativo</Badge>}</Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </>
  );
}
