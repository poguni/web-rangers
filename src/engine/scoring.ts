// 생물 수 판정: 막대·변화 칩·채점이 모두 이 함수를 씀(DESIGN 12장 4번, PRD F6 채점 규칙)

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
