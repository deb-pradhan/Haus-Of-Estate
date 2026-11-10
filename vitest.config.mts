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
      "tests/careers.test.ts",
      "tests/careers-closed.test.ts",
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "tests/unit/**/*.test.ts",
      "tests/unit/**/*.test.tsx",
      // Publication and release checks carried over from main. The other
      // .mjs files under tests/unit are node:test scripts with their own runners.
      "tests/unit/publication/**/*.test.mjs",
    ],
    clearMocks: true,
    restoreMocks: true,
  },
});
