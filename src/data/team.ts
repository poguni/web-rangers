// F8 모둠 대항전 라운드(전자칠판 진행형). 강 테마(M5) 전까지는 숲 사건으로 진행
// 정답은 시뮬레이션으로 계산하고, tests/data/team.test.ts가 답이 애매하지 않은지 검사
import type { Theme } from "./types";

export interface TeamRound {
  theme: Theme;
  eventId: string;
  target: string; // "8년 뒤 ○○는 어떻게 될까요?"
}

/** 사건 탐구에서 묻지 않은 생물을 고름(같은 문제를 다시 풀지 않게) */
export const teamRounds: TeamRound[] = [
  { theme: "forest", eventId: "forest.bulbul-gone", target: "forest.frog" },
  { theme: "forest", eventId: "forest.longrain", target: "forest.grass" },
  { theme: "forest", eventId: "forest.decomposer-gone", target: "forest.grasshopper" },
  { theme: "forest", eventId: "forest.frog-gone", target: "forest.caterpillar" },
  { theme: "forest", eventId: "forest.drought", target: "forest.squirrel" },
];
