// PRD 6.6 출제 품질: 스테이지 질문이 애매하지 않고, 정답이 시뮬레이션과 맞는지
import { describe, expect, it } from "vitest";
import { forestStages } from "../../src/data/stages";
import { BANNED_WORDS } from "../../src/data/words";
import { applyAction, unavailableReason } from "../../src/engine/actions";
import { explainAll, influencePath } from "../../src/engine/explain";
import { runScenario } from "../../src/engine/run";
import { balanceStars, isAmbiguous, toDisplay } from "../../src/engine/scoring";
import { AFTER_YEARS, prepareStage } from "../../src/game/stage";

describe.each(forestStages.map((s) => [s.id, s] as const))("%s", (_, stage) => {
  const p = prepareStage(stage);
  const value = (id: string) => toDisplay(p.scenario.final.N[p.model.index[id]]);

  it("질문 1은 사건이 바로 건드리지 않은 생물이고, 답이 애매하지 않아요", () => {
    expect(p.event.targets).not.toContain(stage.q1);
    expect(isAmbiguous(p.q1Value), `${stage.q1} = ${p.q1Value}`).toBe(false);
  });

  it("질문 2는 보기 4개이고, 가장 크게 변한 생물이 뚜렷해요", () => {
    if (stage.compareChain) {
      expect(p.q2Answer).toBe("chain"); // 먹이사슬에서 변화가 더 큼
      return;
    }
    expect(stage.q2).toHaveLength(4);
    for (const id of stage.q2) expect(p.event.targets).not.toContain(id);
    const sizes = stage.q2.map((id) => Math.abs(value(id) - 100)).sort((a, b) => b - a);
    expect(sizes[0] - sizes[1], `보기 변화량 ${sizes}`).toBeGreaterThanOrEqual(5);
  });

  it("질문 3은 정답이 하나이고, 정답의 영향 길이 엔진 기록과 같아요", () => {
    expect(stage.q3).toHaveLength(3);
    const correct = stage.q3.filter((r) => r.correct);
    expect(correct).toHaveLength(1);
    if (correct[0].path) expect(influencePath(p.model, p.scenario, stage.q1).ids).toEqual(correct[0].path);
  });

  it("알맞은 관리인 행동 하나만 균형 별 3개를 받아요", () => {
    if (stage.compareChain) {
      expect(stage.actions).toHaveLength(0);
      return;
    }
    expect(stage.actions).toHaveLength(3);
    const stars = stage.actions
      .filter((a) => !unavailableReason(p.model, p.scenario.final, a))
      .map((a) => balanceStars(runScenario(p.model, AFTER_YEARS, [], applyAction(p.model, p.scenario.final, a, "test")).final.N));
    expect(stars.filter((s) => s === 3), `행동별 별 ${stars}`).toHaveLength(1);
    expect(stars.length).toBeGreaterThanOrEqual(2);
  });

  it("화면 문장에 4학년 범위 밖 용어와 교과서 쪽수가 없어요", () => {
    const texts = [stage.focus, stage.wrapUp, ...stage.q3.map((r) => r.text), ...stage.actions.flatMap((a) => [a.title, a.text])];
    texts.push(...explainAll(p.model, p.scenario, [p.event]).flatMap((e) => [e.title, e.text]));
    for (const t of texts) {
      for (const w of BANNED_WORDS) expect(t.includes(w), `"${t}"에 "${w}"`).toBe(false);
      expect(t).not.toMatch(/\d+\s*쪽/);
    }
  });
});

describe("설명 문장 (PRD 6.5)", () => {
  it("개구리 사라짐: 메뚜기·풀·오리 설명", () => {
    const p = prepareStage(forestStages[0]);
    const ex = new Map(explainAll(p.model, p.scenario, [p.event]).map((e) => [e.id, e]));
    expect(ex.get("forest.grasshopper")).toMatchObject({ title: "메뚜기가 늘었어요.", text: "메뚜기를 먹는 개구리가 사라졌기 때문이에요." });
    expect(ex.get("forest.grass")).toMatchObject({ title: "풀이 줄었어요.", text: "풀을 먹는 메뚜기가 늘었기 때문이에요." });
    expect(ex.has("forest.frog")).toBe(false); // 사건으로 바로 사라진 생물은 영향이 퍼진 길에서 보여 줌
  });

  it("먹이를 잃고도 버틴 생물: '○○이 사라졌지만 △△를 먹어서'", () => {
    const p = prepareStage(forestStages[1]);
    const weasel = explainAll(p.model, p.scenario, [p.event]).find((e) => e.id === "forest.weasel")!;
    expect(weasel.title).toBe("족제비는 비슷해요.");
    expect(weasel.text).toMatch(/^직박구리가 사라졌지만 .+ 먹어서 크게 줄지 않았어요\.$/);
  });
});
