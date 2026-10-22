"use client";
import type { AnchorHTMLAttributes } from "react";
import { whatsappUrl, whatsappWebUrl } from "@/lib/site";

const isDesktop = () =>
  typeof navigator !== "undefined" && !/android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) && !(navigator.maxTouchPoints > 1 && /macintosh/i.test(navigator.userAgent));

/**
 * Link do WhatsApp que funciona em qualquer cenário com um único botão:
 *  - celular: abre o app instalado (WhatsApp ou WhatsApp Business) pelo link universal wa.me;
 *  - computador: abre o WhatsApp Web já com a conversa e a mensagem (também serve para conta Business);
 *  - sem JavaScript: o link wa.me continua funcionando (ele mesmo oferece app ou Web).
 */
export function WhatsAppLink({ number, message, onClick, children, ...props }: { number: string; message?: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <a
      {...props}
      href={whatsappUrl(message, number)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || !isDesktop()) return;
        e.preventDefault();
        window.open(whatsappWebUrl(message, number), "_blank", "noopener,noreferrer");
      }}
    >
      {children}
    </a>
  );
}
