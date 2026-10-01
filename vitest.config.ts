import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const SRC = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    /*
     * Mirrors the `exports` map in package.json, resolved against source.
     *
     * The published artefact is verified for real in `tests/published-package.test.ts`,
     * which resolves through Node and TypeScript. This alias exists so tests and
     * stories can be *written* with the same specifier a consumer uses, which keeps the
     * documented import path honest in day-to-day development.
     */
    alias: [
      { find: /^uireload\/components\/(.+)$/, replacement: `${SRC}/components/$1` },
      { find: /^uireload$/, replacement: `${SRC}/index.ts` },
      {
        find: /^uireload-test$/,
        replacement: fileURLToPath(new URL("./tests/helpers.tsx", import.meta.url)),
      },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}", "scripts/**/*.test.{ts,tsx}"],
    // `src/index.ts` is re-exports only; testing it adds no behavioural coverage.
    coverage: {
      provider: "v8",
      // `json-summary` rather than `summary`: machine-readable, so CI can diff it, and
      // it does not depend on `istanbul-reports`' optional summary renderer.
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/index.ts",
        "src/**/*.types.ts",
        "src/**/*.test.{ts,tsx}",
        "src/components/_template/**",
        ".storybook/**",
      ],
      thresholds: {
        // Low while the library is infrastructure-only. Raise deliberately as
        // components land rather than letting coverage drift down.
        lines: 60,
        functions: 70,
        branches: 60,
        statements: 60,
      },
    },
  },
});
