// 03 먹이그물 만들기(F3): 테마 생물을 판에 놓고 화살표 잇기(숲은 교과서 49쪽 32개)
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Route } from "../App";
import { AppBar, Pic, RewardNote, RoleBadge, starText, Toast, type ToastMessage } from "../components/common";
import { clientToBoard, FoodWebBoard, type BoardEdge, type BoardNode } from "../components/FoodWebBoard";
import type { Theme } from "../data/types";
import {
  CHAIN_MIN,
  CHAIN_MISSION,
  chainKey,
  chainStep,
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
import { REWARD } from "../game/cards";
import { THEMES } from "../game/stage";
import { useCardDrag } from "../hooks/useCardDrag";
import { useProgress } from "../store/progress";
import { josa } from "../utils/korean";
import { saveSvgAsPng } from "../utils/svgImage";

const START: ToastMessage = {
  kind: "info",
  title: "생산자 카드부터 판에 놓아 보세요.",
  text: "스스로 양분을 만드는 생물부터 시작해요.",
};

export function BuildScreen({ theme, go }: { theme: Theme; go: (r: Route) => void }) {
  const { name, species, layout } = THEMES[theme];
  const byId = new Map(species.map((s) => [s.id, s]));
  const TOTAL = relationsOf(species).length;
  const GOAL = completionTarget(TOTAL);
  // F3-6: 생산자 카드가 보관함 맨 위(교과서 48쪽 "생산자 카드부터 시작")
  const trayOrder = species.filter((s) => s.role !== "decomposer").sort((a, b) => (a.layer ?? 0) - (b.layer ?? 0));
  const decomposers = species.filter((s) => s.role === "decomposer");
  const grant = useProgress((s) => s.grant);
  const [reward, setReward] = useState<string[]>([]);
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
  // F3-10 먹이사슬 찾기
  const [chainMode, setChainMode] = useState(false);
  // 판에서 끌기: 화살표 잇기(기본) 또는 카드 옮기기
  const [moveMode, setMoveMode] = useState(false);
  // 되돌리기: 판을 바꾸는 동작(놓기·잇기·옮기기·정리하기) 바로 전의 카드 위치와 화살표
  const [history, setHistory] = useState<{ placed: Record<string, Point>; linked: Set<string> }[]>([]);
  const remember = () => setHistory((h) => [...h, { placed, linked }]);
  const [path, setPath] = useState<string[]>([]);
  const [found, setFound] = useState<string[]>([]);
  // 파일럿 지표용 시도 기록(화면을 나갈 때 한 번 저장)
  const recordBuild = useProgress((s) => s.recordBuild);
  const tally = useRef({ ok: 0, reversed: 0, wrong: 0, hints: 0, done: false });
  useEffect(
    () => () => {
      const t = tally.current;
      if (t.ok + t.reversed + t.wrong > 0) recordBuild({ theme, total: TOTAL, ...t });
    },
    [recordBuild, theme, TOTAL],
  );

  const tray = trayOrder.filter((s) => !placed[s.id]);
  const stars = starsFor(hintsUsed);

  function place(id: string, p: Point) {
    const first = Object.keys(placed).length === 0;
    remember();
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

  function move(id: string, p: Point) {
    remember();
    setPlaced((prev) => {
      const others = Object.entries(prev).flatMap(([k, q]) => (k === id ? [] : [q]));
      return { ...prev, [id]: findFreeSpot(p, others) };
    });
  }

  function changeMode(next: boolean) {
    setMoveMode(next);
    setToast(
      next
        ? { kind: "info", title: "카드를 끌어서 옮겨요.", text: "이은 화살표는 카드를 따라와요. 다 옮겼으면 🏹 잇기를 눌러요." }
        : { kind: "info", title: "다시 화살표를 이어요.", text: "먹히는 생물 → 먹는 생물로 끌거나, 차례로 눌러요." },
    );
  }

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
      remember();
      setLinked(next);
      setFresh(key);
      tally.current.ok = next.size;
      tally.current.done = next.size >= GOAL;
      if (hint?.from === from && hint.to === to) setHint(null);
      if (next.size === TOTAL) setToast({ kind: "ok", title: `화살표 ${TOTAL}개를 모두 찾았어요!`, text: `${name}의 먹고 먹히는 관계를 모두 이었어요.` });
      else setToast({ kind: "ok", title: `맞아요! ${a.name} → ${b.name}`, text: `${josa(b.name, "은/는")} ${josa(a.name, "을/를")} 먹어요.` });
      if (next.size >= GOAL && !doneShown.current) {
        doneShown.current = true;
        setDoneOpen(true);
        setReward(grant({ theme, n: REWARD.build }));
      }
    } else if (r.kind === "already") {
      setToast({ kind: "info", title: "이미 이은 화살표예요." });
    } else {
      if (r.kind === "reversed") tally.current.reversed++;
      else tally.current.wrong++;
      setFlash({ from, to });
      setTimeout(() => setFlash(null), 600);
      setToast({ kind: "bad", title: r.title, text: r.text });
    }
  }

  function undo() {
    const last = history.at(-1);
    if (!last || chainMode) return;
    setHistory((h) => h.slice(0, -1));
    setPlaced(last.placed);
    setLinked(last.linked);
    setFresh(null);
    tally.current.ok = last.linked.size; // 이미 받은 보상·힌트 감점은 그대로
    setToast({ kind: "info", title: "한 단계 되돌렸어요.", text: history.length > 1 ? "더 누르면 그 전으로 돌아가요." : "처음 상태예요." });
  }

  // Ctrl+Z(맥은 ⌘+Z)로도 되돌리기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  });

  function startChain() {
    setChainMode(true);
    setPath([]);
    setDoneOpen(false);
    setToast({ kind: "info", title: `먹이사슬을 ${CHAIN_MISSION}개 찾아보세요.`, text: "생산자부터 시작해 화살표를 따라 생물을 차례로 눌러요." });
  }

  function onChainTap(id: string) {
    const r = chainStep(species, linked, path, id);
    if (r.kind === "bad") return setToast({ kind: "bad", title: "다시 생각해 봐요!", text: r.text });
    const next = [...path, id];
    const names = next.map((x) => byId.get(x)!.name).join(" → ");
    if (!r.ended) {
      setPath(next);
      return setToast({ kind: "info", title: names, text: next.length >= CHAIN_MIN ? "더 이어 가거나, 여기서 마칠 수 있어요." : "화살표를 따라 다음 생물을 눌러요." });
    }
    finishChain(next);
  }

  function finishChain(p: string[]) {
    const names = p.map((x) => byId.get(x)!.name).join(" → ");
    setPath([]);
    if (p.length < CHAIN_MIN) return setToast({ kind: "bad", title: names, text: `생물 ${CHAIN_MIN}종 이상으로 이어진 먹이사슬을 찾아봐요.` });
    if (found.includes(chainKey(p))) return setToast({ kind: "info", title: "이미 찾은 먹이사슬이에요.", text: names });
    const all = [...found, chainKey(p)];
    setFound(all);
    setToast({
      kind: "ok",
      title: all.length >= CHAIN_MISSION ? `🎉 먹이사슬 ${CHAIN_MISSION}개를 모두 찾았어요!` : `먹이사슬 ${all.length}개 찾았어요!`,
      text: all.length >= CHAIN_MISSION ? "먹이사슬 여러 개가 얽혀 먹이그물이 돼요." : names,
    });
  }

  async function saveImage() {
    const who = useProgress.getState().current ?? "";
    await saveSvgAsPng(svgRef.current!, `먹이그물_${name}_${who}.png`, `${name} 먹이그물 · ${who === "guest" ? "손님" : who} · 화살표 ${linked.size}개`);
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
    remember();
    setPlaced((prev) => Object.fromEntries(Object.keys(prev).map((id) => [id, layout[id]])));
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
      ...layout[s.id],
      state: showDecomp ? undefined : ("ghost" as const),
      fixed: true,
    })),
  ];
  const placedIds = Object.keys(placed);
  // 찾은 먹이사슬과 지금 고르는 줄은 빨간 점선(교과서 그림과 같게)
  const pairs = (c: string) => {
    const ids = c.split(">");
    return ids.slice(1).map((to, i) => linkKey(ids[i], to));
  };
  const chainEdges = new Set([...found, chainKey(path)].flatMap(pairs));
  const edges: BoardEdge[] = [
    ...(showDecomp ? placedIds.map((id, k) => ({ from: id, to: decomposers[k % decomposers.length].id, kind: "decomp" as const })) : []),
    ...[...linked].map((k) => {
      const [from, to] = k.split(">");
      return { from, to, kind: chainMode && chainEdges.has(k) ? ("chain" as const) : ("ok" as const), fresh: k === fresh };
    }),
    ...(hint ? [{ ...hint, kind: "hint" as const }] : []),
    ...(flash ? [{ ...flash, kind: "bad" as const }] : []),
  ];
  const dragging = drag && byId.get(drag.item);

  return (
    <div className="screen">
      <AppBar
        crumb={`${name} › 먹이그물 만들기`}
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
          {!chainMode && (
            <div className="seg" role="group" aria-label="판에서 끌면">
              <button aria-pressed={!moveMode} onClick={() => changeMode(false)}>
                🏹 잇기
              </button>
              <button aria-pressed={moveMode} onClick={() => changeMode(true)}>
                ✋ 옮기기
              </button>
            </div>
          )}
          <button className="btn ghost sm" onClick={undo} disabled={history.length === 0 || chainMode} title="Ctrl+Z">
            ↩ 되돌리기
          </button>
          <button className="btn ghost sm" onClick={showHint} disabled={linked.size === TOTAL}>
            💡 힌트 (별 −1)
          </button>
          <button className="btn ghost sm" onClick={arrange} disabled={placedIds.length === 0}>
            📐 정리하기
          </button>
          <button className="btn ghost sm" onClick={() => (chainMode ? setChainMode(false) : startChain())} disabled={linked.size < GOAL} aria-pressed={chainMode}>
            🔗 {chainMode ? `먹이사슬 ${found.length}/${CHAIN_MISSION}` : "먹이사슬 찾기"}
          </button>
          <button className="btn ghost sm" onClick={saveImage} disabled={placedIds.length === 0}>
            🖼️ 그림 저장
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
              <div>
                <b>옮기기</b> ✋ 옮기기를 누른 뒤 판의 카드를 끌기
              </div>
            </div>
          </aside>

          <div className="canvas">
            <FoodWebBoard
              svgRef={svgRef}
              label={`${name} 먹이그물 만들기 판`}
              nodes={nodes}
              edges={edges}
              onLink={chainMode || moveMode ? undefined : onLink}
              onMove={!chainMode && moveMode ? move : undefined}
              onNodeTap={chainMode ? onChainTap : undefined}
              onBoardTap={chainMode ? undefined : onBoardTap}
              decomposerBox
            />
            {chainMode && path.length >= CHAIN_MIN && (
              <button className="btn gold sm chain-end" onClick={() => finishChain(path)}>
                여기서 마치기
              </button>
            )}
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
                  <RewardNote ids={reward} />
                  <div className="row">
                    <button className="btn gold" onClick={() => setDoneOpen(false)}>
                      더 찾아보기
                    </button>
                    <button className="btn" onClick={startChain}>
                      🔗 먹이사슬 찾기
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
