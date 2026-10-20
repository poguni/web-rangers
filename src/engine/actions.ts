// F6 ⑥ 관리인 행동: 행동 카드 데이터를 받아 유형별 효과만 적용
import type { ActionCard } from "../data/types";
import type { Model } from "./calibrate";
import { resolveTargets } from "./events";
import type { SimState } from "./simulate";

const REINTRODUCE = 0.3; // 되살리면 30
export const PROTECT_YEARS = 4;
const PROTECT = -0.1; // 보호 구역: 1년 사망률을 이만큼 낮춤
const CATCH = 0.5; // 외래종 잡기: 절반으로(PRD 5.3, 2번 써야 거의 사라짐)

/** 사건으로 생긴 오염(사망 증가) 효과: 관리인 행동(보호 구역)으로 생긴 효과는 빼고 */
const pollution = (state: SimState) =>
  state.effects.filter((ef) => ef.kind === "mortality" && !ef.eventId.startsWith("action:") && state.year < ef.untilYear);

/** 지금 쓸 수 없는 행동이면 그 까닭(DESIGN 7.9: "지금은 가뭄이 아니라 필요 없어요") */
export function unavailableReason(model: Model, state: SimState, action: ActionCard): string | null {
  switch (action.type) {
    case "reintroduce":
      return resolveTargets(model, action.targets).some((i) => state.gone[i]) ? null : "지금은 사라진 생물이 아니라 필요 없어요.";
    case "water":
      return state.effects.some((ef) => ef.kind === "abiotic" && state.year < ef.untilYear)
        ? null
        : "지금은 가뭄이 아니라 필요 없어요.";
    case "protect":
      return null;
    case "remove-invasive":
      return model.invaders.some((i) => state.N[i] > 0) ? null : "지금은 외래종이 없어 필요 없어요.";
    case "clean":
      return pollution(state).length > 0 ? null : "지금은 치울 오염이 없어 필요 없어요.";
  }
}

export function applyAction(model: Model, state: SimState, action: ActionCard, actionId: string): SimState {
  const targets = resolveTargets(model, action.targets);
  switch (action.type) {
    case "reintroduce": {
      const N = state.N.slice();
      const gone = state.gone.slice();
      for (const i of targets) {
        if (!gone[i]) continue;
        N[i] = REINTRODUCE;
        gone[i] = false;
      }
      return { ...state, N, gone };
    }
    case "protect":
      return {
        ...state,
        effects: [
          ...state.effects,
          { eventId: actionId, kind: "mortality", targets, amount: PROTECT, untilYear: state.year + PROTECT_YEARS },
        ],
      };
    case "water":
      return {
        ...state,
        effects: state.effects.map((ef) => (ef.kind === "abiotic" ? { ...ef, untilYear: Math.min(ef.untilYear, state.year) } : ef)),
      };
    case "remove-invasive": {
      const N = state.N.slice();
      for (const i of model.invaders) N[i] *= CATCH;
      return { ...state, N };
    }
    case "clean": {
      const ended = new Set(pollution(state));
      return { ...state, effects: state.effects.map((ef) => (ended.has(ef) ? { ...ef, untilYear: Math.min(ef.untilYear, state.year) } : ef)) };
    }
  }
}
