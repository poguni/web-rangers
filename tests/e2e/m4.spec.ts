// M4 교실 기능: 번호 입력, 진단, 교사 화면·CSV, 데이터 지우기, 모둠 대항전, 교사 가이드
import { expect, test, type Page } from "@playwright/test";

const fits = (page: Page) => page.evaluate(() => document.documentElement.scrollHeight <= document.documentElement.clientHeight);
const noPageNumbers = async (page: Page) => expect(await page.locator("body").innerText()).not.toMatch(/\d+\s*(~\s*\d+\s*)?쪽/);

async function login(page: Page, g: number, c: number, n: number) {
  await page.goto("/#/");
  await page.getByLabel("학년").fill(String(g));
  await page.getByLabel("반").fill(String(c));
  await page.getByLabel("번호").fill(String(n));
  await page.getByRole("button", { name: /번으로 시작/ }).click();
}

async function pin(page: Page, digits: string) {
  for (const d of digits) await page.getByRole("button", { name: d, exact: true }).click();
}

test("시작: 번호를 쓰면 메인에 번호가 보이고, 학생 바꾸기로 돌아와요", async ({ page }) => {
  await page.goto("/#/stages"); // 번호를 쓰기 전에는 어느 주소든 시작 화면
  await expect(page.getByText("먹이그물 탐험대에 온 것을 환영해요!")).toBeVisible();
  await expect(page.getByRole("button", { name: "번호를 모두 써 주세요" })).toBeDisabled();
  expect(await fits(page)).toBe(true);
  await login(page, 4, 2, 13);
  await expect(page.getByText("4학년 2반 13번")).toBeVisible();
  expect(await fits(page)).toBe(true);
  await page.getByRole("button", { name: "학생 바꾸기" }).click();
  await expect(page.getByText("먹이그물 탐험대에 온 것을 환영해요!")).toBeVisible();
  await page.getByRole("button", { name: "손님으로 시작" }).click();
  await expect(page.locator(".appbar .pill")).toHaveText("👤 손님");
});

test("시작: 키보드로 차례로 쓰면 다음 칸으로 넘어가고, 범위 밖 수는 알려 줘요", async ({ page }) => {
  await page.goto("/#/");
  await expect(page.getByLabel("학년")).toBeFocused();
  await page.keyboard.type("4");
  await expect(page.getByLabel("반")).toBeFocused();
  await page.keyboard.type("2"); // 2 뒤에는 더 붙일 수 없으니(20반 없음) 바로 번호 칸으로
  await expect(page.getByLabel("번호")).toBeFocused();
  await page.keyboard.type("45");
  await expect(page.getByRole("status").filter({ hasText: "번호는 1부터 40까지" })).toBeVisible();
  await expect(page.getByRole("button", { name: "번호를 모두 써 주세요" })).toBeDisabled();
  await page.getByLabel("번호").fill("13");
  await page.keyboard.press("Enter");
  await expect(page.getByText("4학년 2반 13번")).toBeVisible();
});

test("시작: 작은 QR 코드를 누르면 가운데에 크게 나오고, 닫을 수 있어요", async ({ page }) => {
  await page.goto("/#/");
  await page.getByRole("button", { name: "접속 QR 코드 크게 보기" }).click();
  const dialog = page.getByRole("dialog", { name: "접속 QR 코드" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(new URL(page.url()).origin);
  expect((await dialog.locator("svg").boundingBox())!.width).toBeGreaterThan(250);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("사전 진단: 한 화면에 한 문항, 점수는 보여 주지 않고 다시 풀 수 없어요", async ({ page }) => {
  await login(page, 4, 2, 13);
  await page.getByRole("button", { name: /진단 문제/ }).click();
  await page.getByRole("button", { name: /사전 진단/ }).click();
  await expect(page.getByRole("button", { name: /읽어 주기/ })).toBeVisible();
  const next = page.getByRole("button", { name: "다음 →" });
  await expect(next).toBeDisabled(); // 답을 골라야 다음으로
  for (const answer of ["햇빛", "분해자", "🌿 풀 → 🦗 메뚜기", "한 가지 먹이가", "줄어요"]) {
    await page.locator(".diag-options .choice", { hasText: answer }).click();
    expect(await fits(page)).toBe(true);
    await noPageNumbers(page);
    await next.click();
  }
  await expect(page.getByText("5번에서 고른 답: 줄어요")).toBeVisible();
  const done = page.getByRole("button", { name: /다 풀었어요/ });
  await expect(done).toBeDisabled();
  await page.getByLabel("까닭 쓰기").fill("개구리가 없으면 메뚜기가 늘어서 풀을 많이 먹어요");
  await done.click();
  await expect(page.getByText("사전 진단을 다 풀었어요!")).toBeVisible();
  await expect(page.getByText(/점/)).toHaveCount(0); // 점수 없음
  await page.goto("/#/diag");
  await expect(page.getByRole("button", { name: /사전 진단/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: /사후 진단/ })).toBeEnabled();
});

test("교사: PIN을 정하고, 학생별 결과와 CSV를 확인해요", async ({ page }) => {
  // 학생 활동: 사전 진단(5번 틀림) + 사건 탐구 1 예측(모두 정답)
  await login(page, 4, 2, 13);
  await page.goto("/#/diag/pre");
  for (const answer of ["다람쥐", "분해자", "🌿 풀 → 🦗 메뚜기", "한 가지 먹이가", "늘어요"]) {
    await page.locator(".diag-options .choice", { hasText: answer }).click();
    await page.getByRole("button", { name: "다음 →" }).click();
  }
  await page.getByLabel("까닭 쓰기").fill("개구리가 풀을 안 먹어서, 그대로예요");
  await page.getByRole("button", { name: /다 풀었어요/ }).click();
  await page.goto("/#/stage/forest-1");
  await page.getByRole("button", { name: /사건 카드 열기/ }).click();
  await page.getByRole("button", { name: "줄어요", exact: true }).click();
  await page.getByRole("button", { name: "메뚜기", exact: true }).click();
  await page.locator(".reason").nth(1).click();
  await page.getByRole("button", { name: /예측 제출하고/ }).click();

  // 교사 메뉴: 처음에는 PIN 정하기(두 번), 다르게 넣으면 다시
  await page.goto("/#/teacher");
  await expect(page.getByText("교사 PIN 4자리를 정해 주세요")).toBeVisible();
  await pin(page, "1234");
  await pin(page, "1235");
  await expect(page.getByText("두 번 넣은 PIN이 달라요")).toBeVisible();
  await pin(page, "12341234");
  await expect(page.getByText("학생별 결과")).toBeVisible();

  const row = page.locator(".tbl tbody tr");
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("4-2-13");
  await expect(row).toContainText("3 → -");
  await expect(row).toContainText("개구리가 풀을 안 먹어서");
  await expect(row).toContainText("100%");
  await expect(page.getByText(/4-2-13 학생은 간접 효과 문항/)).toBeVisible();
  await noPageNumbers(page);

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /CSV 내보내기/ }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^먹이그물탐험대_결과_\d{8}\.csv$/);
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  for await (const c of await file.createReadStream()) chunks.push(c);
  const bytes = new Uint8Array(await new Blob(chunks).arrayBuffer());
  expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]); // 엑셀용 BOM
  const lines = new TextDecoder().decode(bytes).trimEnd().split("\r\n");
  expect(lines[0].startsWith("학년,반,번호,사전1")).toBe(true);
  expect(lines[1]).toContain('4,2,13,다람쥐,분해자');
  expect(lines[1]).toContain('"개구리가 풀을 안 먹어서, 그대로예요"');

  // 나가면 다시 잠기고, 틀린 PIN은 들어갈 수 없음
  await page.getByRole("button", { name: "처음 화면으로" }).click();
  await expect(page.getByText("4학년 2반 13번")).toBeVisible(); // 학생 화면으로 돌아온 뒤
  await page.goto("/#/teacher");
  await expect(page.getByText("교사 PIN 4자리를 넣어 주세요")).toBeVisible();
  await pin(page, "0000");
  await expect(page.getByText("PIN이 맞지 않아요")).toBeVisible();
  await pin(page, "1234");
  await expect(page.getByText("학생별 결과")).toBeVisible();
});

test("교사: 이 기기 데이터 지우기는 두 번 확인해요", async ({ page }) => {
  await login(page, 4, 2, 7);
  await page.goto("/#/teacher");
  await pin(page, "24682468");
  await expect(page.locator(".tbl tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "이 기기 데이터 모두 지우기" }).click();
  await expect(page.getByText(/정말 지울까요\? 학생 1명/)).toBeVisible();
  await page.getByRole("button", { name: "지우기", exact: true }).click();
  await expect(page.getByText(/되돌릴 수 없어요/)).toBeVisible();
  await page.getByRole("button", { name: "모두 지우기" }).click();
  await expect(page.getByText("아직 번호를 넣고 활동한 학생이 없어요.")).toBeVisible();
});

test("모둠 대항전: 답 가리기, 공개·관찰, 점수판, 최종 결과", async ({ page }) => {
  await page.goto("/#/teacher");
  await pin(page, "11111111");
  await page.getByRole("button", { name: /모둠 대항전/ }).click();
  await page.getByRole("button", { name: "4", exact: true }).click(); // 모둠 4개
  expect(await fits(page)).toBe(true);
  await page.getByRole("button", { name: /1라운드 시작/ }).click();

  // 라운드 정답: 직박구리 사라짐 → 개구리 ▲, 오랜 장마 → 풀 ●, 분해자 사라짐 → 메뚜기 ▼
  const rounds: ["늘어요" | "비슷해요" | "줄어요", string][] = [
    ["늘어요", "▲ 100 → 119"],
    ["비슷해요", "● 100 → 100"],
    ["줄어요", "▼ 100 → 80"],
  ];
  for (const [i, [right, chip]] of rounds.entries()) {
    await expect(page.getByRole("heading", { name: new RegExp(`${i + 1}라운드 / 3`) })).toBeVisible();
    expect(await fits(page)).toBe(true);
    await page.getByRole("button", { name: `1모둠 ${right}` }).click();
    await page.getByRole("button", { name: `2모둠 ${right === "늘어요" ? "줄어요" : "늘어요"}` }).click();
    await expect(page.getByText("✔ 입력 완료")).toHaveCount(2); // 고른 답은 숨김
    await expect(page.locator(".grp .sel")).toHaveCount(2);
    await page.getByRole("button", { name: /모두 공개하고 관찰하기/ }).click();
    for (let y = 0; y < 8; y++) await page.getByRole("button", { name: "1년 ⏭" }).click();
    await expect(page.locator(".target .chg")).toHaveText(chip);
    await expect(page.locator(".rv.ok")).toHaveText(new RegExp(`1모둠.*\\+100`));
    expect(await fits(page)).toBe(true);
    await noPageNumbers(page);
    await page.getByRole("button", { name: /점수판 보기/ }).click();
    await page.getByRole("button", { name: i < 2 ? /다음 라운드/ : /최종 결과 보기/ }).click();
  }
  await expect(page.getByRole("heading", { name: /1등 1모둠 — 300점/ })).toBeVisible();
  await expect(page.locator(".sb").first()).toContainText("300");

  // 새로 고침해도 점수판이 남아 있음
  await page.reload();
  await expect(page.getByRole("heading", { name: /1등 1모둠/ })).toBeVisible();
  await page.getByRole("button", { name: "새 대항전 준비" }).click();
  await expect(page.getByRole("heading", { name: /모둠 대항전 준비/ })).toBeVisible();
});

test("교사 가이드: 차시별 활용과 모델 한계, 교과서 쪽수 없음", async ({ page }) => {
  await page.goto("/#/guide");
  await pin(page, "12341234");
  await expect(page.getByRole("heading", { name: /1차시/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /시뮬레이션 모델의 한계/ })).toBeVisible();
  await noPageNumbers(page);
});
