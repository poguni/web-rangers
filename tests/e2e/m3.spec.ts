// M3 사건 탐구·자유 실험실 화면 흐름 (1280×690 크롬, 1280×720·1920×1080 엣지)
import { expect, test, type Page } from "@playwright/test";

// 번호 입력(시작 화면)은 m4.spec.ts에서 검사하고, 여기서는 손님으로 바로 시작
test.beforeEach(({ page }) => page.addInitScript(() => sessionStorage.setItem("webrangers.v1.current", "guest")));

const fits = (page: Page) => page.evaluate(() => document.documentElement.scrollHeight <= document.documentElement.clientHeight);
const noPageNumbers = async (page: Page) => expect(await page.locator("body").innerText()).not.toMatch(/\d+\s*(~\s*\d+\s*)?쪽/);
const step = (page: Page, n: number) => (async () => {
  for (let i = 0; i < n; i++) await page.getByRole("button", { name: "1년 ⏭" }).click();
})();

async function predictStage1(page: Page, right: boolean) {
  await page.goto("/#/stage/forest-1");
  expect(await fits(page)).toBe(true); // 안정 관찰
  await page.getByRole("button", { name: /사건 카드 열기/ }).click();
  const submit = page.getByRole("button", { name: /예측 제출하고/ });
  await expect(submit).toBeDisabled(); // 세 질문을 모두 답해야 제출
  await page.getByRole("button", { name: right ? "줄어요" : "늘어요", exact: true }).click();
  await page.getByRole("button", { name: right ? "메뚜기" : "토끼", exact: true }).click();
  await page.locator(".reason").nth(right ? 1 : 0).click();
  expect(await fits(page)).toBe(true);
  await noPageNumbers(page);
  await submit.click();
}

test("사건 탐구 목록·자유 실험실이 스크롤 없이 들어가요", async ({ page }) => {
  for (const route of ["stages", "lab"]) {
    await page.goto(`/#/${route}`);
    await expect(page.locator(".screen")).toBeVisible();
    expect(await fits(page), route).toBe(true);
    await noPageNumbers(page);
  }
});

test("사건 탐구 1: 예측 → 관찰 → 보고서 → 되살리기 → 균형 별 3개", async ({ page }) => {
  await predictStage1(page, true);
  expect(await fits(page)).toBe(true); // 관찰
  await step(page, 8);
  await expect(page.locator('[data-bar="forest.grass"] .chg')).toHaveText("▼ 79");
  await page.getByRole("button", { name: /탐구 보고서 보기/ }).click();

  await expect(page.getByText("350점")).toBeVisible();
  await expect(page.locator(".chain")).toContainText("개구리");
  await expect(page.getByText("메뚜기를 먹는 개구리가 사라졌기 때문이에요.").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /물 대 주기/ })).toBeDisabled();
  await expect(page.getByText("지금은 가뭄이 아니라 필요 없어요.")).toBeVisible();
  await noPageNumbers(page);

  await page.getByRole("button", { name: /개구리 되살리기/ }).click();
  await page.getByRole("button", { name: /행동하고 4년 더/ }).click();
  await step(page, 4);
  await page.getByRole("button", { name: /균형 별 보기/ }).click();
  await expect(page.getByLabel("균형 별 3개")).toBeVisible();
  await expect(page.getByText("500점")).toBeVisible();

  await page.getByRole("button", { name: "사건 목록" }).click();
  await expect(page.locator(".stage-card").first().getByLabel("별 3개")).toBeVisible();
});

test("사건 탐구 1: 틀린 예측에도 정답과 까닭을 보여 줘요", async ({ page }) => {
  await predictStage1(page, false);
  await step(page, 8);
  await page.getByRole("button", { name: /탐구 보고서 보기/ }).click();
  await expect(page.getByText("0점", { exact: true })).toBeVisible();
  await expect(page.getByText("가장 크게 변한 생물 메뚜기")).toBeVisible();
  await expect(page.getByText(/정답: 메뚜기를 먹던 개구리가/)).toBeVisible();
});

test("사건 탐구 5: 먹이사슬 한 줄에서 변화가 더 커요", async ({ page }) => {
  await page.goto("/#/stage/forest-5");
  await page.getByRole("button", { name: /사건 카드 열기/ }).click();
  await page.getByRole("button", { name: "줄어요", exact: true }).click();
  await page.getByRole("button", { name: /먹이사슬$/ }).click();
  await page.locator(".reason").nth(1).click();
  await page.getByRole("button", { name: /예측 제출하고/ }).click();
  expect(await fits(page)).toBe(true);
  await step(page, 8);
  await expect(page.getByRole("status").last()).toContainText("먹이사슬에서 74, 먹이그물에서 79");
  await page.getByRole("button", { name: /탐구 보고서 보기/ }).click();
  await expect(page.getByText("350점")).toBeVisible();
  await page.getByRole("button", { name: /탐구 마치기/ }).click();
  await expect(page.getByLabel("균형 별 3개")).toBeVisible();
});

test("자유 실험실: 개구리를 없애고 먹이사슬과 비교해요", async ({ page }) => {
  await page.goto("/#/lab");
  const start = page.getByRole("button", { name: /실험 시작/ });
  await expect(start).toBeDisabled();
  await page.locator('[data-node="forest.frog"]').click();
  await page.getByRole("button", { name: /없애기/ }).click();
  await page.getByRole("button", { name: "먹이사슬과 비교" }).click();
  await start.click();
  const chart = page.getByRole("img", { name: /생물 수 꺾은선 그래프/ });
  await expect(chart).toContainText("개구리 0");
  await expect(chart).toContainText("풀(사슬) 74");
  await expect(chart).toContainText("풀 79");
  expect(await fits(page)).toBe(true);
});
