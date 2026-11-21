import { defineConfig } from "vitest/config";

// Отдельный конфиг для юнит-тестов: без vite.config.mts с плагином
// Cloudflare, иначе vitest поднимает worker-окружение и не доходит до тестов.
export default defineConfig({
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});