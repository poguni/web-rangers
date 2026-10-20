// F2 생물 카드 수집: 테마별 카드 목록과 보상 순서(화면과 분리한 순수 함수)
import { forestChain } from "../data/forest";
import { riverBass } from "../data/river";
import type { Species, Theme } from "../data/types";
import { THEME_IDS, THEMES } from "./stage";

/** 테마별 카드: 먹이그물 생물(생산자부터) + 외래종 */
export const THEME_CARDS: Record<Theme, Species[]> = {
  forest: THEMES.forest.species,
  river: [...THEMES.river.species, riverBass],
  sea: THEMES.sea.species,
};

export const cardById = new Map(THEME_IDS.flatMap((t) => THEME_CARDS[t]).map((s) => [s.id, s]));

/** F2-3 보상 */
export const REWARD = {
  tutorial: forestChain, // 먹이사슬 배우기를 마치면 풀·메뚜기·개구리
  build: 4, // 먹이그물 완성: 그 테마 카드 4장
  streak: 3, // 예측 3번 연속 정답: 카드 1장
};

/** 아직 없는 카드를 테마 순서대로 n장 */
export function nextCards(owned: string[], theme: Theme, n: number): string[] {
  return THEME_CARDS[theme]
    .filter((s) => !owned.includes(s.id) && !s.tags?.includes("invasive")) // 외래종 카드는 외래종 사건을 탐구해야 얻음
    .slice(0, n)
    .map((s) => s.id);
}

/** 먹이: "메뚜기·애벌레", 나를 먹는 동물: 같은 테마에서 나를 먹이로 하는 생물 */
export function preyNames(s: Species): string[] {
  return s.prey.map((p) => cardById.get(p.id)?.name ?? "");
}
export function predatorNames(s: Species): string[] {
  return THEME_CARDS[s.theme].filter((o) => o.prey.some((p) => p.id === s.id)).map((o) => o.name);
}
