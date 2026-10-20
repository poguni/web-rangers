// F1 학생별 진행 상황: 기기의 localStorage에 학생 번호별로 나눠 저장(PRD 9.3)
// 지금 쓰는 학생은 sessionStorage에 둬서, 브라우저를 닫으면 다음 학생이 번호 입력부터 시작
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Theme } from "../data/types";
import { nextCards, REWARD } from "../game/cards";

export const GUEST = "guest";
const CURRENT_KEY = "webrangers.v1.current";

export interface DiagnosticResult {
  answers: (number | string)[]; // 고른 보기 번호, 서술형은 쓴 글
  score: number; // 객관식 맞힌 수(학생에게는 보여 주지 않음, F9-3)
  at: string;
}

export interface StudentRecord {
  key: string; // "4-2-13"(학년-반-번호) 또는 "guest"
  cards: string[]; // 얻은 생물 카드 id(F2-3)
  streak: number; // 지금까지 이어진 예측 정답 수(3번이면 카드 1장)
  stages: Record<string, { stars: number; best: number }>;
  predictions: { stageId: string; q: 1 | 2 | 3; correct: boolean; at: string }[];
  diagnostic: { pre?: DiagnosticResult; post?: DiagnosticResult };
}

const emptyRecord = (key: string): StudentRecord => ({ key, cards: [], streak: 0, stages: {}, predictions: [], diagnostic: {} });
const EMPTY = emptyRecord("");

function readCurrent(): string | null {
  try {
    return sessionStorage.getItem(CURRENT_KEY);
  } catch {
    return null;
  }
}

function writeCurrent(key: string | null) {
  try {
    if (key) sessionStorage.setItem(CURRENT_KEY, key);
    else sessionStorage.removeItem(CURRENT_KEY);
  } catch {
    // 저장이 막힌 브라우저에서도 이번 화면에서는 계속 쓸 수 있음
  }
}

interface ProgressState {
  students: Record<string, StudentRecord>;
  current: string | null;
  theme: Theme; // 메인에서 고른 테마(이번 화면 동안만)
  setTheme: (t: Theme) => void;
  login: (key: string) => void;
  logout: () => void;
  /** 카드 보상: 정해진 카드(ids) 또는 그 테마의 다음 카드 n장. 새로 얻은 카드 id를 돌려줌 */
  grant: (reward: string[] | { theme: Theme; n: number }) => string[];
  /** 별을 더 얻은 만큼 그 테마 카드를 줌 */
  recordStage: (stageId: string, theme: Theme, stars: number, score: number) => string[];
  /** 예측 3번 연속 정답마다 카드 1장 */
  recordPredictions: (stageId: string, theme: Theme, correct: [boolean, boolean, boolean]) => string[];
  recordDiagnostic: (kind: "pre" | "post", answers: (number | string)[], score: number) => void;
  clearAll: () => void;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => {
      /** 지금 학생의 기록을 고쳐 저장 */
      const update = (fn: (r: StudentRecord) => StudentRecord) =>
        set((s) => {
          if (!s.current) return s;
          return { students: { ...s.students, [s.current]: fn(s.students[s.current] ?? emptyRecord(s.current)) } };
        });
      const record = () => {
        const s = get();
        return (s.current && s.students[s.current]) || emptyRecord(s.current ?? "");
      };
      const grant = (reward: string[] | { theme: Theme; n: number }) => {
        const owned = record().cards;
        const ids = Array.isArray(reward) ? reward.filter((id) => !owned.includes(id)) : nextCards(owned, reward.theme, reward.n);
        if (ids.length) update((r) => ({ ...r, cards: [...r.cards, ...ids] }));
        return ids;
      };
      return {
        students: {},
        current: readCurrent(),
        theme: "forest",
        setTheme: (theme) => set({ theme }),
        grant,
        login: (key) => {
          writeCurrent(key);
          set((s) => ({ current: key, students: s.students[key] ? s.students : { ...s.students, [key]: emptyRecord(key) } }));
        },
        logout: () => {
          writeCurrent(null);
          set({ current: null });
        },
        recordStage: (stageId, theme, stars, score) => {
          const gained = stars - (record().stages[stageId]?.stars ?? 0);
          update((r) => {
            const prev = r.stages[stageId];
            return { ...r, stages: { ...r.stages, [stageId]: { stars: Math.max(prev?.stars ?? 0, stars), best: Math.max(prev?.best ?? 0, score) } } };
          });
          return gained > 0 ? grant({ theme, n: gained }) : [];
        },
        recordPredictions: (stageId, theme, correct) => {
          const at = new Date().toISOString();
          let streak = record().streak;
          let cards = 0;
          for (const c of correct) {
            streak = c ? streak + 1 : 0;
            if (streak === REWARD.streak) {
              cards++;
              streak = 0;
            }
          }
          update((r) => ({ ...r, streak, predictions: [...r.predictions, ...correct.map((c, i) => ({ stageId, q: (i + 1) as 1 | 2 | 3, correct: c, at }))] }));
          return cards ? grant({ theme, n: cards }) : [];
        },
        recordDiagnostic: (kind, answers, score) =>
          update((r) => ({ ...r, diagnostic: { ...r.diagnostic, [kind]: { answers, score, at: new Date().toISOString() } } })),
        clearAll: () => {
          writeCurrent(null);
          set({ students: {}, current: null });
        },
      };
    },
    {
      name: "webrangers.v1.students",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ students: s.students }),
      version: 1,
      // 0 → 1: 카드 수집(M5)을 더하며 cards·streak가 없던 기록을 채움
      migrate: (old, version) => {
        const state = old as { students: Record<string, StudentRecord> };
        if (version < 1) for (const r of Object.values(state.students)) Object.assign(r, { cards: r.cards ?? [], streak: r.streak ?? 0 });
        return state as ProgressState;
      },
    },
  ),
);

/** 지금 학생의 기록(없으면 빈 기록). 선택 함수가 늘 같은 빈 객체를 돌려줘야 화면이 다시 그려지기를 반복하지 않음 */
export const useStudent = () => useProgress((s) => (s.current && s.students[s.current]) || EMPTY);

/** "4-2-13" → "4학년 2반 13번" */
export function studentLabel(key: string): string {
  if (key === GUEST) return "손님";
  const [g, c, n] = key.split("-");
  return `${g}학년 ${c}반 ${n}번`;
}
