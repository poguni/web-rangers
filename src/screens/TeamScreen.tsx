// 08 모둠 대항전(전자칠판 진행형, F8-1~F8-4): 설정 → 사건 카드·타이머·모둠 입력 → 모두 공개 → 함께 관찰 → 점수판
// 모든 크기를 화면 너비 기준(cqw)으로 지정해 엣지 배율 100%(1920×1080)·150%(1280×720)에서 같은 모습(DESIGN 7.10)
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Route } from "../App";
import { Pic } from "../components/common";
import { FoodWebBoard } from "../components/FoodWebBoard";
import { ChangeChip, Timeline, useYearPlayer, webAt } from "../components/observe";
import { teamRounds } from "../data/team";
import { flowEdges, yearNotes } from "../engine/explain";
import { YEARS, type Answer } from "../game/stage";
import { DEFAULT_TEAM, prepareRound, ranking, ROUND_POINTS, useTeam, type TeamSettings } from "../game/team";
import { josa } from "../utils/korean";

const ANSWERS: [Answer, string, string][] = [
  ["up", "▲", "늘어요"],
  ["down", "▼", "줄어요"],
  ["same", "●", "비슷해요"],
];
const MARK = Object.fromEntries(ANSWERS.map(([a, m, t]) => [a, `${m} ${t}`])) as Record<Answer, string>;

export function TeamScreen({ go }: { go: (r: Route) => void }) {
  const t = useTeam();
  const round = teamRounds[t.round];
  const p = useMemo(() => prepareRound(round), [round]);
  const exit = (
    <button className="iconbtn" aria-label="교사 메뉴로" onClick={() => go("teacher")}>
      ✕
    </button>
  );
  const head = (title: string) => (
    <div className="bh">
      <h2>🏆 {title}</h2>
      <span style={{ flex: 1 }} />
      {t.phase !== "setup" && <span className="bpill">{t.hide ? "👁 답 가리기 켜짐" : "👁 답 보이기"}</span>}
      <span className="bpill">전자칠판 진행</span>
      {exit}
    </div>
  );
  const roundTitle = `모둠 대항전 · ${p.theme.name} · ${t.round + 1}라운드 / ${t.rounds}`;
  const question = `${YEARS}년 뒤 ${p.theme.name}에 사는 ${josa(p.target.name, "은/는")} 어떻게 될까요?`;

  return (
    <div className="board-wrap">
      <div className="board">
        {t.phase === "setup" && (
          <>
            {head("모둠 대항전 준비")}
            <Setup onStart={t.start} />
          </>
        )}

        {t.phase === "discuss" && (
          <>
            {head(roundTitle)}
            <BigEvent p={p} question={question} timer={<RoundTimer key={t.round} seconds={t.seconds} />} />
            <div className="groups" style={{ gridTemplateColumns: `repeat(${t.groups.length}, 1fr)` }}>
              {t.groups.map((g, i) => {
                const picked = t.picks[i];
                return (
                  <div key={g} className={`grp${picked ? " done" : ""}${t.hide ? " hide" : ""}`} role="group" aria-label={g}>
                    <span className="gn">{g}</span>
                    <div className="ans">
                      {ANSWERS.map(([a, mark, text]) => (
                        <button
                          key={a}
                          className={`${a}${picked === a ? " sel" : ""}`}
                          aria-label={`${g} ${text}`}
                          aria-pressed={t.hide ? undefined : picked === a}
                          onClick={() => t.pick(i, a)}
                        >
                          {mark}
                        </button>
                      ))}
                    </div>
                    <span className="st">{picked ? (t.hide ? "✔ 입력 완료" : `✔ ${MARK[picked]}`) : "토의 중…"}</span>
                  </div>
                );
              })}
            </div>
            <div className="bfoot">
              <Scoreboard top={3} />
              <button className="btn gold bbtn" onClick={t.reveal}>
                🔎 모두 공개하고 관찰하기
              </button>
            </div>
          </>
        )}

        {t.phase === "observe" && (
          <>
            {head(roundTitle)}
            <TeamObserve p={p} question={question} picks={t.picks} groups={t.groups} onDone={() => t.score(p.answer)} />
          </>
        )}

        {(t.phase === "board" || t.phase === "final") && (
          <>
            {head(t.phase === "final" ? "모둠 대항전 최종 결과" : `${roundTitle} · 점수판`)}
            {t.phase === "final" && <Winner />}
            <div className="board-scores">
              <Scoreboard last={t.phase === "board"} />
            </div>
            <div className="bfoot" style={{ justifyContent: "flex-end" }}>
              {t.phase === "board" ? (
                <button className="btn gold bbtn" onClick={t.next}>
                  {t.round + 1 >= t.rounds ? "🏆 최종 결과 보기" : "다음 라운드 →"}
                </button>
              ) : (
                <>
                  <button className="btn ghost bbtn" onClick={() => go("teacher")}>
                    교사 메뉴로
                  </button>
                  <button className="btn gold bbtn" onClick={t.reset}>
                    새 대항전 준비
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Setup({ onStart }: { onStart: (s: TeamSettings) => void }) {
  const saved = useTeam();
  const [s, setS] = useState<TeamSettings>({ groups: saved.groups, rounds: saved.rounds, seconds: saved.seconds, hide: saved.hide });
  const setCount = (n: number) => setS({ ...s, groups: Array.from({ length: n }, (_, i) => s.groups[i] ?? DEFAULT_TEAM.groups[i] ?? `${i + 1}모둠`) });
  const names = s.groups.map((g, i) => g.trim() || `${i + 1}모둠`);
  const unique = new Set(names).size === names.length;
  const seg = <T,>(label: string, values: T[], cur: T, text: (v: T) => string, on: (v: T) => void) => (
    <div className="setup-row" role="group" aria-label={label}>
      <b>{label}</b>
      <div className="bseg">
        {values.map((v) => (
          <button key={String(v)} aria-pressed={cur === v} onClick={() => on(v)}>
            {text(v)}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div className="setup">
      {seg("모둠 수", [2, 3, 4, 5, 6, 7, 8], s.groups.length, (n) => `${n}`, setCount)}
      <div className="setup-row">
        <b>모둠 이름</b>
        <div className="names">
          {s.groups.map((g, i) => (
            <input
              key={i}
              value={g}
              maxLength={6}
              aria-label={`${i + 1}번째 모둠 이름`}
              onChange={(e) => setS({ ...s, groups: s.groups.map((x, j) => (j === i ? e.target.value : x)) })}
            />
          ))}
        </div>
      </div>
      {seg("라운드", [3, 5], s.rounds, (n) => `${n}라운드`, (rounds) => setS({ ...s, rounds }))}
      {seg("토의 시간", [60, 90, 120], s.seconds, (n) => (n % 60 ? `${Math.floor(n / 60)}분 ${n % 60}초` : `${n / 60}분`), (seconds) => setS({ ...s, seconds }))}
      {seg("답 가리기", [true, false], s.hide, (v) => (v ? "켜기(공개 전까지 숨김)" : "끄기"), (hide) => setS({ ...s, hide }))}
      <div className="bfoot" style={{ justifyContent: "flex-end", alignItems: "center" }}>
        {!unique && <span className="st">모둠 이름이 겹치지 않게 해 주세요.</span>}
        <button className="btn gold bbtn" disabled={!unique} onClick={() => onStart({ ...s, groups: names })}>
          ▶ 1라운드 시작
        </button>
      </div>
    </div>
  );
}

function BigEvent({ p, question, timer }: { p: ReturnType<typeof prepareRound>; question: string; timer?: ReactNode }) {
  return (
    <div className="big-event">
      <span className="e" aria-hidden="true">
        <Pic image={p.event.image} />
      </span>
      <div style={{ flex: "1 1 auto" }}>
        <div className="k">{p.theme.name} 소식</div>
        <h3>{p.event.title}</h3>
        <p>
          질문: <b>{question}</b>
        </p>
      </div>
      {timer}
    </div>
  );
}

/** 원형 타이머(금색 진행 링): ▶ 누르면 토의 시간이 줄어듦 */
function RoundTimer({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!running) return;
    timer.current = window.setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => window.clearInterval(timer.current);
  }, [running]);
  useEffect(() => {
    if (left === 0) setRunning(false);
  }, [left]);
  const C = 2 * Math.PI * 56;
  const text = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  return (
    <div className="timer-box">
      <svg className="timer" viewBox="0 0 130 130" role="timer" aria-label={`남은 시간 ${text}`}>
        <circle cx="65" cy="65" r="56" fill="#FFF3D1" stroke="#EADBB3" strokeWidth="12" />
        <circle
          cx="65"
          cy="65"
          r="56"
          fill="none"
          stroke="#E3A81B"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - left / seconds)}
          transform="rotate(-90 65 65)"
        />
        <text x="65" y="65">
          {left === 0 ? "끝!" : text}
        </text>
      </svg>
      <div className="timer-btns">
        <button className="btn sm" onClick={() => (left === 0 ? (setLeft(seconds), setRunning(true)) : setRunning(!running))}>
          {running ? "⏸ 멈춤" : "▶ 토의 시작"}
        </button>
      </div>
    </div>
  );
}

function TeamObserve(props: { p: ReturnType<typeof prepareRound>; question: string; picks: (Answer | null)[]; groups: string[]; onDone: () => void }) {
  const { p, picks, groups, onDone } = props;
  const player = useYearPlayer(YEARS);
  const svgRef = useRef<SVGSVGElement>(null);
  const y = player.year;
  const { nodes, edges } = webAt(p.model, p.theme.layout, {
    N: p.scenario.series[y],
    flows: y > 0 ? flowEdges(p.model, p.scenario, y) : [],
    decomposers: p.event.type === "decomposer",
  });
  const notes = useMemo(() => yearNotes(p.model, p.scenario, [p.event]), [p]);
  const ended = y === YEARS;
  const i = p.model.index[p.target.id];
  return (
    <div className="team-obs">
      <div className="canvas">
        <FoodWebBoard svgRef={svgRef} label="영향이 퍼지는 먹이그물" nodes={nodes} edges={edges} decomposerBox={nodes.some((n) => n.role === "decomposer")} />
      </div>
      <div className="team-side">
        <div className="big-event small">
          <span className="e" aria-hidden="true">
            <Pic image={p.event.image} />
          </span>
          <div>
            <h3>{p.event.title}</h3>
            <p>{props.question}</p>
          </div>
        </div>
        <div className="target" aria-live="polite">
          <span className="e" aria-hidden="true">
            <Pic image={p.target.image} />
          </span>
          <b>{p.target.name}</b>
          <ChangeChip n={p.scenario.series[y][i]} from={100} />
        </div>
        <div className="team-timeline">
          <Timeline
            labels={Array.from({ length: YEARS + 1 }, (_, k) => (k === 0 ? "처음" : `${k}년`))}
            player={player}
            next={
              <button className="btn gold" onClick={onDone}>
                점수판 보기 →
              </button>
            }
          />
        </div>
        <p className="note" role="status">
          {y === 0 ? "▶ 재생을 눌러 함께 지켜봐요." : notes[y - 1]}
        </p>
        <div className="reveal" aria-label="모둠별 답">
          {groups.map((g, k) => {
            const a = picks[k];
            const ok = a === p.answer;
            return (
              <span key={g} className={`rv${ended ? (ok ? " ok" : " no") : ""}`}>
                <b>{g}</b> {a ? MARK[a] : "답 없음"}
                {ended && <i>{ok ? ` ○ +${ROUND_POINTS}` : " ✕"}</i>}
              </span>
            );
          })}
        </div>
        {ended && (
          <p className="note">
            정답: <b>{MARK[p.answer]}</b>
          </p>
        )}
      </div>
    </div>
  );
}

function Scoreboard({ top, last }: { top?: number; last?: boolean }) {
  const { groups, scores } = useTeam();
  const ranked = ranking(groups, scores);
  const best = Math.max(ROUND_POINTS, ...ranked.map((r) => r.total));
  const lastRound = scores[scores.length - 1];
  return (
    <div className="scoreboard" aria-label="점수판">
      <div className="bpill" style={{ alignSelf: "flex-start" }}>
        점수판
      </div>
      {ranked.slice(0, top).map((r) => (
        <div key={r.name} className="sb">
          <span className="rk">{r.rank}</span>
          <span>{r.name}</span>
          <div className="tr" aria-hidden="true">
            <i style={{ width: `${(r.total / best) * 100}%` }} />
          </div>
          <b>
            {r.total}
            {last && lastRound?.[r.i] ? <small> +{lastRound[r.i]}</small> : null}
          </b>
        </div>
      ))}
    </div>
  );
}

function Winner() {
  const { groups, scores } = useTeam();
  const winners = ranking(groups, scores).filter((r) => r.rank === 1);
  return (
    <div className="winner">
      <span aria-hidden="true">🏆</span>
      <h3>
        1등 {winners.map((w) => w.name).join(" · ")} — {winners[0].total}점
      </h3>
    </div>
  );
}
