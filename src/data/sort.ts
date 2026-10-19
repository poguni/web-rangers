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
