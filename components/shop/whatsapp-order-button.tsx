"use client";
import { MessageCircle } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useSiteConfig } from "@/components/site-config";
import { buildOrderMessage, type OrderMessageLine, type OrderMessageOptions } from "@/lib/order-message";
import { whatsappUrl } from "@/lib/site";

/** Envia o pedido (itens + valores) como mensagem para o WhatsApp da loja. */
export function WhatsAppOrderButton({
  lines,
  options,
  children = "Pedir pelo WhatsApp",
  onSent,
  ...props
}: {
  lines: OrderMessageLine[];
  options?: Omit<OrderMessageOptions, "thresholdCents">;
  children?: React.ReactNode;
  onSent?: () => void;
} & Omit<ButtonProps, "asChild" | "onClick">) {
  const { whatsapp, freeShippingThresholdCents } = useSiteConfig();
  const href = whatsappUrl(buildOrderMessage(lines, { ...options, thresholdCents: freeShippingThresholdCents }), whatsapp);
  if (lines.length === 0 || props.disabled) {
    // um <a> não pode ficar desativado: sem itens (ou opção indisponível) vira um botão inerte
    return (
      <Button {...props} disabled>
        <MessageCircle className="h-4 w-4" strokeWidth={1.5} aria-hidden /> {children}
      </Button>
    );
  }
  return (
    <Button asChild {...props}>
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onSent}>
        <MessageCircle className="h-4 w-4" strokeWidth={1.5} aria-hidden /> {children}
      </a>
    </Button>
  );
}
