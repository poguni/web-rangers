import { describe, expect, it } from "vitest";
import { forestLayout, forestSpecies } from "../../src/data/forest";
import {
  completionTarget,
  findFreeSpot,
  judgeLink,
  linkKey,
  pickHint,
  relationsOf,
  starsFor,
} from "../../src/game/build";
import { josa } from "../../src/utils/korean";

const f = (k: string) => `forest.${k}`;

describe("조사 자동 선택", () => {
  it("받침이 있으면 이·을·은·과, 없으면 가·를·는·와", () => {
    expect(josa("개구리", "이/가")).toBe("개구리가");
    expect(josa("뱀", "이/가")).toBe("뱀이");
    expect(josa("메뚜기", "을/를")).toBe("메뚜기를");
    expect(josa("풀", "을/를")).toBe("풀을");
    expect(josa("토끼풀", "은/는")).toBe("토끼풀은");
    expect(josa("매", "과/와")).toBe("매와");
  });
});

describe("화살표 연결 판정 (F3-3, F3-4)", () => {
  const none = new Set<string>();

  it("먹히는 생물 → 먹는 생물이면 맞아요", () => {
    expect(judgeLink(forestSpecies, none, f("grass"), f("grasshopper")).kind).toBe("ok");
  });

  it("이미 이은 화살표는 따로 알려요", () => {
    const linked = new Set([linkKey(f("grass"), f("grasshopper"))]);
    expect(judgeLink(forestSpecies, linked, f("grass"), f("grasshopper")).kind).toBe("already");
  });

  it("방향을 반대로 그리면 방향을 다시 생각하게 해요", () => {
    const r = judgeLink(forestSpecies, none, f("frog"), f("grasshopper"));
    expect(r).toMatchObject({ kind: "reversed", text: expect.stringContaining("개구리가 메뚜기를 먹어요") });
  });

  it("먹지 않는 관계는 까닭을 알려요", () => {
    expect(judgeLink(forestSpecies, none, f("acorn"), f("frog"))).toMatchObject({
      kind: "wrong",
      text: expect.stringContaining("개구리는 도토리를 먹지 않아요"),
    });
    expect(judgeLink(forestSpecies, none, f("squirrel"), f("grass"))).toMatchObject({
      kind: "wrong",
      text: expect.stringContaining("풀은 햇빛을 받아 스스로 양분을 만들어요"),
    });
  });
});

describe("힌트·완성 (F3-5, F3-9)", () => {
  it("판에 놓인 생물끼리, 생산자 쪽 관계부터 알려 줘요", () => {
    const placed = new Set([f("grass"), f("grasshopper"), f("frog")]);
    expect(pickHint(forestSpecies, new Set(), placed)).toEqual({ from: f("grass"), to: f("grasshopper") });
    const linked = new Set([linkKey(f("grass"), f("grasshopper"))]);
    expect(pickHint(forestSpecies, linked, placed)).toEqual({ from: f("grasshopper"), to: f("frog") });
    linked.add(linkKey(f("grasshopper"), f("frog")));
    expect(pickHint(forestSpecies, linked, placed)).toBeNull();
  });

  it("32개 중 26개를 이으면 완성, 힌트마다 별 1개 감점", () => {
    expect(completionTarget(relationsOf(forestSpecies).length)).toBe(26);
    expect([starsFor(0), starsFor(1), starsFor(2), starsFor(5)]).toEqual([3, 2, 1, 1]);
  });
});

describe("카드 놓을 자리", () => {
  it("빈 곳이면 그 자리에, 겹치면 가까운 빈자리에 놓여요", () => {
    expect(findFreeSpot({ x: 300, y: 300 }, [])).toEqual({ x: 300, y: 300 });
    const spot = findFreeSpot({ x: 300, y: 300 }, [{ x: 300, y: 300 }]);
    expect(Math.hypot(spot.x - 300, spot.y - 300)).toBeGreaterThanOrEqual(84);
  });

  it("판 밖이나 분해자 상자에는 놓이지 않아요", () => {
    const out = findFreeSpot({ x: 2000, y: -50 }, []);
    expect(out.x).toBeLessThanOrEqual(915);
    expect(out.y).toBeGreaterThanOrEqual(45);
    const box = findFreeSpot({ x: 860, y: 460 }, []);
    expect(box.x <= 790 || box.y <= 395).toBe(true);
  });

  it("정리하기 배치(교과서 49쪽)에 16종이 모두 있어요", () => {
    for (const s of forestSpecies) expect(forestLayout[s.id], s.name).toBeDefined();
  });
});
