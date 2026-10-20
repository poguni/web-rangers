// M6 파일럿: 여러 기기에서 내보낸 CSV(F10-3)를 학급 전체로 합치고 PRD 14장 성공 지표를 계산
import { DIAGNOSTIC, INDIRECT_ITEM } from "../data/diagnostic";

export type Row = Record<string, string>;

/** 큰따옴표·쉼표·줄바꿈이 든 칸까지 읽는 CSV 해석(엑셀용 BOM은 뺌) */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c !== "")) rows.push(row);
  return rows;
}

export const rowKey = (r: Row) => `${r["학년"]}-${r["반"]}-${r["번호"]}`;
const filled = (r: Row) => Object.values(r).filter((v) => v !== "").length;

export interface Merged {
  header: string[];
  rows: Row[];
  duplicates: string[]; // 여러 파일에 있던 학생(칸이 더 많이 찬 줄을 씀)
  skipped: string[]; // 우리 앱 CSV가 아닌 파일
}

/** 여러 파일을 학생 번호로 합침. 같은 학생이 두 기기에 있으면 기록이 더 많은 쪽 */
export function mergeCsv(files: { name: string; text: string }[]): Merged {
  let header: string[] = [];
  const byKey = new Map<string, Row>();
  const duplicates = new Set<string>();
  const skipped: string[] = [];
  for (const f of files) {
    const [head, ...body] = parseCsv(f.text);
    if (!head || head.slice(0, 3).join(",") !== "학년,반,번호") {
      skipped.push(f.name);
      continue;
    }
    if (head.length > header.length) header = head; // 칸이 더 많은 새 형식을 기준으로
    for (const cells of body) {
      const r: Row = Object.fromEntries(head.map((h, i) => [h, cells[i] ?? ""]));
      const k = rowKey(r);
      const prev = byKey.get(k);
      if (prev) duplicates.add(k);
      if (!prev || filled(r) > filled(prev)) byKey.set(k, r);
    }
  }
  const num = (k: string) => k.split("-").map(Number);
  const rows = [...byKey.entries()].sort(([a], [b]) => num(a)[0] - num(b)[0] || num(a)[1] - num(b)[1] || num(a)[2] - num(b)[2]).map(([, r]) => r);
  return { header, rows, duplicates: [...duplicates], skipped };
}

export function toMergedCsv(m: Merged): string {
  const cell = (s: string) => (/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  return [m.header.join(","), ...m.rows.map((r) => m.header.map((h) => cell(r[h] ?? "")).join(","))].join("\r\n") + "\r\n";
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined);
const num = (v: string | undefined) => (v === undefined || v === "" ? undefined : Number(v));
const has = <T>(x: T | undefined): x is T => x !== undefined;

function indirectOk(kind: "pre" | "post", text: string) {
  const item = DIAGNOSTIC[kind][INDIRECT_ITEM];
  return item.kind === "choice" && text === item.options[item.answer].text;
}

/** PRD 14장 성공 지표(앱 기록으로 잴 수 있는 것) */
export function pilotMetrics(rows: Row[]) {
  const pre = rows.filter((r) => r["사전5"]);
  const post = rows.filter((r) => r["사후5"]);
  const builds = rows.filter((r) => r["숲그물완성"] !== undefined && r["숲그물완성"] !== "");
  const attempts = builds.reduce((s, r) => s + (num(r["숲잇기시도"]) ?? 0), 0);
  const reversed = builds.reduce((s, r) => s + (num(r["숲방향오류"]) ?? 0), 0);
  const fl = rows.filter((r) => r["첫탐구정답"] && r["마지막탐구정답"]);
  return {
    students: rows.length,
    preAvg: avg(rows.map((r) => num(r["사전점수"])).filter(has)),
    postAvg: avg(rows.map((r) => num(r["사후점수"])).filter(has)),
    indirectPre: pre.length ? pre.filter((r) => indirectOk("pre", r["사전5"])).length / pre.length : undefined,
    indirectPost: post.length ? post.filter((r) => indirectOk("post", r["사후5"])).length / post.length : undefined,
    buildDone: builds.length ? builds.filter((r) => r["숲그물완성"] === "1").length / builds.length : undefined,
    reversedRate: attempts ? reversed / attempts : undefined,
    firstPredict: avg(fl.map((r) => Number(r["첫탐구정답"]) / 3)),
    lastPredict: avg(fl.map((r) => Number(r["마지막탐구정답"]) / 3)),
  };
}

export const PILOT_GOALS = {
  indirectGain: 0.2, // 간접 효과 문항 정답률 +20%p 이상
  twoStep: 0.5, // 사후 까닭 쓰기에서 두 단계 이상 영향을 쓴 학생 50% 이상(교사 채점)
  reversedMax: 0.1, // 마지막 시도 화살표 방향 오류 10% 이하
  buildDone: 0.85, // 1차시 먹이그물 완성 85% 이상
};
