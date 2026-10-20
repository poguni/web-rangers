// F8 모둠 대항전 라운드(전자칠판 진행형). 테마마다 5라운드, 앞 3라운드만 해도 ▲·▼·● 정답이 모두 나오게
// 정답은 시뮬레이션으로 계산하고, tests/data/team.test.ts가 답이 애매하지 않은지 검사
import type { Theme } from "./types";

export interface TeamRound {
  theme: Theme;
  eventId: string;
  target: string; // "8년 뒤 ○○는 어떻게 될까요?"
}

/** 사건 탐구에서 묻지 않은 생물을 고름(같은 문제를 다시 풀지 않게) */
export const teamRounds: Record<Theme, TeamRound[]> = {
  forest: [
    { theme: "forest", eventId: "forest.bulbul-gone", target: "forest.frog" },
    { theme: "forest", eventId: "forest.longrain", target: "forest.grass" },
    { theme: "forest", eventId: "forest.decomposer-gone", target: "forest.grasshopper" },
    { theme: "forest", eventId: "forest.frog-gone", target: "forest.caterpillar" },
    { theme: "forest", eventId: "forest.drought", target: "forest.squirrel" },
  ],
  river: [
    { theme: "river", eventId: "river.overfish", target: "river.hornwort" },
    { theme: "river", eventId: "river.bass", target: "river.duck" },
    { theme: "river", eventId: "river.drought", target: "river.duck" },
    { theme: "river", eventId: "river.heron-gone", target: "river.medaka" },
    { theme: "river", eventId: "river.pollution", target: "river.closterium" },
  ],
  sea: [
    { theme: "sea", eventId: "sea.turtle-fewer", target: "sea.wakame" },
    { theme: "sea", eventId: "sea.jelly-boom", target: "sea.mackerel" },
    { theme: "sea", eventId: "sea.oil", target: "sea.ray" },
    { theme: "sea", eventId: "sea.warm", target: "sea.turtle" },
    { theme: "sea", eventId: "sea.overfish", target: "sea.zooplankton" },
  ],
};
