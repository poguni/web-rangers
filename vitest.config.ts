import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"], // tests/e2e/*.spec.ts 는 Playwright가 실행
  },
});
