import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Analytics } from "@/components/layout/analytics";
import { CartSync } from "@/components/layout/cart-sync";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { SiteConfigProvider } from "@/components/site-config";
import { getSettings } from "@/lib/data/settings";
import { hasDatabase } from "@/lib/db";
import { env } from "@/lib/env";
import { formatBRL } from "@/lib/money";
import { site } from "@/lib/site";

export default async function LojaLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const brl = formatBRL(settings.freeShippingThresholdCents).replace(",00", "");
  const announcement = settings.announcement || `Frete grátis em compras acima de ${brl}`;

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    logo: `${site.url}/icon.png`,
    description: site.description,
    sameAs: [`https://instagram.com/${settings.instagram.replace(/^@/, "")}`],
    contactPoint: { "@type": "ContactPoint", contactType: "customer service", email: settings.contactEmail, availableLanguage: "Portuguese" },
  };

  return (
    <>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-musgo focus:px-4 focus:py-2 focus:text-pedra">
        Pular para o conteúdo
      </a>
      <SiteConfigProvider
        value={{
          freeShippingThresholdCents: settings.freeShippingThresholdCents,
          whatsapp: settings.whatsapp,
          instagram: settings.instagram,
          pickupEnabled: settings.pickupEnabled,
          pickupAddress: settings.pickupAddress,
          maxInstallments: settings.maxInstallments,
          mpPublicKey: env.mpPublicKey,
          checkoutEnabled: hasDatabase && env.hasMercadoPago,
          authEnabled: env.hasSupabase,
        }}
      >
        <AnnouncementBar text={announcement} />
        <Header />
        <main id="conteudo">{children}</main>
        <Footer settings={settings} />
        <CartDrawer />
        <WhatsAppButton />
        <CookieBanner />
        <CartSync />
        <Analytics ga4Id={site.ga4Id} metaPixelId={site.metaPixelId} />
      </SiteConfigProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
    </>
  );
}
