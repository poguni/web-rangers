// 사건 탐구 한 판 준비·채점 (화면과 테스트가 함께 씀)
import { forestEvents, forestLayout, forestSpecies } from "../data/forest";
import { riverEvents, riverLayout, riverSpecies } from "../data/river";
import { seaEvents, seaLayout, seaSpecies } from "../data/sea";
import type { Stage } from "../data/stages";
import type { EventCard, Species, Theme } from "../data/types";
import { calibrate, subWeb, type Model } from "../engine/calibrate";
import { runScenario, type Scenario } from "../engine/run";
import { balanceStars, judge, POINTS, scoreQ2, scoreStars, toDisplay } from "../engine/scoring";

export const YEARS = 8; // 사건 뒤 관찰 기간
export const AFTER_YEARS = 4; // 관리인 행동 뒤 관찰 기간

export interface ThemeData {
  name: string;
  species: Species[];
  events: EventCard[];
  layout: Record<string, { x: number; y: number }>;
}

export const THEMES: Record<Theme, ThemeData> = {
  forest: { name: "숲", species: forestSpecies, events: forestEvents, layout: forestLayout },
  river: { name: "강", species: riverSpecies, events: riverEvents, layout: riverLayout },
  sea: { name: "바다", species: seaSpecies, events: seaEvents, layout: seaLayout },
};
export const THEME_IDS: Theme[] = ["forest", "river", "sea"];

const models = new Map<string, Model>();
/** 테마 먹이그물(또는 일부)의 보정 모델. 외래종 사건이 있으면 외래종을 넣음. 같은 입력이면 다시 계산하지 않음 */
export function modelFor(theme: Theme, ids?: string[], events: EventCard[] = []): Model {
  const invaders = events.flatMap((e) => (e.invader ? [e.invader] : []));
  const key = `${theme}:${ids?.join(",") ?? "all"}:${invaders.map((s) => s.id).join(",")}`;
  if (!models.has(key)) {
    const all = THEMES[theme].species;
    models.set(key, calibrate([...(ids ? subWeb(all, ids) : all), ...invaders]));
  }
  return models.get(key)!;
}

const ABIOTIC = ["sun", "water", "soil", "air"];
/** 보기 그림 기호("[frog]✕ → [grass]▲")를 글자와 그림으로 나눔. [ ] 안은 테마 생물(id 뒷부분)이나 비생물 요소 */
export function reasonParts(icons: string, theme: Theme, model: Model): (string | { image: string })[] {
  return icons
    .split(/\[(\w+)\]/)
    .map((s, i) => {
      if (i % 2 === 0) return s;
      if (ABIOTIC.includes(s)) return { image: `img/abiotic/abiotic-${s}` };
      const sp = model.species[model.index[`${theme}.${s}`]];
      if (!sp) throw new Error(`그림 기호의 생물이 없어요: ${s}`);
      return { image: sp.image };
    })
    .filter((part) => part !== "");
}

export type Answer = "up" | "down" | "same";

export interface PreparedStage {
  stage: Stage;
  event: EventCard;
  model: Model;
  scenario: Scenario;
  chain?: { model: Model; scenario: Scenario };
  q1Value: number; // 질문 1 대상의 8년 뒤 화면 수(비교 탐구는 먹이사슬 쪽)
  q1Answer: Answer;
  q2Answer: string; // 비교 탐구는 "chain" | "web"
}

export function prepareStage(stage: Stage): PreparedStage {
  const theme = THEMES[stage.theme];
  const event = theme.events.find((e) => e.id === stage.eventId)!;
  const model = modelFor(stage.theme, undefined, [event]);
  const scenario = runScenario(model, YEARS, [{ atYear: 0, event }]);
  let chain: PreparedStage["chain"];
  if (stage.compareChain) {
    const cm = modelFor(stage.theme, stage.compareChain);
    chain = { model: cm, scenario: runScenario(cm, YEARS, [{ atYear: 0, event }]) };
  }
  const q = chain ?? { model, scenario };
  const q1Value = toDisplay(q.scenario.final.N[q.model.index[stage.q1]]);
  const webChange = (id: string) => toDisplay(scenario.final.N[model.index[id]]) - 100;
  let q2Answer: string;
  if (chain) {
    const chainChange = Math.abs(q1Value - 100);
    q2Answer = chainChange > Math.abs(webChange(stage.q1)) ? "chain" : "web";
  } else {
    q2Answer = [...stage.q2].sort((a, b) => Math.abs(webChange(b)) - Math.abs(webChange(a)))[0];
  }
  return { stage, event, model, scenario, chain, q1Value, q1Answer: q1Value === 0 ? "down" : judge(q1Value), q2Answer };
}

export interface Answers {
  q1: Answer;
  q2: string;
  q3: number; // 보기 번호
}

export interface StageScore {
  q1: number;
  q2: number;
  q3: number;
  total: number; // 균형 별 점수 전
}

export function scoreAnswers(p: PreparedStage, a: Answers): StageScore {
  const q1 = a.q1 === p.q1Answer ? POINTS.q1 : 0;
  const change = (id: string) => toDisplay(p.scenario.final.N[p.model.index[id]]) - 100;
  const q2 = p.chain ? (a.q2 === p.q2Answer ? POINTS.q2 : 0) : scoreQ2(p.stage.q2, change, a.q2);
  const q3 = p.stage.q3[a.q3]?.correct ? POINTS.q3 : 0;
  return { q1, q2, q3, total: q1 + q2 + q3 };
}

/** 판이 끝났을 때 별: 행동이 있으면 행동 뒤 균형 별, 비교 탐구는 예측 점수로 */
export function finalStars(score: StageScore, afterN?: number[], invaders: number[] = []): 1 | 2 | 3 {
  return afterN ? balanceStars(afterN, invaders) : scoreStars(score.total);
}
