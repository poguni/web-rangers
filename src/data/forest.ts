// 숲 — 교과서 49쪽 먹이그물 (PRD 5.2, 5.4 대조표 32개 관계, 교사 확인 완료)
import type { EventCard, Review, Species } from "./types";

const REVIEW: Review[] = [
  { by: "교사(먹이 관계)", at: "2026-10-19", status: "ok" },
  { by: "Claude(사실 문장 1차 검토)", at: "2026-10-19", status: "check" },
];

function sp(
  key: string,
  name: string,
  role: Species["role"],
  layer: number,
  habitat: string,
  fact: string,
  prey: [string, number][] = [],
  extra: Partial<Species> = {},
): Species {
  return {
    id: `forest.${key}`,
    theme: "forest",
    name,
    role,
    layer,
    image: `img/forest/forest-${key}`,
    habitat,
    fact,
    prey: prey.map(([id, preference]) => ({ id: `forest.${id}`, preference })),
    sources: ["교과서 49쪽"],
    review: REVIEW,
    ...extra,
  };
}

export const forestSpecies: Species[] = [
  // 생산자
  sp("grass", "풀", "producer", 0, "숲 가장자리, 풀밭", "햇빛을 받아 스스로 양분을 만들어요."),
  sp("clover", "토끼풀", "producer", 0, "풀밭, 길가", "잎이 세 장씩 모여 나요."),
  sp("cornus", "산수유", "producer", 0, "숲 가장자리, 마을 근처", "산수유나무의 열매예요. 가을에 빨갛게 익어요."),
  sp("acorn", "도토리", "producer", 0, "숲", "상수리나무의 열매예요."),
  // 소비자 (선호도: 먹이 비율, 합 1.0)
  sp("grasshopper", "메뚜기", "consumer", 1, "풀밭", "뒷다리가 길고 튼튼해 멀리 뛰어요.", [["grass", 1]]),
  sp("caterpillar", "애벌레", "consumer", 1, "풀잎, 나뭇잎 위", "자라서 번데기를 거쳐 나비가 돼요.", [
    ["clover", 0.5],
    ["cornus", 0.5],
  ]),
  sp("rabbit", "토끼", "consumer", 1, "숲 가장자리, 풀밭", "귀가 길어 작은 소리도 잘 들어요.", [
    ["grass", 0.5],
    ["clover", 0.5],
  ]),
  sp("squirrel", "다람쥐", "consumer", 1, "숲, 나무 구멍", "볼주머니에 먹이를 넣어 날라요.", [["acorn", 1]]),
  sp("frog", "개구리", "consumer", 2, "논, 냇가", "긴 혀로 벌레를 잡아먹어요.", [
    ["grasshopper", 0.5],
    ["caterpillar", 0.5],
  ]),
  sp("bulbul", "직박구리", "consumer", 2, "숲, 공원", "산수유 열매를 좋아해요.", [
    ["cornus", 0.5],
    ["grasshopper", 0.25],
    ["caterpillar", 0.25],
  ]),
  sp("duck", "오리", "consumer", 3, "냇가, 저수지", "물풀과 풀씨를 많이 먹어요.", [
    ["grass", 0.3],
    ["clover", 0.2],
    ["grasshopper", 0.2],
    ["caterpillar", 0.1],
    ["frog", 0.2],
  ]),
  // 토끼 → 뱀: 교사 확인. 도감에는 "어린 토끼를 잡아먹어요"로 씀(PRD 5.4)
  sp("snake", "뱀", "consumer", 3, "숲 바닥, 돌 틈", "겨울에는 땅속에서 겨울잠을 자요.", [
    ["frog", 0.4],
    ["squirrel", 0.3],
    ["bulbul", 0.2],
    ["rabbit", 0.1],
  ]),
  sp("weasel", "족제비", "consumer", 4, "숲, 냇가", "몸이 길고 가늘어 좁은 굴에도 들어가요.", [
    ["grasshopper", 0.1],
    ["frog", 0.2],
    ["rabbit", 0.2],
    ["squirrel", 0.2],
    ["bulbul", 0.1],
    ["duck", 0.2],
  ]),
  sp(
    "falcon",
    "매",
    "consumer",
    4,
    "바닷가 절벽, 높은 나무",
    "주로 날아다니는 새를 사냥해요.",
    [
      ["frog", 0.05],
      ["rabbit", 0.1],
      ["squirrel", 0.1],
      ["bulbul", 0.35],
      ["duck", 0.3],
      ["snake", 0.1],
    ],
    { tags: ["endangered"] },
  ),
  // 분해자: 교과서 49쪽 그림에는 없고 43·47쪽 내용으로 추가(분해자 연결 보기를 켰을 때만 보임)
  sp("mushroom", "버섯", "decomposer", 0, "썩은 나무, 숲 바닥", "죽은 나무를 분해해 양분을 흙으로 돌려보내요.", [], {
    sources: ["교과서 43쪽", "교과서 47쪽"],
  }),
  sp("mold", "곰팡이", "decomposer", 0, "떨어진 잎, 숲 바닥", "떨어진 잎이나 죽은 생물을 분해해요.", [], {
    sources: ["교과서 47쪽"],
  }),
];

// 먹이사슬과 먹이그물 비교(숲 스테이지 5, 자유 실험실 F7-4): 교과서 49쪽 먹이사슬(교사 확인)
export const forestChain = ["forest.grass", "forest.grasshopper", "forest.frog"];

// "정리하기" 배치: 먹이그물 판(viewBox 960×530)의 고정 좌표. 선이 생물 그림을 지나가지 않게 맞춤(DESIGN 6장, 시안 N)
// 먹히는 생물은 아래, 먹는 생물은 위로 5층(y = 470 / 365 / 260 / 160 / 60), 분해자는 오른쪽 아래 상자
export const forestLayout: Record<string, { x: number; y: number }> = {
  "forest.grass": { x: 150, y: 470 },
  "forest.clover": { x: 380, y: 470 },
  "forest.cornus": { x: 560, y: 470 },
  "forest.acorn": { x: 720, y: 470 },
  "forest.grasshopper": { x: 170, y: 365 },
  "forest.rabbit": { x: 330, y: 365 },
  "forest.caterpillar": { x: 500, y: 365 },
  "forest.squirrel": { x: 700, y: 365 },
  "forest.frog": { x: 330, y: 260 },
  "forest.bulbul": { x: 590, y: 260 },
  "forest.duck": { x: 50, y: 160 },
  "forest.snake": { x: 410, y: 160 },
  "forest.weasel": { x: 200, y: 60 },
  "forest.falcon": { x: 600, y: 60 },
  "forest.mushroom": { x: 845, y: 470 },
  "forest.mold": { x: 922, y: 470 },
};

export const forestEvents: EventCard[] = [
  {
    id: "forest.frog-gone",
    theme: "forest",
    title: "개구리가 모두 사라졌어요",
    story: "숲속 냇가에서 개구리 소리가 들리지 않아요. 개구리가 모두 사라졌어요.",
    type: "remove",
    targets: ["forest.frog"],
    amount: 0,
    image: "img/event/event-forest-frog-gone",
    textbook: "48쪽",
  },
  {
    id: "forest.bulbul-gone",
    theme: "forest",
    title: "직박구리가 사라졌어요",
    story: "산수유 열매가 가득한데 직박구리가 보이지 않아요. 숲에서 직박구리가 사라졌어요.",
    type: "remove",
    targets: ["forest.bulbul"],
    amount: 0,
    image: "img/event/event-forest-bulbul-gone",
    textbook: "49쪽",
  },
  {
    id: "forest.decomposer-gone",
    theme: "forest",
    title: "버섯과 곰팡이가 사라졌어요",
    story: "떨어진 잎과 죽은 나무가 썩지 않고 쌓여요. 버섯과 곰팡이가 사라졌어요.",
    type: "decomposer",
    targets: ["role:decomposer"],
    amount: 0,
    image: "img/event/event-forest-decomposer-gone",
    textbook: "47쪽",
  },
  {
    id: "forest.drought",
    theme: "forest",
    title: "가뭄이 들었어요",
    story: "몇 달 동안 비가 오지 않아 땅이 갈라졌어요. 풀이 잘 자라지 못해요.",
    type: "abiotic",
    targets: ["role:producer"],
    amount: 0.6,
    duration: 3,
    image: "img/event/event-forest-drought",
    textbook: "42쪽",
  },
  {
    id: "forest.longrain",
    theme: "forest",
    title: "오랜 장마가 왔어요",
    story: "비구름이 오랫동안 햇빛을 가렸어요. 식물이 햇빛을 잘 받지 못해요.",
    type: "abiotic",
    targets: ["role:producer"],
    amount: 0.75,
    duration: 2,
    image: "img/event/event-forest-longrain",
    textbook: "42쪽",
  },
  {
    id: "forest.road",
    theme: "forest",
    title: "숲에 길을 냈어요",
    story: "숲 한가운데에 넓은 길이 생겼어요. 식물이 자랄 땅이 줄었어요.",
    type: "habitat",
    targets: ["role:producer"],
    amount: 0.85,
    image: "img/event/event-forest-road",
  },
  {
    id: "forest.snake-poaching",
    theme: "forest",
    title: "뱀을 마구 잡아갔어요",
    story: "사람들이 숲에서 뱀을 마구 잡아갔어요. 뱀이 크게 줄었어요.",
    type: "reduce",
    targets: ["forest.snake"],
    amount: 0.3,
    image: "img/event/event-forest-snake-poaching",
  },
  {
    id: "forest.rabbit-boom",
    theme: "forest",
    title: "토끼가 크게 늘었어요",
    story: "숲속 풀밭에 토끼가 아주 많아졌어요. 풀이 짧게 뜯겨 있어요.",
    type: "boost",
    targets: ["forest.rabbit"],
    amount: 1.8,
    image: "img/event/event-forest-rabbit-boom",
  },
];
