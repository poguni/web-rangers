// 강 — 교과서 44쪽 생태계 (PRD 5.2 강 표, 교사 확인 완료) + 송사리
// 송사리: 교과서 44쪽 그림의 물고기(사용자 확인, 2026-10-20). 물벼룩을 먹고 왜가리에게 먹힘 → 교사 검토 필요
// 붕어: 교과서에 없지만 붕어마름을 먹고 왜가리에게 먹히는 대표 물고기라 PRD대로 유지
import { speciesMaker } from "./make";
import type { EventCard, Review, Species } from "./types";

const REVIEW: Review[] = [
  { by: "교사(먹이 관계)", at: "2026-10-19", status: "ok" },
  { by: "Claude(사실 문장 1차 검토)", at: "2026-10-20", status: "check" },
];
const NEW_REVIEW: Review[] = [{ by: "Claude(송사리 관계 추가)", at: "2026-10-20", status: "check" }];
const sp = speciesMaker("river", ["교과서 44쪽"], REVIEW);

export const riverSpecies: Species[] = [
  // 생산자
  sp("closterium", "반달말", "producer", 0, "맑은 물속", "아주 작아서 확대해야 보여요. 초승달처럼 생겼어요."),
  sp("hornwort", "붕어마름", "producer", 0, "고인 물, 느리게 흐르는 물속", "뿌리 없이 물속에 떠서 자라요."),
  sp("cattail", "부들", "producer", 0, "강가, 물가", "갈색 소시지처럼 생긴 이삭이 달려요."),
  // 소비자
  sp("daphnia", "물벼룩", "consumer", 1, "물속", "몸이 투명해서 몸속이 보여요.", [["closterium", 1]], { added: true, sources: ["PRD 5.2(추가)"] }),
  sp("melania", "다슬기", "consumer", 1, "맑은 물의 돌 위", "돌에 붙은 작은 조류를 갉아 먹어요.", [["closterium", 1]]),
  sp("nymph", "잠자리 애벌레", "consumer", 2, "물속 돌 밑", "물속에서 살다가 자라면 잠자리가 돼요.", [["daphnia", 1]], {
    added: true,
    sources: ["PRD 5.2(추가)"],
  }),
  sp("medaka", "송사리", "consumer", 2, "논, 얕은 냇물", "물 위쪽을 떼 지어 헤엄쳐요.", [["daphnia", 1]], { review: NEW_REVIEW }),
  sp(
    "crucian",
    "붕어",
    "consumer",
    3,
    "강, 저수지",
    "입수염이 없어 잉어와 구별돼요.",
    [
      ["hornwort", 0.5],
      ["daphnia", 0.25],
      ["nymph", 0.25],
    ],
    { added: true, sources: ["PRD 5.2(추가)"] },
  ),
  sp("duck", "오리", "consumer", 2, "강, 저수지", "물풀과 풀씨를 많이 먹어요.", [
    ["hornwort", 0.3],
    ["cattail", 0.35],
    ["melania", 0.35],
  ]),
  // 섭식량(intake)은 "왜가리 사라짐 → 붕어 ▲ → 붕어마름 ▼"(PRD 강 학습 포인트)가 뚜렷하도록 탐색해 정함(tests/engine/river-sim.test.ts)
  sp(
    "heron",
    "왜가리",
    "consumer",
    4,
    "얕은 물가",
    "긴 다리로 물속을 걸으며 물고기를 잡아요.",
    [
      ["crucian", 0.5],
      ["nymph", 0.2],
      ["medaka", 0.3],
    ],
    { intake: 0.5 },
  ),
  sp("falcon", "매", "consumer", 4, "바닷가 절벽, 높은 나무", "주로 날아다니는 새를 사냥해요.", [["duck", 1]], { tags: ["endangered"] }),
  // 분해자: 교과서 47쪽 "일부 세균"
  sp("bacteria", "세균", "decomposer", 0, "강바닥 진흙", "죽은 생물을 분해해 양분을 물과 흙으로 돌려보내요.", [], { added: true, sources: ["교과서 47쪽"] }),
];

/** 외래종(사건으로만 들어옴). 먹는 동물이 거의 없어 잘 줄지 않음 */
export const riverBass: Species = sp(
  "bass",
  "큰입배스",
  "consumer",
  4,
  "강, 호수",
  "입이 아주 커서 자기보다 조금 작은 물고기도 삼켜요.",
  [
    ["crucian", 0.5],
    ["medaka", 0.3],
    ["nymph", 0.2],
  ],
  // intake: 많이 먹고 먹히지 않아 붕어·송사리를 크게 줄이도록(탐색해 정함)
  { tags: ["invasive"], added: true, intake: 1, image: "img/river/invasive-bass", sources: ["PRD 5.2(외래종)", "환경부 생태계 교란 생물"] },
);

export const riverLayout: Record<string, { x: number; y: number }> = {
  "river.closterium": { x: 170, y: 470 },
  "river.hornwort": { x: 470, y: 470 },
  "river.cattail": { x: 690, y: 470 },
  "river.daphnia": { x: 110, y: 365 },
  "river.melania": { x: 330, y: 365 },
  "river.nymph": { x: 60, y: 260 },
  "river.medaka": { x: 230, y: 170 },
  "river.crucian": { x: 410, y: 245 },
  "river.duck": { x: 640, y: 260 },
  "river.heron": { x: 230, y: 60 },
  "river.falcon": { x: 640, y: 60 },
  "river.bass": { x: 560, y: 160 },
  "river.bacteria": { x: 880, y: 470 },
};

export const riverEvents: EventCard[] = [
  {
    id: "river.heron-gone",
    theme: "river",
    title: "왜가리가 사라졌어요",
    story: "강가 갈대숲에서 왜가리가 보이지 않아요. 왜가리가 모두 사라졌어요.",
    type: "remove",
    targets: ["river.heron"],
    amount: 0,
    image: "img/event/event-river-heron-gone",
    because: "왜가리가 사라져",
  },
  {
    id: "river.pollution",
    theme: "river",
    title: "강물이 더러워졌어요",
    story: "더러운 물이 강으로 흘러들었어요. 깨끗한 물에 사는 생물이 살기 힘들어졌어요.",
    type: "mortality",
    targets: ["river.melania", "river.daphnia"],
    amount: 0.4,
    duration: 10,
    image: "img/event/event-river-pollution",
    because: "강물이 더러워져",
  },
  {
    id: "river.bass",
    theme: "river",
    title: "큰입배스가 들어왔어요",
    story: "누군가 강에 큰입배스를 풀어 놓았어요. 큰입배스는 다른 물고기를 잡아먹어요.",
    type: "invasive",
    targets: ["river.bass"],
    amount: 0.3,
    invader: riverBass,
    image: "img/event/event-river-bass",
    because: "큰입배스가 들어와",
    realCase: "큰입배스는 물고기를 늘리려고 들여왔다가 우리나라 강과 호수로 퍼졌어요. 지금은 생태계를 어지럽히는 생물로 정해져 있어요.",
  },
  {
    id: "river.drought",
    theme: "river",
    title: "강물이 줄었어요",
    story: "오랫동안 비가 오지 않아 강물이 줄었어요. 물풀이 잘 자라지 못해요.",
    type: "abiotic",
    targets: ["role:producer"],
    amount: 0.6,
    duration: 10,
    image: "img/event/event-river-drought",
    because: "강물이 줄어",
  },
  {
    id: "river.overfish",
    theme: "river",
    title: "붕어를 너무 많이 잡았어요",
    story: "사람들이 강에서 붕어를 아주 많이 잡아갔어요. 붕어가 크게 줄었어요.",
    type: "reduce",
    targets: ["river.crucian"],
    amount: 0.3,
    image: "img/event/event-river-overfish",
    because: "사람들이 붕어를 잡아가서",
  },
];
