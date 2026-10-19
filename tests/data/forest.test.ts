// PRD 6.6 데이터 검증·어휘 검사, 5.4 교과서 49쪽 대조표 일치
import { describe, expect, it } from "vitest";
import { forestChain, forestEvents, forestSpecies } from "../../src/data/forest";
import { sortCards } from "../../src/data/sort";
import { BANNED_WORDS } from "../../src/data/words";
import { calibrate } from "../../src/engine/calibrate";

// PRD 5.4 대조표(교사 확인 완료): 먹히는 생물 → 먹는 생물
const TEXTBOOK_49 = [
  "풀→메뚜기", "메뚜기→개구리", "메뚜기→오리", "개구리→오리", "오리→매", "오리→족제비",
  "풀→오리", "풀→토끼", "토끼풀→토끼", "토끼풀→애벌레", "산수유→애벌레", "산수유→직박구리",
  "도토리→다람쥐", "메뚜기→직박구리", "애벌레→개구리", "애벌레→직박구리", "애벌레→오리",
  "개구리→뱀", "개구리→족제비", "다람쥐→뱀", "다람쥐→매", "다람쥐→족제비",
  "직박구리→뱀", "직박구리→매", "직박구리→족제비", "토끼→매", "토끼→족제비", "뱀→매",
  "토끼풀→오리", "메뚜기→족제비", "개구리→매", "토끼→뱀",
];

const byId = new Map(forestSpecies.map((s) => [s.id, s]));

describe("숲 데이터 (교과서 49쪽)", () => {
  it("생산자 4, 소비자 10, 분해자 2 = 16종", () => {
    const count = (role: string) => forestSpecies.filter((s) => s.role === role).length;
    expect(forestSpecies).toHaveLength(16);
    expect([count("producer"), count("consumer"), count("decomposer")]).toEqual([4, 10, 2]);
    expect(new Set(forestSpecies.map((s) => s.id)).size).toBe(16);
  });

  it("먹이 관계 32개가 교과서 대조표와 똑같아요", () => {
    const edges = forestSpecies.flatMap((s) => s.prey.map((p) => `${byId.get(p.id)!.name}→${s.name}`));
    expect(edges).toHaveLength(32);
    expect([...edges].sort()).toEqual([...TEXTBOOK_49].sort());
  });

  it("모든 소비자는 먹이가 있고, 선호도 합은 1이에요", () => {
    for (const s of forestSpecies) {
      if (s.role !== "consumer") {
        expect(s.prey, s.name).toHaveLength(0);
        continue;
      }
      expect(s.prey.length, s.name).toBeGreaterThan(0);
      for (const p of s.prey) expect(byId.has(p.id), `${s.name}의 먹이 ${p.id}`).toBe(true);
      expect(s.prey.reduce((sum, p) => sum + p.preference, 0), s.name).toBeCloseTo(1, 9);
    }
  });

  it("자동 보정: 사망률 > 0, 생산자는 먹히는 양보다 잘 자라요", () => {
    const model = calibrate(forestSpecies);
    for (const j of model.consumers) expect(model.m[j], forestSpecies[j].name).toBeGreaterThan(0);
    for (const i of model.producers) {
      const eaten = model.consumers.reduce((sum, j) => sum + model.a[i][j], 0);
      expect(eaten, forestSpecies[i].name).toBeLessThan(model.r[i]);
    }
  });

  it("그림 경로는 public/img/forest/forest-<이름> 규칙을 따라요", () => {
    for (const s of forestSpecies) expect(s.image).toMatch(/^img\/forest\/forest-[a-z]+$/);
    for (const e of forestEvents) expect(e.image).toMatch(/^img\/event\/event-forest-[a-z-]+$/);
  });

  it("사건 카드는 6장 이상이고, 대상이 먹이그물에 있어요", () => {
    expect(forestEvents.length).toBeGreaterThanOrEqual(6);
    for (const e of forestEvents) {
      for (const t of e.targets) if (!t.startsWith("role:")) expect(byId.has(t), `${e.title}: ${t}`).toBe(true);
      expect(e.story.split(/[.!?]\s*/).filter(Boolean).length, e.title).toBeLessThanOrEqual(2);
    }
  });

  it("먹이사슬 비교용 생물이 먹이그물 안의 한 줄이에요", () => {
    for (let k = 1; k < forestChain.length; k++) {
      expect(byId.get(forestChain[k])!.prey.some((p) => p.id === forestChain[k - 1])).toBe(true);
    }
  });

  it("화면 문장에 4학년 범위 밖 용어가 없어요", () => {
    const texts = [
      ...forestSpecies.flatMap((s) => [s.name, s.habitat, s.fact]),
      ...forestEvents.flatMap((e) => [e.title, e.story, e.realCase ?? ""]),
    ];
    for (const t of texts) for (const w of BANNED_WORDS) expect(t.includes(w), `"${t}"에 "${w}"`).toBe(false);
  });

  it("화면 문장에 교과서 쪽수가 없어요(학교마다 교과서가 다름)", () => {
    const texts = [
      ...forestSpecies.flatMap((s) => [s.name, s.habitat, s.fact]),
      ...forestEvents.flatMap((e) => [e.title, e.story, e.realCase ?? ""]),
      ...sortCards.flatMap((c) => [c.name, c.how]),
    ];
    for (const t of texts) expect(t, t).not.toMatch(/\d+\s*쪽/);
  });
});
