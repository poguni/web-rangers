// 03 먹이그물 만들기(F3): 숲 생물 14종을 판에 놓고 화살표 32개(교과서 49쪽) 잇기
import { useRef, useState, type CSSProperties } from "react";
import type { Route } from "../App";
import { AppBar, Pic, RoleBadge, starText, Toast, type ToastMessage } from "../components/common";
import { clientToBoard, FoodWebBoard, type BoardEdge, type BoardNode } from "../components/FoodWebBoard";
import { forestLayout, forestSpecies } from "../data/forest";
import {
  completionTarget,
  findFreeSpot,
  judgeLink,
  linkKey,
  pickHint,
  relationsOf,
  starsFor,
  type Point,
  type Relation,
} from "../game/build";
import { useCardDrag } from "../hooks/useCardDrag";
import { josa } from "../utils/korean";

const species = forestSpecies;
const byId = new Map(species.map((s) => [s.id, s]));
const TOTAL = relationsOf(species).length;
const GOAL = completionTarget(TOTAL);
// F3-6: 생산자 카드가 보관함 맨 위(교과서 48쪽 "생산자 카드부터 시작")
const trayOrder = species.filter((s) => s.role !== "decomposer").sort((a, b) => (a.layer ?? 0) - (b.layer ?? 0));
const decomposers = species.filter((s) => s.role === "decomposer");

const START: ToastMessage = {
  kind: "info",
  title: "생산자 카드부터 판에 놓아 보세요.",
  text: "스스로 양분을 만드는 생물부터 시작해요.",
};

export function BuildScreen({ go }: { go: (r: Route) => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [placed, setPlaced] = useState<Record<string, Point>>({});
  const [linked, setLinked] = useState<Set<string>>(new Set());
  const [fresh, setFresh] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hint, setHint] = useState<Relation | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showDecomp, setShowDecomp] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(START);
  const [flash, setFlash] = useState<Relation | null>(null);
  const [doneOpen, setDoneOpen] = useState(false);
  const doneShown = useRef(false);

  const tray = trayOrder.filter((s) => !placed[s.id]);
  const stars = starsFor(hintsUsed);

  function place(id: string, p: Point) {
    const first = Object.keys(placed).length === 0;
    setPlaced((prev) => ({ ...prev, [id]: findFreeSpot(p, Object.values(prev)) }));
    setSelected(null);
    if (first) setToast({ kind: "info", title: "카드를 더 놓고 화살표로 이어 보세요.", text: "화살표는 먹히는 생물 → 먹는 생물로 그려요." });
  }

  const { drag, bind } = useCardDrag<string>(
    (id, x, y) => {
      const r = svgRef.current!.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) place(id, clientToBoard(svgRef.current!, x, y));
    },
    (id) => setSelected((s) => (s === id ? null : id)),
  );

  function onBoardTap(p: Point) {
    if (selected) place(selected, p);
    else if (tray.length > 0)
      setToast({ kind: "info", title: "보관함에서 카드를 먼저 골라요.", text: "카드를 누른 다음 판의 빈 곳을 누르면 놓여요." });
  }

  function onLink(from: string, to: string) {
    const r = judgeLink(species, linked, from, to);
    const a = byId.get(from)!;
    const b = byId.get(to)!;
    if (r.kind === "ok") {
      const key = linkKey(from, to);
      const next = new Set(linked).add(key);
      setLinked(next);
      setFresh(key);
      if (hint?.from === from && hint.to === to) setHint(null);
      if (next.size === TOTAL) setToast({ kind: "ok", title: `화살표 ${TOTAL}개를 모두 찾았어요!`, text: "교과서 49쪽 먹이그물과 똑같아요." });
      else setToast({ kind: "ok", title: `맞아요! ${a.name} → ${b.name}`, text: `${josa(b.name, "은/는")} ${josa(a.name, "을/를")} 먹어요.` });
      if (next.size >= GOAL && !doneShown.current) {
        doneShown.current = true;
        setDoneOpen(true);
      }
    } else if (r.kind === "already") {
      setToast({ kind: "info", title: "이미 이은 화살표예요." });
    } else {
      setFlash({ from, to });
      setTimeout(() => setFlash(null), 600);
      setToast({ kind: "bad", title: r.title, text: r.text });
    }
  }

  function showHint() {
    const hintToast: ToastMessage = {
      kind: "info",
      title: "금색 점선으로 이은 두 생물을 살펴봐요.",
      text: "누가 누구를 먹을까요? 먹히는 생물 → 먹는 생물로 이어요.",
    };
    if (hint) return setToast(hintToast); // 아직 잇지 않은 힌트가 있으면 다시 감점하지 않음
    const h = pickHint(species, linked, new Set(Object.keys(placed)));
    if (!h) {
      return setToast({
        kind: "info",
        title: tray.length > 0 ? "보관함의 카드를 더 놓아 보세요." : "더 알려 줄 힌트가 없어요.",
        text: tray.length > 0 ? "판에 놓인 카드끼리만 힌트를 줄 수 있어요." : undefined,
      });
    }
    setHint(h);
    setHintsUsed((n) => n + 1);
    setToast(hintToast);
  }

  function arrange() {
    setPlaced((prev) => Object.fromEntries(Object.keys(prev).map((id) => [id, forestLayout[id]])));
    setToast({ kind: "info", title: "정리했어요.", text: "먹히는 생물은 아래, 먹는 생물은 위에 있어요." });
  }

  const nodes: BoardNode[] = [
    ...Object.entries(placed).map(([id, p]) => {
      const s = byId.get(id)!;
      const shaking = flash && flash.to === id;
      return { id, name: s.name, image: s.image, role: s.role, ...p, state: shaking ? ("shake" as const) : undefined };
    }),
    ...decomposers.map((s) => ({
      id: s.id,
      name: s.name,
      image: s.image,
      role: s.role,
      ...forestLayout[s.id],
      state: showDecomp ? undefined : ("ghost" as const),
    })),
  ];
  const placedIds = Object.keys(placed);
  const edges: BoardEdge[] = [
    ...(showDecomp ? placedIds.map((id, k) => ({ from: id, to: decomposers[k % decomposers.length].id, kind: "decomp" as const })) : []),
    ...[...linked].map((k) => {
      const [from, to] = k.split(">");
      return { from, to, kind: "ok" as const, fresh: k === fresh };
    }),
    ...(hint ? [{ ...hint, kind: "hint" as const }] : []),
    ...(flash ? [{ ...flash, kind: "bad" as const }] : []),
  ];
  const dragging = drag && byId.get(drag.item);

  return (
    <div className="screen">
      <AppBar
        crumb={
          <>
            숲 › 먹이그물 만들기 <span className="tb-tag">교과서 49쪽</span>
          </>
        }
        onExit={() => go("")}
      >
        <span className="pill gold" aria-label={`이번 판 별 ${stars}개`}>
          ⭐ 이번 판 {starText(stars)}
        </span>
      </AppBar>
      <main className="body">
        <div className="toolbar">
          <div className="progress">
            <b>이은 화살표</b>
            <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={linked.size} aria-label="이은 화살표">
              <i style={{ width: `${(linked.size / TOTAL) * 100}%` }} />
            </div>
            <b>
              {linked.size} / {TOTAL}
            </b>
          </div>
          <button className="btn ghost sm" onClick={showHint} disabled={linked.size === TOTAL}>
            💡 힌트 (별 −1)
          </button>
          <button className="btn ghost sm" onClick={arrange} disabled={placedIds.length === 0}>
            📐 정리하기
          </button>
          <span className="toggle">
            분해자 연결 보기
            <button
              className={`switch${showDecomp ? " on" : ""}`}
              aria-pressed={showDecomp}
              aria-label="분해자 연결 보기"
              onClick={() => setShowDecomp((v) => !v)}
            />
          </span>
        </div>

        <div className="build">
          <aside className="tray" aria-label="카드 보관함">
            <div className="sub">
              <b>카드 보관함</b> {tray.length}장
            </div>
            <div className="tray-list">
              {tray.map((s) => (
                <button
                  key={s.id}
                  className={`mini-card${selected === s.id ? " sel" : ""}`}
                  style={{ "--c": `var(--${s.role})` } as CSSProperties}
                  aria-pressed={selected === s.id}
                  {...bind(s.id)}
                >
                  <span className="emo">
                    <Pic image={s.image} />
                  </span>
                  <span>
                    <b>{s.name}</b>
                    <RoleBadge role={s.role} />
                  </span>
                </button>
              ))}
              {tray.length === 0 && <div className="sub">카드를 모두 놓았어요!</div>}
            </div>
            <Toast message={toast} />
            <div className="howto">
              <div>
                <b>놓기</b> 카드를 판으로 끌거나, 카드를 누르고 빈 곳 누르기
              </div>
              <div>
                <b>잇기</b> 먹히는 생물 → 먹는 생물로 끌거나, 차례로 누르기
              </div>
            </div>
          </aside>

          <div className="canvas">
            <FoodWebBoard
              svgRef={svgRef}
              label="숲 먹이그물 만들기 판"
              nodes={nodes}
              edges={edges}
              onLink={onLink}
              onBoardTap={onBoardTap}
              decomposerBox
            />
            {doneOpen && (
              <div className="done-overlay">
                <div className="panel" role="dialog" aria-label="먹이그물 완성">
                  <h2>🎉 먹이그물 완성!</h2>
                  <div className="stars" aria-label={`별 ${stars}개`}>
                    {starText(stars)}
                  </div>
                  <div>
                    화살표 {linked.size}개를 이었어요.
                    {linked.size < TOTAL && ` ${TOTAL - linked.size}개를 더 찾아볼 수 있어요.`}
                  </div>
                  <div className="sub">여러 먹이사슬이 그물처럼 얽혀 있어요.</div>
                  <div className="row">
                    <button className="btn gold" onClick={() => setDoneOpen(false)}>
                      더 찾아보기
                    </button>
                    <button className="btn ghost" onClick={() => go("")}>
                      처음 화면으로
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {drag && dragging && (
        <div className="mini-card drag-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <span className="emo">
            <Pic image={dragging.image} />
          </span>
          <b>{dragging.name}</b>
        </div>
      )}
    </div>
  );
}
