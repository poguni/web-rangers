// F11-1 분류 놀이(생산자·소비자·분해자): 교과서 47쪽 예시 생물 + 숲 생물 + 산호(교과서 45쪽)
import type { Role } from "./types";

export interface SortCard {
  id: string;
  name: string;
  role: Role;
  image: string;
  /** 양분을 얻는 방법(교과서 46쪽 "생물 카드 뒷면"). 틀렸을 때와 맞았을 때 보여 줌 */
  how: string;
  source: string;
}

// 역할이 섞이도록 고정된 순서로 나옴
export const sortCards: SortCard[] = [
  { id: "mushroom", name: "버섯", role: "decomposer", image: "img/forest/forest-mushroom", how: "죽은 나무나 낙엽을 분해해서 양분을 얻어요.", source: "교과서 47쪽" },
  { id: "woodsorrel", name: "괭이밥", role: "producer", image: "img/sort/sort-woodsorrel", how: "햇빛을 받아 스스로 양분을 만들어요.", source: "교과서 47쪽" },
  { id: "tit", name: "박새", role: "consumer", image: "img/sort/sort-tit", how: "애벌레 같은 곤충을 잡아먹고 살아요.", source: "교과서 47쪽" },
  { id: "fleabane", name: "개망초", role: "producer", image: "img/sort/sort-fleabane", how: "햇빛을 받아 스스로 양분을 만들어요.", source: "교과서 47쪽" },
  { id: "mold", name: "곰팡이", role: "decomposer", image: "img/forest/forest-mold", how: "죽은 생물이나 배출물을 분해해서 양분을 얻어요.", source: "교과서 47쪽" },
  { id: "coral", name: "산호", role: "consumer", image: "img/sea/sea-coral", how: "꽃처럼 보이지만 동물이에요. 촉수로 작은 생물을 잡아먹어요.", source: "교과서 45쪽" },
  { id: "grass", name: "풀", role: "producer", image: "img/forest/forest-grass", how: "햇빛을 받아 스스로 양분을 만들어요.", source: "교과서 49쪽" },
  { id: "caterpillar", name: "애벌레", role: "consumer", image: "img/forest/forest-caterpillar", how: "잎을 갉아 먹고 살아요.", source: "교과서 47쪽" },
  { id: "acorn", name: "도토리", role: "producer", image: "img/forest/forest-acorn", how: "상수리나무의 열매예요. 나무는 햇빛을 받아 스스로 양분을 만들어요.", source: "교과서 49쪽" },
  { id: "rabbit", name: "토끼", role: "consumer", image: "img/forest/forest-rabbit", how: "풀과 토끼풀을 먹고 살아요.", source: "교과서 49쪽" },
  { id: "bulbul", name: "직박구리", role: "consumer", image: "img/forest/forest-bulbul", how: "산수유 열매와 곤충을 먹고 살아요.", source: "교과서 49쪽" },
  { id: "frog", name: "개구리", role: "consumer", image: "img/forest/forest-frog", how: "메뚜기와 애벌레를 잡아먹고 살아요.", source: "교과서 49쪽" },
];

// F11-2 생물 요소·비생물 요소 나누기: 교과서 42~45쪽 숲·강·바다 생태계의 구성 요소
export type Factor = "biotic" | "abiotic";
export interface FactorCard {
  id: string;
  name: string;
  factor: Factor;
  image: string;
  how: string;
  source: string;
}

export const FACTORS: Record<Factor, { name: string; icon: string; desc: string }> = {
  biotic: { name: "생물 요소", icon: "🐾", desc: "살아 있는 것이에요. 식물, 동물, 버섯, 세균 등이 있어요." },
  abiotic: { name: "비생물 요소", icon: "☀️", desc: "살아 있지 않은 것이에요. 햇빛, 물, 공기, 흙 등이 있어요." },
};

export const factorCards: FactorCard[] = [
  { id: "sun", name: "햇빛", factor: "abiotic", image: "img/abiotic/abiotic-sun", how: "햇빛은 살아 있지 않아요. 식물이 양분을 만들 때 필요해요.", source: "교과서 42쪽" },
  { id: "squirrel", name: "다람쥐", factor: "biotic", image: "img/forest/forest-squirrel", how: "다람쥐는 살아 있는 동물이에요.", source: "교과서 43쪽" },
  { id: "water", name: "물", factor: "abiotic", image: "img/abiotic/abiotic-water", how: "물은 살아 있지 않아요. 생물이 살아가는 데 꼭 필요해요.", source: "교과서 42쪽" },
  { id: "hornwort", name: "붕어마름", factor: "biotic", image: "img/river/river-hornwort", how: "붕어마름은 물속에서 자라는 식물이에요.", source: "교과서 44쪽" },
  { id: "mushroom", name: "버섯", factor: "biotic", image: "img/forest/forest-mushroom", how: "버섯은 살아 있는 생물이에요. 죽은 생물을 분해해요.", source: "교과서 43쪽" },
  { id: "air", name: "공기", factor: "abiotic", image: "img/abiotic/abiotic-air", how: "공기는 살아 있지 않아요. 생물이 숨을 쉴 때 필요해요.", source: "교과서 42쪽" },
  { id: "coral", name: "산호", factor: "biotic", image: "img/sea/sea-coral", how: "산호는 꽃처럼 보이지만 살아 있는 동물이에요.", source: "교과서 45쪽" },
  { id: "soil", name: "흙", factor: "abiotic", image: "img/abiotic/abiotic-soil", how: "흙은 살아 있지 않아요. 식물이 뿌리를 내리고 자라는 곳이에요.", source: "교과서 43쪽" },
  { id: "melania", name: "다슬기", factor: "biotic", image: "img/river/river-melania", how: "다슬기는 살아 있는 동물이에요.", source: "교과서 44쪽" },
  { id: "wakame", name: "미역", factor: "biotic", image: "img/sea/sea-wakame", how: "미역은 바다에서 자라는 생물이에요.", source: "교과서 45쪽" },
];
