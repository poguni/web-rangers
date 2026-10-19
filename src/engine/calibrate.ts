// PRD 6.3 자동 보정: 모든 생물이 1.0일 때 변화량이 0이 되도록 계수를 계산
import type { Species } from "../data/types";

export interface Params {
  efficiency: number; // e: 먹은 양이 내 몸으로 바뀌는 비율
  baseTurnover: number; // d0: 먹히지 않는 소비자의 1년 사망 몫
  preyTurnover: number; // κ: 많이 먹히는 소비자일수록 빨리 태어나고 죽음(먹히는 양 × κ만큼 사망 몫 추가)
  crowding: number; // θ: 사망 몫 중 "같은 무리끼리 다툼"(포식자 간섭 항)으로 정하는 비율. 진동을 줄임
  producerHeadroom: number; // ρ: 생산자 성장률 = 먹히는 양 × ρ
  decomposerEfficiency: number; // e_d
  nutrientFloor: number; // 분해자가 모두 사라졌을 때의 양분 계수 S
  timeScale: number; // τ: 모든 속도에 곱함. 균형점은 그대로 두고 변화가 몇 년에 걸쳐 나타나게 함
  soilRate: number; // 흙의 양분이 분해자 상태를 따라가는 1년 속도(분해자가 사라지면 생산자가 서서히 줄게 함)
}

// 숲 먹이그물에서 교과서 기대 결과(개구리 사라짐 → 메뚜기 ▲ → 풀 ▼, 분해자 사라짐 → 생산자 서서히 ▼)와
// 안정성·복원력 테스트를 함께 만족하도록 값을 탐색해 정함(tests/engine 참고)
export const DEFAULT_PARAMS: Params = {
  efficiency: 0.8,
  baseTurnover: 0.2,
  preyTurnover: 0.5,
  crowding: 0.95,
  producerHeadroom: 2,
  decomposerEfficiency: 0.5,
  nutrientFloor: 0.7,
  timeScale: 0.4,
  soilRate: 0.4,
};

export interface Model {
  species: Species[];
  index: Record<string, number>;
  producers: number[];
  consumers: number[];
  decomposers: number[];
  /** a[i][j]: 소비자 j가 생물 i를 먹는 계수 */
  a: number[][];
  r: number[]; // 생산자 성장률
  K: number[]; // 생산자 최대 한도
  m: number[]; // 소비자 자연 사망률, 분해자 사망률
  q: number[]; // 소비자 같은 무리 다툼(간섭) 계수
  e: number;
  /** 분해자 d가 찌꺼기를 분해하는 계수 b_d */
  b: number[];
  decomposerEfficiency: number;
  nutrientFloor: number;
  soilRate: number;
}

export class CalibrationError extends Error {}

export function calibrate(species: Species[], params: Params = DEFAULT_PARAMS): Model {
  const n = species.length;
  const index: Record<string, number> = {};
  species.forEach((s, i) => (index[s.id] = i));
  const byRole = (role: Species["role"]) => species.flatMap((s, i) => (s.role === role ? [i] : []));
  const producers = byRole("producer");
  const consumers = byRole("consumer");
  const decomposers = byRole("decomposer");

  // 나를 먹는 소비자 목록
  const predators: { j: number; preference: number }[][] = species.map(() => []);
  for (const j of consumers) {
    const s = species[j];
    if (s.prey.length === 0) throw new CalibrationError(`${s.name}: 먹이가 없어요`);
    for (const p of s.prey) {
      const i = index[p.id];
      if (i === undefined) throw new CalibrationError(`${s.name}: 없는 먹이 ${p.id}`);
      predators[i].push({ j, preference: p.preference });
    }
  }

  // 섭식량 c_j: 위(먹히지 않는 소비자)에서부터 정함. 먹히는 양 L_j를 채우고도 사망 몫 d_j가 남도록
  const { efficiency: e, baseTurnover, preyTurnover, crowding } = params;
  const intake: number[] = new Array(n).fill(NaN);
  const eaten: number[] = new Array(n).fill(0); // L_i: 균형 상태에서 1년에 먹히는 양
  const visiting = new Set<number>();
  const eatenOf = (i: number): number => {
    let sum = 0;
    for (const { j, preference } of predators[i]) sum += intakeOf(j) * preference;
    return sum;
  };
  const intakeOf = (j: number): number => {
    if (!Number.isNaN(intake[j])) return intake[j];
    if (visiting.has(j)) throw new CalibrationError(`${species[j].name}: 먹이 관계가 돌고 돌아요`);
    visiting.add(j);
    const L = eatenOf(j);
    intake[j] = species[j].intake ?? (L * (1 + preyTurnover) + baseTurnover) / e;
    visiting.delete(j);
    return intake[j];
  };

  const a = species.map(() => new Array<number>(n).fill(0));
  for (const j of consumers) {
    for (const p of species[j].prey) a[index[p.id]][j] = intakeOf(j) * p.preference;
  }
  for (let i = 0; i < n; i++) eaten[i] = eatenOf(i);

  const r = new Array<number>(n).fill(0);
  const K = new Array<number>(n).fill(1);
  const m = new Array<number>(n).fill(0);
  const q = new Array<number>(n).fill(0);

  for (const i of producers) {
    const G = eaten[i];
    r[i] = species[i].growth ?? (G > 0 ? G * params.producerHeadroom : 1);
    if (G >= r[i]) throw new CalibrationError(`${species[i].name}: 먹히는 양이 자라는 양보다 많아요`);
    K[i] = 1 / (1 - G / r[i]);
  }
  for (const j of consumers) {
    const turnover = e * intakeOf(j) - eaten[j]; // 균형 상태의 사망 몫 d_j
    q[j] = crowding * turnover;
    m[j] = turnover - q[j];
    if (m[j] <= 0) throw new CalibrationError(`${species[j].name}: 사망률이 0 이하예요`);
  }

  // 분해자: 균형 상태에서 1년에 죽는 양을 정확히 분해하도록 b_d를 정함
  const b = new Array<number>(n).fill(0);
  if (decomposers.length > 0) {
    let deathAtRest = 0;
    for (const i of producers) deathAtRest += r[i] / K[i];
    for (const j of consumers) deathAtRest += m[j] + q[j];
    for (const d of decomposers) {
      b[d] = deathAtRest / decomposers.length;
      q[d] = crowding * params.decomposerEfficiency * b[d];
      m[d] = params.decomposerEfficiency * b[d] - q[d];
    }
  }

  // 속도만 바꾸고 균형점(모두 1.0)은 그대로
  const tau = params.timeScale;
  for (let i = 0; i < n; i++) {
    r[i] *= tau;
    m[i] *= tau;
    q[i] *= tau;
    b[i] *= tau;
    for (let j = 0; j < n; j++) a[i][j] *= tau;
  }

  return {
    species,
    index,
    producers,
    consumers,
    decomposers,
    a,
    r,
    K,
    m,
    q,
    e,
    b,
    decomposerEfficiency: params.decomposerEfficiency,
    nutrientFloor: params.nutrientFloor,
    soilRate: params.soilRate,
  };
}

/** 일부 생물만 남긴 먹이그물(먹이사슬 비교용). 남은 먹이로 선호도를 다시 나눔 */
export function subWeb(species: Species[], ids: string[]): Species[] {
  const keep = new Set(ids);
  return species
    .filter((s) => keep.has(s.id))
    .map((s) => {
      const prey = s.prey.filter((p) => keep.has(p.id));
      const total = prey.reduce((sum, p) => sum + p.preference, 0);
      return { ...s, prey: prey.map((p) => ({ ...p, preference: p.preference / total })) };
    });
}
