// F1 학생별 진행 상황: 기기의 localStorage에 학생 번호별로 나눠 저장(PRD 9.3)
// 지금 쓰는 학생은 sessionStorage에 둬서, 브라우저를 닫으면 다음 학생이 번호 입력부터 시작
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const GUEST = "guest";
const CURRENT_KEY = "webrangers.v1.current";

export interface DiagnosticResult {
  answers: (number | string)[]; // 고른 보기 번호, 서술형은 쓴 글
  score: number; // 객관식 맞힌 수(학생에게는 보여 주지 않음, F9-3)
  at: string;
}

export interface StudentRecord {
  key: string; // "4-2-13"(학년-반-번호) 또는 "guest"
  stages: Record<string, { stars: number; best: number }>;
  predictions: { stageId: string; q: 1 | 2 | 3; correct: boolean; at: string }[];
  diagnostic: { pre?: DiagnosticResult; post?: DiagnosticResult };
}

const emptyRecord = (key: string): StudentRecord => ({ key, stages: {}, predictions: [], diagnostic: {} });
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
  login: (key: string) => void;
  logout: () => void;
  recordStage: (stageId: string, stars: number, score: number) => void;
  recordPredictions: (stageId: string, correct: [boolean, boolean, boolean]) => void;
  recordDiagnostic: (kind: "pre" | "post", answers: (number | string)[], score: number) => void;
  clearAll: () => void;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => {
      /** 지금 학생의 기록을 고쳐 저장 */
      const update = (fn: (r: StudentRecord) => StudentRecord) =>
        set((s) => {
          if (!s.current) return s;
          return { students: { ...s.students, [s.current]: fn(s.students[s.current] ?? emptyRecord(s.current)) } };
        });
      return {
        students: {},
        current: readCurrent(),
        login: (key) => {
          writeCurrent(key);
          set((s) => ({ current: key, students: s.students[key] ? s.students : { ...s.students, [key]: emptyRecord(key) } }));
        },
        logout: () => {
          writeCurrent(null);
          set({ current: null });
        },
        recordStage: (stageId, stars, score) =>
          update((r) => {
            const prev = r.stages[stageId];
            return { ...r, stages: { ...r.stages, [stageId]: { stars: Math.max(prev?.stars ?? 0, stars), best: Math.max(prev?.best ?? 0, score) } } };
          }),
        recordPredictions: (stageId, correct) => {
          const at = new Date().toISOString();
          update((r) => ({ ...r, predictions: [...r.predictions, ...correct.map((c, i) => ({ stageId, q: (i + 1) as 1 | 2 | 3, correct: c, at }))] }));
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
