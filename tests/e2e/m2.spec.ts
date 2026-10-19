// M2 화면 흐름: 1280×690(크롬북 크롬)·1280×720·1920×1080(전자칠판 엣지) — playwright.config.ts 참고
import { expect, test, type Page } from "@playwright/test";

// 피드백 띠(화면 읽기용 role=status 안에 있음)
const feedback = (page: Page) => page.locator('[role="status"] .toast');

const noPageScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollHeight <= document.documentElement.clientHeight);

test.describe("화면이 스크롤 없이 들어가고, 교과서 쪽수가 없어요", () => {
  for (const route of ["", "sort", "tutorial", "build"]) {
    test(`#/${route}`, async ({ page }) => {
      await page.goto(`/#/${route}`);
      await expect(page.locator(".screen")).toBeVisible();
      expect(await noPageScroll(page)).toBe(true);
      // 학교마다 교과서가 달라 화면에 교과서 쪽수를 쓰지 않음
      expect(await page.locator("body").innerText()).not.toMatch(/\d+\s*(~\s*\d+\s*)?쪽/);
    });
  }
});

test("메인 → 분류 놀이: 맞으면 바구니에 들어가고, 틀리면 카드 뒷면 설명이 나와요", async ({ page }) => {
  await page.goto("/#/");
  await page.getByRole("button", { name: /분류 놀이/ }).click();
  await page.locator(".scard", { hasText: "버섯" }).click();
  await page.locator('[data-bin="decomposer"]').click();
  await expect(feedback(page)).toContainText("버섯은 분해자예요");
  await expect(page.locator('[data-bin="decomposer"] .got')).toContainText("버섯");

  await page.locator(".scard", { hasText: "산호" }).click();
  await page.locator('[data-bin="producer"]').click();
  await expect(feedback(page)).toContainText("산호는 생산자가 아니에요");
  await expect(feedback(page)).toContainText("동물이에요");
  await expect(page.getByText("남은 카드 11장")).toBeVisible();
});

test("분류 놀이: 끌어서 바구니에 넣어요", async ({ page }) => {
  await page.goto("/#/sort");
  const card = (await page.locator(".scard", { hasText: "괭이밥" }).boundingBox())!;
  const bin = (await page.locator('[data-bin="producer"]').boundingBox())!;
  await page.mouse.move(card.x + card.width / 2, card.y + card.height / 2);
  await page.mouse.down();
  await page.mouse.move(bin.x + bin.width / 2, bin.y + bin.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(feedback(page)).toContainText("괭이밥은 생산자예요");
});

test("튜토리얼: 풀 → 메뚜기 → 개구리를 이으면 먹이사슬·먹이그물 뜻이 나와요", async ({ page }) => {
  await page.goto("/#/tutorial");
  await page.locator('[data-node="forest.grasshopper"]').click();
  await page.locator('[data-node="forest.grass"]').click();
  await expect(feedback(page)).toContainText("방향을 다시 생각해 봐요");
  await page.locator('[data-node="forest.grass"]').click();
  await page.locator('[data-node="forest.grasshopper"]').click();
  await page.locator('[data-node="forest.grasshopper"]').click();
  await page.locator('[data-node="forest.frog"]').click();
  await expect(page.getByText("생물들의 먹고 먹히는 관계가 사슬처럼 이어진 것")).toBeVisible();
  await page.getByRole("button", { name: "먹이그물 만들기 →" }).click();
  await expect(page).toHaveURL(/#\/build$/);
});

test.describe("먹이그물 만들기", () => {
  async function placeByTap(page: Page, name: string, fx: number, fy: number) {
    const box = (await page.locator("svg.web").boundingBox())!;
    await page.locator(".tray-list .mini-card", { has: page.getByText(name, { exact: true }) }).click();
    await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
  }

  test("생산자 카드가 보관함 맨 위에 있어요 (F3-6)", async ({ page }) => {
    await page.goto("/#/build");
    const first4 = await page.locator(".tray-list .mini-card .role").evaluateAll((els) => els.slice(0, 4).map((e) => e.textContent));
    expect(first4.every((t) => t?.includes("생산자"))).toBe(true);
  });

  test("눌러서 놓기·잇기, 끌어서 잇기, 방향 반대 안내", async ({ page }) => {
    await page.goto("/#/build");
    await placeByTap(page, "풀", 0.2, 0.85);
    await placeByTap(page, "메뚜기", 0.2, 0.55);
    await placeByTap(page, "개구리", 0.45, 0.35);

    await page.locator('[data-node="forest.grass"]').click();
    await page.locator('[data-node="forest.grasshopper"]').click();
    await expect(feedback(page)).toContainText("메뚜기는 풀을 먹어요");

    const a = (await page.locator('[data-node="forest.grasshopper"] circle.bg').boundingBox())!;
    const b = (await page.locator('[data-node="forest.frog"] circle.bg').boundingBox())!;
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2 + 10, b.y + b.height / 2 + 10, { steps: 10 });
    await page.mouse.up();
    await expect(feedback(page)).toContainText("개구리는 메뚜기를 먹어요");

    await page.locator('[data-node="forest.frog"]').click();
    await page.locator('[data-node="forest.grasshopper"]').click();
    await expect(feedback(page)).toContainText("개구리가 메뚜기를 먹어요");
    await expect(page.locator(".progress")).toContainText("2 / 32");
  });

  test("힌트를 쓰면 별이 1개 줄고, 정리하기로 교과서 배치가 돼요", async ({ page }) => {
    await page.goto("/#/build");
    await placeByTap(page, "풀", 0.5, 0.2);
    await placeByTap(page, "메뚜기", 0.7, 0.7);
    await page.getByRole("button", { name: /힌트/ }).click();
    await expect(page.locator("svg.web line.hint")).toHaveCount(1);
    await expect(page.getByLabel("이번 판 별 2개")).toBeVisible();

    // 처음에는 풀이 메뚜기보다 위에 있음 → 정리하면 먹히는 생물(풀)이 아래로
    await page.getByRole("button", { name: /정리하기/ }).click();
    await page.waitForTimeout(500); // 이동 효과 0.4초
    const y = (id: string) => page.locator(`[data-node="${id}"]`).evaluate((g) => g.getBoundingClientRect().y);
    expect(await y("forest.grass")).toBeGreaterThan(await y("forest.grasshopper"));
  });
});
