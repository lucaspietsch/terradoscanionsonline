import { parseHash } from "./shim-navigation";

/** Com roteamento por hash, a query da URL fica dentro do hash: #/vasos?categoria=x */
export function replaceQuery(qs: string) {
  const { path } = parseHash();
  window.history.replaceState(null, "", `#${path}${qs ? `?${qs}` : ""}`);
}
