// PRD 6.5 설명 문장 생성과 "영향이 퍼진 길"(F4-7 원인 기록을 거꾸로 따라감)
import type { EventCard } from "../data/types";
import { josa } from "../utils/korean";
import type { Model } from "./calibrate";
import type { Scenario } from "./run";
import { judge, toDisplay } from "./scoring";
import type { Cause } from "./simulate";

export type Change = "up" | "down" | "same" | "gone";

export function changeOf(n: number): Change {
  return n === 0 ? "gone" : judge(toDisplay(n));
}

/** 한 생물이 처음부터 마지막 해까지 바뀐 가장 큰 까닭: 최종 방향으로 가장 크게 변한 해의 원인 */
export function dominantCause(scenario: Scenario, i: number): Cause | null {
  const { series, causes } = scenario;
  const last = series.length - 1;
  const sign = Math.sign(series[last][i] - series[0][i]);
  let best: Cause | null = null;
  let bestDelta = 0;
  for (let y = 1; y <= last; y++) {
    const delta = (series[y][i] - series[y - 1][i]) * sign;
    const c = causes[y - 1][i];
    if (c.kind && delta > bestDelta) {
      best = c;
      bestDelta = delta;
    }
  }
  return best;
}

/** 원인 하나를 문장으로: "메뚜기를 먹는 개구리가 사라졌기 때문이에요." */
function causeText(model: Model, scenario: Scenario, i: number, c: Cause, events: EventCard[]): string {
  const name = model.species[i].name;
  const v = c.via !== undefined ? model.index[c.via] : -1;
  const via = v >= 0 ? model.species[v].name : "";
  const viaGone = v >= 0 && scenario.final.gone[v];
  switch (c.kind) {
    case "food-down":
      return `먹이인 ${josa(via, "이/가")} ${viaGone ? "사라졌기" : "줄었기"} 때문이에요.`;
    case "food-up":
      return `먹이인 ${josa(via, "이/가")} 많아졌기 때문이에요.`;
    case "predator-up":
      return `${josa(name, "을/를")} 먹는 ${josa(via, "이/가")} 늘었기 때문이에요.`;
    case "predator-down":
      return `${josa(name, "을/를")} 먹는 ${josa(via, "이/가")} ${viaGone ? "사라졌기" : "줄었기"} 때문이에요.`;
    case "nutrient-down":
      return "분해자가 사라져 흙의 양분이 줄었기 때문이에요.";
    case "event": {
      if (model.invaders.includes(i)) return "다른 곳에서 들어왔기 때문이에요.";
      const ev = events.find((e) => e.id === c.eventId);
      return ev ? `${ev.because} 바로 영향을 받았어요.` : "사건 때문에 바로 영향을 받았어요.";
    }
    default:
      return "";
  }
}

export interface Explanation {
  id: string;
  change: Change;
  value: number; // 화면 수
  title: string; // "메뚜기가 늘었어요."
  text: string; // "메뚜기를 먹는 개구리가 사라졌기 때문이에요."
}

/** 생물별 "왜 이렇게 변했나요?" 설명. 크게 변한 생물부터. 사건으로 바로 사라진 생물은 빼고, 비슷한 생물은 먹이를 잃고도 버틴 경우만 */
export function explainAll(model: Model, scenario: Scenario, events: EventCard[]): Explanation[] {
  const { series, final } = scenario;
  const last = series.length - 1;
  const out: { e: Explanation; size: number }[] = [];
  const hitByEvent = new Set(scenario.causes.flatMap((year) => year.flatMap((c, i) => (c.kind === "event" && c.change !== "up" && final.gone[i] ? [i] : []))));

  model.species.forEach((s, i) => {
    const n = series[last][i];
    const change = changeOf(n);
    const value = toDisplay(n);
    if (hitByEvent.has(i) || model.invaders.includes(i)) return; // 외래종은 처음과 견줄 수 없어 "영향이 퍼진 길"에서만 보여 줌
    if (change === "same") {
      const lost = s.prey.find((p) => final.gone[model.index[p.id]]);
      const kept = s.prey.filter((p) => !final.gone[model.index[p.id]]).sort((a, b) => b.preference - a.preference)[0];
      if (!lost || !kept) return;
      const lostName = model.species[model.index[lost.id]].name;
      const keptName = model.species[model.index[kept.id]].name;
      out.push({
        size: 0,
        e: {
          id: s.id,
          change,
          value,
          title: `${josa(s.name, "은/는")} 비슷해요.`,
          text: `${josa(lostName, "이/가")} 사라졌지만 ${josa(keptName, "을/를")} 먹어서 크게 줄지 않았어요.`,
        },
      });
      return;
    }
    const c = dominantCause(scenario, i);
    if (!c) return;
    const verb = change === "up" ? "늘었어요" : change === "gone" ? "사라졌어요" : "줄었어요";
    out.push({
      size: Math.abs(n - 1),
      e: { id: s.id, change, value, title: `${josa(s.name, "이/가")} ${verb}.`, text: causeText(model, scenario, i, c, events) },
    });
  });
  return out.sort((a, b) => b.size - a.size).map((o) => o.e);
}

/** 해마다의 해설 한 문장(관찰 화면 말풍선). 영향이 퍼지는 차례가 보이도록 아직 말하지 않은 생물을 먼저 고름 */
export function yearNotes(model: Model, scenario: Scenario, events: EventCard[]): string[] {
  const told = new Set<number>();
  return scenario.causes.map((causes, y) => {
    const prev = scenario.series[y];
    const cur = scenario.series[y + 1];
    const candidates = cur
      .map((v, i) => ({ i, d: Math.abs(v - prev[i]) }))
      .filter(({ i, d }) => causes[i].kind && !(causes[i].kind === "event" && cur[i] === 0) && d >= 0.004) // 0.4 미만은 말하지 않음
      .sort((a, b) => b.d - a.d);
    const pick = candidates.find(({ i, d }) => !told.has(i) && d >= 0.01) ?? candidates[0];
    if (!pick) return "큰 변화 없이 비슷하게 지냈어요.";
    told.add(pick.i);
    const name = model.species[pick.i].name;
    const verb = cur[pick.i] > prev[pick.i] ? "늘고 있어요" : "줄고 있어요";
    return `${josa(name, "이/가")} ${verb}. ${causeText(model, scenario, pick.i, causes[pick.i], events)}`;
  });
}

export interface InfluencePath {
  /** 사건에서 시작했는지(비생물 요소·서식지 등 생물이 아닌 사건) */
  fromEvent?: string;
  ids: string[]; // 영향이 전해진 차례: ["forest.frog", "forest.grasshopper", "forest.grass"]
}

/** 영향이 퍼진 길: 대상 생물에서 까닭(via)을 거꾸로 따라가 사건까지 */
export function influencePath(model: Model, scenario: Scenario, targetId: string): InfluencePath {
  const ids = [targetId];
  let cur = model.index[targetId];
  for (let step = 0; step < 5; step++) {
    const c = dominantCause(scenario, cur);
    if (!c) break;
    if (c.kind === "event") return { fromEvent: c.eventId, ids };
    if (c.via === undefined || ids.includes(c.via)) break;
    ids.unshift(c.via);
    cur = model.index[c.via];
    if (c.kind === "nutrient-down" || scenario.final.gone[cur]) break;
  }
  return { ids };
}

/** 그해 영향이 전해진 화살표(관찰 화면 금색 흐름). 방향은 먹이그물 화살표와 같게(먹히는 → 먹는) */
export function flowEdges(model: Model, scenario: Scenario, year: number): { from: string; to: string }[] {
  const prev = scenario.series[year - 1];
  const cur = scenario.series[year];
  return scenario.causes[year - 1].flatMap((c, i) => {
    if (!c.via || Math.abs(cur[i] - prev[i]) < 0.01) return [];
    const me = model.species[i].id;
    if (c.kind === "food-up" || c.kind === "food-down" || c.kind === "nutrient-down") return [{ from: c.via, to: me }];
    if (c.kind === "predator-up" || c.kind === "predator-down") return [{ from: me, to: c.via }];
    return [];
  });
}
