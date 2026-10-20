// M6 파일럿 결과 모아 보기: 여러 크롬북에서 내보낸 CSV를 합쳐 PRD 14장 성공 지표를 목표와 비교
import { useState } from "react";
import type { Route } from "../App";
import { AppBar } from "../components/common";
import { mergeCsv, PILOT_GOALS, pilotMetrics, rowKey, toMergedCsv, type Merged } from "../game/pilot";
import { toCsv } from "../game/results";
import { useProgress } from "../store/progress";

const pct = (r?: number) => (r === undefined ? "-" : `${Math.round(r * 100)}%`);
const one = (n?: number) => (n === undefined ? "-" : n.toFixed(1));

// 사후 까닭 쓰기 채점(두 단계 이상 영향을 썼는지)은 교사가 표시: 기기에 남겨 다시 열어도 그대로
const CHECK_KEY = "webrangers.v1.pilot-two-step";
const loadChecks = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(CHECK_KEY) ?? "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
};

function download(name: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function PilotScreen({ go }: { go: (r: Route) => void }) {
  const students = useProgress((s) => s.students);
  const [files, setFiles] = useState<{ name: string; text: string }[]>([]);
  const [checks, setChecks] = useState(loadChecks);
  const merged: Merged | null = files.length ? mergeCsv(files) : null;
  const m = merged && pilotMetrics(merged.rows);
  const whys = merged ? merged.rows.filter((r) => r["사후6"]) : [];
  const twoStep = whys.length ? whys.filter((r) => checks[rowKey(r)]).length / whys.length : undefined;
  const gain = m?.indirectPre !== undefined && m.indirectPost !== undefined ? m.indirectPost - m.indirectPre : undefined;

  async function addFiles(list: FileList | null) {
    if (!list) return;
    const read = await Promise.all([...list].map(async (f) => ({ name: f.name, text: await f.text() })));
    setFiles((prev) => [...prev.filter((p) => !read.some((r) => r.name === p.name)), ...read]);
  }
  function toggle(key: string) {
    const next = { ...checks, [key]: !checks[key] };
    setChecks(next);
    localStorage.setItem(CHECK_KEY, JSON.stringify(next));
  }

  const goals: { label: string; value: string; goal: string; ok?: boolean }[] = m
    ? [
        { label: "간접 효과 문항(5번) 정답률", value: `${pct(m.indirectPre)} → ${pct(m.indirectPost)}`, goal: "사전보다 20%p 이상 오름", ok: gain === undefined ? undefined : gain >= PILOT_GOALS.indirectGain },
        { label: "까닭 쓰기에서 두 단계 이상 영향을 쓴 학생", value: pct(twoStep), goal: "50% 이상(아래에서 채점)", ok: twoStep === undefined ? undefined : twoStep >= PILOT_GOALS.twoStep },
        { label: "마지막 시도 화살표 방향 오류(숲)", value: pct(m.reversedRate), goal: "10% 이하", ok: m.reversedRate === undefined ? undefined : m.reversedRate <= PILOT_GOALS.reversedMax },
        { label: "먹이그물 완성(숲)", value: pct(m.buildDone), goal: "85% 이상", ok: m.buildDone === undefined ? undefined : m.buildDone >= PILOT_GOALS.buildDone },
        { label: "사건 탐구 예측 정답률(첫 탐구 → 마지막 탐구)", value: `${pct(m.firstPredict)} → ${pct(m.lastPredict)}`, goal: "오름", ok: m.firstPredict === undefined || m.lastPredict === undefined ? undefined : m.lastPredict > m.firstPredict },
      ]
    : [];

  return (
    <div className="screen">
      <AppBar crumb="교사 메뉴 › 파일럿 결과 모아 보기" onExit={() => go("teacher")}>
        <button className="btn sm" disabled={!merged} onClick={() => download("먹이그물탐험대_학급결과.csv", toMergedCsv(merged!))}>
          ⬇ 합친 CSV 내보내기
        </button>
      </AppBar>
      <main className="body scroll">
        <section className="panel tools">
          <h3>📂 기기별 CSV 모으기</h3>
          <p className="sub" style={{ margin: 0 }}>
            학생 크롬북마다 교사 메뉴에서 내보낸 CSV를 모두 골라 주세요. 같은 학생이 여러 파일에 있으면 기록이 더 많은 쪽을 써요.
          </p>
          <div className="submit-row" style={{ justifyContent: "flex-start" }}>
            <label className="btn">
              CSV 파일 고르기
              <input type="file" accept=".csv,text/csv" multiple hidden aria-label="CSV 파일 고르기" onChange={(e) => addFiles(e.target.files)} />
            </label>
            <button className="btn ghost" onClick={() => setFiles((prev) => [...prev.filter((p) => p.name !== "이 기기"), { name: "이 기기", text: toCsv(students) }])}>
              이 기기 결과도 넣기
            </button>
            {files.length > 0 && (
              <button className="btn ghost sm" onClick={() => setFiles([])}>
                모두 빼기
              </button>
            )}
          </div>
          {files.length > 0 && (
            <p className="sub" style={{ margin: 0 }}>
              파일 {files.length}개: {files.map((f) => f.name).join(", ")}
              {merged!.duplicates.length > 0 && ` · 여러 파일에 있던 학생 ${merged!.duplicates.length}명`}
              {merged!.skipped.length > 0 && ` · 우리 앱 CSV가 아니라 뺀 파일: ${merged!.skipped.join(", ")}`}
            </p>
          )}
        </section>

        {m && (
          <>
            <div className="stat-row">
              <div className="stat">
                <div className="v">{m.students}명</div>
                <div className="l">모은 학생</div>
              </div>
              <div className="stat">
                <div className="v">
                  {one(m.preAvg)} → {one(m.postAvg)}
                </div>
                <div className="l">진단 평균 (사전 → 사후, 5점 만점)</div>
              </div>
            </div>
            <section className="panel">
              <h3>🎯 성공 지표</h3>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>지표</th>
                    <th>결과</th>
                    <th>목표</th>
                    <th>달성</th>
                  </tr>
                </thead>
                <tbody>
                  {goals.map((g) => (
                    <tr key={g.label}>
                      <td>{g.label}</td>
                      <td>
                        <b>{g.value}</b>
                      </td>
                      <td className="sub">{g.goal}</td>
                      <td>{g.ok === undefined ? <span className="sub">자료 없음</span> : g.ok ? <span className="ok-t">○ 달성</span> : <span className="no-t">✕ 아직</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className="panel">
              <h3>✏️ 사후 진단 6번(까닭 쓰기) 채점</h3>
              <p className="sub" style={{ margin: "0 0 8px" }}>
                두 단계 이상 이어지는 영향(예: 갈매기 → 게 → 미역)을 쓴 답에 표시해 주세요.
              </p>
              {whys.length === 0 ? (
                <p className="sub">사후 진단을 푼 학생이 없어요.</p>
              ) : (
                <ul className="why-list">
                  {whys.map((r) => (
                    <li key={rowKey(r)}>
                      <label>
                        <input type="checkbox" checked={Boolean(checks[rowKey(r)])} onChange={() => toggle(rowKey(r))} aria-label={`${rowKey(r)} 두 단계 이상`} />
                        <b>{rowKey(r)}</b> <span className="sub">5번 {r["사후5"]}</span> “{r["사후6"]}”
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
