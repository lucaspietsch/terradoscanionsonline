import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { site } from "@/lib/site";

// Fontes self-hosted (Fraunces e Jost, as mesmas do Google Fonts) via next/font: pré-carregadas, display=swap,
// com fallback ajustado para evitar salto de layout e sem requisição a terceiros (bom para LGPD).
const jost = localFont({
  src: "../node_modules/@fontsource-variable/jost/files/jost-latin-wght-normal.woff2",
  variable: "--font-jost",
  weight: "100 900",
  display: "swap",
});
const fraunces = localFont({
  src: "../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2",
  variable: "--font-fraunces",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  openGraph: { type: "website", locale: "pt_BR", siteName: site.name, title: `${site.name} — ${site.tagline}`, description: site.description },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#ECEAE5", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${jost.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
