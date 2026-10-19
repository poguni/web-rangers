// F6 사건 탐구 한 판: ① 안정 관찰 → ② 사건 → ③ 예측 → ④ 관찰 → ⑤ 탐구 보고서 → ⑥ 관리인 행동 → 4년 더 → ⑦ 균형 별
import { useMemo, useRef, useState } from "react";
import type { Route } from "../App";
import { AppBar, Pic, starText } from "../components/common";
import { FoodWebBoard } from "../components/FoodWebBoard";
import { ChangeChip, EventCardView, ObservePanel, PopulationBars, Timeline, useYearPlayer, webAt } from "../components/observe";
import { forestStages, type Stage } from "../data/stages";
import { applyAction, unavailableReason } from "../engine/actions";
import { explainAll, influencePath, yearNotes } from "../engine/explain";
import { resolveTargets } from "../engine/events";
import { runScenario } from "../engine/run";
import { toDisplay } from "../engine/scoring";
import { AFTER_YEARS, finalStars, prepareStage, scoreAnswers, THEMES, YEARS, type Answer, type Answers, type PreparedStage } from "../game/stage";
import { useProgress } from "../store/progress";
import { josa } from "../utils/korean";

type Phase = "intro" | "predict" | "observe" | "report" | "after" | "done";
const STEPS: [Phase[], string][] = [
  [["intro", "predict"], "사건"],
  [["predict"], "예측"],
  [["observe", "after"], "관찰"],
  [["report", "done"], "보고서"],
];
const ANSWERS: [Answer, string, string][] = [
  ["up", "▲", "늘어요"],
  ["down", "▼", "줄어요"],
  ["same", "●", "비슷해요"],
];
const ANSWER_TEXT = Object.fromEntries(ANSWERS.map(([a, m, t]) => [a, `${m} ${t}`])) as Record<Answer, string>;
const yearLabels = (n: number, from = 0, first = "처음") => Array.from({ length: n + 1 }, (_, i) => (i === 0 ? first : `${from + i}년`));

export function InvestigateScreen({ stageId, go }: { stageId: string; go: (r: Route) => void }) {
  const stage = forestStages.find((s) => s.id === stageId);
  if (!stage) {
    return (
      <div className="screen">
        <AppBar onExit={() => go("stages")} />
        <main className="body">
          <p>찾는 사건이 없어요.</p>
          <button className="btn" onClick={() => go("stages")}>
            사건 목록으로
          </button>
        </main>
      </div>
    );
  }
  return <Investigation stage={stage} go={go} />;
}

function Investigation({ stage, go }: { stage: Stage; go: (r: Route) => void }) {
  const p = useMemo(() => prepareStage(stage), [stage]);
  const theme = THEMES[stage.theme]!;
  const { model, event } = p;
  const name = (id: string) => model.species[model.index[id]].name;
  const [phase, setPhase] = useState<Phase>("intro");
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [action, setAction] = useState<number | null>(null);
  const recordStage = useProgress((s) => s.recordStage);
  const svgRef = useRef<SVGSVGElement>(null);

  const ready = answers.q1 !== undefined && answers.q2 !== undefined && answers.q3 !== undefined;
  const score = ready ? scoreAnswers(p, answers as Answers) : null;
  const after = useMemo(() => {
    if (action === null) return null;
    const card = stage.actions[action];
    return { card, scenario: runScenario(model, AFTER_YEARS, [], applyAction(model, p.scenario.final, card, `action:${card.type}`)) };
  }, [action, model, p, stage.actions]);
  const stars = score ? finalStars(score, after?.scenario.final.N) : 1;

  function finish() {
    setPhase("done");
    recordStage(stage.id, stars, score!.total + stars * 50);
  }

  const next = forestStages.find((s) => s.number === stage.number + 1);
  const crumb = `${theme.name} › 사건 탐구 ${stage.number}`;
  const steps = (
    <span className="pill navy" aria-label="진행 단계">
      {STEPS.map(([phases, label], i) => (
        <span key={label}>
          {i > 0 && " → "}
          {phases.includes(phase) && !(label === "사건" && phase === "predict") ? <b>{label}</b> : label}
        </span>
      ))}
    </span>
  );
  const hot = resolveTargets(model, event.type === "decomposer" ? ["role:decomposer"] : event.targets).map((i) => model.species[i].id);

  return (
    <div className="screen">
      <AppBar crumb={crumb} onExit={() => go("stages")}>
        {steps}
      </AppBar>

      {phase === "intro" && (
        <main className="body">
          <div className="two-col">
            <div className="left">
              <div className="canvas">
                <FoodWebBoard svgRef={svgRef} label={`${theme.name} 먹이그물`} {...webAt(model, theme.layout)} />
              </div>
            </div>
            <section className="panel right side">
              <h3>지금 {theme.name}은 균형을 이루고 있어요</h3>
              <div className="sub">3년 동안 지켜봤더니 생물 수가 거의 변하지 않았어요.</div>
              <PopulationBars model={model} N={runScenario(model, 3).final.N} ids={model.species.filter((s) => s.role !== "decomposer").map((s) => s.id)} />
              <button className="btn gold" onClick={() => setPhase("predict")}>
                📰 사건 카드 열기
              </button>
            </section>
          </div>
        </main>
      )}

      {phase === "predict" && (
        <main className="body">
          <div className="two-col">
            <div className="left">
              <EventCardView model={model} event={event} label={`사건 탐구 ${stage.number}`} />
              <div className="canvas">
                <FoodWebBoard svgRef={svgRef} label={`${event.title}: 사건이 바로 건드린 생물이 깜빡이는 먹이그물`} {...webAt(model, theme.layout, { hot, decomposers: event.type === "decomposer" })} />
              </div>
            </div>
            <Prediction p={p} answers={answers} setAnswers={setAnswers} onSubmit={() => setPhase("observe")} />
          </div>
        </main>
      )}

      {phase === "observe" &&
        (p.chain ? (
          <main className="body">
            <CompareObserve p={p} onNext={() => setPhase("report")} />
          </main>
        ) : (
          <main className="body">
            <ObservePanel
              model={model}
              scenario={p.scenario}
              layout={theme.layout}
              labels={yearLabels(YEARS)}
              notes={yearNotes(model, p.scenario, [event])}
              highlight={[stage.q1, answers.q2!]}
              banner={
                <div className="banner">
                  <span className="e">
                    <Pic image={event.image} />
                  </span>
                  <b>{event.title}</b>
                  <span style={{ opacity: 0.75 }}>
                    내 예측: {name(stage.q1)} {ANSWER_TEXT[answers.q1!].split(" ")[0]}
                  </span>
                </div>
              }
              next={
                <button className="btn gold sm" onClick={() => setPhase("report")}>
                  탐구 보고서 보기 →
                </button>
              }
            />
          </main>
        ))}

      {phase === "report" && score && (
        <main className="body scroll">
          <Report p={p} answers={answers as Answers} total={score.total} scores={score} />
          {stage.actions.length > 0 ? (
            <section className="panel">
              <h3>
                🛡️ 관리인 행동: {theme.name}의 균형을 되찾아 볼까요? <span className="sub">— 1장만 고를 수 있어요</span>
              </h3>
              <div className="actions">
                {stage.actions.map((a, i) => {
                  const reason = unavailableReason(model, p.scenario.final, a);
                  return (
                    <button key={a.title} className="act" disabled={Boolean(reason)} aria-pressed={action === i} onClick={() => setAction(i)}>
                      <span className="e" aria-hidden="true">
                        <Pic image={a.image} />
                      </span>
                      <b>{a.title}</b>
                      <span className="sub">{reason ?? a.text}</span>
                    </button>
                  );
                })}
              </div>
              <div className="submit-row" style={{ marginTop: 12 }}>
                <button className="btn" disabled={action === null} onClick={() => setPhase("after")}>
                  행동하고 {AFTER_YEARS}년 더 지켜보기 →
                </button>
              </div>
            </section>
          ) : (
            <div className="submit-row">
              <button className="btn gold" onClick={finish}>
                탐구 마치기 →
              </button>
            </div>
          )}
        </main>
      )}

      {phase === "after" && after && (
        <main className="body">
          <ObservePanel
            model={model}
            scenario={after.scenario}
            layout={theme.layout}
            labels={yearLabels(AFTER_YEARS, YEARS, "행동")}
            notes={yearNotes(model, after.scenario, [event])}
            highlight={[]}
            intro={`${after.card.title}! ▶ 재생을 눌러 ${AFTER_YEARS}년 동안 어떻게 되는지 지켜봐요.`}
            banner={
              <div className="banner">
                <span className="e">
                  <Pic image={after.card.image} />
                </span>
                <b>{after.card.title}</b>
              </div>
            }
            next={
              <button className="btn gold sm" onClick={finish}>
                균형 별 보기 →
              </button>
            }
          />
        </main>
      )}

      {phase === "done" && score && (
        <main className="body">
          <section className="panel total" style={{ justifyContent: "center", textAlign: "center", flexDirection: "column" }}>
            <h2 style={{ fontSize: 30, color: "var(--navy)" }}>🎉 사건 탐구 {stage.number} 완료!</h2>
            <div className="stars" style={{ fontSize: 40 }} aria-label={`균형 별 ${stars}개`}>
              {starText(stars)}
            </div>
            <div>
              {after
                ? stars === 3
                  ? `${theme.name}이 처음과 거의 같아졌어요. 균형을 되찾았어요!`
                  : stars === 2
                    ? "모든 생물이 살아 있지만, 아직 처음과는 달라요."
                    : "아직 사라진 생물이 있어요. 다른 행동도 생각해 봐요."
                : "먹이사슬과 먹이그물의 차이를 잘 살펴봤어요."}
            </div>
            <div className="total" style={{ justifyContent: "center" }}>
              <div>
                <div className="sub">이번 탐구 점수</div>
                <div className="big">{score.total + stars * 50}점</div>
              </div>
              <div className="sub" style={{ textAlign: "left" }}>
                예측 {score.total}점
                <br />
                균형 별 {stars} × 50점
              </div>
            </div>
            <div className="submit-row" style={{ justifyContent: "center" }}>
              <button className="btn ghost" onClick={() => go("stages")}>
                사건 목록
              </button>
              <button
                className="btn ghost"
                onClick={() => {
                  setAnswers({});
                  setAction(null);
                  setPhase("intro");
                }}
              >
                ↺ 다시 하기
              </button>
              {next && (
                <button className="btn gold" onClick={() => go(`stage/${next.id}`)}>
                  다음 사건 →
                </button>
              )}
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

function Prediction({
  p,
  answers,
  setAnswers,
  onSubmit,
}: {
  p: PreparedStage;
  answers: Partial<Answers>;
  setAnswers: (a: Partial<Answers>) => void;
  onSubmit: () => void;
}) {
  const { stage, model } = p;
  const target = model.species[model.index[stage.q1]];
  const set = (a: Partial<Answers>) => setAnswers({ ...answers, ...a });
  const ready = answers.q1 !== undefined && answers.q2 !== undefined && answers.q3 !== undefined;
  return (
    <section className="panel right predict" aria-label="예측">
      <h3>🔎 탐험대원의 예측</h3>
      <div className="q" role="group" aria-labelledby="q1">
        <div className="qh">
          <span className="num">1</span>
          <b id="q1">
            {p.chain ? "먹이사슬 한 줄에서 " : ""}
            {YEARS}년 뒤 {josa(target.name, "은/는")} 어떻게 될까요?
          </b>
          <span className="pts">100점</span>
        </div>
        <div className="choices">
          {ANSWERS.map(([a, mark, text]) => (
            <button key={a} className={`choice ${a}`} aria-pressed={answers.q1 === a} onClick={() => set({ q1: a })}>
              <span className="ar" aria-hidden="true">
                {mark}
              </span>
              {text}
            </button>
          ))}
        </div>
      </div>
      <div className="q" role="group" aria-labelledby="q2">
        <div className="qh">
          <span className="num">2</span>
          <b id="q2">{p.chain ? `${josa(target.name, "이/가")} 더 크게 변하는 쪽은?` : "가장 크게 변할 생물은?"}</b>
          <span className="pts">150점</span>
        </div>
        {p.chain ? (
          <div className="choices two">
            {[
              ["chain", "🔗 먹이사슬"],
              ["web", "🕸️ 먹이그물"],
            ].map(([k, label]) => (
              <button key={k} className="choice" aria-pressed={answers.q2 === k} onClick={() => set({ q2: k })}>
                {label}
              </button>
            ))}
          </div>
        ) : (
          <div className="pick-grid">
            {stage.q2.map((id) => {
              const s = model.species[model.index[id]];
              return (
                <button key={id} className="pick" aria-pressed={answers.q2 === id} onClick={() => set({ q2: id })}>
                  <span className="e">
                    <Pic image={s.image} />
                  </span>
                  {s.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="q" role="group" aria-labelledby="q3">
        <div className="qh">
          <span className="num">3</span>
          <b id="q3">왜 그렇게 생각했나요?</b>
          <span className="pts">100점</span>
        </div>
        <div className="reasons">
          {stage.q3.map((r, i) => (
            <button key={r.text} className="reason" aria-pressed={answers.q3 === i} onClick={() => set({ q3: i })}>
              <span className="dot" aria-hidden="true" />
              <span className="mini" aria-hidden="true">
                {r.icons}
              </span>
              {r.text}
            </button>
          ))}
        </div>
      </div>
      <div className="submit-row">
        {!ready && <span className="sub">세 질문에 모두 답하면 관찰할 수 있어요.</span>}
        <button className="btn gold" disabled={!ready} onClick={onSubmit}>
          예측 제출하고 관찰하기 →
        </button>
      </div>
    </section>
  );
}

/** 먹이사슬 비교 탐구의 관찰: 같은 사건을 먹이사슬 한 줄과 먹이그물에 나란히 */
function CompareObserve({ p, onNext }: { p: PreparedStage; onNext: () => void }) {
  const chain = p.chain!;
  const player = useYearPlayer(YEARS);
  const ids = p.stage.compareChain!;
  const y = player.year;
  const v = (side: "chain" | "web") =>
    side === "chain" ? toDisplay(chain.scenario.series[YEARS][chain.model.index[p.stage.q1]]) : toDisplay(p.scenario.series[YEARS][p.model.index[p.stage.q1]]);
  const name = p.model.species[p.model.index[p.stage.q1]].name;
  return (
    <>
      <div className="obs-top">
        <div className="banner">
          <span className="e">
            <Pic image={p.event.image} />
          </span>
          <b>{p.event.title}</b>
          <span style={{ opacity: 0.75 }}>먹이사슬 한 줄과 먹이그물에 같은 사건</span>
        </div>
        <Timeline
          labels={yearLabels(YEARS)}
          player={player}
          next={
            <button className="btn gold sm" onClick={onNext}>
              탐구 보고서 보기 →
            </button>
          }
        />
      </div>
      <div className="compare">
        <section className="panel side">
          <h3>🔗 먹이사슬 한 줄</h3>
          <div className="sub">{ids.map((id) => chain.model.species[chain.model.index[id]].name).join(" → ")}</div>
          <PopulationBars model={chain.model} N={chain.scenario.series[y]} ids={ids} highlight={[p.stage.q1]} />
        </section>
        <section className="panel side">
          <h3>🕸️ 먹이그물</h3>
          <div className="sub">숲의 생물 14종이 모두 이어져 있어요.</div>
          <PopulationBars model={p.model} N={p.scenario.series[y]} ids={ids} highlight={[p.stage.q1]} />
        </section>
      </div>
      <div className="toast info" role="status">
        <span className="ic" aria-hidden="true">
          💬
        </span>
        <div>
          {y < YEARS
            ? "▶ 재생을 눌러 두 쪽의 막대를 비교해 보세요."
            : `${YEARS}년 뒤 ${josa(name, "은/는")} 먹이사슬에서 ${v("chain")}, 먹이그물에서 ${v("web")}이 되었어요.`}
        </div>
      </div>
    </>
  );
}

function Report({ p, answers, total, scores }: { p: PreparedStage; answers: Answers; total: number; scores: { q1: number; q2: number; q3: number } }) {
  const { stage, model, scenario, event } = p;
  const sp = (id: string) => model.species[model.index[id]];
  const N = (id: string) => scenario.final.N[model.index[id]];
  const q1Model = p.chain?.model ?? model;
  const q1N = (p.chain?.scenario ?? scenario).final.N[q1Model.index[stage.q1]];
  const path = influencePath(model, scenario, stage.q1);
  const pathEvent = path.fromEvent ? event : null;
  const explains = explainAll(model, scenario, [event]);
  const shown = explains.slice(0, 4);
  const q1Ex = explains.find((e) => e.id === stage.q1);
  if (q1Ex && !shown.includes(q1Ex)) shown[3] = q1Ex;
  const mark = (pts: number, full: number) => (pts === full ? "ok" : pts > 0 ? "half" : "no");
  const message =
    total >= 350 ? "화살표를 따라 정확히 추리했어요!" : total >= 200 ? "잘했어요! 틀린 부분은 영향이 퍼진 길을 다시 살펴봐요." : "괜찮아요. 영향이 퍼진 길을 따라가며 까닭을 살펴봐요.";
  const correctReason = stage.q3.find((r) => r.correct)!;
  const biggest = p.chain ? null : sp(p.q2Answer);

  return (
    <>
      <section className="panel total">
        <div>
          <div className="sub">예측 점수</div>
          <div className="big">{total}점</div>
        </div>
        <div className="sub" style={{ flex: "1 1 260px" }}>
          {message}
        </div>
      </section>
      <div className="report">
        <div className={`score ${mark(scores.q1, 100)}`}>
          <div className="top">
            <b>① {josa(sp(stage.q1).name, "은/는")} 어떻게 될까?</b>
            <span className="mk">{scores.q1 ? "○" : "✕"}</span>
          </div>
          <div>
            내 답 {ANSWER_TEXT[answers.q1]} · 결과 <ChangeChip n={q1N} from={100} />
          </div>
          <div className="pt">+{scores.q1}</div>
        </div>
        <div className={`score ${mark(scores.q2, 150)}`}>
          <div className="top">
            <b>② {p.chain ? "더 크게 변하는 쪽" : "가장 크게 변할 생물"}</b>
            <span className="mk">{scores.q2 === 150 ? "○" : scores.q2 > 0 ? "△" : "✕"}</span>
          </div>
          {p.chain ? (
            <div>
              내 답 {answers.q2 === "chain" ? "🔗 먹이사슬" : "🕸️ 먹이그물"} · 정답 {p.q2Answer === "chain" ? "🔗 먹이사슬" : "🕸️ 먹이그물"}
            </div>
          ) : (
            <div>
              내 답 <Pic image={sp(answers.q2).image} /> {sp(answers.q2).name} <ChangeChip n={N(answers.q2)} />
              {scores.q2 < 150 && (
                <>
                  {" "}
                  · 가장 크게 변한 생물 {biggest!.name} <ChangeChip n={N(biggest!.id)} />
                </>
              )}
            </div>
          )}
          <div className="pt">+{scores.q2}</div>
        </div>
        <div className={`score ${mark(scores.q3, 100)}`}>
          <div className="top">
            <b>③ 왜 그럴까?</b>
            <span className="mk">{scores.q3 ? "○" : "✕"}</span>
          </div>
          <div>
            {scores.q3 ? "" : "정답: "}
            {correctReason.text}
          </div>
          <div className="pt">+{scores.q3}</div>
        </div>
      </div>
      <section className="panel">
        <h3>🧵 영향이 퍼진 길</h3>
        <div className="chain">
          {pathEvent && (
            <>
              <div className="link">
                <span className="e">
                  <Pic image={pathEvent.image} />
                </span>
                <b>{pathEvent.title}</b>
                <span className="chg down">사건</span>
              </div>
              <span className="to" aria-hidden="true">
                →
              </span>
            </>
          )}
          {path.ids.map((id, i) => (
            <span key={id} style={{ display: "contents" }}>
              {i > 0 && (
                <span className="to" aria-label="다음으로 영향">
                  →
                </span>
              )}
              <div className="link">
                <span className="e">
                  <Pic image={sp(id).image} />
                </span>
                <b>{sp(id).name}</b>
                <ChangeChip n={N(id)} />
              </div>
            </span>
          ))}
        </div>
        <div className="explain">
          {shown.map((e) => (
            <div key={e.id} className="ex">
              <span className="e" aria-hidden="true">
                <Pic image={sp(e.id).image} />
              </span>
              <div>
                <b>{e.title}</b>
                <p>{e.text}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="wrapup">💡 {stage.wrapUp}</p>
        <p className="real-note" style={{ marginTop: 8 }}>
          실제 자연에서는 날씨, 병 같은 더 많은 것이 영향을 줘요. 이 탐구는 변화의 방향을 알아보는 모형이에요.
        </p>
      </section>
    </>
  );
}
