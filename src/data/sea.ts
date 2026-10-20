// 바다 — 교과서 45쪽 생태계 (PRD 5.2 바다 표, 13개 관계 교사 확인 완료)
import { speciesMaker } from "./make";
import type { EventCard, Review, Species } from "./types";

const REVIEW: Review[] = [
  { by: "교사(먹이 관계)", at: "2026-10-19", status: "ok" },
  { by: "Claude(사실 문장 1차 검토)", at: "2026-10-20", status: "check" },
];
const sp = speciesMaker("sea", ["교과서 45쪽"], REVIEW);
const ADDED = { added: true, sources: ["PRD 5.2(추가)"] };

export const seaSpecies: Species[] = [
  // 생산자
  sp("phytoplankton", "식물 플랑크톤", "producer", 0, "바닷물 위쪽", "아주 작아서 확대해야 보여요. 햇빛으로 양분을 만들어요.", [], ADDED),
  sp("wakame", "미역", "producer", 0, "바닷가 바위", "가운데 줄기 양쪽으로 잎이 깃털처럼 갈라져요."),
  sp("hijiki", "톳", "producer", 0, "바닷가 바위", "통통한 작은 잎이 줄기에 많이 붙어 있어요."),
  // 소비자
  sp("zooplankton", "동물 플랑크톤", "consumer", 1, "바닷물 속", "아주 작은 동물이에요. 식물 플랑크톤을 먹어요.", [["phytoplankton", 1]], ADDED),
  sp("coral", "산호", "consumer", 2, "따뜻한 바다의 바위", "꽃처럼 보이지만 동물이에요. 촉수로 작은 생물을 잡아요.", [["zooplankton", 1]]),
  sp("jellyfish", "해파리", "consumer", 2, "바닷물 속", "갓을 오므렸다 폈다 하며 헤엄쳐요.", [["zooplankton", 1]]),
  sp("mackerel", "고등어", "consumer", 2, "넓은 바다", "등에 물결무늬가 있어요. 떼 지어 다녀요.", [["zooplankton", 1]]),
  sp("crab", "게", "consumer", 1, "바닷가, 바닷속 모래", "다리가 10개이고, 그중 2개가 집게예요.", [
    ["wakame", 0.5],
    ["hijiki", 0.5],
  ]),
  // 바다거북: 종마다 먹이가 달라 "해파리와 미역·톳을 먹어요"로 묶음(PRD 5.4 메모)
  sp(
    "turtle",
    "바다거북",
    "consumer",
    3,
    "따뜻한 바다",
    "해파리와 미역·톳을 먹어요. 비닐봉지를 해파리로 알고 먹기도 해요.",
    [
      ["jellyfish", 0.5],
      ["wakame", 0.25],
      ["hijiki", 0.25],
    ],
    // 섭식량: 바다거북이 줄면 해파리가 늘고, 덜 먹힌 미역·톳 덕분에 게가 늘도록(탐색해 정함, tests/engine/sea-sim.test.ts)
    { tags: ["endangered"], intake: 1 },
  ),
  sp("ray", "가오리", "consumer", 2, "바닷속 모래 바닥", "몸이 납작하고 꼬리가 길어요.", [["crab", 1]]),
  sp("dolphin", "돌고래", "consumer", 3, "바닷가 가까운 바다", "숨을 쉬러 물 위로 올라와요.", [["mackerel", 1]]),
  sp("gull", "갈매기", "consumer", 3, "바닷가", "부리 끝에 빨간 점과 검은 점이 있어요.", [
    ["crab", 0.5],
    ["mackerel", 0.5],
  ]),
  // 분해자: 교과서 47쪽 "일부 세균"
  sp("bacteria", "세균", "decomposer", 0, "바닷속 모래", "죽은 생물을 분해해 양분을 바다로 돌려보내요.", [], { added: true, sources: ["교과서 47쪽"] }),
];

export const seaLayout: Record<string, { x: number; y: number }> = {
  "sea.phytoplankton": { x: 260, y: 470 },
  "sea.wakame": { x: 560, y: 470 },
  "sea.hijiki": { x: 740, y: 470 },
  "sea.zooplankton": { x: 260, y: 365 },
  "sea.crab": { x: 540, y: 365 },
  "sea.coral": { x: 80, y: 260 },
  "sea.jellyfish": { x: 400, y: 260 },
  "sea.mackerel": { x: 230, y: 230 },
  "sea.ray": { x: 790, y: 260 },
  "sea.turtle": { x: 680, y: 160 },
  "sea.dolphin": { x: 110, y: 80 },
  "sea.gull": { x: 400, y: 60 },
  "sea.bacteria": { x: 880, y: 470 },
};

export const seaEvents: EventCard[] = [
  {
    id: "sea.turtle-fewer",
    theme: "sea",
    title: "바다거북이 크게 줄었어요",
    story: "바다에 떠다니는 비닐봉지를 해파리로 알고 먹은 바다거북이 해마다 크게 줄고 있어요.",
    // 쓰레기가 남아 있는 동안 계속 영향을 줌 → "바다 쓰레기 치우기"가 알맞은 행동(tests/data/stages.test.ts)
    type: "mortality",
    targets: ["sea.turtle"],
    amount: 0.45,
    duration: 10,
    image: "img/event/event-sea-turtle-fewer",
    because: "바다 쓰레기 때문에",
    realCase: "바다거북은 바다에 떠다니는 비닐봉지를 해파리로 알고 먹다가 다치기도 해요.",
  },
  {
    id: "sea.overfish",
    theme: "sea",
    title: "고등어를 너무 많이 잡았어요",
    story: "커다란 그물로 고등어를 아주 많이 잡았어요. 바다에 고등어가 크게 줄었어요.",
    type: "reduce",
    targets: ["sea.mackerel"],
    amount: 0.3,
    image: "img/event/event-sea-overfish",
    because: "사람들이 고등어를 많이 잡아서",
  },
  {
    id: "sea.warm",
    theme: "sea",
    title: "바닷물이 따뜻해졌어요",
    story: "바닷물 온도가 계속 높아지고 있어요. 바닷가 바위에 미역과 톳이 잘 자라지 못해요.",
    type: "abiotic", // 지속 기간 없음: 바로 되돌릴 수 없는 변화
    targets: ["sea.wakame", "sea.hijiki"],
    amount: 0.4,
    image: "img/event/event-sea-warm",
    because: "바닷물이 따뜻해져",
  },
  {
    id: "sea.oil",
    theme: "sea",
    title: "바다에 기름이 흘렀어요",
    story: "배에서 기름이 흘러 바닷가 바위를 덮었어요. 게와 바위의 해조류가 살기 힘들어요.",
    type: "mortality",
    targets: ["sea.crab", "sea.wakame", "sea.hijiki"],
    amount: 0.4,
    duration: 10,
    image: "img/event/event-sea-oil",
    because: "기름이 흘러",
  },
  {
    id: "sea.jelly-boom",
    theme: "sea",
    title: "해파리가 크게 늘었어요",
    story: "바닷가에 해파리가 아주 많이 나타났어요. 해파리 떼가 바다를 떠다녀요.",
    type: "boost",
    targets: ["sea.jellyfish"],
    amount: 1.8,
    image: "img/event/event-sea-jelly-boom",
    because: "해파리가 크게 늘어",
  },
];
