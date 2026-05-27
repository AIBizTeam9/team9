import { defineConfig } from "vitest/config";
import path from "node:path";

// 순수 lib 함수만 대상 — JSX / Next 환경 필요 없음.
// `@/` alias는 tsconfig와 동일하게 repo root로 매핑.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
    reporters: ["default"],
    globals: false,
  },
});
