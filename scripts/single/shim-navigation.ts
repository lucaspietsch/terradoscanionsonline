import { useEffect, useState } from "react";

export function parseHash() {
  const h = window.location.hash.slice(1) || "/";
  const [path, q = ""] = h.split("?");
  return { path: path || "/", search: q };
}

function useHash() {
  const [h, setH] = useState(window.location.hash);
  useEffect(() => {
    const f = () => setH(window.location.hash);
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return h;
}

export function useSearchParams() {
  useHash();
  return new URLSearchParams(parseHash().search);
}
export function usePathname() {
  useHash();
  return parseHash().path;
}
export function useRouter() {
  return {
    push: (p: string) => { window.location.hash = `#${p}`; },
    replace: (p: string) => { window.history.replaceState(null, "", `#${p}`); window.dispatchEvent(new HashChangeEvent("hashchange")); },
    back: () => window.history.back(),
    refresh: () => undefined,
    prefetch: () => undefined,
  };
}
