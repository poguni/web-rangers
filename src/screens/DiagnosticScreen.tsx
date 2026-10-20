// F9 사전·사후 진단: 한 화면에 한 문항, 큰 보기 버튼, 읽어 주기(F9-5), 진행 표시. 점수는 학생에게 보여 주지 않음(F9-3)
import { useEffect, useState } from "react";
import type { Route } from "../App";
import { AppBar } from "../components/common";
import { answerText, DIAG_NAME, DIAGNOSTIC, INDIRECT_ITEM, scoreDiagnostic, type DiagKind } from "../data/diagnostic";
import { useProgress, useStudent } from "../store/progress";

/** 크롬북 기본 음성 합성으로 읽어 주기 */
function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  u.rate = 0.9;
  speechSynthesis.speak(u);
}
const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

export function DiagnosticScreen({ kind, go }: { kind: DiagKind | null; go: (r: Route) => void }) {
  const done = useStudent().diagnostic;
  if (!kind) {
    return (
      <div className="screen">
        <AppBar crumb="진단 문제" onExit={() => go("")} />
        <main className="body">
          <div>
            <h1 style={{ fontSize: 26 }}>어떤 진단 문제를 풀까요?</h1>
            <div className="sub">선생님이 알려 준 진단을 골라요. 진단은 한 번만 풀 수 있어요.</div>
          </div>
          <div className="diag-pick">
            {(["pre", "post"] as const).map((k) => (
              <button key={k} className="stage-card" disabled={Boolean(done[k])} onClick={() => go(`diag/${k}`)}>
                <span className="e" aria-hidden="true">
                  {k === "pre" ? "📝" : "🏁"}
                </span>
                <b>{DIAG_NAME[k]}</b>
                <span className="sub">{k === "pre" ? "공부를 시작하기 전에 풀어요" : "공부를 마친 뒤에 풀어요"}</span>
                <span className="sub">{done[k] ? "✔ 다 풀었어요" : "문제 6개"}</span>
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }
  return <Diagnostic kind={kind} go={go} already={Boolean(done[kind])} />;
}

function Diagnostic({ kind, go, already }: { kind: DiagKind; go: (r: Route) => void; already: boolean }) {
  const items = DIAGNOSTIC[kind];
  const record = useProgress((s) => s.recordDiagnostic);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<(number | string | undefined)[]>([]);
  const [finished, setFinished] = useState(already);
  useEffect(() => () => {
    if (canSpeak) speechSynthesis.cancel();
  }, []);

  const crumb = `진단 문제 › ${DIAG_NAME[kind]}`;
  if (finished) {
    return (
      <div className="screen">
        <AppBar crumb={crumb} onExit={() => go("")} />
        <main className="body" style={{ justifyContent: "center", alignItems: "center" }}>
          <section className="panel" style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <h2 style={{ fontSize: 30, color: "var(--navy)" }}>🎉 {DIAG_NAME[kind]}을 다 풀었어요!</h2>
            <p style={{ margin: 0 }}>수고했어요. 선생님이 결과를 살펴볼 거예요.</p>
            <button className="btn gold" onClick={() => go("")}>
              처음 화면으로 →
            </button>
          </section>
        </main>
      </div>
    );
  }

  const item = items[i];
  const a = answers[i];
  const answered = item.kind === "write" ? typeof a === "string" && a.trim() !== "" : a !== undefined;
  const set = (v: number | string) => {
    const next = answers.slice();
    next[i] = v;
    setAnswers(next);
  };
  const last = i === items.length - 1;
  const readText = item.kind === "choice" ? `${item.text} ${item.options.map((o, j) => `${j + 1}번, ${o.text}`).join(". ")}` : item.text;

  function submit() {
    const final = items.map((it, j) => (it.kind === "write" ? String(answers[j] ?? "").trim() : (answers[j] as number)));
    record(kind, final, scoreDiagnostic(kind, final));
    setFinished(true);
  }

  return (
    <div className="screen">
      <AppBar crumb={crumb} onExit={() => go("diag")}>
        <span className="pill navy" aria-label={`${items.length}문제 가운데 ${i + 1}번째`}>
          {i + 1} / {items.length}
        </span>
      </AppBar>
      <main className="body">
        <div className="diag-dots" aria-hidden="true">
          {items.map((_, j) => (
            <span key={j} className={j === i ? "now" : answers[j] !== undefined && answers[j] !== "" ? "done" : ""} />
          ))}
        </div>
        <section className="panel diag" aria-labelledby="diag-q">
          <div className="qh">
            <span className="num">{i + 1}</span>
            <h2 id="diag-q">{item.text}</h2>
            {canSpeak && (
              <button className="btn ghost sm" onClick={() => speak(readText)}>
                🔊 읽어 주기
              </button>
            )}
          </div>
          {item.kind === "choice" ? (
            <div className={`diag-options n${item.options.length}${item.options.some((o) => o.text.length > 12) ? " long" : ""}`}>
              {item.options.map((o, j) => (
                <button key={o.text} className="choice" aria-pressed={a === j} onClick={() => set(j)}>
                  {o.icon && (
                    <span className="ar" aria-hidden="true">
                      {o.icon}
                    </span>
                  )}
                  {o.text}
                </button>
              ))}
            </div>
          ) : (
            <label className="diag-write">
              <span className="sub">
                5번에서 고른 답: <b>{answerText(kind, INDIRECT_ITEM, answers[INDIRECT_ITEM]) || "-"}</b>
              </span>
              <textarea
                value={typeof a === "string" ? a : ""}
                onChange={(e) => set(e.target.value)}
                rows={4}
                maxLength={300}
                placeholder="예: ○○가 사라지면 △△가 …"
                aria-label="까닭 쓰기"
              />
            </label>
          )}
        </section>
        <div className="submit-row">
          <button className="btn ghost" disabled={i === 0} onClick={() => setI(i - 1)}>
            ← 이전
          </button>
          {last ? (
            <button className="btn gold" disabled={!answered} onClick={submit}>
              다 풀었어요 ✔
            </button>
          ) : (
            <button className="btn" disabled={!answered} onClick={() => setI(i + 1)}>
              다음 →
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
