// PRD 6.6 시뮬레이션 검증 테스트 (숲)
import { describe, expect, it } from "vitest";
import { forestChain, forestEvents, forestSpecies } from "../../src/data/forest";
import { calibrate, subWeb } from "../../src/engine/calibrate";
import { runScenario } from "../../src/engine/run";
import { judge, toDisplay } from "../../src/engine/scoring";
import { initialState } from "../../src/engine/simulate";

const model = calibrate(forestSpecies);
const event = (key: string) => forestEvents.find((e) => e.id === `forest.${key}`)!;
const idx = (key: string) => model.index[`forest.${key}`];
const run = (key: string, years = 8) => runScenario(model, years, [{ atYear: 0, event: event(key) }]);
const at = (series: number[][], year: number, key: string) => toDisplay(series[year][idx(key)]);

describe("무사건 안정성", () => {
  it("30년 동안 모든 생물이 100 ±2 안에 머물러요", () => {
    const { series } = runScenario(model, 30);
    for (const N of series) for (const v of N) expect(Math.abs(v * 100 - 100)).toBeLessThanOrEqual(2);
  });
});

describe("복원력", () => {
  it.each(forestSpecies.map((s, i) => [s.name, i] as const))("%s를 20 줄여도 30년 안에 모두 100 ±5로 돌아와요", (_, i) => {
    const start = initialState(model);
    start.N[i] = 0.8;
    const { series } = runScenario(model, 30, [], start);
    for (const v of series[30]) expect(Math.abs(v * 100 - 100)).toBeLessThanOrEqual(5);
  });
});

describe("같은 조건이면 늘 같은 결과 (F4-6)", () => {
  it("두 번 계산해도 똑같아요", () => {
    expect(run("frog-gone").series).toEqual(run("frog-gone").series);
  });
});

describe("교과서 정답 일치", () => {
  it("개구리가 사라지면 메뚜기는 늘고, 풀은 줄어요 (48쪽)", () => {
    const { series } = run("frog-gone");
    expect(at(series, 8, "frog")).toBe(0);
    expect(judge(at(series, 8, "grasshopper"))).toBe("up");
    expect(judge(at(series, 8, "grass"))).toBe("down");
  });

  it("개구리를 먹던 동물은 다른 먹이가 있어 사라지지 않아요 (49쪽)", () => {
    const { series } = run("frog-gone");
    for (const k of ["duck", "snake", "weasel", "falcon"]) expect(at(series, 8, k)).toBeGreaterThanOrEqual(75);
  });

  it("직박구리가 사라져도 뱀과 족제비는 다른 먹이를 먹고 버텨요 (49쪽)", () => {
    const { series } = run("bulbul-gone");
    expect(judge(at(series, 8, "snake"))).toBe("same");
    expect(judge(at(series, 8, "weasel"))).toBe("same");
  });

  it("분해자가 사라지면 생산자가 서서히 줄어요 (47쪽)", () => {
    const { series } = run("decomposer-gone");
    for (const k of ["grass", "clover", "cornus", "acorn"]) {
      expect(at(series, 1, k), `${k} 1년`).toBeGreaterThanOrEqual(95);
      expect(judge(at(series, 8, k)), `${k} 8년`).toBe("down");
    }
  });

  it("가뭄이 들면 생산자가 먼저 줄고, 먹는 동물은 늦게 영향을 받아요 (42쪽)", () => {
    const { series } = run("drought");
    for (const k of ["grass", "clover", "cornus"]) expect(judge(at(series, 2, k)), k).toBe("down");
    for (const k of ["snake", "weasel", "falcon"]) expect(judge(at(series, 2, k)), k).toBe("same");
  });

  it("먹이사슬보다 먹이그물에서 변화가 작아요 (49쪽)", () => {
    const chain = calibrate(subWeb(forestSpecies, forestChain));
    const c = runScenario(chain, 8, [{ atYear: 0, event: event("frog-gone") }]).series;
    const w = run("frog-gone").series;
    for (const k of ["grass", "grasshopper"]) {
      const chainChange = Math.abs(toDisplay(c[8][chain.index[`forest.${k}`]]) - 100);
      const webChange = Math.abs(at(w, 8, k) - 100);
      expect(chainChange, k).toBeGreaterThan(webChange);
    }
  });
});

describe("영향 원인 기록 (F4-7)", () => {
  it("개구리 사라짐: 사건 → 메뚜기(먹는 동물이 줄어서) → 풀(먹는 동물이 늘어서)", () => {
    const { causes } = run("frog-gone");
    expect(causes[0][idx("frog")]).toMatchObject({ kind: "event", eventId: "forest.frog-gone" });
    expect(causes[1][idx("grasshopper")]).toMatchObject({ change: "up", kind: "predator-down", via: "forest.frog" });
    expect(causes[2][idx("grass")]).toMatchObject({ change: "down", kind: "predator-up", via: "forest.grasshopper" });
  });

  it("분해자 사라짐: 생산자는 흙의 양분이 줄어서 줄어요", () => {
    const { causes } = run("decomposer-gone");
    expect(causes[2][idx("grass")]).toMatchObject({ change: "down", kind: "nutrient-down" });
  });

  it("가뭄: 생산자는 사건 때문에 줄어요", () => {
    const { causes } = run("drought");
    expect(causes[0][idx("grass")]).toMatchObject({ change: "down", kind: "event", eventId: "forest.drought" });
  });
});

describe("판정 (110 / 90)", () => {
  it("110보다 크면 늘어요, 90보다 작으면 줄어요", () => {
    expect([judge(111), judge(110), judge(100), judge(90), judge(89)]).toEqual(["up", "same", "same", "same", "down"]);
  });
});
