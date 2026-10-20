// 00 시작: 학년·반·번호를 숫자 버튼으로 고르기(이름 입력란 없음), 손님으로 시작, 교사 메뉴(F1-1)
import { useState } from "react";
import { AppBar } from "../components/common";
import { GUEST, studentLabel, useProgress } from "../store/progress";

const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
const ROWS: { key: "g" | "c" | "n"; label: string; unit: string; values: number[] }[] = [
  { key: "g", label: "학년", unit: "학년", values: range(6) },
  { key: "c", label: "반", unit: "반", values: range(15) },
  { key: "n", label: "번호", unit: "번", values: range(40) },
];

export function StartScreen() {
  const login = useProgress((s) => s.login);
  const [pick, setPick] = useState<Partial<Record<"g" | "c" | "n", number>>>({});
  const ready = pick.g && pick.c && pick.n;
  const key = ready ? `${pick.g}-${pick.c}-${pick.n}` : "";

  return (
    <div className="screen">
      <AppBar>
        <a className="iconbtn" href="#/teacher" aria-label="교사 메뉴">
          🔒
        </a>
      </AppBar>
      <main className="body">
        <div className="hello">
          <div className="badge" aria-hidden="true">
            🧭
          </div>
          <div>
            <h1>먹이그물 탐험대에 온 것을 환영해요!</h1>
            <div className="sub">학년, 반, 번호를 차례로 눌러 주세요. 이름은 쓰지 않아요.</div>
          </div>
        </div>
        <section className="panel numpick">
          {ROWS.map((row) => (
            <div key={row.key} className="np-row" role="group" aria-label={row.label}>
              <b className="np-label">{row.label}</b>
              <div className={`np-btns ${row.key}`}>
                {row.values.map((v) => (
                  <button
                    key={v}
                    className="np"
                    aria-pressed={pick[row.key] === v}
                    aria-label={`${v}${row.unit}`}
                    onClick={() => setPick({ ...pick, [row.key]: v })}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
        <div className="submit-row">
          <button className="btn ghost" onClick={() => login(GUEST)}>
            손님으로 시작
          </button>
          <button className="btn gold" disabled={!ready} onClick={() => login(key)}>
            {ready ? `${studentLabel(key)}으로 시작 →` : "번호를 모두 골라 주세요"}
          </button>
        </div>
      </main>
    </div>
  );
}
