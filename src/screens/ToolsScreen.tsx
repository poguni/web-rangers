// 교사 수업 도구: 오늘의 수업 코드(F10-4)와 도전 코드형 대항전 코드·점수 확인(F8-5)
import { useEffect, useState } from "react";
import type { Route } from "../App";
import { AppBar } from "../components/common";
import type { Theme } from "../data/types";
import { makeChallenge, parseChallenge, verifyMark } from "../game/challenge";
import { ACTIVITIES, ACTIVITY_NAME, makeLessonCode, readLesson, saveLesson, type Activity } from "../game/lesson";
import { THEME_IDS, THEMES } from "../game/stage";
import { prepareRound, ranking, ROUND_POINTS } from "../game/team";

// 도전 코드와 모둠별로 넣은 점수: 새로 고침해도 남게 기기에 저장
const KEY = "webrangers.v1.challenge";
interface Entry {
  score: string;
  mark: string;
}
interface Saved {
  code: string;
  groups: number;
  entries: Entry[];
}
function load(): Saved | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null") as Saved | null;
  } catch {
    return null;
  }
}

export function ToolsScreen({ go }: { go: (r: Route) => void }) {
  return (
    <div className="screen">
      <AppBar crumb="교사 메뉴 › 수업 도구" onExit={() => go("teacher")} />
      <main className="body scroll">
        <LessonPanel />
        <ChallengePanel />
      </main>
    </div>
  );
}

function LessonPanel() {
  const [theme, setTheme] = useState<Theme>("forest");
  const [acts, setActs] = useState<Activity[]>(["build", "stages"]);
  const [active, setActive] = useState(readLesson);
  const code = acts.length ? makeLessonCode({ theme, activities: acts }) : "";
  return (
    <section className="panel tools">
      <h3>🔑 오늘의 수업 코드</h3>
      <p className="sub" style={{ margin: 0 }}>
        학생이 메인 화면의 "수업 코드 넣기"에 이 코드를 넣으면, 고른 테마와 활동만 열려요. 다음 날이 되면 저절로 풀려요.
      </p>
      <div className="setup-row-light" role="group" aria-label="수업 테마">
        <b>테마</b>
        <div className="seg">
          {THEME_IDS.map((t) => (
            <button key={t} aria-pressed={theme === t} onClick={() => setTheme(t)}>
              {THEMES[t].name}
            </button>
          ))}
        </div>
      </div>
      <div className="setup-row-light" role="group" aria-label="열 활동">
        <b>활동</b>
        <div className="seg wrap">
          {ACTIVITIES.map((a) => (
            <button key={a} aria-pressed={acts.includes(a)} onClick={() => setActs(acts.includes(a) ? acts.filter((x) => x !== a) : ACTIVITIES.filter((x) => x === a || acts.includes(x)))}>
              {ACTIVITY_NAME[a]}
            </button>
          ))}
        </div>
      </div>
      <div className="code-show">
        {code ? (
          <>
            <span className="sub">수업 코드</span>
            <b aria-label={`수업 코드 ${code}`}>{code}</b>
          </>
        ) : (
          <span className="sub">활동을 하나 이상 골라 주세요.</span>
        )}
      </div>
      <div className="submit-row" style={{ justifyContent: "flex-start" }}>
        <span className="sub">이 기기: {active ? `${active.code} (${THEMES[active.theme].name} · ${active.activities.map((a) => ACTIVITY_NAME[a]).join(", ")})` : "수업 코드 없음"}</span>
        <button
          className="btn ghost sm"
          disabled={!active}
          onClick={() => {
            saveLesson(null);
            setActive(null);
          }}
        >
          이 기기 수업 코드 끄기
        </button>
      </div>
    </section>
  );
}

function ChallengePanel() {
  const [saved, setSaved] = useState<Saved | null>(load);
  const [theme, setTheme] = useState<Theme>("forest");
  useEffect(() => {
    if (saved) localStorage.setItem(KEY, JSON.stringify(saved));
    else localStorage.removeItem(KEY);
  }, [saved]);

  const challenge = saved && parseChallenge(saved.code);
  const verified = saved
    ? saved.entries.map((e, i) => e.score !== "" && e.mark !== "" && verifyMark(saved.code, i + 1, Number(e.score), e.mark))
    : [];
  const names = saved ? Array.from({ length: saved.groups }, (_, i) => `${i + 1}모둠`) : [];
  const ranked = saved ? ranking(names, [saved.entries.map((e, i) => (verified[i] ? Number(e.score) : 0))]) : [];
  const setEntry = (i: number, patch: Partial<Entry>) => setSaved(saved && { ...saved, entries: saved.entries.map((e, j) => (j === i ? { ...e, ...patch } : e)) });

  return (
    <section className="panel tools">
      <h3>🏁 도전 코드 대항전</h3>
      <p className="sub" style={{ margin: 0 }}>
        모둠 대표 크롬북에서 메인 화면의 "도전 코드"에 이 코드를 넣으면, 모든 모둠이 같은 사건 3개를 풀어요. 끝나면 나오는 점수와 확인 문자를 아래에 넣어 확인해요.
      </p>
      {!saved || !challenge ? (
        <div className="submit-row" style={{ justifyContent: "flex-start" }}>
          <div className="seg" role="group" aria-label="도전 테마">
            {THEME_IDS.map((t) => (
              <button key={t} aria-pressed={theme === t} onClick={() => setTheme(t)}>
                {THEMES[t].name}
              </button>
            ))}
          </div>
          <button className="btn gold" onClick={() => setSaved({ code: makeChallenge(theme), groups: 6, entries: Array.from({ length: 8 }, () => ({ score: "", mark: "" })) })}>
            도전 코드 만들기
          </button>
        </div>
      ) : (
        <>
          <div className="code-show">
            <span className="sub">도전 코드 · {THEMES[challenge.theme].name}</span>
            <b aria-label={`도전 코드 ${saved.code}`}>{saved.code}</b>
            <ol className="sub">
              {challenge.rounds.map((r) => {
                const p = prepareRound(r);
                return (
                  <li key={r.eventId + r.target}>
                    {p.event.title} → {p.target.name}
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="setup-row-light" role="group" aria-label="모둠 수">
            <b>모둠 수</b>
            <div className="seg">
              {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                <button key={n} aria-pressed={saved.groups === n} onClick={() => setSaved({ ...saved, groups: n })}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>모둠</th>
                <th>점수</th>
                <th>확인 문자</th>
                <th>확인</th>
              </tr>
            </thead>
            <tbody>
              {names.map((name, i) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>
                    <select className="sel" aria-label={`${name} 점수`} value={saved.entries[i].score} onChange={(e) => setEntry(i, { score: e.target.value })}>
                      <option value="">-</option>
                      {[0, 1, 2, 3].map((k) => (
                        <option key={k} value={k * ROUND_POINTS}>
                          {k * ROUND_POINTS}점
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input className="mark-input" aria-label={`${name} 확인 문자`} maxLength={3} value={saved.entries[i].mark} onChange={(e) => setEntry(i, { mark: e.target.value })} />
                  </td>
                  <td>{saved.entries[i].mark.length === 3 ? verified[i] ? <span className="ok-t">✔ 맞아요</span> : <span className="no-t">✕ 다시 확인</span> : <span className="sub">-</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="scoreboard light" aria-label="도전 순위">
            {ranked
              .filter((r) => verified[r.i])
              .map((r) => (
                <div key={r.name} className="sb">
                  <span className="rk">{r.rank}</span>
                  <span>{r.name}</span>
                  <b>{r.total}점</b>
                </div>
              ))}
          </div>
          <div className="submit-row" style={{ justifyContent: "flex-start" }}>
            <button className="btn ghost sm" onClick={() => setSaved(null)}>
              새 도전 코드 만들기
            </button>
          </div>
        </>
      )}
    </section>
  );
}
