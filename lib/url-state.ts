/** Atualiza a query da URL sem navegar. Na versão "arquivo único" (roteamento por #) este módulo é substituído por um equivalente. */
export function replaceQuery(qs: string) {
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
}
