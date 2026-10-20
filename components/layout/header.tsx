"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, ShoppingBag, User } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SearchDialog } from "@/components/layout/search-dialog";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSiteConfig } from "@/components/site-config";
import { selectCount, useCart } from "@/lib/cart-store";
import { useAuthUser, useHydrated } from "@/lib/hooks";
import { navLinks } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const hydrated = useHydrated();
  const count = useCart(selectCount);
  const setOpen = useCart((s) => s.setOpen);
  const { authEnabled } = useSiteConfig();
  const user = useAuthUser(authEnabled);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,backdrop-filter,border-color] duration-300",
        scrolled ? "border-concreto/70 bg-nevoa/80 backdrop-blur-md" : "border-transparent bg-nevoa",
      )}
    >
      <div className="container flex h-[72px] items-center justify-between gap-6">
        <div className="flex items-center gap-2 lg:hidden">
          <Sheet>
            <SheetTrigger className="inline-flex h-10 w-10 items-center justify-center rounded text-musgo hover:bg-musgo/10" aria-label="Abrir menu">
              <Menu className="h-6 w-6" strokeWidth={1.5} />
            </SheetTrigger>
            <SheetContent side="left" aria-describedby="menu-desc">
              <div className="border-b border-concreto px-6 py-6">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <SheetDescription id="menu-desc" className="sr-only">Navegação principal</SheetDescription>
                <Logo />
              </div>
              <nav aria-label="Principal" className="flex flex-col px-6 py-4">
                {navLinks.map((l) => (
                  <SheetClose asChild key={l.href}>
                    <Link href={l.href} className="border-b border-concreto/70 py-4 font-serif text-2xl font-light hover:text-musgo">
                      {l.label}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Link href={user ? "/conta" : "/entrar"} className="py-4 text-sm uppercase tracking-[0.2em] text-secundario">
                    {user ? "Minha conta" : "Entrar"}
                  </Link>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        <Link href="/" className="rounded focus-visible:outline-offset-4" aria-label="Cambará Ornamentais — página inicial">
          <Logo />
        </Link>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="relative py-2 text-[0.9375rem] tracking-wide text-sombra transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-musgo after:transition-transform hover:text-musgo hover:after:scale-x-100">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <SearchDialog />
          <Link href={user ? "/conta" : "/entrar"} className="hidden h-10 w-10 items-center justify-center rounded text-musgo hover:bg-musgo/10 sm:inline-flex" aria-label={user ? "Minha conta" : "Entrar"}>
            <User className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <button type="button" onClick={() => setOpen(true)} className="relative inline-flex h-10 w-10 items-center justify-center rounded text-musgo hover:bg-musgo/10" aria-label={`Abrir carrinho${hydrated && count ? `, ${count} ${count === 1 ? "item" : "itens"}` : ""}`}>
            <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
            {hydrated && count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-musgo px-1 text-[0.6875rem] font-normal leading-none text-pedra" aria-hidden>
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
