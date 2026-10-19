// F3 먹이그물 만들기: 연결 판정·힌트·완성·카드 놓을 자리 (화면과 분리한 순수 함수)
import type { Species } from "../data/types";
import { josa } from "../utils/korean";

/** 먹히는 생물(from) → 먹는 생물(to) */
export interface Relation {
  from: string;
  to: string;
}

export interface Point {
  x: number;
  y: number;
}

export type LinkResult =
  | { kind: "ok" }
  | { kind: "already" }
  | { kind: "reversed" | "wrong"; title: string; text: string };

export const linkKey = (from: string, to: string) => `${from}>${to}`;

export function relationsOf(species: Species[]): Relation[] {
  return species.flatMap((s) => s.prey.map((p) => ({ from: p.id, to: s.id })));
}

export function judgeLink(species: Species[], linked: Set<string>, from: string, to: string): LinkResult {
  const byId = new Map(species.map((s) => [s.id, s]));
  const a = byId.get(from)!;
  const b = byId.get(to)!;
  if (b.prey.some((p) => p.id === from)) return { kind: linked.has(linkKey(from, to)) ? "already" : "ok" };
  if (a.prey.some((p) => p.id === to)) {
    return {
      kind: "reversed",
      title: "방향을 다시 생각해 봐요!",
      text: `${josa(a.name, "이/가")} ${josa(b.name, "을/를")} 먹어요. 화살표는 먹히는 생물 → 먹는 생물로 그려요.`,
    };
  }
  if (b.role === "producer") {
    return {
      kind: "wrong",
      title: "다시 생각해 봐요!",
      text: `${josa(b.name, "은/는")} 햇빛을 받아 스스로 양분을 만들어요. 다른 생물을 먹지 않아요.`,
    };
  }
  return {
    kind: "wrong",
    title: "다시 생각해 봐요!",
    text: `${josa(b.name, "은/는")} ${josa(a.name, "을/를")} 먹지 않아요. 누가 누구를 먹는지 다시 생각해 봐요.`,
  };
}

/** 아직 잇지 않은 관계 하나. 판에 놓인 생물끼리, 아래(생산자) 쪽 관계부터 */
export function pickHint(species: Species[], linked: Set<string>, placed: Set<string>): Relation | null {
  const layer = new Map(species.map((s) => [s.id, s.layer ?? 0]));
  const candidates = relationsOf(species)
    .filter((r) => !linked.has(linkKey(r.from, r.to)) && placed.has(r.from) && placed.has(r.to))
    .sort((p, q) => layer.get(p.from)! - layer.get(q.from)! || layer.get(p.to)! - layer.get(q.to)!);
  return candidates[0] ?? null;
}

/** F3-9: 정해진 관계의 80% 이상을 이으면 완성 */
export const completionTarget = (total: number) => Math.ceil(total * 0.8);

/** F3-5: 힌트를 쓸 때마다 별 1개 감점(최소 1개) */
export const starsFor = (hintsUsed: number) => Math.max(1, 3 - hintsUsed);

// 먹이그물 판(viewBox 960×530)에서 카드를 놓을 수 있는 곳
export const BOARD = { width: 960, height: 530 };
const MIN_GAP = 84; // 노드 지름 64 + 이름 글자 여유
const AREA = { left: 45, right: 915, top: 45, bottom: 470 };
const DECOMPOSER_BOX = { left: 790, top: 395 }; // 오른쪽 아래 분해자 상자

function isFree(p: Point, others: Point[]) {
  const inBox = p.x > DECOMPOSER_BOX.left && p.y > DECOMPOSER_BOX.top;
  return !inBox && others.every((o) => Math.hypot(o.x - p.x, o.y - p.y) >= MIN_GAP);
}

/** 놓은 자리가 다른 카드와 겹치면 가까운 빈자리를 찾음 */
export function findFreeSpot(p: Point, others: Point[]): Point {
  const clamp = (q: Point) => ({
    x: Math.min(AREA.right, Math.max(AREA.left, q.x)),
    y: Math.min(AREA.bottom, Math.max(AREA.top, q.y)),
  });
  const start = clamp(p);
  for (let ring = 0; ring <= 6; ring++) {
    const steps = ring === 0 ? 1 : 8 * ring;
    for (let k = 0; k < steps; k++) {
      const angle = (2 * Math.PI * k) / steps;
      const q = clamp({ x: start.x + Math.cos(angle) * ring * 50, y: start.y + Math.sin(angle) * ring * 50 });
      if (isFree(q, others)) return q;
    }
  }
  return start;
}
