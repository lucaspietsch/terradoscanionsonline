import type { Metadata } from "next";
import { Clock, Instagram, Mail, MapPin, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/home/contact-form";
import { Button } from "@/components/ui/button";
import { getSettings } from "@/lib/data/settings";
import { WhatsAppLink } from "@/components/shop/whatsapp-link";
import { instagramUrl, site } from "@/lib/site";

export const metadata: Metadata = { title: "Contato", description: "Fale com a Cambará Ornamentais por formulário, WhatsApp ou e-mail.", alternates: { canonical: "/contato" } };
export const revalidate = 300;

export default async function Page() {
  const s = await getSettings();
  return (
    <div className="container py-14 md:py-24">
      <p className="eyebrow">Contato</p>
      <h1 className="h1-display mt-4 !text-5xl md:!text-6xl">Vamos conversar</h1>
      <p className="mt-6 max-w-2xl text-xl text-secundario">Dúvidas sobre tamanhos, plantas, prazos ou encomendas? Escreva — respondemos com carinho.</p>

      <div className="mt-14 grid gap-14 lg:grid-cols-2">
        <section aria-labelledby="form-title">
          <h2 id="form-title" className="mb-6 font-serif text-2xl font-light">Envie uma mensagem</h2>
          <ContactForm />
        </section>
        <section aria-labelledby="canais-title" className="space-y-8">
          <h2 id="canais-title" className="font-serif text-2xl font-light">Outros canais</h2>
          <ul className="space-y-5">
            <li className="flex gap-4"><MessageCircle className="mt-1 h-5 w-5 text-musgo" strokeWidth={1.5} aria-hidden /><div><p>WhatsApp</p><Button asChild variant="link"><WhatsAppLink number={s.whatsapp} message="Olá! Vim pelo site da Cambará Ornamentais.">Chamar no WhatsApp</WhatsAppLink></Button></div></li>
            <li className="flex gap-4"><Mail className="mt-1 h-5 w-5 text-musgo" strokeWidth={1.5} aria-hidden /><div><p>E-mail</p><a className="text-secundario underline underline-offset-4 hover:text-musgo" href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a></div></li>
            <li className="flex gap-4"><Instagram className="mt-1 h-5 w-5 text-musgo" strokeWidth={1.5} aria-hidden /><div><p>Instagram</p><a className="text-secundario underline underline-offset-4 hover:text-musgo" href={instagramUrl(s.instagram)} target="_blank" rel="noopener noreferrer">@{s.instagram.replace(/^@/, "")}</a></div></li>
            {s.pickupEnabled && <li className="flex gap-4"><MapPin className="mt-1 h-5 w-5 text-musgo" strokeWidth={1.5} aria-hidden /><div><p>Retirada no local</p><p className="text-secundario">{s.pickupAddress}</p><p className="text-sm text-secundario">Combine o horário antes pelo WhatsApp.</p></div></li>}
            <li className="flex gap-4"><Clock className="mt-1 h-5 w-5 text-musgo" strokeWidth={1.5} aria-hidden /><div><p>Atendimento</p><p className="text-secundario">Segunda a sexta, 9h às 17h</p></div></li>
          </ul>
          {site.mapEmbedUrl ? (
            <div className="aspect-[4/3] overflow-hidden rounded border border-concreto">
              <iframe title="Mapa com a localização da Cambará Ornamentais" src={site.mapEmbedUrl} className="h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          ) : (
            <p className="rounded border border-dashed border-concreto p-5 text-sm text-secundario">Mapa: defina <code>NEXT_PUBLIC_MAP_EMBED_URL</code> com o link de incorporação do Google Maps ou OpenStreetMap para exibi-lo aqui.</p>
          )}
        </section>
      </div>
    </div>
  );
}
