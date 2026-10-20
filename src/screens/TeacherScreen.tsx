// 09 교사 화면: PIN 잠금(F10-1), 이 기기 결과(F10-2), CSV 내보내기(F10-3), 데이터 모두 지우기(F1-4, 확인 2회)
import { useState, type ReactNode } from "react";
import type { Route } from "../App";
import { AppBar } from "../components/common";
import { DIAG_MAX } from "../data/diagnostic";
import { allStages } from "../data/stages";
import { needsReview, sortedStudents, studentRow, summary, toCsv } from "../game/results";
import { useTeam } from "../game/team";
import { useProgress } from "../store/progress";
import { allCardsOpen, checkPin, hasPin, isUnlocked, setAllCardsOpen, setPin, setUnlocked } from "../store/settings";

/** 교사 메뉴 잠금: 처음이면 PIN 정하기, 다음부터 PIN 넣기 */
export function TeacherGate({ go, children }: { go: (r: Route) => void; children: ReactNode }) {
  const [, rerender] = useState(0);
  const creating = !hasPin();
  const [first, setFirst] = useState<string | null>(null);
  const [pin, setPinText] = useState("");
  const [message, setMessage] = useState("");

  // 저장된 잠금 상태를 그릴 때마다 읽음: 나가자마자 다시 들어와도(화면이 바뀌기 전) 잠김
  if (isUnlocked()) return <>{children}</>;

  function press(d: string) {
    const next = (pin + d).slice(0, 4);
    setPinText(next);
    if (next.length < 4) return;
    setPinText("");
    if (!creating) {
      if (checkPin(next)) open();
      else setMessage("PIN이 맞지 않아요. 다시 넣어 주세요.");
    } else if (first === null) {
      setFirst(next);
      setMessage("확인을 위해 한 번 더 넣어 주세요.");
    } else if (first === next) {
      setPin(next);
      open();
    } else {
      setFirst(null);
      setMessage("두 번 넣은 PIN이 달라요. 처음부터 다시 정해 주세요.");
    }
  }
  function open() {
    setUnlocked(true);
    rerender((n) => n + 1);
  }

  return (
    <div className="screen">
      <AppBar crumb="교사 메뉴" onExit={() => go("")} />
      <main className="body" style={{ alignItems: "center", justifyContent: "center" }}>
        <section className="panel pinpad" aria-label="교사 PIN">
          <h2>🔒 {creating ? "이 기기의 교사 PIN 4자리를 정해 주세요" : "교사 PIN 4자리를 넣어 주세요"}</h2>
          <p className="sub" style={{ margin: 0 }}>
            {message || (creating ? "선생님만 아는 숫자로 정해요. 학생이 교사 메뉴에 잘못 들어오지 않게 막아 줘요." : "학생은 들어올 수 없어요.")}
          </p>
          <div className="pin-dots" aria-label={`${pin.length}자리 넣음`}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={i < pin.length ? "on" : ""} />
            ))}
          </div>
          <div className="pin-keys">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "←"].map((k, i) =>
              k === "" ? (
                <span key={i} />
              ) : (
                <button
                  key={k}
                  className="np"
                  aria-label={k === "←" ? "지우기" : k}
                  onClick={() => (k === "←" ? setPinText(pin.slice(0, -1)) : press(k))}
                >
                  {k}
                </button>
              ),
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

const pct = (r?: number) => (r === undefined ? "-" : `${Math.round(r * 100)}%`);
const one = (n?: number) => (n === undefined ? "-" : n.toFixed(1));
const OX = (v?: boolean) => (v === undefined ? <span className="sub">-</span> : v ? <span className="ok-t">○</span> : <span className="no-t">✕</span>);

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" })); // 엑셀에서 한글이 깨지지 않게 BOM
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function TeacherScreen({ go }: { go: (r: Route) => void }) {
  const students = useProgress((s) => s.students);
  const clearAll = useProgress((s) => s.clearAll);
  const resetTeam = useTeam((s) => s.reset);
  const [confirm, setConfirm] = useState(0);
  const [cardsOpen, setCardsOpen] = useState(allCardsOpen);
  const rows = sortedStudents(students).map(studentRow);
  const sum = summary(rows);
  const review = needsReview(rows);

  function exportCsv() {
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    download(`먹이그물탐험대_결과_${stamp}.csv`, toCsv(students));
  }

  return (
    <div className="screen">
      <AppBar
        crumb="교사 메뉴 › 이 기기 결과"
        onExit={() => {
          setUnlocked(false); // 나가면 다시 잠금(학생 기기에서 결과를 본 뒤)
          go("");
        }}
      >
        <button className="btn ghost sm" onClick={() => go("team")}>
          🏆 모둠 대항전
        </button>
        <button className="btn ghost sm" onClick={() => go("guide")}>
          📘 교사 가이드
        </button>
        <button
          className="btn ghost sm"
          aria-pressed={cardsOpen}
          onClick={() => {
            setAllCardsOpen(!cardsOpen);
            setCardsOpen(!cardsOpen);
          }}
        >
          {cardsOpen ? "🔒 카드 다시 닫기" : "🔓 카드 모두 열기"}
        </button>
        <button className="btn sm" disabled={rows.length === 0} onClick={exportCsv}>
          ⬇ CSV 내보내기
        </button>
      </AppBar>
      <main className="body scroll">
        <div className="stat-row">
          <div className="stat">
            <div className="v">{sum.students}명</div>
            <div className="l">이 기기를 쓴 학생</div>
          </div>
          <div className="stat">
            <div className="v">
              {one(sum.preAvg)} → {one(sum.postAvg)}
            </div>
            <div className="l">진단 평균 (사전 → 사후, {DIAG_MAX}점 만점)</div>
          </div>
          <div className="stat">
            <div className="v">
              {pct(sum.indirectPre)} → {pct(sum.indirectPost)}
            </div>
            <div className="l">간접 효과 문항(5번) 정답률</div>
          </div>
          <div className="stat">
            <div className="v">{pct(sum.predict)}</div>
            <div className="l">사건 탐구 예측 정답률</div>
          </div>
        </div>

        <section className="panel" style={{ overflowX: "auto" }}>
          <h3>학생별 결과</h3>
          {rows.length === 0 ? (
            <p className="sub" style={{ margin: 0 }}>
              아직 번호를 넣고 활동한 학생이 없어요. 손님으로 한 활동은 결과에 넣지 않아요.
            </p>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>번호</th>
                  <th>사전 → 사후</th>
                  <th>간접 효과(5번)</th>
                  <th>까닭 쓰기(6번)</th>
                  <th>사건 탐구</th>
                  <th>예측 정답률</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key}>
                    <td>{r.key}</td>
                    <td>
                      <div className="prepost">
                        <span className="b pre" style={{ width: ((r.pre ?? 0) / DIAG_MAX) * 100 }} />
                        <span className="b post" style={{ width: ((r.post ?? 0) / DIAG_MAX) * 100 }} />
                        <b>
                          {r.pre ?? "-"} → {r.post ?? "-"}
                        </b>
                      </div>
                    </td>
                    <td>
                      {OX(r.indirectPre)} → {OX(r.indirectPost)}
                    </td>
                    <td className="why">{r.why ? `"${r.why}"` : <span className="sub">-</span>}</td>
                    <td>
                      {r.stagesDone} / {allStages.length} · ★{r.stars}
                    </td>
                    <td>{r.predictTotal ? pct(r.predictCorrect / r.predictTotal) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {review.length > 0 && (
            <p className="sub" style={{ margin: "10px 0 0" }}>
              💡 {review.join(", ")} 학생은 간접 효과 문항(5번)을 틀렸어요. 숲 사건 탐구 1을 다시 해 보도록 안내해 주세요.
            </p>
          )}
          <p className="sub" style={{ margin: "6px 0 0" }}>
            CSV는 기기마다 같은 칸 순서라서, 여러 기기의 파일을 이어 붙이면 학급 전체 결과가 돼요.
          </p>
        </section>

        <section className="panel danger">
          <h3>🧹 학기 말 정리</h3>
          {confirm === 0 && (
            <button className="btn ghost" onClick={() => setConfirm(1)}>
              이 기기 데이터 모두 지우기
            </button>
          )}
          {confirm > 0 && (
            <div className="confirm" role="alert">
              <b>
                {confirm === 1
                  ? `정말 지울까요? 학생 ${rows.length}명의 진단·사건 탐구 기록과 모둠 점수판이 모두 사라져요.`
                  : "마지막으로 확인해요. 지우면 되돌릴 수 없어요. CSV를 먼저 내보냈나요?"}
              </b>
              <div className="submit-row" style={{ justifyContent: "flex-start" }}>
                <button className="btn ghost" onClick={() => setConfirm(0)}>
                  그만두기
                </button>
                <button
                  className="btn danger"
                  onClick={() => {
                    if (confirm === 1) return setConfirm(2);
                    clearAll();
                    resetTeam();
                    setConfirm(0);
                  }}
                >
                  {confirm === 1 ? "지우기" : "모두 지우기"}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
