// DESIGN 7.1 FoodWebCanvas + 7.2 화살표 잇기 입력(끌어서 잇기·눌러서 잇기를 Pointer Events 하나로)
import { useId, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type RefObject } from "react";
import { BOARD, type Point } from "../game/build";
import { PLACEHOLDER } from "../data/placeholders";
import type { Role } from "../data/types";

export interface BoardNode {
  id: string;
  name: string;
  image: string;
  role: Role;
  x: number;
  y: number;
  state?: "ghost" | "shake";
}

export interface BoardEdge {
  from: string;
  to: string;
  kind: "ok" | "bad" | "hint" | "decomp";
  fresh?: boolean; // 방금 이은 화살표(그려지는 효과)
}

const R = 32; // 노드 반지름
const MAGNET = 60; // 끌어서 놓을 때 이 거리 안의 생물에 자석처럼 붙음
const DRAG_START = 8; // px
const ROLE_COLOR: Record<Role, string> = {
  producer: "var(--producer)",
  consumer: "var(--consumer)",
  decomposer: "var(--decomposer)",
};
const MARKERS = { plain: "#8D8574", ok: "#3F9A4E", bad: "#D1495B", rubber: "#24466B", decomp: "#8B6B4E" };

/** 화면 좌표 → 판 좌표(viewBox) */
export function clientToBoard(svg: SVGSVGElement, x: number, y: number): Point {
  const p = new DOMPoint(x, y).matrixTransform(svg.getScreenCTM()!.inverse());
  return { x: p.x, y: p.y };
}

interface Props {
  nodes: BoardNode[];
  edges: BoardEdge[];
  label: string;
  svgRef: RefObject<SVGSVGElement | null>;
  onLink: (from: string, to: string) => void;
  /** 빈 곳을 눌렀을 때(카드 놓기) */
  onBoardTap?: (p: Point) => void;
  decomposerBox?: boolean;
}

export function FoodWebBoard({ nodes, edges, label, svgRef, onLink, onBoardTap, decomposerBox }: Props) {
  const uid = useId();
  const [pick, setPick] = useState<string | null>(null);
  const [rubber, setRubber] = useState<{ from: string; x: number; y: number } | null>(null);
  const down = useRef<{ from: string; x: number; y: number; moved: boolean } | null>(null);
  const dropping = useRef(false); // 끌어서 잇기를 끝낸 pointerup 바로 뒤에 오는 click 하나만 무시
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const toBoard = (x: number, y: number) => clientToBoard(svgRef.current!, x, y);

  function tapNode(id: string) {
    if (dropping.current) return;
    if (pick === null) setPick(id);
    else if (pick === id) setPick(null);
    else {
      onLink(pick, id);
      setPick(null);
    }
  }

  function onNodePointerDown(id: string, e: PointerEvent) {
    if (e.button !== 0) return;
    down.current = { from: id, x: e.clientX, y: e.clientY, moved: false };
  }

  function onPointerMove(e: PointerEvent<SVGSVGElement>) {
    const d = down.current;
    if (!d) return;
    if (e.buttons === 0) {
      // 판 밖에서 손을 떼 pointerup을 못 받은 경우: 끌기 상태를 버림
      down.current = null;
      setRubber(null);
      return;
    }
    if (!d.moved) {
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < DRAG_START) return;
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      setPick(null);
    }
    setRubber({ from: d.from, ...toBoard(e.clientX, e.clientY) });
  }

  function onPointerUp(e: PointerEvent<SVGSVGElement>) {
    const d = down.current;
    down.current = null;
    if (!d?.moved) return;
    setRubber(null);
    dropping.current = true;
    setTimeout(() => (dropping.current = false));
    const p = toBoard(e.clientX, e.clientY);
    let best: BoardNode | null = null;
    let bestDist = MAGNET;
    for (const n of nodes) {
      const dist = Math.hypot(n.x - p.x, n.y - p.y);
      if (n.id !== d.from && n.state !== "ghost" && dist < bestDist) {
        best = n;
        bestDist = dist;
      }
    }
    if (best) onLink(d.from, best.id);
  }

  function onBackgroundClick(e: MouseEvent<SVGSVGElement>) {
    if (dropping.current) return;
    if (pick) setPick(null);
    else onBoardTap?.(toBoard(e.clientX, e.clientY));
  }

  const onNodeKey = (id: string) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      tapNode(id);
    }
  };

  const okList = edges
    .filter((e) => e.kind === "ok")
    .map((e) => `${byId.get(e.from)?.name} → ${byId.get(e.to)?.name}`)
    .join(", ");

  return (
    <svg
      ref={svgRef}
      className="web"
      viewBox={`0 0 ${BOARD.width} ${BOARD.height}`}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        down.current = null;
        setRubber(null);
      }}
      onClick={onBackgroundClick}
    >
      <desc>{okList ? `이은 화살표: ${okList}` : "아직 이은 화살표가 없어요."}</desc>
      <defs>
        {Object.entries(MARKERS).map(([k, color]) => (
          <marker key={k} id={`${uid}-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={color} />
          </marker>
        ))}
      </defs>

      {decomposerBox && (
        <g aria-hidden="true">
          <rect x="800" y="405" width="155" height="120" rx="14" fill="#F7F0E6" stroke="#E2D6BC" strokeDasharray="6 6" />
          <text x="812" y="425" className="cap">
            분해자
          </text>
        </g>
      )}

      {edges.map((ed) => {
        const a = byId.get(ed.from);
        const b = byId.get(ed.to);
        if (!a || !b) return null;
        const marker = ed.kind === "hint" ? undefined : `url(#${uid}-${ed.kind})`;
        return <Arrow key={`${ed.kind}-${ed.from}-${ed.to}`} a={a} b={b} className={`edge ${ed.kind}${ed.fresh ? " fresh" : ""}`} marker={marker} />;
      })}
      {rubber && byId.get(rubber.from) && (
        <Arrow a={byId.get(rubber.from)!} b={{ x: rubber.x, y: rubber.y }} className="edge rubber" marker={`url(#${uid}-rubber)`} free />
      )}

      {nodes.map((n) => (
        <g
          key={n.id}
          className="node-pos"
          style={{ transform: `translate(${n.x}px, ${n.y}px)` }}
        >
          <g
            className={`node${pick === n.id ? " pick" : ""}${n.state ? ` ${n.state}` : ""}`}
            role="button"
            tabIndex={n.state === "ghost" ? -1 : 0}
            aria-label={pick === n.id ? `${n.name} (골랐어요)` : n.name}
            data-node={n.id}
            onPointerDown={(e) => onNodePointerDown(n.id, e)}
            onClick={(e) => {
              e.stopPropagation();
              tapNode(n.id);
            }}
            onKeyDown={onNodeKey(n.id)}
          >
            <g>
              <circle className="hit" r={R + 12} />
              <circle className="ring" r={40} />
              <circle className="bg" r={R} stroke={ROLE_COLOR[n.role]} />
              <text className="emo" y={1}>
                {PLACEHOLDER[n.image] ?? "❔"}
              </text>
              <text className="nm" y={50}>
                {n.name}
              </text>
            </g>
          </g>
        </g>
      ))}
    </svg>
  );
}

/** 노드 가운데에서 (ux, uy) 쪽으로 화살표를 띄울 거리. 아래쪽(이름 글자 자리)으로 드나들면 글자 아래까지 띄움 */
function gap(ux: number, uy: number) {
  return uy > 0 && Math.abs(ux) < 0.6 ? 62 : R + 4;
}

/** 화살표 끝을 노드 반지름 + 여유 4만큼 줄여 화살촉이 원에 가려지지 않게(DESIGN 12장 3번) */
function Arrow({ a, b, className, marker, free }: { a: Point; b: Point; className: string; marker?: string; free?: boolean }) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const startGap = gap(dx / len, dy / len);
  const endGap = free ? 0 : gap(-dx / len, -dy / len);
  return (
    <line
      x1={a.x + (dx / len) * startGap}
      y1={a.y + (dy / len) * startGap}
      x2={b.x - (dx / len) * endGap}
      y2={b.y - (dy / len) * endGap}
      className={className}
      markerEnd={marker}
      pathLength={className.includes("fresh") ? 1 : undefined} // 그려지는 효과(app.css @keyframes draw)용
    />
  );
}
