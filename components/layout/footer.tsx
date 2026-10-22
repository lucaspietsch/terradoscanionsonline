import Link from "next/link";
import { Barcode, CreditCard, Instagram, Mail, MessageCircle, QrCode } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { instagramUrl, site, whatsappUrl } from "@/lib/site";
import { hasDatabase } from "@/lib/db";
import { env } from "@/lib/env";
import type { SiteSettings } from "@/types";

export function Footer({ settings }: { settings: SiteSettings }) {
  const col = "space-y-3 text-[0.9375rem]";
  const link = "text-nevoa/80 transition-colors hover:text-pedra";
  return (
    <footer className="bg-sombra text-nevoa" data-dark>
      <div className="container grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="space-y-5">
          <Logo variant="light" />
          <p className="max-w-xs text-[0.9375rem] leading-relaxed text-nevoa/75">
            Vasos de cimento feitos à mão, para trazer o jardim para dentro de casa.
          </p>
        </div>

        <nav aria-label="Loja" className={col}>
          <p className="eyebrow !text-salvia-clara">Loja</p>
          <ul className="space-y-2.5">
            <li><Link className={link} href="/vasos#produtos">Todos os vasos</Link></li>
            <li><Link className={link} href="/vasos?categoria=pequenos#produtos">Pequenos</Link></li>
            <li><Link className={link} href="/vasos?categoria=medios#produtos">Médios</Link></li>
            <li><Link className={link} href="/vasos?categoria=aromaterapia#produtos">Aromaterapia</Link></li>
          </ul>
        </nav>

        <nav aria-label="Institucional" className={col}>
          <p className="eyebrow !text-salvia-clara">Cambará</p>
          <ul className="space-y-2.5">
            <li><Link className={link} href="/sobre">Sobre nós</Link></li>
            <li><Link className={link} href="/cuidados">Cuidados com o cimento</Link></li>
            <li><Link className={link} href="/trocas-e-devolucoes">Trocas e devoluções</Link></li>
            <li><Link className={link} href="/privacidade">Política de privacidade</Link></li>
            <li><Link className={link} href="/termos">Termos de uso</Link></li>
            <li><Link className={link} href="/contato">Contato</Link></li>
          </ul>
        </nav>

        <div className={col}>
          <p className="eyebrow !text-salvia-clara">Fale com a gente</p>
          <ul className="space-y-2.5">
            <li>
              <a className={`${link} inline-flex items-center gap-2`} href={whatsappUrl(undefined, settings.whatsapp)} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" strokeWidth={1.5} aria-hidden /> WhatsApp
              </a>
            </li>
            <li>
              <a className={`${link} inline-flex items-center gap-2`} href={instagramUrl(settings.instagram)} target="_blank" rel="noopener noreferrer">
                <Instagram className="h-4 w-4" strokeWidth={1.5} aria-hidden /> @{settings.instagram.replace(/^@/, "")}
              </a>
            </li>
            <li>
              <a className={`${link} inline-flex items-center gap-2`} href={`mailto:${settings.contactEmail}`}>
                <Mail className="h-4 w-4" strokeWidth={1.5} aria-hidden /> {settings.contactEmail}
              </a>
            </li>
          </ul>
          <p className="eyebrow !text-salvia-clara pt-4">Formas de pagamento</p>
          {hasDatabase && env.hasMercadoPago ? (
            <ul className="flex flex-wrap gap-2 text-xs text-nevoa/85">
              <li className="inline-flex items-center gap-1.5 rounded border border-nevoa/25 px-2.5 py-1.5"><QrCode className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Pix</li>
              <li className="inline-flex items-center gap-1.5 rounded border border-nevoa/25 px-2.5 py-1.5"><CreditCard className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Cartão até {settings.maxInstallments}x sem juros</li>
              <li className="inline-flex items-center gap-1.5 rounded border border-nevoa/25 px-2.5 py-1.5"><Barcode className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Boleto</li>
            </ul>
          ) : (
            <p className="max-w-[16rem] text-sm leading-relaxed text-nevoa/75">Pedido finalizado pelo WhatsApp: combinamos pagamento e entrega por lá.</p>
          )}
        </div>
      </div>
      <div className="border-t border-nevoa/15">
        <div className="container flex flex-col gap-2 py-6 text-xs text-nevoa/65 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {site.name} · CNPJ {site.cnpj}</p>
          <p>Desenvolvido com cuidado</p>
        </div>
      </div>
    </footer>
  );
}
