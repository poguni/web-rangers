// 강·바다 데이터 무결성 (PRD 5.2 표, 교사 확인 관계 + 송사리)
import { describe, expect, it } from "vitest";
import { riverBass, riverEvents, riverLayout, riverSpecies } from "../../src/data/river";
import { seaEvents, seaLayout, seaSpecies } from "../../src/data/sea";
import { PLACEHOLDER } from "../../src/data/placeholders";
import { BANNED_WORDS } from "../../src/data/words";
import { relationsOf } from "../../src/game/build";
import { THEME_CARDS } from "../../src/game/cards";

const rel = (species: typeof riverSpecies) => relationsOf(species).map((r) => `${r.from.split(".")[1]}>${r.to.split(".")[1]}`).sort();

describe("강 데이터", () => {
  it("PRD 강 표의 관계 12개 + 송사리 관계 2개(물벼룩 → 송사리, 송사리 → 왜가리)", () => {
    expect(rel(riverSpecies)).toEqual(
      [
        "closterium>daphnia",
        "closterium>melania",
        "daphnia>nymph",
        "hornwort>crucian",
        "daphnia>crucian",
        "nymph>crucian",
        "hornwort>duck",
        "cattail>duck",
        "melania>duck",
        "crucian>heron",
        "nymph>heron",
        "duck>falcon",
        "daphnia>medaka",
        "medaka>heron",
      ].sort(),
    );
  });
  it("큰입배스는 붕어·송사리·잠자리 애벌레를 먹고, 먹는 동물이 없어요", () => {
    expect(riverBass.prey.map((p) => p.id.split(".")[1]).sort()).toEqual(["crucian", "medaka", "nymph"]);
    expect(riverSpecies.some((s) => s.prey.some((p) => p.id === riverBass.id))).toBe(false);
  });
});

describe("바다 데이터", () => {
  it("PRD 바다 표의 관계 13개", () => {
    expect(rel(seaSpecies)).toEqual(
      [
        "phytoplankton>zooplankton",
        "zooplankton>coral",
        "zooplankton>jellyfish",
        "zooplankton>mackerel",
        "wakame>crab",
        "hijiki>crab",
        "jellyfish>turtle",
        "wakame>turtle",
        "hijiki>turtle",
        "crab>ray",
        "mackerel>dolphin",
        "crab>gull",
        "mackerel>gull",
      ].sort(),
    );
  });
});

describe.each([
  ["강", [...riverSpecies, riverBass], riverEvents, riverLayout],
  ["바다", seaSpecies, seaEvents, seaLayout],
] as const)("%s 공통", (_, species, events, layout) => {
  it("선호도 합은 1이고, 먹이는 같은 테마에 있어요", () => {
    for (const s of species) {
      if (s.role !== "consumer") continue;
      expect(s.prey.reduce((t, p) => t + p.preference, 0), s.name).toBeCloseTo(1);
      for (const p of s.prey) expect(species.some((o) => o.id === p.id), `${s.name} → ${p.id}`).toBe(true);
    }
  });
  it("배치 좌표와 자리 표시 그림이 모두 있어요", () => {
    for (const s of species) {
      expect(layout[s.id], s.name).toBeDefined();
      expect(PLACEHOLDER[s.image], s.image).toBeDefined();
    }
    for (const e of events) expect(PLACEHOLDER[e.image], e.image).toBeDefined();
  });
  it("배치에서 생물끼리 겹치지 않고, 화살표가 다른 생물 그림을 지나가지 않아요", () => {
    const ids = species.map((s) => s.id);
    for (const a of ids) for (const b of ids) if (a < b) expect(Math.hypot(layout[a].x - layout[b].x, layout[a].y - layout[b].y), `${a} ${b}`).toBeGreaterThanOrEqual(84);
    for (const r of relationsOf([...species])) {
      const [p, q] = [layout[r.from], layout[r.to]];
      for (const id of ids) {
        if (id === r.from || id === r.to) continue;
        const c = layout[id];
        const t = Math.max(0, Math.min(1, ((c.x - p.x) * (q.x - p.x) + (c.y - p.y) * (q.y - p.y)) / ((q.x - p.x) ** 2 + (q.y - p.y) ** 2)));
        const d = Math.hypot(c.x - (p.x + t * (q.x - p.x)), c.y - (p.y + t * (q.y - p.y)));
        expect(d, `${r.from} → ${r.to} 가 ${id}에 닿음`).toBeGreaterThanOrEqual(36);
      }
    }
  });
  it("사건 카드는 4장 이상이고, 이야기는 2문장 이내예요", () => {
    expect(events.length).toBeGreaterThanOrEqual(4);
    for (const e of events) expect(e.story.split(/[.!?]\s*/).filter(Boolean).length, e.title).toBeLessThanOrEqual(2);
  });
  it("화면 문장에 4학년 범위 밖 용어와 교과서 쪽수가 없어요", () => {
    const texts = [...species.flatMap((s) => [s.name, s.habitat, s.fact]), ...events.flatMap((e) => [e.title, e.story, e.because, e.realCase ?? ""])];
    for (const t of texts) {
      for (const w of BANNED_WORDS) expect(t.includes(w), `"${t}"에 "${w}"`).toBe(false);
      expect(t).not.toMatch(/\d+\s*쪽/);
    }
  });
});

describe("카드", () => {
  it("숲 16장, 강 13장(큰입배스 포함), 바다 13장", () => {
    expect([THEME_CARDS.forest.length, THEME_CARDS.river.length, THEME_CARDS.sea.length]).toEqual([16, 13, 13]);
  });
});
