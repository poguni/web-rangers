// PRD 6.2 1년(한 턴) 계산과 F4-7 영향 원인 기록
import type { Model } from "./calibrate";

const STEPS_PER_YEAR = 10; // dt = 0.1
const MAX = 3; // 화면 300
const GONE_BELOW = 0.02; // 화면 2 미만이면 사라짐
const SAME_BELOW = 0.002; // 1년 변화가 이보다 작으면 "비슷해요"
const ENOUGH_DECOMPOSERS = 0.5; // 분해자가 이만큼 남아 있으면 흙의 양분은 충분함

export interface Effect {
  eventId: string;
  kind: "abiotic" | "habitat" | "mortality";
  targets: number[];
  amount: number;
  untilYear: number; // state.year < untilYear 인 동안 적용
}

export interface SimState {
  year: number;
  N: number[]; // 생물 수(처음 1.0, 화면 100)
  D: number; // 쌓인 찌꺼기(죽은 생물·배출물, 처음 1.0)
  soil: number; // 흙의 양분 계수 S(처음 1.0). 분해자가 줄면 천천히 떨어짐
  gone: boolean[];
  effects: Effect[];
  hits: { i: number; eventId: string }[]; // 이번 해에 사건이 바로 건드린 생물
}

export type CauseKind =
  | "food-down" // 먹이가 줄어서
  | "food-up" // 먹이가 늘어서
  | "predator-up" // 나를 먹는 동물이 늘어서
  | "predator-down" // 나를 먹는 동물이 줄어서
  | "nutrient-down" // 분해자가 줄어 흙의 양분이 줄어서
  | "event"; // 사건 때문에

export interface Cause {
  change: "up" | "down" | "same";
  kind: CauseKind | null;
  via?: string; // 까닭이 된 생물 id
  eventId?: string;
}

export function initialState(model: Model): SimState {
  const n = model.species.length;
  const N = new Array(n).fill(1);
  const gone = new Array(n).fill(false);
  for (const i of model.invaders) {
    N[i] = 0; // 외래종은 사건으로 들어오기 전에는 없음
    gone[i] = true;
  }
  return { year: 0, N, D: 1, soil: 1, gone, effects: [], hits: [] };
}

function activeEffects(state: SimState) {
  return state.effects.filter((ef) => state.year < ef.untilYear);
}

/** 생산자 성장 한도에 곱하는 비생물 요소·서식지 계수(E × H) */
function limitFactor(effects: Effect[], i: number) {
  let f = 1;
  for (const ef of effects) if ((ef.kind === "abiotic" || ef.kind === "habitat") && ef.targets.includes(i)) f *= ef.amount;
  return f;
}

function extraDeath(effects: Effect[], i: number) {
  let x = 0;
  for (const ef of effects) if (ef.kind === "mortality" && ef.targets.includes(i)) x += ef.amount;
  return x;
}

/** 흙의 양분이 다다르려는 값 = 바닥값 + (1 − 바닥값) × min(1, 분해자 평균 / 충분한 양) */
function soilTarget(model: Model, N: number[]) {
  if (model.decomposers.length === 0) return 1;
  const avg = model.decomposers.reduce((s, d) => s + N[d], 0) / model.decomposers.length;
  return model.nutrientFloor + (1 - model.nutrientFloor) * Math.min(1, avg / ENOUGH_DECOMPOSERS);
}

/** y = [생물 수…, 찌꺼기 D, 흙 양분 S] 의 변화량 */
function derivatives(model: Model, effects: Effect[], y: number[]) {
  const { a, r, K, m, q, e, b, producers, consumers, decomposers } = model;
  const n = model.species.length;
  const N = y.slice(0, n);
  const D = y[n];
  const S = y[n + 1];
  const dy = new Array<number>(n + 2).fill(0);
  let deaths = 0;

  for (const i of producers) {
    const limit = K[i] * S * limitFactor(effects, i);
    const selfDeath = (r[i] * N[i] * N[i]) / limit + extraDeath(effects, i) * N[i];
    let grazed = 0;
    for (const j of consumers) grazed += a[i][j] * N[i] * N[j];
    dy[i] = r[i] * N[i] - selfDeath - grazed;
    deaths += selfDeath;
  }
  for (const j of consumers) {
    let gain = 0;
    let lost = 0;
    for (let i = 0; i < n; i++) gain += a[i][j] * N[i];
    for (const k of consumers) lost += a[j][k] * N[k];
    const death = m[j] * N[j] + q[j] * N[j] * N[j] + extraDeath(effects, j) * N[j];
    dy[j] = e * gain * N[j] - lost * N[j] - death;
    deaths += death;
  }
  if (decomposers.length > 0) {
    let decomposed = 0;
    for (const d of decomposers) {
      decomposed += b[d] * N[d] * D;
      dy[d] = model.decomposerEfficiency * b[d] * N[d] * D - m[d] * N[d] - q[d] * N[d] * N[d];
    }
    dy[n] = deaths - decomposed;
    dy[n + 1] = model.soilRate * (soilTarget(model, N) - S);
  }
  return dy;
}

function clamp(gone: boolean[], y: number[]) {
  return y.map((v, i) => (gone[i] ? 0 : i < gone.length ? Math.min(MAX, Math.max(0, v)) : Math.max(0, v)));
}

/** 1년 진행: 작은 단계 10번(dt = 0.1, 4차 룽게-쿠타) */
export function stepYear(model: Model, state: SimState): { state: SimState; causes: Cause[] } {
  const effects = activeEffects(state);
  const dt = 1 / STEPS_PER_YEAR;
  const f = (y: number[]) => derivatives(model, effects, y);
  const add = (y: number[], k: number[], h: number) => clamp(state.gone, y.map((v, i) => v + k[i] * h));
  let y = [...state.N, state.D, state.soil];
  for (let s = 0; s < STEPS_PER_YEAR; s++) {
    const k1 = f(y);
    const k2 = f(add(y, k1, dt / 2));
    const k3 = f(add(y, k2, dt / 2));
    const k4 = f(add(y, k3, dt));
    y = clamp(state.gone, y.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])));
  }

  const n = model.species.length;
  const gone = state.gone.slice();
  const N = y.slice(0, n).map((v, i) => {
    if (v < GONE_BELOW) gone[i] = true;
    return gone[i] ? 0 : v;
  });

  const next: SimState = { ...state, year: state.year + 1, N, D: y[n], soil: y[n + 1], gone, hits: [] };
  return { state: next, causes: explainYear(model, state, next, effects) };
}

/** F4-7: 각 생물이 이번 해에 늘거나 준 가장 큰 까닭을 처음(균형) 상태와 비교해 찾음 */
function explainYear(model: Model, prev: SimState, next: SimState, effects: Effect[]): Cause[] {
  const { a, r, K, e, consumers, decomposers, species } = model;
  const N = next.N;
  const base = (k: number) => (model.invaders.includes(k) ? 0 : 1); // 비교 기준: 처음 균형(외래종은 처음에 없었음)
  return species.map((_, i) => {
    const delta = N[i] - prev.N[i];
    const change = Math.abs(delta) < SAME_BELOW ? "same" : delta > 0 ? "up" : "down";
    const hit = prev.hits.find((h) => h.i === i);
    if (hit) return { change, kind: "event", eventId: hit.eventId };
    if (change === "same") return { change, kind: null };
    const sign = change === "up" ? 1 : -1;

    // 후보: [점수(이번 해 방향을 만든 크기), 원인]
    const candidates: [number, Cause][] = [];
    const strongest = (terms: [number, number][]) => terms.reduce((x, y) => (y[1] * sign > x[1] * sign ? y : x));

    // 먹이
    const food: [number, number][] = [];
    for (let p = 0; p < N.length; p++) if (a[p][i] > 0) food.push([p, e * a[p][i] * (N[p] - base(p))]);
    if (food.length > 0) {
      const total = food.reduce((s, t) => s + t[1], 0);
      if (total * sign > 0) {
        const [p] = strongest(food);
        candidates.push([Math.abs(total), { change, kind: sign > 0 ? "food-up" : "food-down", via: species[p].id }]);
      }
    }
    // 나를 먹는 동물 (먹힘이 줄면 늘어남)
    const pred: [number, number][] = [];
    for (const k of consumers) if (a[i][k] > 0) pred.push([k, -a[i][k] * (N[k] - base(k))]);
    if (pred.length > 0) {
      const total = pred.reduce((s, t) => s + t[1], 0);
      if (total * sign > 0) {
        const [k] = strongest(pred);
        candidates.push([Math.abs(total), { change, kind: sign > 0 ? "predator-down" : "predator-up", via: species[k].id }]);
      }
    }
    if (sign < 0) {
      // 사건(비생물 요소·서식지·사망 증가)
      for (const ef of effects) {
        if (!ef.targets.includes(i)) continue;
        const score = ef.kind === "mortality" ? ef.amount * N[i] : r[i] * (N[i] / K[i]) * (1 / ef.amount - 1);
        candidates.push([score, { change, kind: "event", eventId: ef.eventId }]);
      }
      // 분해자가 줄어 흙의 양분이 줄어듦
      if (r[i] > 0 && next.soil < 1 && decomposers.length > 0) {
        const d = decomposers.reduce((x, y) => (N[y] < N[x] ? y : x));
        candidates.push([r[i] * (N[i] / K[i]) * (1 / next.soil - 1), { change, kind: "nutrient-down", via: species[d].id }]);
      }
    }
    if (candidates.length === 0) return { change, kind: null };
    candidates.sort((x, y) => y[0] - x[0]);
    return candidates[0][1];
  });
}
