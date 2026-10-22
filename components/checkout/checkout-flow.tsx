"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Barcode, Check, CreditCard, Loader2, QrCode, Store, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { CardForm, emptyCard, tokenizeCard, validateCard, type CardData } from "@/components/checkout/card-form";
import { OrderSummary } from "@/components/checkout/order-summary";
import { WhatsAppOrderButton } from "@/components/shop/whatsapp-order-button";
import { toMsgLine } from "@/lib/cart-helpers";
import { PaymentInstructions, type PaymentView } from "@/components/checkout/payment-instructions";
import { useSiteConfig } from "@/components/site-config";
import { track } from "@/lib/analytics";
import { toLineInputs, useCart } from "@/lib/cart-store";
import { useAuthUser, useHydrated } from "@/lib/hooks";
import { formatBRL } from "@/lib/money";
import type { ShippingOption } from "@/lib/shipping";
import { computeTotals } from "@/lib/totals";
import { useCoupon } from "@/lib/use-coupon";
import { cn, maskCep, maskCpf, maskPhone, onlyDigits } from "@/lib/utils";
import { addressSchema, customerSchema } from "@/lib/validators";
import { fetchCep } from "@/lib/viacep";

type Step = 1 | 2 | 3 | 4 | 5;
type Method = "PIX" | "CREDIT_CARD" | "BOLETO";
const STEPS = ["Identificação", "Endereço", "Entrega", "Pagamento", "Confirmação"] as const;
const STATES = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

interface Form {
  name: string; email: string; cpf: string; phone: string;
  cep: string; street: string; number: string; complement: string; neighborhood: string; city: string; state: string;
}
const emptyForm: Form = { name: "", email: "", cpf: "", phone: "", cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" };

type Errors = Record<string, string>;
function zodErrors(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }): Errors {
  const out: Errors = {};
  if (!result.success) for (const i of result.error!.issues) out[String(i.path[0])] ??= i.message;
  return out;
}

export function CheckoutFlow() {
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const savedCep = useCart((s) => s.cep);
  const clearCart = useCart((s) => s.clear);
  const { checkoutEnabled, authEnabled, maxInstallments, mpPublicKey, pickupAddress } = useSiteConfig();
  const user = useAuthUser(authEnabled);
  const coupon = useCoupon();

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<Form>(emptyForm);
  const [errors, setErrors] = useState<Errors>({});
  const [cepLoading, setCepLoading] = useState(false);
  const [options, setOptions] = useState<ShippingOption[] | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [shipping, setShipping] = useState<ShippingOption | null>(null);
  const [method, setMethod] = useState<Method>("PIX");
  const [card, setCard] = useState<CardData>(emptyCard);
  const [cardErrors, setCardErrors] = useState<Partial<Record<keyof CardData, string>>>({});
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentView | null>(null);

  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const totals = useMemo(() => computeTotals({ lines: items, shippingCents: shipping?.priceCents ?? 0, discountCents: coupon.discountCents }), [items, shipping, coupon.discountCents]);

  // dados da conta logada
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({ ...f, email: f.email || user.email || "", name: f.name || (user.user_metadata?.full_name as string) || "" }));
  }, [user]);
  useEffect(() => {
    if (savedCep) setForm((f) => (f.cep ? f : { ...f, cep: maskCep(savedCep) }));
  }, [savedCep]);
  useEffect(() => {
    if (items.length) track("begin_checkout", { currency: "BRL", value: totals.subtotalCents / 100, items: items.map((i) => ({ item_id: i.productId, item_name: i.name, quantity: i.quantity, price: i.unitPriceCents / 100 })) });
    // uma vez ao abrir o checkout
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const lookupCep = useCallback(async (value: string) => {
    if (onlyDigits(value).length !== 8) return;
    setCepLoading(true);
    const r = await fetchCep(value);
    setCepLoading(false);
    if (!r) {
      setErrors((e) => ({ ...e, cep: "CEP não encontrado. Preencha o endereço manualmente." }));
      return;
    }
    setErrors((e) => ({ ...e, cep: "" }));
    setForm((f) => ({ ...f, street: r.street || f.street, neighborhood: r.neighborhood || f.neighborhood, city: r.city, state: r.state }));
  }, []);

  async function loadQuote() {
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const res = await fetch("/api/shipping/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cep: onlyDigits(form.cep), items: toLineInputs(items) }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível calcular o frete.");
      setOptions(data.options);
      setShipping((cur) => data.options.find((o: ShippingOption) => o.id === cur?.id) ?? data.options[0] ?? null);
    } catch (e) {
      setOptions(null);
      setShipping(null);
      setQuoteError(e instanceof Error ? e.message : "Erro ao calcular frete.");
    } finally {
      setQuoteLoading(false);
    }
  }

  function next() {
    if (step === 1) {
      const e = zodErrors(customerSchema.safeParse({ name: form.name, email: form.email, cpf: form.cpf, phone: form.phone }));
      setErrors(e);
      if (!Object.keys(e).length) setStep(2);
    } else if (step === 2) {
      const e = zodErrors(addressSchema.safeParse({ cep: form.cep, street: form.street, number: form.number, complement: form.complement, neighborhood: form.neighborhood, city: form.city, state: form.state }));
      setErrors(e);
      if (!Object.keys(e).length) {
        setStep(3);
        void loadQuote();
      }
    } else if (step === 3) {
      if (shipping) setStep(4);
    }
  }

  async function pay() {
    setPayError(null);
    if (!shipping) return setStep(3);
    let payment: Record<string, unknown> = { method };
    if (method === "CREDIT_CARD") {
      const ce = validateCard(card);
      setCardErrors(ce);
      if (Object.keys(ce).length) return;
      if (!mpPublicKey) return setPayError("Pagamento com cartão indisponível no momento. Use Pix ou boleto.");
    }
    setPaying(true);
    try {
      if (method === "CREDIT_CARD") {
        const t = await tokenizeCard(mpPublicKey, card, form.cpf);
        payment = { method, ...t, installments: card.installments };
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: form.name, email: form.email, cpf: form.cpf, phone: form.phone },
          address: { cep: form.cep, street: form.street, number: form.number, complement: form.complement, neighborhood: form.neighborhood, city: form.city, state: form.state },
          items: toLineInputs(items),
          shippingOptionId: shipping.id,
          couponCode: coupon.code ?? "",
          payment,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível finalizar o pedido.");
      if (data.payment.status === "rejected") {
        throw new Error("O cartão foi recusado. Confira os dados ou tente outra forma de pagamento.");
      }
      const view: PaymentView = {
        orderNumber: data.orderNumber, token: data.accessToken, status: data.status, method: data.payment.method,
        totalCents: data.totalCents, pix: data.payment.pix, boletoUrl: data.payment.boletoUrl, paymentStatus: data.payment.status,
      };
      track("purchase", { transaction_id: data.orderNumber, currency: "BRL", value: data.totalCents / 100, shipping: totals.shippingCents / 100, items: items.map((i) => ({ item_id: i.productId, item_name: i.name, quantity: i.quantity, price: i.unitPriceCents / 100 })) });
      setResult(view);
      clearCart();
      setStep(5);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Erro ao processar o pagamento.");
    } finally {
      setPaying(false);
    }
  }

  if (!hydrated) return <div className="container py-16"><div className="img-skeleton h-96 rounded" /></div>;

  if (step === 5 && result) {
    return (
      <div className="container max-w-3xl py-14 md:py-20">
        <Stepper step={5} />
        <div className="mt-10 text-center">
          <p className="eyebrow">Pedido {result.orderNumber}</p>
          <h1 className="mt-3 font-serif text-4xl font-light md:text-5xl">Obrigada pela compra</h1>
          <p className="mx-auto mt-4 max-w-lg text-secundario">Enviamos os detalhes para <strong className="font-medium text-sombra">{form.email}</strong>. Guarde o número do pedido para acompanhar a entrega.</p>
        </div>
        <div className="mt-10"><PaymentInstructions view={result} /></div>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button asChild variant="secondary"><Link href={`/pedido/${result.orderNumber}?token=${result.token}`}>Acompanhar pedido</Link></Button>
          <Button asChild><Link href="/vasos">Continuar comprando</Link></Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container py-28 text-center">
        <h1 className="font-serif text-4xl font-light">Seu carrinho está vazio</h1>
        <Button asChild size="lg" className="mt-8"><Link href="/vasos">Ver vasos</Link></Button>
      </div>
    );
  }

  if (!checkoutEnabled) {
    return (
      <div className="container py-12 md:py-20">
        <h1 className="font-serif text-4xl font-light md:text-5xl">Finalizar pedido</h1>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <section aria-labelledby="zap" className="max-w-xl">
            <h2 id="zap" className="font-serif text-2xl font-light">Pedido pelo WhatsApp</h2>
            <p className="mt-4 leading-relaxed text-secundario">
              Por enquanto a compra é finalizada pelo WhatsApp: enviamos para a Cambará os produtos e valores do seu carrinho já preenchidos, e combinamos por lá o frete, o pagamento e a entrega (ou retirada).
            </p>
            <WhatsAppOrderButton size="lg" className="mt-8" lines={items.map(toMsgLine)} options={{ cep: savedCep }}>Enviar pedido pelo WhatsApp</WhatsAppOrderButton>
            <p className="mt-4 text-sm text-secundario">Quer calcular o frete antes? <Link href="/carrinho" className="text-musgo underline underline-offset-4">Volte ao carrinho</Link>.</p>
          </section>
          <OrderSummary items={items} totals={totals} shippingLabel="A combinar" coupon={coupon} />
        </div>
      </div>
    );
  }

  const shippingLabel = shipping ? (shipping.priceCents === 0 ? "Grátis" : formatBRL(shipping.priceCents)) : "A calcular";

  return (
    <div className="container py-10 md:py-16">
      <h1 className="font-serif text-4xl font-light md:text-5xl">Finalizar compra</h1>
      <div className="mt-8"><Stepper step={step} onJump={(s) => s < step && setStep(s)} /></div>

      {!checkoutEnabled && (
        <p role="alert" className="mt-8 rounded border border-concreto bg-pedra p-4 text-sm text-secundario">
          Modo demonstração: o pagamento está desativado até que o banco de dados e o Mercado Pago sejam configurados (veja o README). Você pode navegar pelas etapas normalmente.
        </p>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
        <div>
          {step === 1 && (
            <section aria-labelledby="s1">
              <h2 id="s1" className="font-serif text-2xl font-light">Seus dados</h2>
              {authEnabled && !user && <p className="mt-2 text-sm text-secundario">Já tem conta? <Link href="/entrar?next=/checkout" className="text-musgo underline underline-offset-4">Entrar</Link> — ou continue como convidado.</p>}
              {user && <p className="mt-2 text-sm text-secundario">Comprando como <strong className="font-medium text-sombra">{user.email}</strong></p>}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Nome completo" htmlFor="name" error={errors.name} className="sm:col-span-2"><Input id="name" autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} aria-invalid={Boolean(errors.name)} /></Field>
                <Field label="E-mail" htmlFor="email" error={errors.email} className="sm:col-span-2" hint="Enviaremos a confirmação e o rastreio para este e-mail."><Input id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} aria-invalid={Boolean(errors.email)} readOnly={Boolean(user)} /></Field>
                <Field label="CPF" htmlFor="cpf" error={errors.cpf} hint="Exigido pelo meio de pagamento."><Input id="cpf" inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" value={form.cpf} onChange={(e) => set("cpf", maskCpf(e.target.value))} aria-invalid={Boolean(errors.cpf)} /></Field>
                <Field label="Telefone / WhatsApp" htmlFor="phone" error={errors.phone}><Input id="phone" inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" value={form.phone} onChange={(e) => set("phone", maskPhone(e.target.value))} aria-invalid={Boolean(errors.phone)} /></Field>
              </div>
            </section>
          )}

          {step === 2 && (
            <section aria-labelledby="s2">
              <h2 id="s2" className="font-serif text-2xl font-light">Endereço de entrega</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-6">
                <Field label="CEP" htmlFor="cep" error={errors.cep} className="sm:col-span-2">
                  <div className="relative">
                    <Input id="cep" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" maxLength={9} value={form.cep}
                      onChange={(e) => { const v = maskCep(e.target.value); set("cep", v); if (onlyDigits(v).length === 8) void lookupCep(v); }} aria-invalid={Boolean(errors.cep)} />
                    {cepLoading && <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-secundario" aria-label="Buscando endereço" />}
                  </div>
                </Field>
                <Field label="Rua" htmlFor="street" error={errors.street} className="sm:col-span-4"><Input id="street" autoComplete="address-line1" value={form.street} onChange={(e) => set("street", e.target.value)} aria-invalid={Boolean(errors.street)} /></Field>
                <Field label="Número" htmlFor="number" error={errors.number} className="sm:col-span-2"><Input id="number" autoComplete="off" value={form.number} onChange={(e) => set("number", e.target.value)} aria-invalid={Boolean(errors.number)} /></Field>
                <Field label="Complemento (opcional)" htmlFor="complement" className="sm:col-span-4"><Input id="complement" autoComplete="address-line2" value={form.complement} onChange={(e) => set("complement", e.target.value)} /></Field>
                <Field label="Bairro" htmlFor="neighborhood" error={errors.neighborhood} className="sm:col-span-3"><Input id="neighborhood" value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} aria-invalid={Boolean(errors.neighborhood)} /></Field>
                <Field label="Cidade" htmlFor="city" error={errors.city} className="sm:col-span-2"><Input id="city" autoComplete="address-level2" value={form.city} onChange={(e) => set("city", e.target.value)} aria-invalid={Boolean(errors.city)} /></Field>
                <Field label="UF" htmlFor="state" error={errors.state} className="sm:col-span-1">
                  <Select id="state" value={form.state} onChange={(e) => set("state", e.target.value)} aria-invalid={Boolean(errors.state)}>
                    <option value="">—</option>
                    {STATES.map((s) => <option key={s}>{s}</option>)}
                  </Select>
                </Field>
              </div>
            </section>
          )}

          {step === 3 && (
            <section aria-labelledby="s3">
              <h2 id="s3" className="font-serif text-2xl font-light">Forma de entrega</h2>
              {quoteLoading && <p className="mt-6 flex items-center gap-2 text-secundario"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Consultando transportadoras…</p>}
              {quoteError && (
                <div role="alert" className="mt-6">
                  <p className="text-erro">{quoteError}</p>
                  <Button variant="secondary" size="sm" className="mt-3" onClick={() => void loadQuote()}>Tentar de novo</Button>
                </div>
              )}
              {options && (
                <ul className="mt-6 space-y-3" role="radiogroup" aria-label="Opções de entrega">
                  {options.map((o) => (
                    <li key={o.id}>
                      <label className={cn("flex cursor-pointer items-center gap-4 rounded border p-4 transition-colors", shipping?.id === o.id ? "border-musgo bg-pedra" : "border-concreto hover:border-musgo")}>
                        <input type="radio" name="shipping" className="h-4 w-4 accent-musgo" checked={shipping?.id === o.id} onChange={() => setShipping(o)} />
                        {o.kind === "PICKUP" ? <Store className="h-5 w-5 text-musgo" strokeWidth={1.5} aria-hidden /> : <Truck className="h-5 w-5 text-musgo" strokeWidth={1.5} aria-hidden />}
                        <span className="flex-1">
                          <span className="block text-[0.9375rem]">{o.kind === "PICKUP" ? o.name : `${o.carrier} ${o.name}`}</span>
                          <span className="block text-sm text-secundario">{o.kind === "PICKUP" ? pickupAddress : o.days ? `Entrega em até ${o.days} dias úteis` : "Prazo sob consulta"}</span>
                        </span>
                        <span className="text-right">
                          {o.priceCents === 0 ? <span className="font-medium text-musgo">Grátis</span> : <span>{formatBRL(o.priceCents)}</span>}
                          {o.free && o.originalPriceCents ? <span className="block text-xs text-secundario line-through">{formatBRL(o.originalPriceCents)}</span> : null}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-sm text-secundario">Prazo de produção à parte: as peças são feitas à mão e saem em poucos dias úteis.</p>
            </section>
          )}

          {step === 4 && (
            <section aria-labelledby="s4">
              <h2 id="s4" className="font-serif text-2xl font-light">Pagamento</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Forma de pagamento">
                {([
                  { id: "PIX", label: "Pix", sub: "Aprovação na hora", icon: QrCode },
                  { id: "CREDIT_CARD", label: "Cartão de crédito", sub: `Até ${maxInstallments}x sem juros`, icon: CreditCard },
                  { id: "BOLETO", label: "Boleto", sub: "Vence em 3 dias", icon: Barcode },
                ] as const).map(({ id, label, sub, icon: Icon }) => (
                  <button key={id} type="button" role="radio" aria-checked={method === id} onClick={() => setMethod(id)}
                    className={cn("flex flex-col items-start gap-1 rounded border p-4 text-left transition-colors", method === id ? "border-musgo bg-pedra" : "border-concreto hover:border-musgo")}>
                    <Icon className="h-5 w-5 text-musgo" strokeWidth={1.5} aria-hidden />
                    <span className="mt-1 text-[0.9375rem]">{label}</span>
                    <span className="text-xs text-secundario">{sub}</span>
                  </button>
                ))}
              </div>

              <div className="mt-8">
                {method === "PIX" && <p className="text-secundario">Ao confirmar, mostramos o QR Code e o código copia e cola. Ele vale por 30 minutos.</p>}
                {method === "BOLETO" && <p className="text-secundario">Ao confirmar, geramos o boleto. O pedido segue para produção após a compensação (até 2 dias úteis).</p>}
                {method === "CREDIT_CARD" && <CardForm value={card} onChange={setCard} errors={cardErrors} totalCents={totals.totalCents} maxInstallments={maxInstallments} />}
              </div>

              {payError && <p role="alert" className="mt-6 rounded border border-erro/40 bg-pedra p-4 text-sm text-erro">{payError}</p>}
            </section>
          )}

          <div className="mt-10 flex flex-wrap items-center gap-4">
            {step > 1 && <Button variant="ghost" onClick={() => setStep((s) => (s - 1) as Step)}>Voltar</Button>}
            {step < 4 && <Button size="lg" onClick={next} disabled={step === 3 && (!shipping || quoteLoading)}>Continuar</Button>}
            {step === 4 && (
              <Button size="lg" loading={paying} onClick={pay} disabled={!checkoutEnabled}>
                {method === "PIX" ? "Gerar Pix" : method === "BOLETO" ? "Gerar boleto" : "Pagar"} {formatBRL(totals.totalCents)}
              </Button>
            )}
          </div>
          {step === 4 && <p className="mt-3 text-xs text-secundario">Pagamento processado pelo Mercado Pago. Os dados do cartão não passam pelos nossos servidores.</p>}
        </div>

        <OrderSummary items={items} totals={totals} shippingLabel={shippingLabel} coupon={coupon} />
      </div>
    </div>
  );
}

function Stepper({ step, onJump }: { step: number; onJump?: (s: Step) => void }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm" aria-label="Etapas do checkout">
      {STEPS.map((label, i) => {
        const n = (i + 1) as Step;
        const done = n < step;
        const current = n === step;
        return (
          <li key={label} className="flex items-center gap-3" aria-current={current ? "step" : undefined}>
            <button type="button" disabled={!done || !onJump} onClick={() => onJump?.(n)} className={cn("flex items-center gap-2", done && onJump && "cursor-pointer hover:text-musgo")}>
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-full border text-xs", current ? "border-musgo bg-musgo text-pedra" : done ? "border-musgo bg-salvia/30 text-musgo" : "border-concreto text-secundario")}>
                {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : n}
              </span>
              <span className={cn(current ? "text-sombra" : "text-secundario", "hidden sm:inline")}>{label}</span>
              <span className="sr-only sm:hidden">{label}</span>
            </button>
            {i < STEPS.length - 1 && <span className="hidden h-px w-6 bg-concreto sm:block" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
