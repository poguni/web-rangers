// M6: 도전 코드, 수업 코드, 파일럿 CSV 합치기·지표
import { describe, expect, it } from "vitest";
import { checkMark, makeChallenge, parseChallenge, verifyMark } from "../../src/game/challenge";
import { ACTIVITIES, makeLessonCode, parseLessonCode } from "../../src/game/lesson";
import { mergeCsv, parseCsv, pilotMetrics, toMergedCsv } from "../../src/game/pilot";
import { prepareRound } from "../../src/game/team";

describe("도전 코드 (F8-5)", () => {
  it("테마 숫자 + 세 자리: 같은 코드면 늘 같은 3라운드", () => {
    const code = makeChallenge("river", 42);
    expect(code).toBe("2042");
    const a = parseChallenge(code)!;
    expect(a.theme).toBe("river");
    expect(a.rounds).toHaveLength(3);
    expect(new Set(a.rounds.map((r) => r.eventId + r.target)).size).toBe(3); // 같은 라운드가 두 번 나오지 않음
    expect(parseChallenge(code)).toEqual(a);
    expect(a.rounds.map((r) => prepareRound(r).answer)).toEqual(parseChallenge("2042")!.rounds.map((r) => prepareRound(r).answer));
  });

  it("잘못된 코드는 받지 않아요", () => {
    for (const bad of ["", "123", "4123", "0123", "12a4", "12345"]) expect(parseChallenge(bad), bad).toBeNull();
  });

  it("확인 문자: 코드·모둠·점수가 하나라도 다르면 맞지 않아요", () => {
    const mark = checkMark("1234", 3, 200);
    expect(mark).toMatch(/^[가-힣]{3}$/);
    expect(verifyMark("1234", 3, 200, mark)).toBe(true);
    expect(verifyMark("1234", 3, 300, mark)).toBe(false);
    expect(verifyMark("1234", 2, 200, mark)).toBe(false);
    expect(verifyMark("1235", 3, 200, mark)).toBe(false);
  });
});

describe("오늘의 수업 코드 (F10-4)", () => {
  it("테마와 활동을 담았다가 그대로 꺼내요", () => {
    const code = makeLessonCode({ theme: "sea", activities: ["build", "stages"] });
    expect(code).toMatch(/^3\d{3}$/);
    expect(parseLessonCode(code)).toEqual({ theme: "sea", activities: ["build", "stages"] });
    const all = makeLessonCode({ theme: "forest", activities: [...ACTIVITIES] });
    expect(parseLessonCode(all)!.activities).toEqual([...ACTIVITIES]);
  });

  it("아무 숫자나 넣으면 대부분 맞지 않아요", () => {
    let valid = 0;
    for (let n = 1000; n < 4000; n++) if (parseLessonCode(String(n))) valid++;
    expect(valid).toBe(3 * 63); // 3000개 중 189개(약 6%)만 쓰이는 코드
  });
});

const HEAD = "학년,반,번호,사전5,사전점수,사후5,사후6,사후점수,첫탐구정답,마지막탐구정답,숲그물완성,숲방향오류,숲잇기시도";
describe("파일럿 결과 모아 보기", () => {
  it("따옴표 안의 쉼표·줄바꿈과 BOM까지 읽어요", () => {
    expect(parseCsv('﻿가,나\r\n"1,2","그는 ""좋아""\n라고"\r\n')).toEqual([
      ["가", "나"],
      ["1,2", '그는 "좋아"\n라고'],
    ]);
  });

  it("여러 기기 파일을 학생 번호로 합치고, 겹치면 기록이 많은 쪽을 써요", () => {
    const a = { name: "기기1.csv", text: `${HEAD}\r\n4,2,13,늘어요,3,,,,,,1,2,30\r\n4,2,2,줄어요,4,,,,,,,,\r\n` };
    const b = { name: "기기2.csv", text: `${HEAD}\r\n4,2,13,늘어요,3,줄어요,"게가 늘어, 미역이 줄어요",5,1,3,1,2,30\r\n` };
    const junk = { name: "메모.csv", text: "이름,점수\r\n철수,3\r\n" };
    const m = mergeCsv([a, b, junk]);
    expect(m.rows.map((r) => `${r["학년"]}-${r["반"]}-${r["번호"]}`)).toEqual(["4-2-2", "4-2-13"]);
    expect(m.duplicates).toEqual(["4-2-13"]);
    expect(m.skipped).toEqual(["메모.csv"]);
    expect(m.rows[1]["사후6"]).toBe("게가 늘어, 미역이 줄어요");
    expect(toMergedCsv(m).split("\r\n")[2]).toContain('"게가 늘어, 미역이 줄어요"');

    const g = pilotMetrics(m.rows);
    expect(g).toMatchObject({ students: 2, preAvg: 3.5, postAvg: 5, indirectPre: 0.5, indirectPost: 1, buildDone: 1, firstPredict: 1 / 3, lastPredict: 1 });
    expect(g.reversedRate).toBeCloseTo(2 / 30);
  });
});
