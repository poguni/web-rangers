// PRD 9장 데이터 모델

export type Role = "producer" | "consumer" | "decomposer"; // 교과서 분류(생산자·소비자·분해자)
export type Theme = "forest" | "river" | "sea";

export interface Review {
  by: string;
  at: string;
  status: "ok" | "check";
}

export interface Species {
  id: string; // "forest.snake"
  theme: Theme;
  name: string; // "뱀"
  role: Role;
  layer?: number; // 배치용 층(0=생산자, 1~4=위로 갈수록 먹는 동물). 화면에 표시하지 않음
  image: string; // "img/forest/forest-snake" — 뒤에 "-512.webp" 또는 "-256.webp"를 붙여 씀
  habitat: string; // "숲 바닥, 돌 틈"
  fact: string; // "겨울에는 땅속에서 겨울잠을 자요."
  prey: { id: string; preference: number }[]; // 먹이와 선호도(합 1.0)
  intake?: number; // 섭식량 c_j (없으면 자동 보정 값 사용)
  growth?: number; // 생산자 성장률 r_i (없으면 자동 보정 값 사용)
  tags?: ("endangered" | "invasive")[];
  added?: boolean; // 교과서에 없지만 먹이그물에 꼭 필요해 추가한 생물
  sources: string[]; // 관계·사실의 출처 (예: "교과서 49쪽")
  review?: Review[]; // PRD 5.6 검토 기록
}

export type EventType =
  | "remove" // 생물 사라짐: 대상을 0으로
  | "reduce" // 생물 줄어듦: 대상 수 × amount
  | "abiotic" // 비생물 요소 변화: 대상 생산자의 성장 한도 × amount, duration년 동안
  | "invasive" // 외래종 유입(강 테마, M5에서 구현)
  | "mortality" // 사망 증가: 대상의 1년 사망률 + amount, duration년 동안
  | "habitat" // 서식지 감소: 대상 생산자의 성장 한도 × amount, duration년 동안(없으면 계속)
  | "decomposer" // 분해자 사라짐: 모든 분해자를 0으로
  | "boost"; // 생물 늘어남: 대상 수 × amount

export interface EventCard {
  id: string; // "forest.frog-gone"
  theme: Theme | "common";
  title: string; // "개구리가 모두 사라졌어요"
  story: string; // 소식 형식 2문장
  type: EventType;
  targets: string[]; // 영향 대상 생물 id 또는 "role:producer"
  amount: number; // type 설명 참고
  duration?: number; // 지속 기간(년)
  invader?: Species; // 외래종 유입 시 새 생물
  image: string; // "img/event/event-forest-frog-gone"
  textbook?: string; // 교과서 연결 (예: "48쪽 정리 2")
  realCase?: string; // "실제로 있었던 일" 설명
}
