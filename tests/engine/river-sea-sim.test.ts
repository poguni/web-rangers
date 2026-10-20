// PRD 6.6 시뮬레이션 검증 테스트 (강·바다)
import { describe, expect, it } from "vitest";
import { riverBass, riverEvents } from "../../src/data/river";
import { seaEvents } from "../../src/data/sea";
import type { Theme } from "../../src/data/types";
import { applyAction } from "../../src/engine/actions";
import { runScenario } from "../../src/engine/run";
import { judge, toDisplay } from "../../src/engine/scoring";
import { initialState } from "../../src/engine/simulate";
import { modelFor } from "../../src/game/stage";

describe.each(["river", "sea"] as Theme[])("%s 안정성", (theme) => {
  const model = modelFor(theme);
  it("사건이 없으면 30년 동안 모든 생물이 100 ±2 안에 머물러요", () => {
    for (const N of runScenario(model, 30).series) for (const v of N) expect(Math.abs(v * 100 - 100)).toBeLessThanOrEqual(2);
  });
  it("어느 생물을 20 줄여도 30년 안에 모두 100 ±5로 돌아와요", () => {
    model.species.forEach((s, i) => {
      const start = initialState(model);
      start.N[i] = 0.8;
      for (const v of runScenario(model, 30, [], start).series[30]) expect(Math.abs(v * 100 - 100), s.name).toBeLessThanOrEqual(5);
    });
  });
});

const run = (theme: Theme, id: string) => {
  const event = [...riverEvents, ...seaEvents].find((e) => e.id === id)!;
  const model = modelFor(theme, undefined, [event]);
  const scenario = runScenario(model, 8, [{ atYear: 0, event }]);
  return { model, scenario, v: (key: string) => toDisplay(scenario.final.N[model.index[`${theme}.${key}`]]) };
};

describe("강 학습 포인트 (PRD 5.2)", () => {
  it("왜가리가 사라지면 붕어가 늘어 붕어마름이 줄어요", () => {
    const { v } = run("river", "river.heron-gone");
    expect(judge(v("crucian"))).toBe("up");
    expect(judge(v("hornwort"))).toBe("down");
  });
  it("강물이 더러워지면 깨끗한 물에 사는 다슬기부터 크게 줄어요", () => {
    const { v, scenario, model } = run("river", "river.pollution");
    expect(toDisplay(scenario.series[1][model.index["river.melania"]])).toBeLessThan(80);
    expect(judge(v("melania"))).toBe("down");
  });
  it("큰입배스가 들어오면 붕어·송사리가 줄고 배스는 사라지지 않아요", () => {
    const { v } = run("river", "river.bass");
    expect(judge(v("crucian"))).toBe("down");
    expect(judge(v("medaka"))).toBe("down");
    expect(v("bass")).toBeGreaterThan(30);
  });
});

describe("바다 학습 포인트 (PRD 5.2)", () => {
  it("바다거북이 줄면 해파리가 늘어요", () => {
    expect(judge(run("sea", "sea.turtle-fewer").v("jellyfish"))).toBe("up");
  });
  it("고등어를 많이 잡으면 고등어를 먹는 돌고래가 줄어요", () => {
    expect(judge(run("sea", "sea.overfish").v("dolphin"))).toBe("down");
  });
  it("바닷물이 따뜻해지면 미역·톳이 줄고 게도 줄어요", () => {
    const { v } = run("sea", "sea.warm");
    expect(judge(v("wakame"))).toBe("down");
    expect(judge(v("crab"))).toBe("down");
  });
});

describe("외래종", () => {
  const event = riverEvents.find((e) => e.id === "river.bass")!;
  const model = modelFor("river", undefined, [event]);
  const bass = model.index[riverBass.id];

  it("들어오기 전에는 없고, 다른 생물의 균형도 흔들지 않아요", () => {
    const { series } = runScenario(model, 30);
    for (const N of series) {
      expect(N[bass]).toBe(0);
      for (const [i, v] of N.entries()) if (i !== bass) expect(Math.abs(v * 100 - 100)).toBeLessThanOrEqual(2);
    }
  });

  it("외래종 잡기는 큰입배스를 절반으로 줄여요", () => {
    const { final } = runScenario(model, 8, [{ atYear: 0, event }]);
    const after = applyAction(model, final, { type: "remove-invasive", title: "", text: "", image: "", targets: [] }, "action:catch");
    expect(after.N[bass]).toBeCloseTo(final.N[bass] / 2);
  });
});
