import { defineConfig } from "vitest/config";

// Отдельный конфиг для юнит-тестов ядра: без vite.config.mts с плагином
// Cloudflare, иначе vitest поднимает worker-окружение и не доходит до тестов.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
