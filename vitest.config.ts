import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { include: ["tests/**/*.test.ts"], environment: "node", testTimeout: 20000 },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      // `server-only` lança fora do bundler do Next; nos testes de servidor ele vira um módulo vazio.
      "server-only": path.resolve(__dirname, "tests/stubs/empty.ts"),
    },
  },
});
