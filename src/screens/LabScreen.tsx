// F7 자유 실험실: 생물을 없애기·줄이기·늘리기, 사건 고르기, 관찰 기간, 꺾은선 그래프, 먹이사슬과 비교(F7-4)
import { useMemo, useRef, useState } from "react";
import type { Route } from "../App";
import { AppBar, Toast } from "../components/common";
import { useProgress, useStudent } from "../store/progress";
import { FoodWebBoard } from "../components/FoodWebBoard";
import { webAt } from "../components/observe";
import { forestChain } from "../data/forest";
import type { EventCard, Theme } from "../data/types";
import type { Model } from "../engine/calibrate";
import { explainAll } from "../engine/explain";
import { runScenario, type Scenario } from "../engine/run";
import { judge, toDisplay } from "../engine/scoring";
import { modelFor, THEMES } from "../game/stage";
import { josa } from "../utils/korean";

type Op = "remove" | "reduce" | "boost";
const OPS: [Op, string, string, number][] = [
  ["remove", "✕", "없애기", 0],
  ["reduce", "▼", "줄이기", 0.5],
  ["boost", "▲", "늘리기", 1.5],
];
const PERIODS = [4, 8, 16];
// 선 색(역할 색과 겹치지 않는 구분용): 이름을 선 끝에 바로 붙여 색만으로 구분하지 않음
const LINE_COLORS = ["#24466B", "#D1495B", "#1F8A70", "#8A5E00", "#7A4FA0", "#3F86A0"];
const MAX_LINES = 6;

function opEvent(theme: Theme, id: string, op: Op): EventCard {
  const amount = OPS.find((o) => o[0] === op)![3];
  return { id: `lab.${op}.${id}`, theme, title: "", story: "", type: op, targets: [id], amount, image: "", because: "실험으로" };
}

interface Result {
  years: number;
  web: Scenario;
  chain?: Scenario;
  skipped: string[]; // 먹이사슬에 없어 비교에서 빠진 것
}

export function LabScreen({ theme: themeId, go }: { theme: Theme; go: (r: Route) => void }) {
  const theme = THEMES[themeId];
  const canCompare = themeId === "forest"; // 교과서 먹이사슬(풀 → 메뚜기 → 개구리)이 있는 숲만 비교
  const svgRef = useRef<SVGSVGElement>(null);
  const [ops, setOps] = useState<Record<string, Op>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [eventId, setEventId] = useState("");
  const [years, setYears] = useState(8);
  const [compare, setCompare] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  // F7-5 실험 기록장
  const notes = useStudent().notes.filter((n) => n.theme === themeId);
  const addNote = useProgress((s) => s.addNote);
  const removeNote = useProgress((s) => s.removeNote);
  const [memo, setMemo] = useState("");
  const [saved, setSaved] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const event = theme.events.find((e) => e.id === eventId);
  const model = modelFor(themeId, undefined, event ? [event] : []); // 외래종 사건이면 외래종을 넣은 모델
  const chainModel = modelFor("forest", forestChain);
  const sp = (id: string) => model.species[model.index[id]];

  function run() {
    const events = [...Object.entries(ops).map(([id, op]) => opEvent(themeId, id, op)), ...(event ? [event] : [])];
    const web = runScenario(model, years, events.map((e) => ({ atYear: 0, event: e })));
    let chain: Scenario | undefined;
    const skipped: string[] = [];
    if (compare && canCompare) {
      const inChain = (e: EventCard) => e.targets.every((t) => t.startsWith("role:") || forestChain.includes(t));
      const usable = events.filter((e) => inChain(e) && (e.type !== "decomposer" || chainModel.decomposers.length > 0));
      skipped.push(...events.filter((e) => !usable.includes(e)).map((e) => (e.title || sp(e.targets[0]).name)));
      chain = runScenario(chainModel, years, usable.map((e) => ({ atYear: 0, event: e })));
    }
    setResult({ years, web, chain, skipped });
    setSelected(null);
    setSaved(false);
  }

  function reset() {
    setOps({});
    setEventId("");
    setResult(null);
    setSelected(null);
  }

  const { nodes, edges } = webAt(model, theme.layout, { N: result?.web.final.N });
  const shownNodes = nodes.map((n) => {
    const op = ops[n.id];
    const mark = op && OPS.find((o) => o[0] === op)!;
    return {
      ...n,
      state: selected === n.id ? ("pick" as const) : n.state,
      badge: !result && mark ? { text: `${mark[1]}${mark[2]}`, kind: op === "boost" ? ("up" as const) : op === "remove" ? ("gone" as const) : ("down" as const) } : n.badge,
    };
  });

  function saveNote() {
    if (!result) return;
    const setup = [
      ...Object.entries(ops).map(([id, op]) => `${sp(id).name} ${OPS.find((o) => o[0] === op)![2]}`),
      ...(event ? [event.title] : []),
      `${result.years}년`,
    ].join(" · ");
    const changes = model.species
      .map((s, i) => ({ s, i, d: Math.abs(result.web.final.N[i] - 1) }))
      .filter(({ i }) => !Object.keys(ops).includes(model.species[i].id))
      .sort((a, b) => b.d - a.d)
      .slice(0, 3)
      .map(({ s, i }) => {
        const v = toDisplay(result.web.final.N[i]);
        return `${s.name} ${v === 0 ? "✕" : { up: "▲", down: "▼", same: "●" }[judge(v)]} ${v}`;
      });
    addNote({ theme: themeId, setup, result: changes.join(", "), memo: memo.trim() });
    setMemo("");
    setSaved(true);
  }

  const summary = useMemo(() => (result ? explainAll(model, result.web, event ? [event] : []).slice(0, 3) : []), [result, model, event]);

  return (
    <div className="screen">
      <AppBar crumb={`${theme.name} › 자유 실험실`} onExit={() => go("")} />
      <main className="body">
        <div className="toolbar">
          <span className="seg" role="group" aria-label="관찰 기간">
            {PERIODS.map((y) => (
              <button key={y} aria-pressed={years === y} onClick={() => setYears(y)}>
                {y}년
              </button>
            ))}
          </span>
          <select className="sel" aria-label="사건 고르기" value={eventId} onChange={(e) => {
              setEventId(e.target.value);
              setResult(null); // 외래종 사건이면 모델이 바뀌므로 이전 결과를 지움
            }}>
            <option value="">사건 없음</option>
            {theme.events.map((e) => (
              <option key={e.id} value={e.id}>
                📰 {e.title}
              </option>
            ))}
          </select>
          {canCompare && (
            <span className="toggle">
              먹이사슬과 비교
              <button className={`switch${compare ? " on" : ""}`} style={compare ? { background: "var(--navy)" } : undefined} aria-pressed={compare} aria-label="먹이사슬과 비교" onClick={() => setCompare((v) => !v)} />
            </span>
          )}
          <span className="sp" style={{ flex: 1 }} />
          <button className="btn ghost sm" aria-pressed={notesOpen} onClick={() => setNotesOpen((v) => !v)}>
            📒 기록장 {notes.length}
          </button>
          <button className="btn ghost sm" onClick={reset}>
            ↺ 처음부터
          </button>
          <button className="btn gold sm" onClick={run} disabled={Object.keys(ops).length === 0 && !event}>
            ▶ 실험 시작
          </button>
        </div>

        <div className="lab">
          <div className="canvas">
            <FoodWebBoard svgRef={svgRef} label={`실험할 생물을 고르는 ${theme.name} 먹이그물`} nodes={shownNodes} edges={edges} onNodeTap={(id) => setSelected((s) => (s === id ? null : id))} />
            {notesOpen && (
              <div className="done-overlay notes-overlay">
                <div className="panel" role="dialog" aria-label="실험 기록장">
                  <h3>📒 실험 기록장 <span className="sub">— {theme.name}</span></h3>
                  {notes.length === 0 ? (
                    <p className="sub">아직 남긴 실험이 없어요. 실험을 한 뒤 메모와 함께 남겨 보세요.</p>
                  ) : (
                    <ol className="notes">
                      {notes.map((n) => (
                        <li key={n.at}>
                          <b>{n.setup}</b>
                          <span>{n.result}</span>
                          {n.memo && <span className="memo">✏️ {n.memo}</span>}
                          <button className="btn ghost sm" aria-label="이 기록 지우기" onClick={() => removeNote(n.at)}>
                            🗑️
                          </button>
                        </li>
                      ))}
                    </ol>
                  )}
                  <button className="btn" onClick={() => setNotesOpen(false)}>
                    닫기
                  </button>
                </div>
              </div>
            )}
            <div className="op-menu" role="group" aria-label="고른 생물 바꾸기">
              {selected ? (
                <>
                  <b>{sp(selected).name}:</b>
                  {OPS.map(([op, mark, label]) => (
                    <button
                      key={op}
                      className="btn ghost sm"
                      aria-pressed={ops[selected] === op}
                      onClick={() => {
                        setOps({ ...ops, [selected]: op });
                        setResult(null);
                      }}
                    >
                      {mark} {label}
                    </button>
                  ))}
                  <button
                    className="btn ghost sm"
                    onClick={() => {
                      const rest = { ...ops };
                      delete rest[selected];
                      setOps(rest);
                      setResult(null);
                    }}
                  >
                    그대로
                  </button>
                </>
              ) : (
                <span className="sub">생물을 누르면 없애거나 줄이거나 늘릴 수 있어요. 사건을 골라도 돼요.</span>
              )}
            </div>
          </div>

          <section className="panel side">
            <h3>
              생물 수 그래프 <span className="sub">— 점선은 처음(100)</span>
            </h3>
            {result ? (
              <>
                <LineChart model={model} chainModel={chainModel} result={result} focus={Object.keys(ops)} />
                {result.skipped.length > 0 && <p className="real-note">먹이사슬에 없어 비교에서 빠진 것: {result.skipped.join(", ")}</p>}
                <Toast message={summary.length ? { kind: "info", title: "실험 결과", text: summary.map((e) => `${e.title} ${e.text}`).join(" ") } : null} />
                <div className="note-row">
                  <input
                    value={memo}
                    maxLength={60}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="한 줄 메모(예: 개구리가 없으면 풀이 줄어요)"
                    aria-label="실험 메모"
                  />
                  <button className="btn sm" onClick={saveNote} disabled={saved}>
                    {saved ? "✔ 남겼어요" : "📒 기록장에 남기기"}
                  </button>
                </div>
              </>
            ) : (
              <p className="sub" style={{ margin: "auto", textAlign: "center" }}>
                실험을 정하고 ▶ 실험 시작을 누르면
                <br />
                해마다의 생물 수가 꺾은선으로 나타나요.
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

const W = 600;
const H = 340;
const PAD = { l: 34, r: 128, t: 12, b: 26 };
const YMAX = 200;

/** 해마다의 꺾은선(F7-3). 크게 변한 생물과 직접 바꾼 생물을 6개까지, 이름을 선 끝에 붙임 */
function LineChart({ model, chainModel, result, focus }: { model: Model; chainModel: Model; result: Result; focus: string[] }) {
  const { web, chain, years } = result;
  const x = (y: number) => PAD.l + (y / years) * (W - PAD.l - PAD.r);
  const yv = (v: number) => PAD.t + (1 - Math.min(YMAX, v) / YMAX) * (H - PAD.t - PAD.b);
  const changed = model.species
    .map((s, i) => ({ id: s.id, d: Math.abs(web.final.N[i] - 1) }))
    .sort((a, b) => b.d - a.d)
    .map((c) => c.id);
  const ids = [...new Set([...focus, ...(chain ? forestChain : []), ...changed])].slice(0, MAX_LINES);
  const lines = ids.flatMap((id, k) => {
    const color = LINE_COLORS[k % LINE_COLORS.length];
    const name = model.species[model.index[id]].name;
    const out = [{ key: id, color, name, series: web.series.map((N) => toDisplay(N[model.index[id]])), chain: false }];
    if (chain && chainModel.index[id] !== undefined) {
      out.push({ key: `${id}-chain`, color, name: `${name}(사슬)`, series: chain.series.map((N) => toDisplay(N[chainModel.index[id]])), chain: true });
    }
    return out;
  });
  // 선 끝 이름이 겹치지 않게 아래로 밀기
  const labels = lines.map((l) => ({ key: l.key, y: yv(l.series[years]) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i++) labels[i].y = Math.max(labels[i].y, labels[i - 1].y + 14);
  // 아래로 밀려 그래프 밖으로 나가면 거꾸로 위로 올림
  const bottom = H - PAD.b;
  for (let i = labels.length - 1; i >= 0; i--) labels[i].y = Math.min(labels[i].y, i === labels.length - 1 ? bottom : labels[i + 1].y - 14);
  const labelY = new Map(labels.map((l) => [l.key, l.y]));
  const xTicks = Array.from({ length: years + 1 }, (_, i) => i).filter((i) => years <= 8 || i % 2 === 0);
  const desc = lines.map((l) => `${josa(l.name, "은/는")} ${l.series[0]}에서 ${l.series[years]}`).join(", ");

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`생물 수 꺾은선 그래프: ${desc}`}>
      {[0, 50, 100, 150, 200].map((t) => (
        <g key={t}>
          <line className={t === 100 ? "base" : "axis"} x1={PAD.l} x2={W - PAD.r} y1={yv(t)} y2={yv(t)} />
          <text x={PAD.l - 6} y={yv(t) + 4} textAnchor="end">
            {t}
          </text>
        </g>
      ))}
      {xTicks.map((i) => (
        <text key={i} x={x(i)} y={H - 6} textAnchor={i === years ? "end" : "middle"}>
          {i === 0 ? "처음" : `${i}년`}
        </text>
      ))}
      {lines.map((l) => (
        <g key={l.key}>
          <polyline className={`line${l.chain ? " chain" : ""}`} stroke={l.color} points={l.series.map((v, i) => `${x(i)},${yv(v)}`).join(" ")} />
          <text className="lab-name" x={x(years) + 6} y={labelY.get(l.key)! + 4} fill={l.color}>
            {l.name} {l.series[years]}
          </text>
        </g>
      ))}
    </svg>
  );
}
