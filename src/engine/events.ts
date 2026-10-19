// F5 사건 효과: 사건 카드 데이터를 받아 유형별 효과만 적용
import type { EventCard } from "../data/types";
import type { Model } from "./calibrate";
import type { SimState } from "./simulate";

/** "role:producer" 같은 대상을 생물 번호 목록으로 바꿈 */
export function resolveTargets(model: Model, targets: string[]): number[] {
  return targets.flatMap((t) => {
    if (t.startsWith("role:")) {
      const role = t.slice(5);
      return model.species.flatMap((s, i) => (s.role === role ? [i] : []));
    }
    const i = model.index[t];
    if (i === undefined) throw new Error(`대상이 이 먹이그물에 없어요: ${t}`);
    return [i];
  });
}

export function applyEvent(model: Model, state: SimState, event: EventCard): SimState {
  const N = state.N.slice();
  const gone = state.gone.slice();
  const effects = state.effects.slice();
  const targets = resolveTargets(model, event.type === "decomposer" ? ["role:decomposer"] : event.targets);
  const hit = targets.map((i) => ({ i, eventId: event.id }));
  const until = state.year + (event.duration ?? Infinity);

  switch (event.type) {
    case "remove":
    case "decomposer":
      for (const i of targets) {
        N[i] = 0;
        gone[i] = true;
      }
      break;
    case "reduce":
    case "boost":
      for (const i of targets) N[i] = Math.min(3, N[i] * event.amount);
      break;
    case "abiotic":
    case "habitat":
    case "mortality":
      effects.push({ eventId: event.id, kind: event.type, targets, amount: event.amount, untilYear: until });
      return { ...state, effects };
    case "invasive":
      throw new Error("외래종 유입은 강 테마(M5)에서 구현해요");
  }
  return { ...state, N, gone, hits: [...state.hits, ...hit] };
}
