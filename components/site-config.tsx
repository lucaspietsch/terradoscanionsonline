"use client";
import { createContext, useContext } from "react";

export interface ClientSiteConfig {
  freeShippingThresholdCents: number;
  whatsapp: string;
  instagram: string;
  pickupEnabled: boolean;
  pickupAddress: string;
  maxInstallments: number;
  mpPublicKey: string;
  checkoutEnabled: boolean;
  authEnabled: boolean;
}

const Ctx = createContext<ClientSiteConfig | null>(null);

export function SiteConfigProvider({ value, children }: { value: ClientSiteConfig; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSiteConfig(): ClientSiteConfig {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSiteConfig fora do SiteConfigProvider");
  return v;
}
