// M6: 도전 코드형 대항전, 오늘의 수업 코드, 실험 기록장, 먹이사슬 찾기·그림 저장, 파일럿 결과 모아 보기
import { expect, test, type Page } from "@playwright/test";
import { forestSpecies } from "../../src/data/forest";
import { relationsOf } from "../../src/game/build";
import { checkMark, parseChallenge } from "../../src/game/challenge";
import { prepareRound } from "../../src/game/team";

const fits = (page: Page) => page.evaluate(() => document.documentElement.scrollHeight <= document.documentElement.clientHeight);
const pin = async (page: Page, digits: string) => {
  for (const d of digits) await page.getByRole("button", { name: d, exact: true }).click();
};
const typeCode = async (page: Page, code: string) => {
  for (const d of code) await page.getByRole("button", { name: `코드 ${d}` }).click();
};
const ANSWER_TEXT = { up: "늘어요", down: "줄어요", same: "비슷해요" } as const;

test.beforeEach(({ page }) => page.addInitScript(() => sessionStorage.setItem("webrangers.v1.current", "4-2-13")));

test("도전 코드: 교사가 만든 코드로 3라운드를 풀고, 확인 문자로 점수를 검증해요", async ({ page }) => {
  await page.goto("/#/tools");
  await pin(page, "12341234");
  await page.getByRole("group", { name: "도전 테마" }).getByRole("button", { name: "강" }).click();
  await page.getByRole("button", { name: "도전 코드 만들기" }).click();
  const code = (await page.getByLabel(/^도전 코드 \d{4}$/).getAttribute("aria-label"))!.slice(-4);
  expect(code[0]).toBe("2"); // 강

  // 모둠 대표 크롬북: 틀린 코드는 받지 않음
  await page.goto("/#/challenge");
  await typeCode(page, "9999");
  await page.getByRole("button", { name: "3모둠" }).click();
  await page.getByRole("button", { name: /도전 시작/ }).click();
  await expect(page.getByRole("alert")).toContainText("코드가 맞지 않아요");
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "지우기" }).click();
  await typeCode(page, code);
  await page.getByRole("button", { name: /도전 시작/ }).click();

  // 1·2라운드는 정답, 3라운드는 일부러 틀림 → 200점
  const answers = parseChallenge(code)!.rounds.map((r) => prepareRound(r).answer);
  for (const [i, right] of answers.entries()) {
    await expect(page.locator(".appbar .pill")).toHaveText(`${i + 1}라운드 / 3`);
    expect(await fits(page)).toBe(true);
    const pick = i < 2 ? right : right === "up" ? "down" : "up";
    await page.getByRole("button", { name: ANSWER_TEXT[pick], exact: true }).click();
    await page.getByRole("button", { name: /답 정하고/ }).click();
    for (let y = 0; y < 8; y++) await page.getByRole("button", { name: "1년 ⏭" }).click();
    await page.getByRole("button", { name: /정답 확인/ }).click();
    await expect(page.getByRole("heading", { name: i < 2 ? /맞았어요/ : /아쉬워요/ })).toBeVisible();
    await page.getByRole("button", { name: /다음 라운드|결과 보기/ }).click();
  }
  const mark = checkMark(code, 3, 200);
  await expect(page.getByText("200점", { exact: true })).toBeVisible();
  await expect(page.getByLabel(`확인 문자 ${mark}`)).toBeVisible();

  // 교사: 점수와 확인 문자 넣기. 점수를 부풀리면 맞지 않음
  await page.goto("/#/tools"); // 이번 브라우저에서 이미 연 교사 메뉴는 열려 있음
  await page.getByLabel("3모둠 점수").selectOption("300");
  await page.getByLabel("3모둠 확인 문자").fill(mark);
  await expect(page.getByText("✕ 다시 확인")).toBeVisible();
  await page.getByLabel("3모둠 점수").selectOption("200");
  await expect(page.getByText("✔ 맞아요")).toBeVisible();
  await expect(page.getByLabel("도전 순위")).toContainText("3모둠");
  await page.reload(); // 새로 고침해도 코드와 넣은 점수가 남음
  await expect(page.getByLabel(`도전 코드 ${code}`)).toBeVisible();
  await expect(page.getByText("✔ 맞아요")).toBeVisible();
});

test("오늘의 수업 코드: 고른 테마·활동만 열리고, 교사가 끌 수 있어요", async ({ page }) => {
  await page.goto("/#/tools");
  await pin(page, "12341234");
  await page.getByRole("group", { name: "수업 테마" }).getByRole("button", { name: "바다" }).click();
  await page.getByRole("group", { name: "열 활동" }).getByRole("button", { name: "사건 탐구" }).click(); // 기본(먹이그물·사건 탐구)에서 사건 탐구 끔
  const code = (await page.getByLabel(/^수업 코드 \d{4}$/).getAttribute("aria-label"))!.slice(-4);

  await page.goto("/#/");
  await page.getByRole("button", { name: /수업 코드 넣기/ }).click();
  await typeCode(page, "1000");
  await expect(page.getByText("코드가 맞지 않아요")).toBeVisible();
  await typeCode(page, code);
  await expect(page.getByText(/오늘의 수업: 바다 · 먹이그물 만들기/)).toBeVisible();
  await expect(page.getByRole("button", { name: /사건 탐구/ })).toBeDisabled();
  await expect(page.getByRole("group", { name: "테마" }).getByRole("button", { name: /^숲/ })).toBeDisabled();
  expect(await fits(page)).toBe(true);
  await page.getByRole("button", { name: /먹이그물 만들기/ }).click();
  await expect(page.getByText("바다 › 먹이그물 만들기")).toBeVisible();

  await page.goto("/#/tools");
  await page.getByRole("button", { name: "이 기기 수업 코드 끄기" }).click();
  await page.goto("/#/");
  await expect(page.getByRole("button", { name: /사건 탐구/ })).toBeEnabled();
});

test("실험 기록장: 실험 결과를 메모와 함께 남기고 지울 수 있어요", async ({ page }) => {
  await page.goto("/#/lab/forest");
  await page.locator('[data-node="forest.frog"]').click();
  await page.getByRole("button", { name: /없애기/ }).click();
  await page.getByRole("button", { name: /실험 시작/ }).click();
  await page.getByLabel("실험 메모").fill("개구리가 없으면 풀이 줄어요");
  await page.getByRole("button", { name: /기록장에 남기기/ }).click();
  await expect(page.getByRole("button", { name: "✔ 남겼어요" })).toBeDisabled();
  await page.getByRole("button", { name: "📒 기록장 1" }).click();
  const book = page.getByRole("dialog", { name: "실험 기록장" });
  await expect(book).toContainText("개구리 없애기 · 8년");
  await expect(book).toContainText("애벌레 ▲ 136");
  await expect(book).toContainText("개구리가 없으면 풀이 줄어요");
  await book.getByRole("button", { name: "이 기록 지우기" }).click();
  await expect(book).toContainText("아직 남긴 실험이 없어요");
});

test("먹이그물 완성 → 먹이사슬 3개 찾기 → 그림 저장, 시도 기록이 파일럿 결과에 들어가요", async ({ page }) => {
  await page.goto("/#/build/forest");
  const board = page.locator("svg.web");
  const box = (await board.boundingBox())!; // 화면 크기마다 판 크기가 달라 비율로 자리를 정함
  for (let i = 0; i < 14; i++) {
    await page.locator(".mini-card").first().click();
    await board.click({ position: { x: box.width * (0.1 + (i % 5) * 0.15), y: box.height * (0.12 + Math.floor(i / 5) * 0.25) } });
  }
  await expect(page.locator(".mini-card")).toHaveCount(0);
  await page.getByRole("button", { name: /정리하기/ }).click();
  await page.locator('[data-node="forest.grasshopper"]').click(); // 방향을 반대로 이은 시도 1번
  await page.locator('[data-node="forest.grass"]').click();
  const done = page.getByRole("dialog", { name: "먹이그물 완성" });
  for (const r of relationsOf(forestSpecies)) {
    await page.locator(`[data-node="${r.from}"]`).click();
    await page.locator(`[data-node="${r.to}"]`).click();
    if (await done.isVisible()) await done.getByRole("button", { name: /더 찾아보기/ }).click(); // 26개(80%)에서 완성 창
  }

  await page.getByRole("button", { name: /먹이사슬 찾기/ }).click();
  const say = page.locator('[role="status"] .toast');
  await page.locator('[data-node="forest.frog"]').click();
  await expect(say).toContainText("생산자부터 시작해요");
  const chains = [
    ["grass", "grasshopper", "frog"],
    ["acorn", "squirrel", "snake"],
    ["clover", "caterpillar", "bulbul"],
  ];
  for (const c of chains) {
    for (const k of c) await page.locator(`[data-node="forest.${k}"]`).click();
    await page.getByRole("button", { name: "여기서 마치기" }).click();
  }
  await expect(say).toContainText("먹이사슬 3개를 모두 찾았어요");
  await expect(page.locator(".edge.chain")).toHaveCount(6);
  expect(await fits(page)).toBe(true);

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /그림 저장/ }).click();
  expect((await download).suggestedFilename()).toBe("먹이그물_숲_4-2-13.png");

  // 화면을 나가면 시도가 기록되고, 파일럿 결과에 완성·방향 오류가 들어감
  await page.goto("/#/pilot");
  await pin(page, "12341234");
  await page.getByRole("button", { name: "이 기기 결과도 넣기" }).click();
  const row = (label: string) => page.locator("tr", { hasText: label });
  await expect(row("먹이그물 완성(숲)")).toContainText("100%");
  await expect(row("먹이그물 완성(숲)")).toContainText("○ 달성");
  await expect(row("마지막 시도 화살표 방향 오류(숲)")).toContainText("3%"); // 33번 중 1번
});
