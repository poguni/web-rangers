// 스테이지 진행(별·최고 점수). 지금은 화면을 오가는 동안만 기억하고, 기기 저장(localStorage)은 M4에서 붙임
import { create } from "zustand";

interface StageResult {
  stars: number;
  best: number;
}

interface ProgressState {
  stages: Record<string, StageResult>;
  recordStage: (stageId: string, stars: number, score: number) => void;
}

export const useProgress = create<ProgressState>((set) => ({
  stages: {},
  recordStage: (stageId, stars, score) =>
    set((s) => {
      const prev = s.stages[stageId];
      return {
        stages: {
          ...s.stages,
          [stageId]: { stars: Math.max(prev?.stars ?? 0, stars), best: Math.max(prev?.best ?? 0, score) },
        },
      };
    }),
}));
