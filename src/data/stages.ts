// F6 사건 탐구 스테이지(숲 5개, 강·바다 각 3개). 질문 1·2의 정답은 시뮬레이션 결과로 계산(tests/data/stages.test.ts가 애매하지 않은지 검사)
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
const protect = (target: string | string[], name: string): ActionCard => ({
  type: "protect",
  title: `${name} 보호 구역 정하기`,
  text: `${josa(name, "이/가")} 4년 동안 덜 죽어요.`,
  image: "img/action/action-protect",
  targets: typeof target === "string" ? [target] : target,
});
const clean = (theme: "river" | "sea"): ActionCard =>
  theme === "river"
    ? { type: "clean", title: "강물 깨끗하게 하기", text: "더러운 물이 흘러들지 않게 막고 강을 청소해요.", image: "img/action/action-clean-river", targets: [] }
    : { type: "clean", title: "바다 쓰레기 치우기", text: "바다와 바닷가의 쓰레기를 모두 치워요.", image: "img/action/action-clean-sea", targets: [] };
const catchInvasive: ActionCard = {
  type: "remove-invasive",
  title: "외래종 잡기",
  text: "그물로 큰입배스를 잡아 절반으로 줄여요.",
  image: "img/action/action-remove-invasive",
  targets: [],
};
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

// 강·바다: 정답은 tests/data/stages.test.ts가 시뮬레이션으로 확인
export const riverStages: Stage[] = [
  {
    id: "river-1",
    theme: "river",
    number: 1,
    focus: "먹는 동물이 사라지면 먹히는 생물이 늘고, 그 먹이는 줄어요",
    eventId: "river.heron-gone",
    q1: "river.hornwort",
    q2: ["river.crucian", "river.medaka", "river.daphnia", "river.duck"],
    q3: [
      { icons: "🪶✕ → 🌱▲", text: "왜가리가 붕어마름을 먹지 않게 되어서 붕어마름이 늘어요." },
      {
        icons: "🪶✕ → 🐟▲ → 🌱▼",
        text: "붕어를 먹던 왜가리가 사라져 붕어가 늘고, 붕어가 붕어마름을 많이 먹어요.",
        correct: true,
        path: ["river.heron", "river.crucian", "river.hornwort"],
      },
      { icons: "🪶 ⋯ 🌱", text: "왜가리와 붕어마름은 이어져 있지 않아서 변하지 않아요." },
    ],
    actions: [reintroduce(["river.heron"], "왜가리", "다른 강의 왜가리가 찾아오도록 둥지 숲을 지켜요."), protect("river.hornwort", "붕어마름"), clean("river")],
    wrapUp: "먹는 동물이 사라지면 먹히는 생물이 늘고, 그 생물의 먹이는 줄어요. 강에서도 영향은 화살표를 따라 퍼져요.",
  },
  {
    id: "river-2",
    theme: "river",
    number: 2,
    focus: "물(비생물 요소)이 더러워지면 생물에게 주는 영향",
    eventId: "river.pollution",
    q1: "river.duck",
    q2: ["river.closterium", "river.medaka", "river.crucian", "river.falcon"],
    q3: [
      { icons: "💧✕ → 🦆▲", text: "물이 더러워지면 오리가 물속 먹이를 찾기 쉬워져 늘어요." },
      { icons: "💧 ⋯ 🦆", text: "오리는 물 위에서 살아서 강물이 더러워져도 상관없어요." },
      {
        icons: "💧✕ → 🐌▼ → 🦆▼",
        text: "더러운 물에 다슬기가 줄어, 다슬기를 먹는 오리도 줄어요.",
        correct: true,
        path: ["river.melania", "river.duck"],
      },
    ],
    actions: [clean("river"), protect("river.melania", "다슬기"), reintroduce(["river.melania"], "다슬기", "다른 강의 다슬기를 옮겨 와요.")],
    wrapUp: "물 같은 비생물 요소가 나빠지면 깨끗한 물에 사는 생물부터 줄고, 그 생물을 먹는 동물에게도 영향이 이어져요.",
  },
  {
    id: "river-3",
    theme: "river",
    number: 3,
    focus: "외래종이 먹이그물을 흔들어요",
    eventId: "river.bass",
    q1: "river.hornwort",
    q2: ["river.crucian", "river.medaka", "river.heron", "river.daphnia"],
    q3: [
      { icons: "🐟➕ → 🌱▼", text: "큰입배스가 붕어마름을 먹어서 붕어마름이 줄어요." },
      {
        icons: "🐟➕ → 🐟▼ → 🌱▲",
        text: "큰입배스가 붕어를 잡아먹어 붕어가 줄고, 붕어가 덜 먹는 붕어마름은 늘어요.",
        correct: true,
        path: ["river.bass", "river.crucian", "river.hornwort"],
      },
      { icons: "🐟➕ ⋯ 🌱", text: "큰입배스는 물고기만 먹으니 붕어마름은 그대로예요." },
    ],
    actions: [catchInvasive, protect("river.hornwort", "붕어마름"), clean("river")],
    wrapUp: "외래종은 먹는 동물이 거의 없어 잘 줄지 않아요. 원래 살던 생물이 줄고, 먹이그물 전체가 흔들려요.",
  },
];

export const seaStages: Stage[] = [
  {
    id: "sea-1",
    theme: "sea",
    number: 1,
    focus: "한 생물이 줄면 먹이를 나누던 생물이 늘어요",
    eventId: "sea.turtle-fewer",
    q1: "sea.crab",
    q2: ["sea.jellyfish", "sea.mackerel", "sea.gull", "sea.ray"],
    q3: [
      { icons: "🐢▼ → 🦀▲", text: "바다거북이 게를 먹지 않게 되어서 게가 늘어요." },
      {
        icons: "🐢▼ → 🌿▲ → 🦀▲",
        text: "바다거북이 줄어 미역·톳을 덜 먹으니, 미역·톳을 먹는 게가 늘어요.",
        correct: true,
        path: ["sea.turtle", "sea.wakame", "sea.crab"],
      },
      { icons: "🪼▲ → 🦀▼", text: "해파리가 늘어 게를 잡아먹으니 게가 줄어요." },
    ],
    actions: [clean("sea"), protect("sea.turtle", "바다거북"), protect("sea.crab", "게")],
    wrapUp: "같은 먹이를 먹는 생물끼리도 이어져 있어요. 한쪽이 줄면 남은 먹이를 먹는 다른 생물이 늘어요.",
  },
  {
    id: "sea-2",
    theme: "sea",
    number: 2,
    focus: "먹이가 줄면 먹는 동물도 줄어요",
    eventId: "sea.overfish",
    q1: "sea.dolphin",
    q2: ["sea.dolphin", "sea.gull", "sea.jellyfish", "sea.crab"],
    q3: [
      { icons: "🐟▼ → 🐬▲", text: "고등어가 줄면 돌고래끼리 먹이 다툼이 줄어 돌고래가 늘어요." },
      {
        icons: "🐟▼ → 🐬▼",
        text: "돌고래의 먹이인 고등어가 줄어서 돌고래도 줄어요.",
        correct: true,
        path: ["sea.mackerel", "sea.dolphin"],
      },
      { icons: "🐟 ⋯ 🐬", text: "돌고래는 물고기를 먹지 않아서 그대로예요." },
    ],
    actions: [], // 고등어가 저절로 다시 늘어 어떤 행동이든 결과가 같음 → 예측 점수로 별
    wrapUp: "먹이가 줄면 그 먹이를 먹는 동물도 줄어요. 생물을 잡을 때는 다시 늘어날 수 있을 만큼만 잡아야 해요.",
  },
  {
    id: "sea-3",
    theme: "sea",
    number: 3,
    focus: "바닷물 온도(비생물 요소)가 생물에게 주는 영향",
    eventId: "sea.warm",
    q1: "sea.crab",
    q2: ["sea.crab", "sea.turtle", "sea.gull", "sea.mackerel"],
    q3: [
      { icons: "🌡️ → 🦀▲", text: "게는 따뜻한 물을 좋아해서 늘어요." },
      { icons: "🌡️ ⋯ 🦀", text: "게는 바닷물 온도와 상관없어서 그대로예요." },
      {
        icons: "🌡️ → 🌿▼ → 🦀▼",
        text: "바닷물이 따뜻해져 미역·톳이 줄자, 미역·톳을 먹는 게도 줄어요.",
        correct: true,
        path: ["sea.wakame", "sea.crab"],
      },
    ],
    actions: [protect(["sea.wakame", "sea.hijiki"], "미역·톳"), protect("sea.crab", "게"), clean("sea")],
    wrapUp: "바닷물 온도 같은 비생물 요소가 바뀌면 생산자부터 영향을 받고, 먹이그물을 따라 소비자에게도 이어져요.",
  },
];

export const allStages: Stage[] = [...forestStages, ...riverStages, ...seaStages];
