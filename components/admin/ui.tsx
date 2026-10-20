import { cn } from "@/lib/utils";

export function PageHeader({ title, actions, subtitle }: { title: string; actions?: React.ReactNode; subtitle?: string }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl font-light md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-secundario">{subtitle}</p>}
      </div>
      {actions}
    </header>
  );
}

export function StatCard({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "warn" }) {
  return (
    <div className={cn("rounded border bg-pedra p-5", tone === "warn" ? "border-erro/40" : "border-concreto")}>
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-serif text-3xl font-light">{value}</p>
      {hint && <p className="mt-1 text-xs text-secundario">{hint}</p>}
    </div>
  );
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded border border-concreto bg-pedra", className)}>
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}
export const Th = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <th scope="col" className={cn("border-b border-concreto px-4 py-3 text-xs font-normal uppercase tracking-[0.16em] text-secundario", className)}>{children}</th>
);
export const Td = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <td className={cn("border-b border-concreto/60 px-4 py-3 align-middle", className)}>{children}</td>
);

export function DemoNotice() {
  return (
    <div role="alert" className="rounded border border-concreto bg-pedra p-6">
      <p className="font-serif text-xl font-light">Banco de dados não configurado</p>
      <p className="mt-2 text-secundario">O painel precisa do PostgreSQL (Supabase). Configure <code>DATABASE_URL</code>, rode <code>npm run db:push</code> e <code>npm run db:seed</code> — veja o README.</p>
    </div>
  );
}
