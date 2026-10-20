// F8-5 도전 코드형 대항전(학생 크롬북): 코드·모둠 번호 넣기 → 3라운드(예측 → 관찰 → 정답) → 점수와 확인 문자
import { useMemo, useState } from "react";
import type { Route } from "../App";
import { AppBar, Pic } from "../components/common";
import { ChangeChip, EventCardView, ObservePanel } from "../components/observe";
import { yearNotes } from "../engine/explain";
import { CHALLENGE_ROUNDS, checkMark, parseChallenge } from "../game/challenge";
import { YEARS, type Answer } from "../game/stage";
import { prepareRound, ROUND_POINTS } from "../game/team";
import { josa } from "../utils/korean";

const ANSWERS: [Answer, string, string][] = [
  ["up", "▲", "늘어요"],
  ["down", "▼", "줄어요"],
  ["same", "●", "비슷해요"],
];
const MARK = Object.fromEntries(ANSWERS.map(([a, m, t]) => [a, `${m} ${t}`])) as Record<Answer, string>;
const GROUPS = Array.from({ length: 8 }, (_, i) => i + 1);

type Phase = "predict" | "observe" | "check";

export function ChallengeScreen({ go }: { go: (r: Route) => void }) {
  const [code, setCode] = useState("");
  const [group, setGroup] = useState<number | null>(null);
  const [started, setStarted] = useState<{ code: string; group: number } | null>(null);
  const [error, setError] = useState("");

  if (started) return <Challenge {...started} go={go} />;

  function start() {
    if (!parseChallenge(code)) return setError("코드가 맞지 않아요. 선생님이 알려 준 네 자리 숫자를 다시 넣어 주세요.");
    setStarted({ code, group: group! });
  }

  return (
    <div className="screen">
      <AppBar crumb="도전 코드 대항전" onExit={() => go("")} />
      <main className="body" style={{ alignItems: "center" }}>
        <section className="panel pinpad" style={{ maxWidth: 640 }}>
          <h2>🏁 선생님이 알려 준 도전 코드를 넣어 주세요</h2>
          <div className="code-box" aria-label={`넣은 코드 ${code || "없음"}`}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i}>{code[i] ?? ""}</span>
            ))}
          </div>
          <div className="pin-keys">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "←"].map((k) =>
              k === "" ? (
                <span key="blank" />
              ) : (
                <button
                  key={k}
                  className="np"
                  aria-label={k === "←" ? "지우기" : `코드 ${k}`}
                  onClick={() => {
                    setError("");
                    setCode(k === "←" ? code.slice(0, -1) : (code + k).slice(0, 4));
                  }}
                >
                  {k}
                </button>
              ),
            )}
          </div>
          <div className="np-row" role="group" aria-label="모둠">
            <b className="np-label">모둠</b>
            <div className="np-btns" style={{ gridTemplateColumns: "repeat(8, 48px)" }}>
              {GROUPS.map((g) => (
                <button key={g} className="np" aria-pressed={group === g} aria-label={`${g}모둠`} onClick={() => setGroup(g)}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <p className="sub" role="alert" style={{ color: "var(--down)", margin: 0 }}>
              {error}
            </p>
          )}
          <button className="btn gold" disabled={code.length < 4 || !group} onClick={start}>
            도전 시작 →
          </button>
        </section>
      </main>
    </div>
  );
}

function Challenge({ code, group, go }: { code: string; group: number; go: (r: Route) => void }) {
  const challenge = useMemo(() => parseChallenge(code)!, [code]);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>("predict");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [pick, setPick] = useState<Answer | null>(null);
  const finished = answers.length === CHALLENGE_ROUNDS && phase === "check" && round === CHALLENGE_ROUNDS;
  const prepared = useMemo(() => challenge.rounds.map(prepareRound), [challenge]);
  const score = answers.filter((a, i) => a === prepared[i].answer).length * ROUND_POINTS;
  const crumb = `도전 코드 ${code} · ${group}모둠`;

  if (finished) {
    return (
      <div className="screen">
        <AppBar crumb={crumb} onExit={() => go("")} />
        <main className="body" style={{ justifyContent: "center", alignItems: "center" }}>
          <section className="panel" style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <h2 style={{ fontSize: 30, color: "var(--navy)" }}>🏁 도전 끝!</h2>
            <div className="total" style={{ justifyContent: "center" }}>
              <div>
                <div className="sub">{group}모둠 점수</div>
                <div className="big">{score}점</div>
              </div>
              <div>
                <div className="sub">확인 문자</div>
                <div className="big mark" aria-label={`확인 문자 ${checkMark(code, group, score)}`}>
                  {checkMark(code, group, score)}
                </div>
              </div>
            </div>
            <ol className="sub" style={{ textAlign: "left", margin: 0 }}>
              {prepared.map((p, i) => (
                <li key={i}>
                  {p.event.title} → {p.target.name}: 내 답 {MARK[answers[i]]} · 정답 {MARK[p.answer]} {answers[i] === p.answer ? "○" : "✕"}
                </li>
              ))}
            </ol>
            <p style={{ margin: 0 }}>
              선생님께 <b>“{group}모둠, {score}점, {checkMark(code, group, score)}”</b>라고 알려 주세요.
            </p>
            <button className="btn ghost" onClick={() => go("")}>
              처음 화면으로
            </button>
          </section>
        </main>
      </div>
    );
  }

  const p = prepared[round];
  const question = `${YEARS}년 뒤 ${josa(p.target.name, "은/는")} 어떻게 될까요?`;
  const roundLabel = `${round + 1}라운드 / ${CHALLENGE_ROUNDS}`;
  const nextRound = () => {
    setRound(round + 1);
    setPick(null);
    setPhase(round + 1 === CHALLENGE_ROUNDS ? "check" : "predict");
  };

  return (
    <div className="screen">
      <AppBar crumb={crumb} onExit={() => go("")}>
        <span className="pill navy">{roundLabel}</span>
      </AppBar>
      {phase === "predict" && (
        <main className="body">
          <div className="two-col">
            <div className="left">
              <EventCardView model={p.model} event={p.event} label={roundLabel} />
            </div>
            <section className="panel right predict" aria-label="예측">
              <h3>🔎 모둠 토의</h3>
              <div className="q">
                <div className="qh">
                  <span className="num">?</span>
                  <b>{question}</b>
                  <span className="pts">{ROUND_POINTS}점</span>
                </div>
                <div className="choices">
                  {ANSWERS.map(([a, mark, text]) => (
                    <button key={a} className={`choice ${a}`} aria-pressed={pick === a} onClick={() => setPick(a)}>
                      <span className="ar" aria-hidden="true">
                        {mark}
                      </span>
                      {text}
                    </button>
                  ))}
                </div>
              </div>
              <div className="submit-row">
                <span className="sub">답을 정하면 바꿀 수 없어요.</span>
                <button
                  className="btn gold"
                  disabled={!pick}
                  onClick={() => {
                    setAnswers([...answers, pick!]);
                    setPhase("observe");
                  }}
                >
                  답 정하고 관찰하기 →
                </button>
              </div>
            </section>
          </div>
        </main>
      )}
      {phase === "observe" && (
        <main className="body">
          <ObservePanel
            model={p.model}
            scenario={p.scenario}
            layout={p.theme.layout}
            labels={Array.from({ length: YEARS + 1 }, (_, k) => (k === 0 ? "처음" : `${k}년`))}
            notes={yearNotes(p.model, p.scenario, [p.event])}
            highlight={[p.target.id]}
            banner={
              <div className="banner">
                <span className="e">
                  <Pic image={p.event.image} />
                </span>
                <b>{p.event.title}</b>
                <span style={{ opacity: 0.75 }}>
                  우리 답: {p.target.name} {MARK[answers[round]]}
                </span>
              </div>
            }
            next={
              <button className="btn gold sm" onClick={() => setPhase("check")}>
                정답 확인 →
              </button>
            }
          />
        </main>
      )}
      {phase === "check" && (
        <main className="body" style={{ justifyContent: "center", alignItems: "center" }}>
          <section className="panel" style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <h2 style={{ fontSize: 28 }}>{answers[round] === p.answer ? "⭕ 맞았어요!" : "❌ 아쉬워요"}</h2>
            <div>
              {question} 정답은 <b>{MARK[p.answer]}</b> <ChangeChip n={p.scenario.final.N[p.model.index[p.target.id]]} from={100} />
            </div>
            <div className="sub">지금까지 {score}점</div>
            <button className="btn gold" onClick={nextRound}>
              {round + 1 < CHALLENGE_ROUNDS ? "다음 라운드 →" : "결과 보기 →"}
            </button>
          </section>
        </main>
      )}
    </div>
  );
}
