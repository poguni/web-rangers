// 생물 수 판정과 채점: 막대·변화 칩·채점이 모두 이 함수를 씀(DESIGN 12장 4번, PRD F6 채점 규칙)

/** 엔진 값(처음 1.0)을 화면 수(처음 100)로 */
export function toDisplay(n: number): number {
  return Math.round(n * 100);
}

/** 110보다 크면 늘어요, 90보다 작으면 줄어요, 그 사이면 비슷해요 */
export function judge(display: number): "up" | "down" | "same" {
  if (display > 110) return "up";
  if (display < 90) return "down";
  return "same";
}

/** 경계(90·110) 2 안쪽이면 애매한 문제라 질문 1로 내지 않음(PRD F6 출제 자동 검사) */
export function isAmbiguous(display: number): boolean {
  return Math.abs(display - 90) <= 2 || Math.abs(display - 110) <= 2;
}

export const POINTS = { q1: 100, q2: 150, q2second: 50, q3: 100, star: 50 };

/** 질문 2: 보기 가운데 실제로 가장 크게 변한 생물이면 150점, 두 번째면 50점 */
export function scoreQ2(options: string[], change: (id: string) => number, answer: string): number {
  const ranked = [...options].sort((a, b) => Math.abs(change(b)) - Math.abs(change(a)));
  if (answer === ranked[0]) return POINTS.q2;
  if (answer === ranked[1]) return POINTS.q2second;
  return 0;
}

/** 균형 별(F6 ⑦): 사라진 생물이 있으면 1개, 모두 살아 있으면 2개, 처음과 평균 15 안이면 3개. 외래종(ignore)은 세지 않음 */
export function balanceStars(N: number[], ignore: number[] = []): 1 | 2 | 3 {
  const native = N.filter((_, i) => !ignore.includes(i));
  if (native.some((v) => v === 0)) return 1;
  const avg = native.reduce((s, v) => s + Math.abs(v - 1) * 100, 0) / native.length;
  return avg <= 15 ? 3 : 2;
}

/** 먹이사슬 비교처럼 행동이 없는 탐구는 예측 점수로 별(350점 만점) */
export function scoreStars(score: number): 1 | 2 | 3 {
  return score >= 300 ? 3 : score >= 150 ? 2 : 1;
}
