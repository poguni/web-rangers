// F8 모둠 대항전 출제 품질: 정답이 애매하지 않고, 사건 탐구와 같은 질문을 다시 내지 않는지
import { describe, expect, it } from "vitest";
import { allStages } from "../../src/data/stages";
import { teamRounds } from "../../src/data/team";
import { isAmbiguous } from "../../src/engine/scoring";
import { prepareRound, ranking } from "../../src/game/team";

describe.each(Object.values(teamRounds).flat().map((r) => [`${r.eventId} → ${r.target}`, r] as const))("%s", (_, round) => {
  const p = prepareRound(round);

  it("질문 생물은 사건이 바로 건드리지 않았고, 답이 애매하지 않아요", () => {
    expect(p.event.targets).not.toContain(round.target);
    expect(isAmbiguous(p.value), `${round.target} = ${p.value}`).toBe(false);
  });

  it("사건 탐구에서 같은 사건·같은 생물로 묻지 않았어요", () => {
    expect(allStages.some((s) => s.eventId === round.eventId && s.q1 === round.target)).toBe(false);
  });
});

describe("모둠 대항전 라운드", () => {
  it.each(Object.entries(teamRounds))("%s: 5라운드까지 할 수 있고, 답이 한쪽으로 몰리지 않아요", (_, rounds) => {
    expect(rounds.length).toBeGreaterThanOrEqual(5);
    const answers = new Set(rounds.slice(0, 3).map((r) => prepareRound(r).answer));
    expect(answers.size).toBe(3); // 3라운드만 해도 ▲·▼·● 정답이 모두 나옴
  });

  it("점수판 순위: 같은 점수는 같은 순위예요", () => {
    const r = ranking(["1모둠", "2모둠", "3모둠"], [
      [100, 0, 100],
      [0, 0, 100],
    ]);
    expect(r.map((x) => [x.name, x.total, x.rank])).toEqual([
      ["3모둠", 200, 1],
      ["1모둠", 100, 2],
      ["2모둠", 0, 3],
    ]);
    expect(ranking(["가", "나"], [[100, 100]]).map((x) => x.rank)).toEqual([1, 1]);
  });
});
