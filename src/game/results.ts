// F10-2·F10-3 교사 결과: 학생별 요약과 CSV(여러 기기의 CSV를 이어 붙이면 학급 전체가 되는 형식)
import { answerText, DIAGNOSTIC, INDIRECT_ITEM, isCorrect, WHY_ITEM, type DiagKind } from "../data/diagnostic";
import { forestStages } from "../data/stages";
import { GUEST, type StudentRecord } from "../store/progress";

/** 학년-반-번호 순서(손님 기록은 번호가 없어 결과에 넣지 않음) */
export function sortedStudents(students: Record<string, StudentRecord>): StudentRecord[] {
  const num = (k: string) => k.split("-").map(Number);
  return Object.values(students)
    .filter((r) => r.key !== GUEST)
    .sort((a, b) => {
      const [x, y] = [num(a.key), num(b.key)];
      return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
    });
}

export interface StudentRow {
  key: string;
  pre?: number;
  post?: number;
  indirectPre?: boolean;
  indirectPost?: boolean;
  why?: string; // 사후 까닭 쓰기(사후가 없으면 사전)
  stagesDone: number;
  stars: number;
  predictCorrect: number;
  predictTotal: number;
}

export function studentRow(r: StudentRecord): StudentRow {
  const { pre, post } = r.diagnostic;
  const latest = post ?? pre;
  return {
    key: r.key,
    pre: pre?.score,
    post: post?.score,
    indirectPre: pre && isCorrect("pre", INDIRECT_ITEM, pre.answers[INDIRECT_ITEM]),
    indirectPost: post && isCorrect("post", INDIRECT_ITEM, post.answers[INDIRECT_ITEM]),
    why: latest && String(latest.answers[WHY_ITEM] ?? ""),
    stagesDone: Object.keys(r.stages).length,
    stars: Object.values(r.stages).reduce((s, v) => s + v.stars, 0),
    predictCorrect: r.predictions.filter((p) => p.correct).length,
    predictTotal: r.predictions.length,
  };
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined);
const rate = (xs: boolean[]) => (xs.length ? xs.filter(Boolean).length / xs.length : undefined);

export function summary(rows: StudentRow[]) {
  const has = <T>(x: T | undefined): x is T => x !== undefined;
  return {
    students: rows.length,
    preAvg: avg(rows.map((r) => r.pre).filter(has)),
    postAvg: avg(rows.map((r) => r.post).filter(has)),
    indirectPre: rate(rows.map((r) => r.indirectPre).filter(has)),
    indirectPost: rate(rows.map((r) => r.indirectPost).filter(has)),
    predict: rows.reduce((s, r) => s + r.predictTotal, 0)
      ? rows.reduce((s, r) => s + r.predictCorrect, 0) / rows.reduce((s, r) => s + r.predictTotal, 0)
      : undefined,
  };
}

/** 간접 효과 문항을 가장 최근 진단에서 틀린 학생: 사건 탐구 1을 다시 하도록 안내 */
export const needsReview = (rows: StudentRow[]) => rows.filter((r) => (r.indirectPost ?? r.indirectPre) === false).map((r) => r.key);

const cell = (v: string | number | undefined) => {
  const s = v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const localTime = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export function toCsv(students: Record<string, StudentRecord>): string {
  const diagCols = (k: DiagKind, label: string) => [...DIAGNOSTIC[k].map((_, i) => `${label}${i + 1}`), `${label}점수`, `${label}날짜`];
  const header = [
    "학년",
    "반",
    "번호",
    ...diagCols("pre", "사전"),
    ...diagCols("post", "사후"),
    ...forestStages.map((s) => `숲${s.number}별`),
    "예측맞힘",
    "예측전체",
  ];
  const lines = sortedStudents(students).map((r) => {
    const diag = (k: DiagKind) => {
      const d = r.diagnostic[k];
      return [...DIAGNOSTIC[k].map((_, i) => answerText(k, i, d?.answers[i])), d?.score, localTime(d?.at)];
    };
    const row = studentRow(r);
    return [
      ...r.key.split("-"),
      ...diag("pre"),
      ...diag("post"),
      ...forestStages.map((s) => r.stages[s.id]?.stars),
      row.predictCorrect,
      row.predictTotal,
    ]
      .map(cell)
      .join(",");
  });
  return [header.join(","), ...lines].join("\r\n") + "\r\n";
}
