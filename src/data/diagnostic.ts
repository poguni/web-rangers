// F9 사전·사후 진단 6문항(같은 구조, 다른 생물로 평행 문항). 사전은 숲, 사후는 스테이지에서 다루지 않은 바다 생물
// 바다 먹이 관계(갈매기 → 게 → 미역 등)는 PRD 5.2 바다 표(교사 확인 완료)를 따름

export type DiagKind = "pre" | "post";

/** F9-2 문항 유형: ① 생물·비생물 요소 ② 생산자·소비자·분해자 ③ 화살표 방향 ④ 먹이그물이 좋은 까닭 ⑤ 간접 효과 ⑥ 까닭 쓰기 */
export type DiagItem =
  | { kind: "choice"; text: string; options: { icon?: string; text: string }[]; answer: number }
  | { kind: "write"; text: string };

const ROLES3 = [
  { icon: "🌱", text: "생산자" },
  { icon: "🐾", text: "소비자" },
  { icon: "🍄", text: "분해자" },
];
const CHANGE3 = [
  { icon: "▲", text: "늘어요" },
  { icon: "▼", text: "줄어요" },
  { icon: "●", text: "변하지 않아요" },
];
const WEB_GOOD = "한 가지 먹이가 없어져도 다른 먹이를 먹고 살 수 있어요.";
const WEB_BAD1 = "먹는 동물이 많아져서 모든 생물이 늘어나요.";
const WEB_BAD2 = "생물들이 서로 먹지 않게 되어요.";
const WEB_Q = "먹이그물이 복잡하면 생물이 살아가기에 좋은 까닭은 무엇일까요?";
const WHY = "5번 답을 고른 까닭을 써 보세요.";

export const DIAGNOSTIC: Record<DiagKind, DiagItem[]> = {
  pre: [
    {
      kind: "choice",
      text: "다음 중 비생물 요소는 무엇일까요?",
      options: [
        { icon: "🐿️", text: "다람쥐" },
        { icon: "☀️", text: "햇빛" },
        { icon: "🍄", text: "버섯" },
        { icon: "🌿", text: "풀" },
      ],
      answer: 1,
    },
    { kind: "choice", text: "버섯과 곰팡이는 생태계에서 어떤 역할을 할까요?", options: ROLES3, answer: 2 },
    {
      kind: "choice",
      text: "메뚜기가 풀을 먹어요. 화살표를 바르게 그린 것은 무엇일까요?",
      options: [{ text: "🌿 풀 → 🦗 메뚜기" }, { text: "🦗 메뚜기 → 🌿 풀" }],
      answer: 0,
    },
    { kind: "choice", text: WEB_Q, options: [{ text: WEB_GOOD }, { text: WEB_BAD1 }, { text: WEB_BAD2 }], answer: 0 },
    { kind: "choice", text: "숲에서 개구리가 모두 사라지면, 풀은 어떻게 될까요?", options: CHANGE3, answer: 1 },
    { kind: "write", text: WHY },
  ],
  post: [
    {
      kind: "choice",
      text: "다음 중 비생물 요소는 무엇일까요?",
      options: [
        { icon: "🦀", text: "게" },
        { icon: "🌿", text: "미역" },
        { icon: "💧", text: "물" },
        { icon: "🕊️", text: "갈매기" },
      ],
      answer: 2,
    },
    { kind: "choice", text: "세균은 생태계에서 어떤 역할을 할까요?", options: ROLES3, answer: 2 },
    {
      kind: "choice",
      text: "게가 미역을 먹어요. 화살표를 바르게 그린 것은 무엇일까요?",
      options: [{ text: "🦀 게 → 🌿 미역" }, { text: "🌿 미역 → 🦀 게" }],
      answer: 1,
    },
    { kind: "choice", text: WEB_Q, options: [{ text: WEB_BAD2 }, { text: WEB_GOOD }, { text: WEB_BAD1 }], answer: 1 },
    { kind: "choice", text: "바다에서 갈매기가 모두 사라지면, 미역은 어떻게 될까요?", options: CHANGE3, answer: 1 },
    { kind: "write", text: WHY },
  ],
};

export const DIAG_NAME: Record<DiagKind, string> = { pre: "사전 진단", post: "사후 진단" };
export const INDIRECT_ITEM = 4; // 5번(간접 효과) 문항 번호(0부터)
export const WHY_ITEM = 5; // 6번(까닭 쓰기)

/** 객관식 맞힌 수(서술형은 자동 채점하지 않음, F9-4) */
export function scoreDiagnostic(kind: DiagKind, answers: (number | string)[]): number {
  return DIAGNOSTIC[kind].filter((item, i) => item.kind === "choice" && answers[i] === item.answer).length;
}

export const DIAG_MAX = DIAGNOSTIC.pre.filter((i) => i.kind === "choice").length;

/** 고른 보기를 글로(교사 화면·CSV용) */
export function answerText(kind: DiagKind, i: number, answer: number | string | undefined): string {
  const item = DIAGNOSTIC[kind][i];
  if (answer === undefined) return "";
  if (item.kind === "write") return String(answer);
  return item.options[answer as number]?.text ?? "";
}

export function isCorrect(kind: DiagKind, i: number, answer: number | string | undefined): boolean {
  const item = DIAGNOSTIC[kind][i];
  return item.kind === "choice" && answer === item.answer;
}
