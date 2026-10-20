// F8 모둠 대항전: 라운드 준비·채점과 점수판 저장(PRD 9.3 webrangers.v1.scoreboard)
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { TeamRound } from "../data/team";
import type { Theme } from "../data/types";
import { runScenario } from "../engine/run";
import { judge, toDisplay } from "../engine/scoring";
import { modelFor, THEMES, YEARS, type Answer } from "./stage";

export const ROUND_POINTS = 100;

export function prepareRound(round: TeamRound) {
  const theme = THEMES[round.theme];
  const event = theme.events.find((e) => e.id === round.eventId)!;
  const model = modelFor(round.theme, undefined, [event]);
  const scenario = runScenario(model, YEARS, [{ atYear: 0, event }]);
  const value = toDisplay(scenario.final.N[model.index[round.target]]);
  const answer: Answer = value === 0 ? "down" : judge(value);
  return { theme, event, model, scenario, target: model.species[model.index[round.target]], value, answer };
}

export interface TeamSettings {
  theme: Theme;
  groups: string[]; // 모둠 이름
  rounds: number; // 3 또는 5
  seconds: number; // 토의 시간
  hide: boolean; // 답 가리기(F8-4)
}

export type TeamPhase = "setup" | "discuss" | "observe" | "board" | "final";

interface TeamState extends TeamSettings {
  phase: TeamPhase;
  round: number; // 0부터
  picks: (Answer | null)[]; // 이번 라운드 모둠별 답
  scores: number[][]; // scores[라운드][모둠]
  start: (s: TeamSettings) => void;
  pick: (group: number, a: Answer) => void;
  reveal: () => void;
  score: (answer: Answer) => void;
  next: () => void;
  reset: () => void;
}

export const DEFAULT_TEAM: TeamSettings = {
  theme: "forest",
  groups: Array.from({ length: 6 }, (_, i) => `${i + 1}모둠`),
  rounds: 3,
  seconds: 90,
  hide: true,
};

export const useTeam = create<TeamState>()(
  persist(
    (set) => ({
      ...DEFAULT_TEAM,
      phase: "setup",
      round: 0,
      picks: [],
      scores: [],
      start: (s) => set({ ...s, phase: "discuss", round: 0, picks: s.groups.map(() => null), scores: [] }),
      pick: (group, a) => set((st) => ({ picks: st.picks.map((p, i) => (i === group ? a : p)) })),
      reveal: () => set({ phase: "observe" }),
      score: (answer) =>
        set((st) => ({ phase: "board", scores: [...st.scores.slice(0, st.round), st.picks.map((p) => (p === answer ? ROUND_POINTS : 0))] })),
      next: () =>
        set((st) =>
          st.round + 1 >= st.rounds ? { phase: "final" } : { phase: "discuss", round: st.round + 1, picks: st.groups.map(() => null) },
        ),
      reset: () => set({ phase: "setup", round: 0, picks: [], scores: [] }),
    }),
    { name: "webrangers.v1.scoreboard", storage: createJSONStorage(() => localStorage) },
  ),
);

/** 모둠별 합계와 순위(같은 점수는 같은 순위) */
export function ranking(groups: string[], scores: number[][]) {
  const totals = groups.map((name, i) => ({ name, i, total: scores.reduce((s, r) => s + (r[i] ?? 0), 0) }));
  const sorted = [...totals].sort((a, b) => b.total - a.total || a.i - b.i);
  return sorted.map((t) => ({ ...t, rank: sorted.findIndex((u) => u.total === t.total) + 1 }));
}
