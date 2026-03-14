import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html", "lcov"],
      reportsDirectory: "coverage",
      include: [
        "src/**/*.ts",
        "scripts/**/*.mjs",
      ],
      exclude: [
        ".artifacts/**",
        ".codex/**",
        "dist/**",
        "coverage/**",
        "docs/**",
        "test/**",
      ],
    },
  },
});
