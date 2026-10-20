// F9 진단 문항: 사전·사후가 같은 구조(평행 문항)이고, 정답이 하나이며, 4학년 범위 밖 용어가 없는지
import { describe, expect, it } from "vitest";
import { DIAG_MAX, DIAGNOSTIC, INDIRECT_ITEM, scoreDiagnostic, WHY_ITEM } from "../../src/data/diagnostic";
import { BANNED_WORDS } from "../../src/data/words";

describe("진단 문항", () => {
  it("사전·사후 모두 6문항이고 같은 순서의 같은 유형이에요", () => {
    expect(DIAGNOSTIC.pre).toHaveLength(6);
    expect(DIAGNOSTIC.post.map((i) => i.kind)).toEqual(DIAGNOSTIC.pre.map((i) => i.kind));
    for (const k of ["pre", "post"] as const) {
      DIAGNOSTIC[k].forEach((item, i) => {
        if (item.kind === "choice") expect(item.options[item.answer], `${k} ${i + 1}번`).toBeDefined();
      });
    }
    expect(DIAGNOSTIC.pre[WHY_ITEM].kind).toBe("write");
    expect(DIAG_MAX).toBe(5);
  });

  it("보기 수가 사전·사후 같아요(난이도를 맞춤)", () => {
    DIAGNOSTIC.pre.forEach((item, i) => {
      const post = DIAGNOSTIC.post[i];
      if (item.kind === "choice" && post.kind === "choice") expect(post.options.length, `${i + 1}번`).toBe(item.options.length);
    });
  });

  it("5번은 간접 효과 문항: 답이 '줄어요'예요", () => {
    for (const k of ["pre", "post"] as const) {
      const item = DIAGNOSTIC[k][INDIRECT_ITEM];
      expect(item.kind === "choice" && item.options[item.answer].text).toBe("줄어요");
    }
  });

  it("객관식만 채점하고 서술형은 점수에 넣지 않아요", () => {
    const right = DIAGNOSTIC.pre.map((i) => (i.kind === "choice" ? i.answer : "아무 글"));
    expect(scoreDiagnostic("pre", right)).toBe(5);
    expect(scoreDiagnostic("pre", right.map((a, i) => (i === 0 ? 0 : a)))).toBe(4);
  });

  it("문장에 4학년 범위 밖 용어와 교과서 쪽수가 없어요", () => {
    for (const item of [...DIAGNOSTIC.pre, ...DIAGNOSTIC.post]) {
      const texts = [item.text, ...(item.kind === "choice" ? item.options.map((o) => o.text) : [])];
      for (const t of texts) {
        for (const w of BANNED_WORDS) expect(t.includes(w), `"${t}"에 "${w}"`).toBe(false);
        expect(t).not.toMatch(/\d+\s*쪽/);
      }
    }
  });
});
