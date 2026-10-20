"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteConfig } from "@/components/site-config";
import { useAuthUser } from "@/lib/hooks";

export function WishlistButton({ productId }: { productId: string }) {
  const router = useRouter();
  const { authEnabled, checkoutEnabled } = useSiteConfig();
  const user = useAuthUser(authEnabled);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !checkoutEnabled) return;
    fetch("/api/wishlist").then((r) => r.json()).then((d) => setSaved((d.productIds ?? []).includes(productId))).catch(() => undefined);
  }, [user, productId, checkoutEnabled]);

  if (!authEnabled || !checkoutEnabled) return null;

  async function toggle() {
    if (!user) return router.push(`/entrar?next=${encodeURIComponent(window.location.pathname)}`);
    setLoading(true);
    try {
      const res = await fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId }) });
      if (res.ok) setSaved((await res.json()).saved);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="ghost" className="w-full" onClick={toggle} loading={loading} aria-pressed={saved}>
      <Heart className={saved ? "h-4 w-4 fill-musgo" : "h-4 w-4"} strokeWidth={1.5} aria-hidden /> {saved ? "Nos favoritos" : "Salvar nos favoritos"}
    </Button>
  );
}
