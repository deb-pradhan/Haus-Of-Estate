import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./tests/setup/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "tests/unit/**/*.test.ts",
      "tests/unit/**/*.test.tsx",
    ],
    clearMocks: true,
    restoreMocks: true,
  },
});
