"use client";
import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { FinishDot, QuantityInput } from "@/components/shop/finish-selector";
import { useCart, type CartItem } from "@/lib/cart-store";
import { formatBRL } from "@/lib/money";

export function CartLine({ item, compact = false }: { item: CartItem; compact?: boolean }) {
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const close = useCart((s) => s.setOpen);
  const size = compact ? 80 : 112;

  return (
    <li className="flex gap-4 py-5">
      <Link href={`/vasos/${item.slug}`} onClick={() => close(false)} className="shrink-0 overflow-hidden rounded bg-pedra" style={{ width: size, height: size }}>
        {item.image && <Image src={item.image} alt={item.imageAlt} width={size * 2} height={size * 2} className="h-full w-full object-cover" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/vasos/${item.slug}`} onClick={() => close(false)} className="block truncate font-serif text-lg font-light hover:text-musgo">
              {item.name}
            </Link>
            <p className="mt-0.5 flex items-center gap-2 text-sm text-secundario">
              <FinishDot hex={item.finishHex} /> {item.finishName}
            </p>
          </div>
          <p className="whitespace-nowrap text-sm">{formatBRL(item.unitPriceCents * item.quantity)}</p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <QuantityInput size="sm" value={item.quantity} max={item.maxStock || 99} onChange={(n) => setQuantity(item.productId, item.finishId, n)} />
          <button
            type="button"
            onClick={() => remove(item.productId, item.finishId)}
            className="flex items-center gap-1.5 text-xs text-secundario underline-offset-4 hover:text-erro hover:underline"
            aria-label={`Remover ${item.name} do carrinho`}
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Remover
          </button>
        </div>
        {item.maxStock > 0 && item.quantity >= item.maxStock && <p className="mt-2 text-xs text-secundario">Máximo disponível em estoque.</p>}
      </div>
    </li>
  );
}
