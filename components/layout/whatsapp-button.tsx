"use client";
import { MessageCircle } from "lucide-react";
import { useSiteConfig } from "@/components/site-config";
import { whatsappUrl } from "@/lib/site";

export function WhatsAppButton() {
  const { whatsapp } = useSiteConfig();
  return (
    <a
      href={whatsappUrl("Olá! Vim pelo site da Cambará Ornamentais e gostaria de ajuda.", whatsapp)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-musgo text-pedra shadow-lg shadow-sombra/20 transition-transform hover:scale-105 hover:bg-musgo-claro md:bottom-7 md:right-7"
    >
      <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
    </a>
  );
}
