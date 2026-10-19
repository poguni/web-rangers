// F6 ⑥ 관리인 행동: 행동 카드 데이터를 받아 유형별 효과만 적용
import type { ActionCard } from "../data/types";
import type { Model } from "./calibrate";
import { resolveTargets } from "./events";
import type { SimState } from "./simulate";

const REINTRODUCE = 0.3; // 되살리면 30
export const PROTECT_YEARS = 4;
const PROTECT = -0.1; // 보호 구역: 1년 사망률을 이만큼 낮춤

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
    case "clean":
      return "강·바다 테마에서 쓸 수 있어요.";
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
    case "remove-invasive":
    case "clean":
      throw new Error("강·바다 테마(M5)에서 구현해요");
  }
}
