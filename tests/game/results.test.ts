// F10-2·F10-3 교사 결과 요약과 CSV
import { describe, expect, it } from "vitest";
import { needsReview, sortedStudents, studentRow, summary, toCsv } from "../../src/game/results";
import type { StudentRecord } from "../../src/store/progress";

const at = "2026-10-20T01:30:00.000Z";
const rec = (key: string, extra: Partial<StudentRecord> = {}): StudentRecord => ({ key, cards: [], streak: 0, builds: [], notes: [], stages: {}, predictions: [], diagnostic: {}, ...extra });

const students: Record<string, StudentRecord> = {
  "4-2-13": rec("4-2-13", {
    stages: { "forest-1": { stars: 3, best: 500 } },
    predictions: [
      { stageId: "forest-1", q: 1, correct: true, at },
      { stageId: "forest-1", q: 2, correct: true, at },
      { stageId: "forest-1", q: 3, correct: false, at },
    ],
    diagnostic: {
      pre: { answers: [1, 2, 0, 0, 0, "풀을 안 먹어서"], score: 4, at },
      post: { answers: [2, 2, 1, 1, 1, '갈매기가 없어지면 게가 많아져서, "미역"이 줄어요'], score: 5, at },
    },
  }),
  "4-2-2": rec("4-2-2", { diagnostic: { pre: { answers: [0, 0, 1, 1, 1, "몰라요"], score: 1, at } } }),
  guest: rec("guest", { stages: { "forest-2": { stars: 1, best: 100 } } }),
};

describe("교사 결과", () => {
  it("손님은 빼고 학년-반-번호 순서로 정렬해요", () => {
    expect(sortedStudents(students).map((r) => r.key)).toEqual(["4-2-2", "4-2-13"]);
  });

  it("학생별 요약: 진단 점수, 간접 효과 문항, 까닭 쓰기, 예측 정답", () => {
    const row = studentRow(students["4-2-13"]);
    expect(row).toMatchObject({ pre: 4, post: 5, indirectPre: false, indirectPost: true, stagesDone: 1, stars: 3, predictCorrect: 2, predictTotal: 3 });
    expect(row.why).toContain("게가 많아져서");
    expect(studentRow(students["4-2-2"])).toMatchObject({ pre: 1, post: undefined, indirectPre: true, why: "몰라요" });
  });

  it("전체 요약과 다시 볼 학생", () => {
    const rows = sortedStudents(students).map(studentRow);
    expect(summary(rows)).toMatchObject({ students: 2, preAvg: 2.5, postAvg: 5, indirectPre: 0.5, indirectPost: 1 });
    expect(needsReview(rows)).toEqual([]); // 4-2-13은 사후에 맞힘, 4-2-2는 사전에 맞힘
    expect(needsReview([{ ...rows[1], indirectPost: false }])).toEqual(["4-2-13"]);
  });

  it("CSV: 같은 머리글, 학생 한 줄씩, 쉼표·따옴표는 따옴표로 감쌈", () => {
    const lines = toCsv(students).trimEnd().split("\r\n");
    expect(lines).toHaveLength(3);
    expect(lines[0].split(",").slice(0, 4)).toEqual(["학년", "반", "번호", "사전1"]);
    expect(lines[0]).toContain("사후점수");
    expect(lines[0]).toContain("숲5별");
    expect(lines[1].startsWith("4,2,2,다람쥐,생산자,")).toBe(true);
    expect(lines[2]).toContain('"갈매기가 없어지면 게가 많아져서, ""미역""이 줄어요"');
    expect(lines[2]).toContain("물,분해자,🌿 미역 → 🦀 게");
    expect(lines[0]).toContain("숲5별,강1별,강2별,강3별,바다1별,바다2별,바다3별");
    expect(lines[2].endsWith(",3,,,,,,,,,,,2,3" + ",".repeat(11))).toBe(true); // 숲1 별 3, 나머지 10칸 빈칸, 예측 2/3, 첫·마지막 탐구와 먹이그물 칸은 비어 있음
    expect(lines[0].endsWith("첫탐구정답,마지막탐구정답,숲그물완성,숲방향오류,숲잇기시도,강그물완성,강방향오류,강잇기시도,바다그물완성,바다방향오류,바다잇기시도")).toBe(true);
  });

  it("파일럿 칸: 마지막 먹이그물 시도, 한 번이라도 완성, 첫·마지막 탐구 예측 정답", () => {
    const later = "2026-10-21T01:30:00.000Z";
    const r = rec("4-2-1", {
      builds: [
        { theme: "forest", at, ok: 26, reversed: 5, wrong: 3, total: 32, done: true, hints: 1 },
        { theme: "forest", at: later, ok: 10, reversed: 1, wrong: 0, total: 32, done: false, hints: 0 },
      ],
      predictions: [
        { stageId: "forest-1", q: 1, correct: false, at },
        { stageId: "forest-1", q: 2, correct: true, at },
        { stageId: "forest-1", q: 3, correct: false, at },
        { stageId: "forest-2", q: 1, correct: true, at: later },
        { stageId: "forest-2", q: 2, correct: true, at: later },
        { stageId: "forest-2", q: 3, correct: true, at: later },
      ],
    });
    const line = toCsv({ "4-2-1": r }).trimEnd().split("\r\n")[1];
    expect(line.endsWith(",4,6,1,3,1,1,11,,,,,,")).toBe(true); // 예측 4/6, 첫 1 → 마지막 3, 숲 완성 1·방향 오류 1·시도 11
  });
});
