import type { Metadata } from "next";
import Link from "next/link";
import { LayoutDashboard, Package, Receipt, Settings, Tag } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { requireAdminPage } from "@/lib/server/admin-page";

export const metadata: Metadata = { title: { default: "Painel", template: "%s | Painel Cambará" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/pedidos", label: "Pedidos", icon: Receipt },
  { href: "/admin/cupons", label: "Cupons", icon: Tag },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-concreto bg-pedra lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 px-5 py-4 lg:block lg:py-8">
          <Link href="/admin" aria-label="Painel — início"><Logo /></Link>
          <p className="eyebrow mt-0 hidden lg:mt-4 lg:block">Painel administrativo</p>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:pb-0">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-3 whitespace-nowrap rounded px-3 py-2.5 text-[0.9375rem] text-sombra hover:bg-musgo/10">
              <Icon className="h-4 w-4 text-musgo" strokeWidth={1.5} aria-hidden /> {label}
            </Link>
          ))}
          <Link href="/" className="flex items-center gap-3 whitespace-nowrap rounded px-3 py-2.5 text-sm text-secundario hover:bg-musgo/10 lg:mt-6">Ver a loja ↗</Link>
        </nav>
        <p className="hidden px-5 pt-6 text-xs text-secundario lg:block">{user.email}</p>
      </aside>
      <div className="min-w-0 p-5 md:p-10">{children}</div>
    </div>
  );
}
