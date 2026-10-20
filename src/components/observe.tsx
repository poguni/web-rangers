// DESIGN 7.5 EventCard, 7.7 PopulationBars·YearTimeline, 05 관찰 화면
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { EventCard } from "../data/types";
import type { Model } from "../engine/calibrate";
import { changeOf, flowEdges } from "../engine/explain";
import type { Scenario } from "../engine/run";
import { toDisplay } from "../engine/scoring";
import { relationsOf } from "../game/build";
import { josa } from "../utils/korean";
import { Pic } from "./common";
import { FoodWebBoard, type BoardEdge, type BoardNode } from "./FoodWebBoard";

const MARK = { up: "▲", down: "▼", same: "●" };

/** 변화 칩: 색 + 기호 + 수 ("▲ 136", "✕ 사라짐"). 외래종은 처음에 없었으므로 "＋ 65" */
export function ChangeChip({ n, from, invader }: { n: number; from?: number; invader?: boolean }) {
  const c = changeOf(n);
  const v = toDisplay(n);
  if (invader && n > 0) return <span className="chg up">＋ {from !== undefined ? `0 → ${v}` : v}</span>;
  if (c === "gone") return <span className="chg gone">✕ 사라짐</span>;
  return (
    <span className={`chg ${c}`}>
      {MARK[c]} {from !== undefined ? `${from} → ${v}` : v}
    </span>
  );
}

const THEME_NEWS = { forest: "숲속 소식", river: "강가 소식", sea: "바닷가 소식", common: "생태계 소식" };

/** 사건이 바로 바꾼 것 한 줄 */
function eventEffect(model: Model, event: EventCard): string {
  const names = event.targets
    .filter((t) => !t.startsWith("role:"))
    .map((t) => model.species[model.index[t]]?.name)
    .filter(Boolean)
    .join("·");
  switch (event.type) {
    case "remove":
      return `✕ ${names} 100 → 0`;
    case "decomposer":
      return "✕ 분해자 100 → 0";
    case "reduce":
      return `▼ ${names} 100 → ${Math.round(event.amount * 100)}`;
    case "boost":
      return `▲ ${names} 100 → ${Math.round(event.amount * 100)}`;
    case "abiotic":
    case "habitat":
      return `▼ ${josa(names || "생산자", "이/가")} 자라는 힘${event.duration ? ` (${event.duration}년 동안)` : ""}`;
    case "mortality":
      return `▼ ${josa(names, "이/가")} 살기 힘들어요${event.duration ? ` (${event.duration}년 동안)` : ""}`;
    case "invasive":
      return `＋ ${names} 0 → ${Math.round(event.amount * 100)}`;
  }
}

export function EventCardView({ model, event, label }: { model: Model; event: EventCard; label: string }) {
  const vanished = event.type === "remove" || event.type === "decomposer";
  return (
    <article className="event-card" aria-label={`사건 카드: ${event.title}`}>
      <div className="head">
        <span>📰 {THEME_NEWS[event.theme]}</span>
        <span>{label}</span>
      </div>
      <div className="pic">
        <span className={vanished ? "gray" : undefined}>
          <Pic image={event.image} />
        </span>
        {vanished && <span className="x">사라짐</span>}
      </div>
      <h2>{event.title}</h2>
      <p>{event.story}</p>
      <div className="meta">
        <span className={`chg ${event.type === "boost" || event.type === "invasive" ? "up" : vanished ? "gone" : "down"}`}>{eventEffect(model, event)}</span>
      </div>
    </article>
  );
}

/** 외래종은 들어오기 전(0)에는 보여 주지 않음 */
export const isHidden = (model: Model, N: number[] | undefined, i: number) => model.invaders.includes(i) && (N?.[i] ?? 0) === 0;

/** 생물 수 막대(최대 150, 처음 100에 점선) */
export function PopulationBars({ model, N, ids, highlight }: { model: Model; N: number[]; ids: string[]; highlight?: string[] }) {
  return (
    <div className="bars" role="list" aria-label="생물 수">
      {ids.filter((id) => !isHidden(model, N, model.index[id])).map((id) => {
        const i = model.index[id];
        const s = model.species[i];
        return (
          <div key={id} role="listitem" className={`bar${highlight?.includes(id) ? " hl" : ""}`} data-bar={id}>
            <span className="e">
              <Pic image={s.image} />
            </span>
            <span className="n">{s.name}</span>
            <div className="track" aria-hidden="true">
              <span className="fill" style={{ width: `${Math.min(100, (N[i] * 100) / 1.5)}%`, background: `var(--${s.role})` }} />
              <span className="base" style={{ left: `${100 / 1.5}%` }} />
            </div>
            <ChangeChip n={N[i]} invader={model.invaders.includes(i)} />
          </div>
        );
      })}
    </div>
  );
}

const PLAY_MS = 1100; // 1.1초에 1년

/** ▶ 재생·⏸ 멈춤·1년 ⏭·↺ 처음부터 */
export function useYearPlayer(last: number) {
  const [year, setYear] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => setYear((y) => Math.min(last, y + 1)), PLAY_MS);
    return () => window.clearInterval(timer.current);
  }, [playing, last]);
  useEffect(() => {
    if (year >= last) setPlaying(false);
  }, [year, last]);
  return {
    year,
    playing,
    toggle: () => {
      if (!playing && year >= last) setYear(0);
      setPlaying((p) => !p);
    },
    step: () => {
      setPlaying(false);
      setYear((y) => Math.min(last, y + 1));
    },
    reset: () => {
      setPlaying(false);
      setYear(0);
    },
  };
}

export function Timeline({ labels, player, next }: { labels: string[]; player: ReturnType<typeof useYearPlayer>; next?: ReactNode }) {
  const last = labels.length - 1;
  return (
    <>
      <div className="turns" aria-label="해마다 진행">
        {labels.map((l, i) => (
          <span key={l} className={`turn${i < player.year ? " done" : i === player.year ? " now" : ""}`} aria-current={i === player.year ? "step" : undefined}>
            {l}
          </span>
        ))}
      </div>
      <div className="controls">
        {player.year < last ? (
          <>
            <button className="btn sm" onClick={player.toggle}>
              {player.playing ? "⏸ 멈춤" : "▶ 재생"}
            </button>
            <button className="btn ghost sm" onClick={player.step}>
              1년 ⏭
            </button>
          </>
        ) : (
          next
        )}
        <button className="btn ghost sm" onClick={player.reset} aria-label="처음부터">
          ↺
        </button>
      </div>
    </>
  );
}

/** 테마 먹이그물을 판 노드·화살표로: 그해 영향이 전해진 화살표는 금색으로 흐르고, 나머지는 흐리게 */
export function webAt(
  model: Model,
  layout: Record<string, { x: number; y: number }>,
  opts: { N?: number[]; flows?: { from: string; to: string }[]; hot?: string[]; decomposers?: boolean } = {},
): { nodes: BoardNode[]; edges: BoardEdge[] } {
  const N = opts.N;
  const flowKeys = new Set((opts.flows ?? []).map((f) => `${f.from}>${f.to}`));
  const showDecomposers = opts.decomposers || (opts.flows ?? []).some((f) => model.species[model.index[f.from]]?.role === "decomposer");
  const nodes: BoardNode[] = model.species
    .filter((s, i) => (s.role !== "decomposer" || showDecomposers) && !isHidden(model, N, i))
    .map((s) => {
      const i = model.index[s.id];
      const n = N?.[i] ?? 1;
      const c = changeOf(n);
      if (model.invaders.includes(i)) return { id: s.id, name: s.name, image: s.image, role: s.role, ...layout[s.id], badge: { text: `＋${toDisplay(n)}`, kind: "up" as const } };
      return {
        id: s.id,
        name: s.name,
        image: s.image,
        role: s.role,
        ...layout[s.id],
        state: c === "gone" ? "gone" : opts.hot?.includes(s.id) ? "hot" : undefined,
        badge: c === "up" || c === "down" ? { text: `${c === "up" ? "▲" : "▼"}${toDisplay(n)}`, kind: c } : undefined,
      };
    });
  const shown = new Set(nodes.map((n) => n.id));
  const edges: BoardEdge[] = [
    ...relationsOf(model.species)
      .filter((r) => shown.has(r.from) && shown.has(r.to) && !flowKeys.has(`${r.from}>${r.to}`))
      .map((r) => ({ ...r, kind: (flowKeys.size ? "dim" : "plain") as BoardEdge["kind"] })),
    ...[...flowKeys].map((k) => {
      const [from, to] = k.split(">");
      return { from, to, kind: "flow" as const };
    }),
  ];
  return { nodes, edges };
}

/** 05 관찰: 왼쪽 영향이 흐르는 먹이그물, 오른쪽 생물 수 막대와 해설 */
export function ObservePanel(props: {
  model: Model;
  scenario: Scenario;
  layout: Record<string, { x: number; y: number }>;
  labels: string[];
  notes: string[]; // notes[year - 1]
  banner: ReactNode;
  highlight: string[];
  next: ReactNode; // 마지막 해에 보이는 버튼
  intro?: string; // 0년 해설
}) {
  const { model, scenario, layout, labels, notes, banner, highlight, next, intro } = props;
  const player = useYearPlayer(labels.length - 1);
  const svgRef = useRef<SVGSVGElement>(null);
  const y = player.year;
  const N = scenario.series[y];
  const flows = y > 0 ? flowEdges(model, scenario, y) : [];
  const { nodes, edges } = webAt(model, layout, { N, flows, decomposers: model.decomposers.some((d) => scenario.final.gone[d]) });
  const ids = model.species
    .filter((s) => s.role !== "decomposer" || model.decomposers.some((d) => scenario.final.gone[d]))
    .map((s) => s.id)
    .sort((a, b) => Math.abs(scenario.final.N[model.index[b]] - 1) - Math.abs(scenario.final.N[model.index[a]] - 1));

  return (
    <>
      <div className="obs-top">
        {banner}
        <Timeline labels={labels} player={player} next={next} />
      </div>
      <div className="obs">
        <div className="canvas">
          <FoodWebBoard svgRef={svgRef} label="영향이 퍼지는 먹이그물" nodes={nodes} edges={edges} decomposerBox={nodes.some((n) => n.role === "decomposer")} />
          <div className="legend">
            <span>
              <i style={{ background: "var(--gold)" }} />
              지금 영향이 전해지는 화살표
            </span>
            <span>▲ 늘었어요</span>
            <span>▼ 줄었어요</span>
          </div>
        </div>
        <section className="panel side">
          <h3>
            생물 수 <span className="sub">— 점선은 처음(100)</span>
          </h3>
          <PopulationBars model={model} N={N} ids={ids} highlight={highlight} />
          <div className="toast info" role="status" style={{ marginTop: "auto" } as CSSProperties}>
            <span className="ic" aria-hidden="true">
              💬
            </span>
            <div>
              <b>{labels[y]}</b> {y === 0 ? (intro ?? "▶ 재생을 눌러 해마다 무슨 일이 일어나는지 관찰해 보세요.") : notes[y - 1]}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
