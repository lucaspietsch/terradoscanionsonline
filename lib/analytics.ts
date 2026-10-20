"use client";

type Params = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

const META_EVENTS: Record<string, string> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
};

/** Dispara eventos GA4 + Meta Pixel (só existem se o usuário aceitou cookies de análise). */
export function track(event: "view_item" | "add_to_cart" | "begin_checkout" | "purchase", params: Params = {}) {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", event, params);
    const value = typeof params.value === "number" ? params.value : undefined;
    window.fbq?.("track", META_EVENTS[event], { ...(value != null && { value, currency: "BRL" }), content_type: "product" });
  } catch {
    /* analytics nunca pode quebrar a loja */
  }
}

export const CONSENT_KEY = "cambara-consent";
export type Consent = "all" | "essential";

export function readConsent(): Consent | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "all" || v === "essential" ? v : null;
  } catch {
    return null;
  }
}
