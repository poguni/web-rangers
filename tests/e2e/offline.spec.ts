// PRD 11장 오프라인: 배포판을 한 번 열면 인터넷이 끊겨도 글꼴까지 그대로 쓸 수 있는지(배포판 미리보기 서버 4173)
import { expect, test } from "@playwright/test";

test("한 번 접속한 뒤에는 인터넷 없이도 열려요", async ({ page, context }, info) => {
  test.skip(info.project.name !== "chromebook-1280x690", "서비스 워커 동작은 한 화면 크기에서만 확인");
  await page.goto("http://localhost:4173/");
  await page.evaluate(() => navigator.serviceWorker.ready); // 설치 = 모든 파일 저장 완료
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText("탐험대원 번호를 써 주세요")).toBeVisible();
  await page.getByRole("button", { name: "손님으로 시작" }).click();
  await page.getByRole("button", { name: /먹이그물 만들기/ }).click();
  await expect(page.locator(".web")).toBeVisible();
  // 처음 화면에서 쓰지 않은 글자(한글 글꼴 조각)도 저장되어 있어 글꼴이 바뀌지 않음
  const ok = await page.evaluate(async () => {
    await document.fonts.load('20px "Jua"', "쀍");
    return document.fonts.check('20px "Jua"', "쀍");
  });
  expect(ok).toBe(true);
});
