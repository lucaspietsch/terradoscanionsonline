import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

/** Substitui next/link: links internos viram "#/rota" (roteamento por hash, funciona em file://). */
export default function Link({
  href,
  children,
  onClick,
  prefetch: _prefetch,
  scroll: _scroll,
  replace: _replace,
  ...rest
}: { href: string | { pathname?: string; search?: string }; children?: ReactNode; prefetch?: boolean; scroll?: boolean; replace?: boolean } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const raw = typeof href === "string" ? href : `${href.pathname ?? "/"}${href.search ?? ""}`;
  const hashAt = raw.indexOf("#");
  const frag = hashAt >= 0 ? raw.slice(hashAt + 1) : "";
  const target = hashAt >= 0 ? raw.slice(0, hashAt) : raw;
  const external = /^(https?:|mailto:|tel:)/.test(target);

  if (external) return <a href={raw} {...rest} onClick={onClick}>{children}</a>;

  const to = target === "" ? "/" : target.startsWith("/") ? target : `/${target}`;
  return (
    <a
      href={`#${to}`}
      {...rest}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        // rola até o âncora (ex.: grade de produtos) mesmo quando a rota não muda
        (window as unknown as { __pendingScroll?: string }).__pendingScroll = frag || undefined;
        // rota diferente: o próprio hashchange cuida da rolagem; mesma rota: dispara manualmente
        if (window.location.hash === `#${to}` || (window.location.hash === "" && to === "/")) setTimeout(() => window.dispatchEvent(new Event("cb-nav")), 0);
      }}
    >
      {children}
    </a>
  );
}
