// 여러 해를 한 번에 계산(테스트·명령줄 표·자유 실험실용)
import type { EventCard } from "../data/types";
import type { Model } from "./calibrate";
import { applyEvent } from "./events";
import { initialState, stepYear, type Cause, type SimState } from "./simulate";

export interface Scenario {
  series: number[][]; // series[year][생물 번호], year 0 = 처음
  causes: Cause[][]; // causes[year - 1][생물 번호]
  final: SimState;
}

/** events: atYear 해의 시작에 사건 발동(0이면 처음 상태에서 바로) */
export function runScenario(
  model: Model,
  years: number,
  events: { atYear: number; event: EventCard }[] = [],
  start: SimState = initialState(model),
): Scenario {
  let state = start;
  const series = [state.N];
  const causes: Cause[][] = [];
  for (let y = 0; y < years; y++) {
    for (const ev of events) if (ev.atYear === state.year) state = applyEvent(model, state, ev.event);
    const out = stepYear(model, state);
    state = out.state;
    series.push(state.N);
    causes.push(out.causes);
  }
  return { series, causes, final: state };
}
