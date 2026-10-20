// 튜토리얼: 카드 3장으로 먹이사슬(풀 → 메뚜기 → 개구리, 교과서 49쪽) 잇기 → 화살표 뜻 → 먹이그물로
import { useRef, useState } from "react";
import type { Route } from "../App";
import { AppBar, RewardNote, Toast, type ToastMessage } from "../components/common";
import { FoodWebBoard, type BoardEdge } from "../components/FoodWebBoard";
import { forestChain, forestSpecies } from "../data/forest";
import { judgeLink, linkKey } from "../game/build";
import { REWARD } from "../game/cards";
import { useProgress } from "../store/progress";
import { subWeb } from "../engine/calibrate";
import { josa } from "../utils/korean";

const chain = subWeb(forestSpecies, forestChain);
const POS = [
  { x: 200, y: 290 },
  { x: 480, y: 290 },
  { x: 760, y: 290 },
];
const STEPS = [
  { key: linkKey("forest.grass", "forest.grasshopper"), text: "메뚜기는 풀을 먹어요. 풀에서 메뚜기로 화살표를 이어 보세요." },
  { key: linkKey("forest.grasshopper", "forest.frog"), text: "개구리는 메뚜기를 먹어요. 이번에는 어느 쪽에서 시작할까요?" },
];

export function TutorialScreen({ go }: { go: (r: Route) => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [linked, setLinked] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState<{ from: string; to: string } | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [reward, setReward] = useState<string[]>([]);
  const grant = useProgress((s) => s.grant);
  const done = STEPS.every((s) => linked.has(s.key));
  const now = STEPS.findIndex((s) => !linked.has(s.key));

  function onLink(from: string, to: string) {
    const r = judgeLink(chain, linked, from, to);
    const a = chain.find((s) => s.id === from)!;
    const b = chain.find((s) => s.id === to)!;
    if (r.kind === "ok") {
      const next = new Set(linked).add(linkKey(from, to));
      setLinked(next);
      if (STEPS.every((s) => next.has(s.key))) setReward(grant(REWARD.tutorial));
      setToast({ kind: "ok", title: `맞아요! ${a.name} → ${b.name}`, text: `${josa(b.name, "은/는")} ${josa(a.name, "을/를")} 먹어요.` });
    } else if (r.kind === "already") {
      setToast({ kind: "info", title: "이미 이은 화살표예요." });
    } else {
      setFlash({ from, to });
      setTimeout(() => setFlash(null), 600);
      setToast({ kind: "bad", title: r.title, text: r.text });
    }
  }

  const edges: BoardEdge[] = [
    ...[...linked].map((k) => {
      const [from, to] = k.split(">");
      return { from, to, kind: "ok" as const };
    }),
    ...(flash ? [{ ...flash, kind: "bad" as const }] : []),
  ];

  return (
    <div className="screen">
      <AppBar
        crumb="숲 › 먹이사슬 배우기"
        onExit={() => go("")}
      />
      <main className="body">
        <div className="tutorial">
          <section className="panel steps" aria-label="할 일">
            <h3>화살표의 뜻</h3>
            <div className="toast info">
              <span className="ic" aria-hidden="true">
                ➡️
              </span>
              <div>
                <b>먹히는 생물 → 먹는 생물</b>
                <p>화살표는 양분이 옮겨 가는 방향이에요.</p>
              </div>
            </div>
            <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {STEPS.map((s, i) => (
                <li key={s.key} className={`step ${linked.has(s.key) ? "done" : i === now ? "now" : "later"}`}>
                  <span className="num">{linked.has(s.key) ? "✓" : i + 1}</span>
                  <span>{s.text}</span>
                </li>
              ))}
            </ol>
            {done ? (
              <>
                <div>
                  <div className="keyword">먹이사슬</div>
                  <div>생물들의 먹고 먹히는 관계가 사슬처럼 이어진 것</div>
                </div>
                <div>
                  <div className="keyword">먹이그물</div>
                  <div>여러 먹이사슬이 얽혀 그물처럼 이어진 것</div>
                </div>
                <RewardNote ids={reward} />
                <button className="btn gold" onClick={() => go("build")}>
                  먹이그물 만들기 →
                </button>
              </>
            ) : (
              <div className="howto">
                <div>
                  <b>잇는 방법</b> ① 먹히는 생물에서 먹는 생물로 끌기 ② 먹히는 생물 누르고 → 먹는 생물 누르기
                </div>
              </div>
            )}
            <Toast message={toast} />
          </section>
          <div className="canvas">
            <FoodWebBoard
              svgRef={svgRef}
              label="먹이사슬 잇기 판: 풀, 메뚜기, 개구리"
              nodes={chain.map((s, i) => ({ id: s.id, name: s.name, image: s.image, role: s.role, ...POS[i] }))}
              edges={edges}
              onLink={onLink}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
