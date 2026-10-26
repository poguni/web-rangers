// 01 메인: 테마(숲·강·바다)·모드 선택, 학생 번호·학생 바꾸기(F1-2), 진단, 카드 도감, 도전 코드, 오늘의 수업 코드(F10-4)
import { useState } from "react";
import { AppBar, Pic } from "../components/common";
import type { Route } from "../App";
import { allStages } from "../data/stages";
import type { Theme } from "../data/types";
import { THEME_CARDS } from "../game/cards";
import { ACTIVITY_NAME, parseLessonCode, readLesson, saveLesson, type Activity } from "../game/lesson";
import { THEME_IDS, THEMES } from "../game/stage";
import { studentLabel, useProgress, useStudent } from "../store/progress";

const ART: Record<Theme, { art: string[]; desc: string }> = {
  forest: { art: ["acorn", "squirrel", "bulbul", "snake", "falcon"], desc: "도토리·다람쥐·직박구리·매가 사는 곳" },
  river: { art: ["hornwort", "melania", "medaka", "duck", "heron"], desc: "붕어마름·다슬기·송사리·왜가리가 사는 곳" },
  sea: { art: ["wakame", "jellyfish", "mackerel", "turtle", "dolphin"], desc: "미역·해파리·고등어·바다거북이 사는 곳" },
};

/** 테마가 정해지는 모드는 주소 뒤에 테마를 붙임(#/build/river) */
const MODES: { act: Activity; route: (t: Theme) => Route; icon: string; bg: string; title: string; desc: string }[] = [
  { act: "sort", route: () => "sort", icon: "🧺", bg: "var(--producer-2)", title: "분류 놀이", desc: "생산자·소비자·분해자 나누기" },
  { act: "abiotic", route: () => "sort/abiotic", icon: "☀️", bg: "var(--navy-2)", title: "생물·비생물", desc: "생물 요소와 비생물 요소 나누기" },
  { act: "tutorial", route: () => "tutorial", icon: "🔗", bg: "var(--consumer-2)", title: "먹이사슬 배우기", desc: "숲 카드 3장을 화살표로 이어요" },
  { act: "build", route: (t) => `build/${t}`, icon: "🕸️", bg: "var(--producer-2)", title: "먹이그물 만들기", desc: "카드를 화살표로 이어요" },
  { act: "stages", route: (t) => `stages/${t}`, icon: "🔎", bg: "var(--navy-2)", title: "사건 탐구", desc: "예측하고 관찰해요" },
  { act: "lab", route: (t) => `lab/${t}`, icon: "🧪", bg: "var(--gold-2)", title: "자유 실험실", desc: "마음대로 없애고 늘려 봐요" },
];

export function MainScreen({ go }: { go: (r: Route) => void }) {
  const current = useProgress((s) => s.current)!;
  const logout = useProgress((s) => s.logout);
  const chosen = useProgress((s) => s.theme);
  const setTheme = useProgress((s) => s.setTheme);
  const record = useStudent();
  const [lesson, setLesson] = useState(readLesson);
  const [codeOpen, setCodeOpen] = useState(false);
  const theme = lesson?.theme ?? chosen; // 수업 코드가 있으면 그 테마만
  return (
    <div className="screen">
      <AppBar>
        <span className="pill navy">👤 {studentLabel(current)}</span>
        <button className="btn ghost sm" onClick={logout}>
          학생 바꾸기
        </button>
      </AppBar>
      <main className="body">
        <div className="hello">
          <div className="badge" aria-hidden="true">
            <Pic image="img/ui/ui-mascot" />
          </div>
          <div>
            <h1>탐험대원, 오늘은 어디를 탐험해 볼까요?</h1>
            <div className="sub">테마를 고르고, 할 일을 골라 보세요.</div>
          </div>
          <span className="sp" />
          <button className="btn ghost" onClick={() => go("challenge")}>
            🏁 도전 코드
          </button>
          <button className="btn ghost" onClick={() => go("cards")}>
            🃏 카드 도감
          </button>
          <button className="btn ghost" onClick={() => go("diag")}>
            📝 진단 문제
          </button>
        </div>

        <div className="themes" role="group" aria-label="테마">
          {THEME_IDS.map((t) => {
            const stages = allStages.filter((s) => s.theme === t);
            const stars = stages.reduce((sum, s) => sum + (record.stages[s.id]?.stars ?? 0), 0);
            const cards = THEME_CARDS[t].filter((s) => record.cards.includes(s.id)).length;
            return (
              <button key={t} className={`theme ${t}${theme === t ? " on" : ""}`} aria-pressed={theme === t} disabled={Boolean(lesson) && lesson!.theme !== t} onClick={() => setTheme(t)}>
                <div className="art" aria-hidden="true" style={{ backgroundImage: `url(img/ui/ui-bg-${t}.webp)` }}>
                  <span className="tag">
                    ⭐ {stars}/{stages.length * 3} · 🃏 {cards}/{THEME_CARDS[t].length}
                  </span>
                  {ART[t].art.map((k) => (
                    <Pic key={k} image={`img/${t}/${t}-${k}`} />
                  ))}
                </div>
                <div className="info">
                  <h3>{THEMES[t].name}</h3>
                  <div className="sub">{ART[t].desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <section className="panel">
          <h3 className="mode-head">
            무엇을 할까요?{" "}
            <span className="sub">
              {lesson ? `— 🔑 오늘의 수업: ${THEMES[theme].name} · ${lesson.activities.map((a) => ACTIVITY_NAME[a]).join(", ")}` : `— ${THEMES[theme].name} 선택됨`}
            </span>
            {!lesson && (
              <button className="btn ghost sm" onClick={() => setCodeOpen(true)}>
                🔑 수업 코드 넣기
              </button>
            )}
          </h3>
          <div className="modes">
            {MODES.map((m) => (
              <button key={m.title} className="mode" disabled={Boolean(lesson) && !lesson!.activities.includes(m.act)} onClick={() => go(m.route(theme))}>
                <span className="ic" style={{ background: m.bg }} aria-hidden="true">
                  {m.icon}
                </span>
                <span>
                  <b>{m.title}</b>
                  <span>{m.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>
      {codeOpen && (
        <LessonCodeDialog
          onClose={() => setCodeOpen(false)}
          onSet={(code) => {
            saveLesson(code);
            setLesson(readLesson());
            setCodeOpen(false);
          }}
        />
      )}
    </div>
  );
}

function LessonCodeDialog({ onClose, onSet }: { onClose: () => void; onSet: (code: string) => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  function press(k: string) {
    const next = k === "←" ? code.slice(0, -1) : (code + k).slice(0, 4);
    setCode(next);
    setError(false);
    if (next.length === 4) {
      if (parseLessonCode(next)) onSet(next);
      else {
        setError(true);
        setCode("");
      }
    }
  }
  return (
    <div className="modal" role="dialog" aria-label="수업 코드 넣기">
      <section className="panel pinpad">
        <h2>🔑 선생님이 알려 준 수업 코드를 넣어 주세요</h2>
        <p className="sub" style={{ margin: 0, color: error ? "var(--down)" : undefined }}>{error ? "코드가 맞지 않아요. 다시 넣어 주세요." : "오늘 수업에서 쓸 테마와 활동만 열려요."}</p>
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
              <button key={k} className="np" aria-label={k === "←" ? "지우기" : `코드 ${k}`} onClick={() => press(k)}>
                {k}
              </button>
            ),
          )}
        </div>
        <button className="btn ghost" onClick={onClose}>
          닫기
        </button>
      </section>
    </div>
  );
}
