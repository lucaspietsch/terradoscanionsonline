"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Store, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FreeShippingBar } from "@/components/shop/free-shipping-bar";
import { useCart } from "@/lib/cart-store";
import { formatBRL } from "@/lib/money";
import { maskCep, onlyDigits, cn } from "@/lib/utils";
import type { ShippingOption } from "@/lib/shipping";
import type { CartLineInput } from "@/types";

interface Quote {
  options: ShippingOption[];
  subtotalCents: number;
  thresholdCents: number;
  freeShipping: boolean;
}

export function ShippingCalculator({
  items,
  showProgress = false,
  className,
  selectedId,
  onSelect,
}: {
  items: CartLineInput[];
  showProgress?: boolean;
  className?: string;
  /** Quando informado, as opções viram um grupo de rádio (carrinho). */
  selectedId?: string | null;
  onSelect?: (option: ShippingOption | null, cep: string) => void;
}) {
  const savedCep = useCart((s) => s.cep);
  const setCep = useCart((s) => s.setCep);
  const [cep, setLocalCep] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const lastKey = useRef("");

  useEffect(() => {
    if (savedCep && !cep) setLocalCep(maskCep(savedCep));
    // preenche uma única vez a partir do CEP salvo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedCep]);

  const itemsKey = JSON.stringify(items);

  const run = useCallback(
    async (rawCep: string) => {
      const digits = onlyDigits(rawCep);
      if (digits.length !== 8) {
        setError("Digite um CEP com 8 números.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/shipping/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cep: digits, items }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Não foi possível calcular o frete.");
        setQuote(data);
        setCep(digits);
        if (onSelect) {
          const keep = (data as Quote).options.find((o) => o.id === selectedId);
          onSelect(keep ?? (data as Quote).options[0] ?? null, digits);
        }
        lastKey.current = itemsKey;
      } catch (e) {
        setQuote(null);
        setError(e instanceof Error ? e.message : "Não foi possível calcular o frete.");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itemsKey, setCep],
  );

  // recota automaticamente quando os itens mudam depois de uma primeira cotação
  useEffect(() => {
    if (quote && lastKey.current !== itemsKey) void run(cep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey]);

  return (
    <div className={cn("space-y-4", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(cep);
        }}
        className="space-y-2"
      >
        <label htmlFor="shipping-cep" className="eyebrow flex items-center gap-2">
          <Truck className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Calcular frete
        </label>
        <div className="flex gap-2">
          <Input
            id="shipping-cep"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={cep}
            maxLength={9}
            onChange={(e) => setLocalCep(maskCep(e.target.value))}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "shipping-error" : undefined}
          />
          <Button type="submit" variant="secondary" loading={loading} className="shrink-0">
            Calcular
          </Button>
        </div>
        <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-secundario underline underline-offset-4 hover:text-musgo">
          Não sei meu CEP
        </a>
        {error && (
          <p id="shipping-error" role="alert" className="text-sm text-erro">
            {error}
          </p>
        )}
      </form>

      {loading && !quote && (
        <p className="flex items-center gap-2 text-sm text-secundario">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Consultando transportadoras…
        </p>
      )}

      {quote && (
        <div className="space-y-3">
          <ul className="divide-y divide-concreto rounded border border-concreto bg-pedra">
            {quote.options.map((o) => (
              <li key={o.id} className={cn("flex items-center justify-between gap-4 p-3.5", onSelect && selectedId === o.id && "bg-nevoa")}>
                <div className="flex items-start gap-3">
                  {onSelect && (
                    <input type="radio" name="shipping-option" className="mt-1 h-4 w-4 accent-musgo" checked={selectedId === o.id} onChange={() => onSelect(o, onlyDigits(cep))} aria-label={`${o.carrier} ${o.name}`} />
                  )}
                  {o.kind === "PICKUP" ? <Store className="mt-0.5 h-4 w-4 text-musgo" strokeWidth={1.5} aria-hidden /> : <MapPin className="mt-0.5 h-4 w-4 text-musgo" strokeWidth={1.5} aria-hidden />}
                  <div>
                    <p className="text-sm text-sombra">
                      {o.kind === "PICKUP" ? o.name : `${o.carrier} ${o.name}`}
                    </p>
                    <p className="text-xs text-secundario">
                      {o.kind === "PICKUP" ? "Sem custo — combinamos o horário" : o.days ? `Entrega em até ${o.days} dias úteis` : "Prazo sob consulta"}
                    </p>
                  </div>
                </div>
                <p className="text-right text-sm">
                  {o.free ? (
                    <>
                      <span className="font-medium text-musgo">Grátis</span>
                      {o.originalPriceCents ? <span className="block text-xs text-secundario line-through">{formatBRL(o.originalPriceCents)}</span> : null}
                    </>
                  ) : o.priceCents === 0 ? (
                    <span className="font-medium text-musgo">Grátis</span>
                  ) : (
                    <span>{formatBRL(o.priceCents)}</span>
                  )}
                </p>
              </li>
            ))}
          </ul>
          {showProgress && <FreeShippingBar subtotalCents={quote.subtotalCents} thresholdCents={quote.thresholdCents} />}
        </div>
      )}
    </div>
  );
}
