// F10-4 오늘의 수업 코드: 교사가 고른 테마·활동만 학생 기기에서 열리게 함(서버 없음)
// 코드 = 테마 숫자(1 숲, 2 강, 3 바다) + 활동 묶음을 섞은 세 자리 수. 아무 숫자나 넣으면 대부분 맞지 않음
import type { Theme } from "../data/types";

export const ACTIVITIES = ["sort", "abiotic", "tutorial", "build", "stages", "lab"] as const;
export type Activity = (typeof ACTIVITIES)[number];
export const ACTIVITY_NAME: Record<Activity, string> = {
  sort: "분류 놀이",
  abiotic: "생물·비생물",
  tutorial: "먹이사슬 배우기",
  build: "먹이그물 만들기",
  stages: "사건 탐구",
  lab: "자유 실험실",
};
export interface Lesson {
  theme: Theme;
  activities: Activity[];
}

const THEME_DIGIT: Theme[] = ["forest", "river", "sea"];
const MUL = 37; // 37 × 973 = 36001 ≡ 1 (mod 1000)
const INV = 973;
const ADD = 11;

export function makeLessonCode(lesson: Lesson): string {
  const mask = lesson.activities.reduce((m, a) => m | (1 << ACTIVITIES.indexOf(a)), 0);
  return `${THEME_DIGIT.indexOf(lesson.theme) + 1}${String((mask * MUL + ADD) % 1000).padStart(3, "0")}`;
}

export function parseLessonCode(code: string): Lesson | null {
  if (!/^[1-3]\d{3}$/.test(code)) return null;
  const mask = (((Number(code.slice(1)) - ADD + 1000) % 1000) * INV) % 1000;
  if (mask < 1 || mask >= 1 << ACTIVITIES.length) return null;
  return { theme: THEME_DIGIT[Number(code[0]) - 1], activities: ACTIVITIES.filter((_, i) => mask & (1 << i)) };
}

// 기기에 오늘 날짜와 함께 저장: 다음 날이 되면 저절로 풀림(학교 기기는 여러 반이 함께 씀)
const KEY = "webrangers.v1.lesson";
const today = () => new Date().toLocaleDateString("sv"); // "2026-10-21"

export function readLesson(): (Lesson & { code: string }) | null {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as { code: string; date: string } | null;
    if (!saved || saved.date !== today()) return null;
    const lesson = parseLessonCode(saved.code);
    return lesson && { ...lesson, code: saved.code };
  } catch {
    return null;
  }
}

export function saveLesson(code: string | null) {
  if (code) localStorage.setItem(KEY, JSON.stringify({ code, date: today() }));
  else localStorage.removeItem(KEY);
}
