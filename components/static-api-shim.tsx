"use client";
import { installStaticApi } from "@/lib/static-api";

// Roda no carregamento do módulo (antes dos efeitos dos componentes filhos). Só é incluído na versão estática.
installStaticApi();

export function StaticApiShim() {
  return null;
}
