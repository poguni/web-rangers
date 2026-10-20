// PRD 8장: 주요 화면 흐름을 1280×690(크롬북)·1280×720·1920×1080(전자칠판) 세 크기에서 검사
// 브라우저는 내려받지 않고 기기에 설치된 크롬·엣지를 씀
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results", // .gitignore 대상(실패 스크린샷 포함)
  workers: 1, // 브라우저를 한 번에 하나만: 동시에 여러 개 띄우면 메모리가 부족해 개발 도구가 멈춘 적이 있음
  use: {
    baseURL: "http://localhost:5173",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromebook-1280x690", use: { channel: "chrome", viewport: { width: 1280, height: 690 } } },
    { name: "board-150-1280x720", use: { channel: "msedge", viewport: { width: 1280, height: 720 } } },
    { name: "board-100-1920x1080", use: { channel: "msedge", viewport: { width: 1920, height: 1080 } } },
  ],
  webServer: [
    {
      command: "npm run dev -- --port 5173 --strictPort",
      url: "http://localhost:5173",
      reuseExistingServer: true,
    },
    {
      // 오프라인 검사(offline.spec.ts)는 서비스 워커가 있는 배포판으로
      command: "npm run build && npm run preview -- --port 4173 --strictPort",
      url: "http://localhost:4173",
      reuseExistingServer: true,
    },
  ],
});
