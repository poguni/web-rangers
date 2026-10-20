// F8-5 모둠 대항전 도전 코드형: 4자리 코드 하나로 모든 크롬북이 같은 테마·같은 사건 순서로 3라운드를 풂(서버 없음)
// 코드 = 테마 숫자(1 숲, 2 강, 3 바다) + 세 자리 수(라운드 순서). 엔진에 무작위가 없어(F4-6) 같은 코드면 같은 문제·같은 정답
import { teamRounds, type TeamRound } from "../data/team";
import type { Theme } from "../data/types";
import { hashPin } from "../store/settings";

export const CHALLENGE_ROUNDS = 3;
const THEME_DIGIT: Theme[] = ["forest", "river", "sea"];

/** 라운드 5개 가운데 3개를 고르는 순서 60가지(5 × 4 × 3) */
function orders(n: number): number[][] {
  const out: number[][] = [];
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) for (let c = 0; c < n; c++) if (a !== b && b !== c && a !== c) out.push([a, b, c]);
  return out;
}

export function makeChallenge(theme: Theme, seed = Math.floor(Math.random() * 1000)): string {
  return `${THEME_DIGIT.indexOf(theme) + 1}${String(seed % 1000).padStart(3, "0")}`;
}

export function parseChallenge(code: string): { theme: Theme; rounds: TeamRound[] } | null {
  if (!/^[1-3]\d{3}$/.test(code)) return null;
  const theme = THEME_DIGIT[Number(code[0]) - 1];
  const pool = teamRounds[theme];
  const all = orders(pool.length);
  return { theme, rounds: all[Number(code.slice(1)) % all.length].map((i) => pool[i]) };
}

// 확인 문자: 소리 내어 읽기 쉬운 글자 16개 중 3개(16 × 16 × 16 = 4096가지). 점수를 바꿔 말하면 맞지 않음
const SYLLABLES = ["가", "나", "다", "라", "마", "바", "사", "아", "자", "차", "카", "타", "파", "하", "호", "구"];

export function checkMark(code: string, group: number, score: number): string {
  const h = parseInt(hashPin(`challenge:${code}:${group}:${score}`), 16);
  return [0, 4, 8].map((shift) => SYLLABLES[(h >>> shift) & 15]).join("");
}

export const verifyMark = (code: string, group: number, score: number, mark: string) => checkMark(code, group, score) === mark.trim();
