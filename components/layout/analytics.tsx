"use client";
import Script from "next/script";
import { useEffect, useState } from "react";
import { readConsent } from "@/lib/analytics";

/** Só carrega GA4 e Meta Pixel depois do consentimento (LGPD). */
export function Analytics({ ga4Id, metaPixelId }: { ga4Id: string; metaPixelId: string }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(readConsent() === "all");
    const on = (e: Event) => setAllowed((e as CustomEvent).detail === "all");
    window.addEventListener("cambara-consent", on);
    return () => window.removeEventListener("cambara-consent", on);
  }, []);

  if (!allowed) return null;
  return (
    <>
      {ga4Id && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${ga4Id}',{anonymize_ip:true});`}</Script>
        </>
      )}
      {metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}</Script>
      )}
    </>
  );
}
