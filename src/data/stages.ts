// F6 사건 탐구 스테이지(숲 5개). 질문 1·2의 정답은 시뮬레이션 결과로 계산(tests/data/stages.test.ts가 애매하지 않은지 검사)
import { josa } from "../utils/korean";
import type { ActionCard, Theme } from "./types";

export interface Reason {
  icons: string; // 그림 기호 "🐸✕ → 🦗▲ → 🌿▼"
  text: string;
  correct?: boolean;
  /** 정답 보기의 영향이 퍼진 길. 엔진이 기록한 원인과 같은지 테스트로 확인 */
  path?: string[];
}

export interface Stage {
  id: string; // "forest-1"
  theme: Theme;
  number: number;
  focus: string; // 학습 초점
  eventId: string;
  /** 먹이사슬 비교 탐구: 같은 사건을 이 먹이사슬 한 줄에도 적용(질문 1은 먹이사슬 쪽, 관리인 행동 없음) */
  compareChain?: string[];
  q1: string; // "8년 뒤 ○○는?" 대상
  q2: string[]; // "가장 크게 변할 생물은?" 보기 4개(사건이 바로 건드린 생물 제외). 비교 탐구에서는 비움
  q3: Reason[];
  actions: ActionCard[];
  wrapUp: string; // 정리 문장
}

const reintroduce = (targets: string[], name: string, text: string): ActionCard => ({
  type: "reintroduce",
  title: `${name} 되살리기`,
  text,
  image: "img/action/action-reintroduce",
  targets,
});
const protect = (target: string, name: string): ActionCard => ({
  type: "protect",
  title: `${name} 보호 구역 정하기`,
  text: `${josa(name, "이/가")} 4년 동안 덜 죽어요.`,
  image: "img/action/action-protect",
  targets: [target],
});
const water: ActionCard = {
  type: "water",
  title: "물 대 주기",
  text: "가뭄으로 마른 땅에 물을 대 줘요.",
  image: "img/action/action-water",
  targets: ["role:producer"],
};

export const forestStages: Stage[] = [
  {
    id: "forest-1",
    theme: "forest",
    number: 1,
    focus: "먹는 동물이 사라지면 먹히는 생물은 늘고, 그 먹이는 줄어요",
    eventId: "forest.frog-gone",
    q1: "forest.grass",
    q2: ["forest.grasshopper", "forest.duck", "forest.snake", "forest.rabbit"],
    q3: [
      { icons: "🐸✕ → 🌿▲", text: "개구리가 풀을 먹지 않게 되어서 풀이 늘어요." },
      {
        icons: "🐸✕ → 🦗▲ → 🌿▼",
        text: "메뚜기를 먹던 개구리가 없어져 메뚜기가 늘고, 메뚜기가 풀을 많이 먹어요.",
        correct: true,
        path: ["forest.frog", "forest.grasshopper", "forest.grass"],
      },
      { icons: "🐸 ⋯ 🌿", text: "개구리와 풀은 이어져 있지 않아서 변하지 않아요." },
    ],
    actions: [
      reintroduce(["forest.frog"], "개구리", "다른 숲의 개구리를 옮겨 와 풀어 줘요."),
      protect("forest.grass", "풀"),
      water,
    ],
    wrapUp: "먹는 동물이 사라지면 먹히는 생물이 늘고, 그 먹이는 줄어요. 영향은 화살표를 따라 멀리까지 퍼져요.",
  },
  {
    id: "forest-2",
    theme: "forest",
    number: 2,
    focus: "먹이그물에서는 다른 먹이를 먹고 버텨요",
    eventId: "forest.bulbul-gone",
    q1: "forest.weasel",
    q2: ["forest.caterpillar", "forest.cornus", "forest.rabbit", "forest.acorn"],
    q3: [
      { icons: "🐦✕ → 🦦✕", text: "족제비는 먹이가 없어져서 함께 사라져요." },
      { icons: "🐦✕ → 🦦▲", text: "직박구리가 사라지면 족제비가 크게 늘어요." },
      {
        icons: "🐦✕ → 🦦 ← 🐇🐿️🦆",
        text: "족제비는 직박구리 말고도 토끼·다람쥐·오리를 먹어서 버틸 수 있어요.",
        correct: true,
      },
    ],
    actions: [
      reintroduce(["forest.bulbul"], "직박구리", "다른 숲의 직박구리를 옮겨 와 풀어 줘요."),
      protect("forest.cornus", "산수유"),
      water,
    ],
    wrapUp: "먹이그물이 복잡하면 어떤 생물이 사라져도 다른 먹이를 먹고 살아갈 수 있어요.",
  },
  {
    id: "forest-3",
    theme: "forest",
    number: 3,
    focus: "분해자가 하는 일",
    eventId: "forest.decomposer-gone",
    q1: "forest.grass",
    q2: ["forest.clover", "forest.squirrel", "forest.falcon", "forest.weasel"],
    q3: [
      { icons: "🦗▲ → 🌿▼", text: "풀을 먹는 동물이 늘어서 풀이 줄어요." },
      { icons: "🍄 ⋯ 🌿", text: "버섯과 곰팡이는 풀과 상관없어서 풀은 그대로예요." },
      {
        icons: "🍄✕ → 🟫▼ → 🌿▼",
        text: "죽은 생물이 분해되지 않아 흙의 양분이 줄고, 풀이 잘 자라지 못해요.",
        correct: true,
        path: ["forest.mushroom", "forest.grass"],
      },
    ],
    actions: [
      reintroduce(["role:decomposer"], "버섯과 곰팡이", "다른 숲의 흙과 썩은 나무를 옮겨 와요."),
      protect("forest.grass", "풀"),
      water,
    ],
    wrapUp: "분해자는 죽은 생물과 배출물을 분해해 양분을 흙으로 돌려줘요. 분해자가 없으면 생산자가 잘 자라지 못해요.",
  },
  {
    id: "forest-4",
    theme: "forest",
    number: 4,
    focus: "비생물 요소가 생물에게 주는 영향",
    eventId: "forest.drought",
    q1: "forest.frog",
    q2: ["forest.grasshopper", "forest.falcon", "forest.snake", "forest.rabbit"],
    q3: [
      {
        icons: "☀️ → 🌿▼ → 🦗▼ → 🐸▼",
        text: "가뭄으로 풀이 줄자 풀을 먹는 메뚜기가 줄고, 메뚜기를 먹는 개구리도 줄어요.",
        correct: true,
        path: ["forest.grass", "forest.grasshopper", "forest.frog"],
      },
      { icons: "☀️ → 🌿▼ → 🐸▲", text: "풀이 줄면 개구리가 숨을 곳이 없어 오히려 늘어요." },
      { icons: "☀️ ⋯ 🐸", text: "개구리는 풀을 먹지 않아서 가뭄과 상관없어요." },
    ],
    actions: [
      water,
      protect("forest.frog", "개구리"),
      reintroduce(["forest.frog"], "개구리", "다른 숲의 개구리를 옮겨 와 풀어 줘요."),
    ],
    wrapUp: "햇빛·물 같은 비생물 요소가 바뀌면 생산자부터 영향을 받고, 먹이그물을 따라 소비자에게도 이어져요.",
  },
  {
    id: "forest-5",
    theme: "forest",
    number: 5,
    focus: "먹이사슬과 먹이그물 비교",
    eventId: "forest.frog-gone",
    compareChain: ["forest.grass", "forest.grasshopper", "forest.frog"],
    q1: "forest.grass",
    q2: [],
    q3: [
      { icons: "🔗 = 🕸️", text: "먹이사슬과 먹이그물은 결과가 똑같아요." },
      {
        icons: "🕸️ 🦗 ← 🐦🦆🦦",
        text: "먹이그물에는 메뚜기를 먹는 다른 동물도 있어서, 메뚜기가 덜 늘어나요.",
        correct: true,
      },
      { icons: "🔗 🌿🦗🐸", text: "먹이사슬에는 생물이 적어서 변화도 작아요." },
    ],
    actions: [],
    wrapUp: "먹이그물이 복잡하면 한 생물이 사라져도 다른 생물이 그 자리를 채워, 생태계가 더 안정적으로 유지돼요.",
  },
];
