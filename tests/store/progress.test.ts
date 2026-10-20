// F2-3 카드 보상: 먹이그물 완성·별·예측 연속 정답
import { beforeEach, describe, expect, it } from "vitest";
import { nextCards } from "../../src/game/cards";
import { useProgress } from "../../src/store/progress";

const s = () => useProgress.getState();
const cards = () => s().students["4-2-13"].cards;

describe("카드 보상", () => {
  beforeEach(() => {
    s().clearAll();
    s().login("4-2-13");
  });

  it("다음 카드는 테마 순서대로(생산자부터), 외래종 카드는 빼고", () => {
    expect(nextCards([], "river", 3)).toEqual(["river.closterium", "river.hornwort", "river.cattail"]);
    expect(nextCards(["river.closterium"], "river", 1)).toEqual(["river.hornwort"]);
    expect(nextCards([], "river", 99)).not.toContain("river.bass");
  });

  it("먹이그물 완성처럼 n장을 주고, 이미 있는 카드는 다시 주지 않아요", () => {
    expect(s().grant({ theme: "sea", n: 2 })).toEqual(["sea.phytoplankton", "sea.wakame"]);
    expect(s().grant(["sea.wakame", "sea.hijiki"])).toEqual(["sea.hijiki"]);
    expect(cards()).toEqual(["sea.phytoplankton", "sea.wakame", "sea.hijiki"]);
  });

  it("별을 더 얻은 만큼만 카드를 줘요", () => {
    expect(s().recordStage("forest-1", "forest", 2, 400)).toHaveLength(2);
    expect(s().recordStage("forest-1", "forest", 1, 300)).toHaveLength(0); // 별이 줄면 없음
    expect(s().recordStage("forest-1", "forest", 3, 500)).toHaveLength(1);
    expect(s().students["4-2-13"].stages["forest-1"]).toEqual({ stars: 3, best: 500 });
  });

  it("예측 3번 연속 정답마다 카드 1장, 틀리면 다시 셈", () => {
    expect(s().recordPredictions("forest-1", "forest", [true, true, false])).toHaveLength(0);
    expect(s().recordPredictions("forest-2", "forest", [true, true, true])).toHaveLength(1);
    expect(s().students["4-2-13"].streak).toBe(0);
    expect(s().recordPredictions("forest-3", "forest", [true, true, false])).toHaveLength(0);
    expect(s().students["4-2-13"].streak).toBe(0);
  });
});
