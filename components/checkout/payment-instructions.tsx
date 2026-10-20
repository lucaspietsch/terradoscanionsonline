"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Clock, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/money";

export interface PaymentView {
  orderNumber: string;
  token: string;
  status: string;
  method: "PIX" | "CREDIT_CARD" | "BOLETO";
  totalCents: number;
  pix?: { qrCode: string; qrCodeBase64: string; expiresAt: string | null };
  boletoUrl?: string;
  paymentStatus?: string;
}

function useCountdown(expiresAt: string | null | undefined) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setLeft(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return left;
}

export function PaymentInstructions({ view, onPaid }: { view: PaymentView; onPaid?: () => void }) {
  const [status, setStatus] = useState(view.status);
  const [copied, setCopied] = useState(false);
  const left = useCountdown(view.pix?.expiresAt);
  const expired = view.method === "PIX" && left === 0 && status === "AWAITING_PAYMENT";
  const paid = ["PAID", "IN_PRODUCTION", "SHIPPED", "DELIVERED"].includes(status);

  // Pix e boleto: consulta o status até confirmar (o webhook do Mercado Pago atualiza o pedido)
  useEffect(() => {
    if (status !== "AWAITING_PAYMENT" || expired) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${view.orderNumber}/status?token=${encodeURIComponent(view.token)}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.status !== "AWAITING_PAYMENT") {
          setStatus(data.status);
          if (["PAID", "IN_PRODUCTION", "SHIPPED", "DELIVERED"].includes(data.status)) onPaid?.();
        }
      } catch {
        /* tenta de novo no próximo ciclo */
      }
    }, 5000);
    return () => clearInterval(id);
  }, [status, expired, view.orderNumber, view.token, onPaid]);

  const mm = left != null ? String(Math.floor(left / 60000)).padStart(2, "0") : "--";
  const ss = left != null ? String(Math.floor((left % 60000) / 1000)).padStart(2, "0") : "--";

  if (paid) {
    return (
      <div className="rounded border border-salvia bg-salvia/15 p-6 text-center" role="status">
        <Check className="mx-auto h-8 w-8 text-musgo" strokeWidth={1.5} aria-hidden />
        <p className="mt-3 font-serif text-2xl font-light">Pagamento aprovado</p>
        <p className="mt-1 text-sm text-secundario">Já estamos preparando suas peças. Enviaremos um e-mail com cada atualização.</p>
      </div>
    );
  }

  if (status === "CANCELLED") {
    return (
      <div className="rounded border border-erro/40 bg-pedra p-6 text-center" role="alert">
        <p className="font-serif text-2xl font-light">Pagamento não concluído</p>
        <p className="mt-1 text-sm text-secundario">Este pedido foi cancelado. Você pode refazer a compra quando quiser.</p>
        <Button asChild className="mt-5"><a href="/checkout">Tentar novamente</a></Button>
      </div>
    );
  }

  if (view.method === "PIX" && view.pix) {
    return (
      <div className="rounded border border-concreto bg-pedra p-6 md:p-8">
        <p className="eyebrow">Pague com Pix</p>
        <p className="mt-2 font-serif text-3xl font-light">{formatBRL(view.totalCents)}</p>
        {expired ? (
          <div className="mt-6" role="alert">
            <p className="text-erro">O código Pix expirou.</p>
            <Button asChild className="mt-4"><a href="/checkout">Gerar novo pedido</a></Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-8 md:grid-cols-[200px_1fr]">
            {view.pix.qrCodeBase64 && (
              <Image src={`data:image/png;base64,${view.pix.qrCodeBase64}`} alt="QR Code do Pix" width={200} height={200} unoptimized className="rounded border border-concreto bg-white p-2" />
            )}
            <div>
              <p className="text-sm text-secundario">Abra o app do seu banco, escolha Pix e leia o QR Code ou use o código copia e cola:</p>
              <textarea readOnly value={view.pix.qrCode} rows={4} className="field-input mt-3 h-auto resize-none py-2 font-mono text-xs" aria-label="Código Pix copia e cola" onFocus={(e) => e.currentTarget.select()} />
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(view.pix!.qrCode);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2500);
                    } catch {
                      /* o usuário pode copiar manualmente do campo */
                    }
                  }}
                >
                  {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />} {copied ? "Código copiado" : "Copiar código"}
                </Button>
                <p className="flex items-center gap-2 text-sm text-secundario" aria-live="off">
                  <Clock className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Expira em <span className="tabular-nums text-sombra">{mm}:{ss}</span>
                </p>
              </div>
              <p className="mt-4 text-xs text-secundario" role="status">Aguardando pagamento… esta página atualiza sozinha quando o Pix for confirmado.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view.method === "BOLETO") {
    return (
      <div className="rounded border border-concreto bg-pedra p-6 md:p-8">
        <p className="eyebrow">Boleto bancário</p>
        <p className="mt-2 font-serif text-3xl font-light">{formatBRL(view.totalCents)}</p>
        <p className="mt-3 text-sm text-secundario">O boleto vence em 3 dias. A compensação leva até 2 dias úteis e só então o pedido segue para produção.</p>
        {view.boletoUrl && (
          <Button asChild className="mt-5">
            <a href={view.boletoUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" aria-hidden /> Abrir boleto</a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded border border-concreto bg-pedra p-6 text-center" role="status">
      <p className="font-serif text-2xl font-light">Pagamento em análise</p>
      <p className="mt-1 text-sm text-secundario">Estamos aguardando a confirmação do cartão. Você receberá um e-mail assim que for aprovado.</p>
    </div>
  );
}
