"use client";
import { Field, Input, Select } from "@/components/ui/input";
import { formatBRL } from "@/lib/money";
import { onlyDigits } from "@/lib/utils";

export interface CardData {
  number: string;
  name: string;
  expiry: string; // MM/AA
  cvv: string;
  installments: number;
}

export const emptyCard: CardData = { number: "", name: "", expiry: "", cvv: "", installments: 1 };

const maskNumber = (v: string) => onlyDigits(v).slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
const maskExpiry = (v: string) => {
  const d = onlyDigits(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export function validateCard(c: CardData): Partial<Record<keyof CardData, string>> {
  const e: Partial<Record<keyof CardData, string>> = {};
  const n = onlyDigits(c.number);
  if (n.length < 13 || n.length > 16) e.number = "Número do cartão inválido";
  if (c.name.trim().length < 3) e.name = "Informe o nome impresso no cartão";
  const m = /^(\d{2})\/(\d{2})$/.exec(c.expiry);
  if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) e.expiry = "Validade inválida";
  else {
    const exp = new Date(2000 + Number(m[2]), Number(m[1]), 0, 23, 59);
    if (exp < new Date()) e.expiry = "Cartão vencido";
  }
  if (!/^\d{3,4}$/.test(c.cvv)) e.cvv = "CVV inválido";
  return e;
}

export function CardForm({ value, onChange, errors, totalCents, maxInstallments }: { value: CardData; onChange: (c: CardData) => void; errors: Partial<Record<keyof CardData, string>>; totalCents: number; maxInstallments: number }) {
  const set = <K extends keyof CardData>(k: K, v: CardData[K]) => onChange({ ...value, [k]: v });
  const minInstallment = 500; // parcela mínima R$ 5,00
  const options = Array.from({ length: maxInstallments }, (_, i) => i + 1).filter((n) => n === 1 || totalCents / n >= minInstallment);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Número do cartão" htmlFor="cc-number" error={errors.number} className="sm:col-span-2">
        <Input id="cc-number" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" value={value.number} onChange={(e) => set("number", maskNumber(e.target.value))} aria-invalid={Boolean(errors.number)} />
      </Field>
      <Field label="Nome impresso no cartão" htmlFor="cc-name" error={errors.name} className="sm:col-span-2">
        <Input id="cc-name" autoComplete="cc-name" value={value.name} onChange={(e) => set("name", e.target.value.toUpperCase())} aria-invalid={Boolean(errors.name)} />
      </Field>
      <Field label="Validade" htmlFor="cc-exp" error={errors.expiry}>
        <Input id="cc-exp" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" value={value.expiry} onChange={(e) => set("expiry", maskExpiry(e.target.value))} aria-invalid={Boolean(errors.expiry)} />
      </Field>
      <Field label="Código de segurança" htmlFor="cc-cvv" error={errors.cvv}>
        <Input id="cc-cvv" inputMode="numeric" autoComplete="cc-csc" placeholder="CVV" maxLength={4} value={value.cvv} onChange={(e) => set("cvv", onlyDigits(e.target.value))} aria-invalid={Boolean(errors.cvv)} />
      </Field>
      <Field label="Parcelas" htmlFor="cc-inst" className="sm:col-span-2">
        <Select id="cc-inst" value={value.installments} onChange={(e) => set("installments", Number(e.target.value))}>
          {options.map((n) => (
            <option key={n} value={n}>{n}x de {formatBRL(Math.ceil(totalCents / n))} {n === 1 ? "à vista" : "sem juros"}</option>
          ))}
        </Select>
      </Field>
    </div>
  );
}

/** Tokeniza o cartão no navegador com o SDK do Mercado Pago — o número nunca passa pelo nosso servidor. */
interface MpSdk {
  createCardToken(d: Record<string, string>): Promise<{ id: string }>;
  getPaymentMethods(d: { bin: string }): Promise<{ results: { id: string; issuer?: { id: string | number } }[] }>;
}
declare global {
  interface Window {
    MercadoPago?: new (key: string, opts?: Record<string, string>) => MpSdk;
  }
}

let sdkPromise: Promise<void> | null = null;
export function loadMercadoPago(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("sem janela"));
  if (window.MercadoPago) return Promise.resolve();
  sdkPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://sdk.mercadopago.com/js/v2";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      sdkPromise = null;
      reject(new Error("Não foi possível carregar o Mercado Pago."));
    };
    document.head.appendChild(s);
  });
  return sdkPromise;
}

export async function tokenizeCard(publicKey: string, card: CardData, cpf: string) {
  await loadMercadoPago();
  const mp = new window.MercadoPago!(publicKey, { locale: "pt-BR" });
  const number = onlyDigits(card.number);
  const [mm, yy] = card.expiry.split("/");
  const [token, methods] = await Promise.all([
    mp.createCardToken({
      cardNumber: number,
      cardholderName: card.name,
      cardExpirationMonth: mm,
      cardExpirationYear: `20${yy}`,
      securityCode: card.cvv,
      identificationType: "CPF",
      identificationNumber: onlyDigits(cpf),
    }),
    mp.getPaymentMethods({ bin: number.slice(0, 8) }),
  ]);
  const method = methods.results?.[0];
  if (!token?.id || !method) throw new Error("Não foi possível validar o cartão. Confira os dados.");
  return { token: token.id, paymentMethodId: method.id, issuerId: method.issuer?.id != null ? String(method.issuer.id) : undefined };
}
