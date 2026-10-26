// M5 강·바다 콘텐츠와 카드 수집: 테마 고르기, 강·바다 사건 탐구, 카드 도감, 생물·비생물 나누기, 교사 카드 열기, 강 모둠 대항전
import { expect, test, type Page } from "@playwright/test";

const fits = (page: Page) => page.evaluate(() => document.documentElement.scrollHeight <= document.documentElement.clientHeight);
const noPageNumbers = async (page: Page) => expect(await page.locator("body").innerText()).not.toMatch(/\d+\s*(~\s*\d+\s*)?쪽/);
const step = async (page: Page, n: number) => {
  for (let i = 0; i < n; i++) await page.getByRole("button", { name: "1년 ⏭" }).click();
};
const pin = async (page: Page, digits: string) => {
  for (const d of digits) await page.getByRole("button", { name: d, exact: true }).click();
};

test.beforeEach(({ page }) => page.addInitScript(() => sessionStorage.setItem("webrangers.v1.current", "4-2-13")));

test("강·바다 화면이 스크롤 없이 들어가고, 교과서 쪽수가 없어요", async ({ page }) => {
  for (const route of ["build/river", "build/sea", "stages/river", "stages/sea", "lab/river", "lab/sea", "cards", "sort/abiotic"]) {
    await page.goto(`/#/${route}`);
    await expect(page.locator(".screen")).toBeVisible();
    expect(await fits(page), route).toBe(true);
    await noPageNumbers(page);
  }
});

test("메인에서 바다를 고르면 바다 먹이그물 만들기로 가요", async ({ page }) => {
  await page.goto("/#/");
  await page.getByRole("group", { name: "테마" }).getByRole("button", { name: /^바다/ }).click();
  await expect(page.getByText("— 바다 선택됨")).toBeVisible();
  expect(await fits(page)).toBe(true);
  await page.getByRole("button", { name: /먹이그물 만들기/ }).click();
  await expect(page.getByText("바다 › 먹이그물 만들기")).toBeVisible();
  await expect(page.locator(".mini-card").first()).toContainText("식물 플랑크톤"); // 생산자부터
});

test("강 사건 탐구 3: 큰입배스가 들어오고, 외래종 잡기로 균형 별 3개와 큰입배스 카드", async ({ page }) => {
  await page.goto("/#/stage/river-3");
  await expect(page.locator('[data-node="river.bass"]')).toHaveCount(0); // 들어오기 전에는 없음
  await page.getByRole("button", { name: /사건 카드 열기/ }).click();
  await page.getByRole("button", { name: "늘어요", exact: true }).click();
  await page.getByRole("button", { name: "붕어", exact: true }).click();
  await page.locator(".reason").nth(1).click();
  await page.getByRole("button", { name: /예측 제출하고/ }).click();
  await step(page, 8);
  await expect(page.locator('[data-bar="river.bass"] .chg')).toHaveText("＋ 65");
  await expect(page.locator('[data-bar="river.hornwort"] .chg')).toHaveText("▲ 115");
  expect(await fits(page)).toBe(true);
  await page.getByRole("button", { name: /탐구 보고서 보기/ }).click();
  await expect(page.getByText("350점")).toBeVisible();
  await expect(page.locator(".chain")).toContainText("큰입배스");
  await expect(page.getByRole("button", { name: /강물 깨끗하게 하기/ })).toBeDisabled();
  await page.getByRole("button", { name: /외래종 잡기/ }).click();
  await page.getByRole("button", { name: /행동하고 4년 더/ }).click();
  await step(page, 4);
  await page.getByRole("button", { name: /균형 별 보기/ }).click();
  await expect(page.getByLabel("균형 별 3개")).toBeVisible();
  await expect(page.locator(".reward")).toContainText("큰입배스");
  await noPageNumbers(page);

  await page.goto("/#/cards");
  await page.getByRole("tab", { name: /강/ }).click();
  await page.getByRole("listitem", { name: "큰입배스" }).click();
  await expect(page.getByText("생태계를 어지럽히는 생물")).toBeVisible();
  await page.getByRole("button", { name: /뒤집어서/ }).click();
  await expect(page.locator(".face.back")).toContainText("이 먹이그물에는 없어요."); // 먹는 동물이 거의 없음
});

test("바다 사건 탐구 1: 바다 쓰레기를 치워야 균형 별 3개", async ({ page }) => {
  await page.goto("/#/stage/sea-1");
  await page.getByRole("button", { name: /사건 카드 열기/ }).click();
  await expect(page.locator(".event-card")).toContainText("바다거북이 살기 힘들어요 (10년 동안)");
  await page.getByRole("button", { name: "늘어요", exact: true }).click();
  await page.getByRole("button", { name: "해파리", exact: true }).click();
  await page.locator(".reason").nth(1).click();
  await page.getByRole("button", { name: /예측 제출하고/ }).click();
  await step(page, 8);
  await page.getByRole("button", { name: /탐구 보고서 보기/ }).click();
  await expect(page.getByText("350점")).toBeVisible();
  await page.getByRole("button", { name: /바다 쓰레기 치우기/ }).click();
  await page.getByRole("button", { name: /행동하고 4년 더/ }).click();
  await step(page, 4);
  await page.getByRole("button", { name: /균형 별 보기/ }).click();
  await expect(page.getByLabel("균형 별 3개")).toBeVisible();
  await expect(page.getByText("바다가 처음과 거의 같아졌어요.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "다음 사건 →" }).click();
  await expect(page.getByText("바다 › 사건 탐구 2")).toBeVisible();
});

test("생물·비생물 나누기: 맞으면 바구니에, 틀리면 까닭을 알려 줘요", async ({ page }) => {
  await page.goto("/#/sort/abiotic");
  await page.locator(".scard", { hasText: "햇빛" }).click();
  await page.locator('[data-bin="abiotic"]').click();
  await expect(page.locator('[role="status"] .toast')).toContainText("햇빛은 비생물 요소예요");
  await page.locator(".scard", { hasText: "다람쥐" }).click();
  await page.locator('[data-bin="abiotic"]').click();
  await expect(page.locator('[role="status"] .toast')).toContainText("다람쥐는 비생물 요소가 아니에요");
});

test("교사: 카드 모두 열기를 켜면 도감의 카드가 모두 보여요", async ({ page }) => {
  await page.goto("/#/cards");
  await expect(page.getByRole("tab", { name: "숲 0/16" })).toBeVisible();
  await page.goto("/#/teacher");
  await pin(page, "12341234");
  await page.getByRole("button", { name: /카드 모두 열기/ }).click();
  await expect(page.getByRole("button", { name: /카드 다시 닫기/ })).toBeVisible();
  await page.goto("/#/cards");
  await expect(page.getByRole("tab", { name: "숲 16/16" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "강 13/13" })).toBeVisible();
  await expect(page.getByText("선생님이 모든 카드를 열었어요")).toBeVisible();

  // 큰 카드: 앞면 512px 그림 → 뒤집으면 사는 곳·특징, 다른 카드를 고르면 다시 앞면
  await page.getByRole("tab", { name: /숲/ }).click();
  await page.getByRole("listitem", { name: "개구리" }).click();
  const front = page.locator(".face.front");
  const back = page.locator(".face.back");
  await expect(front.locator("img.pic")).toHaveAttribute("src", /forest-frog-512\.webp$/);
  await expect(front).toHaveAttribute("aria-hidden", "false");
  await front.click(); // 카드를 눌러도 뒤집힘
  await expect(back).toHaveAttribute("aria-hidden", "false");
  await expect(back).toContainText("사는 곳");
  await expect(back).toContainText("특징");
  await page.getByRole("button", { name: /앞면 보기/ }).click();
  await expect(front).toHaveAttribute("aria-hidden", "false");
  await page.getByRole("button", { name: /뒤집어서/ }).click();
  await page.getByRole("listitem", { name: "메뚜기" }).click();
  await expect(page.locator(".face.front")).toHaveAttribute("aria-hidden", "false");
  await expect(page.locator(".face.front h2")).toHaveText("메뚜기");
});

test("모둠 대항전: 강 테마로 진행해요", async ({ page }) => {
  await page.goto("/#/team");
  await pin(page, "12341234");
  await page.getByRole("group", { name: "테마" }).getByRole("button", { name: "강" }).click();
  await page.getByRole("button", { name: /1라운드 시작/ }).click();
  await expect(page.getByRole("heading", { name: /모둠 대항전 · 강 · 1라운드/ })).toBeVisible();
  await expect(page.getByText("붕어를 너무 많이 잡았어요")).toBeVisible();
  expect(await fits(page)).toBe(true);
  await page.getByRole("button", { name: "1모둠 늘어요" }).click();
  await page.getByRole("button", { name: /모두 공개하고 관찰하기/ }).click();
  await step(page, 8);
  await expect(page.locator(".target .chg")).toHaveText("▲ 100 → 123");
  await expect(page.locator(".rv.ok")).toContainText("1모둠");
});
