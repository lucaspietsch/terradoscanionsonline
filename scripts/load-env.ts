/** Carrega .env.local e .env (nesta ordem) para os scripts de linha de comando; não sobrescreve variáveis já definidas. */
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    /* arquivo ausente: ok */
  }
}
export {};
