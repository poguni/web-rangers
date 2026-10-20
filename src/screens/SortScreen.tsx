// 02 분류 놀이: 생산자·소비자·분해자 나누기(F11-1), 생물 요소·비생물 요소 나누기(F11-2)
import { useState, type CSSProperties } from "react";
import type { Route } from "../App";
import { AppBar, Pic, Toast, type ToastMessage } from "../components/common";
import { ROLES } from "../data/roles";
import { factorCards, FACTORS, sortCards } from "../data/sort";
import { useCardDrag } from "../hooks/useCardDrag";
import { josa } from "../utils/korean";

const DECK_SIZE = 6; // 한 번에 보여 주는 카드 수

interface Bin {
  key: string;
  name: string;
  icon: string;
  desc: string;
  color: string; // 테두리·제목 색
  bg: string; // 바탕 색
}
interface Card {
  id: string;
  name: string;
  image: string;
  how: string; // 카드 뒷면 설명
  bin: string;
}

const KINDS: Record<"role" | "abiotic", { title: string; bins: Bin[]; cards: Card[]; next: [Route, string][] }> = {
  role: {
    title: "분류 놀이",
    bins: (["producer", "consumer", "decomposer"] as const).map((r) => ({ key: r, ...ROLES[r], color: `var(--${r})`, bg: `var(--${r}-2)` })),
    cards: sortCards.map((c) => ({ ...c, bin: c.role })),
    next: [
      ["tutorial", "먹이사슬 배우기 →"],
      ["build", "먹이그물 만들기 →"],
    ],
  },
  abiotic: {
    title: "생물·비생물 나누기",
    bins: [
      { key: "biotic", ...FACTORS.biotic, color: "var(--forest)", bg: "var(--producer-2)" },
      { key: "abiotic", ...FACTORS.abiotic, color: "var(--river)", bg: "var(--navy-2)" },
    ],
    cards: factorCards.map((c) => ({ ...c, bin: c.factor })),
    next: [
      ["sort", "생산자·소비자·분해자 나누기 →"],
      ["build", "먹이그물 만들기 →"],
    ],
  },
};

function binAt(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-bin]");
  return el?.dataset.bin ?? null;
}

export function SortScreen({ kind, go }: { kind: "role" | "abiotic"; go: (r: Route) => void }) {
  const { title, bins, cards: sortCards, next } = KINDS[kind];
  const binName = (key: string) => bins.find((b) => b.key === key)!.name;
  const [sorted, setSorted] = useState<Record<string, true>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const remaining = sortCards.filter((c) => !sorted[c.id]);

  function put(cardId: string, bin: string) {
    const card = sortCards.find((c) => c.id === cardId)!;
    setSelected(null);
    if (card.bin === bin) {
      setSorted((s) => ({ ...s, [cardId]: true }));
      setToast({ kind: "ok", title: `맞아요! ${josa(card.name, "은/는")} ${binName(bin)}예요.`, text: card.how });
    } else {
      setToast({
        kind: "bad",
        title: `${josa(card.name, "은/는")} ${josa(binName(bin), "이/가")} 아니에요.`,
        text: `카드 뒷면을 보세요. ${card.how}`,
      });
    }
  }

  const { drag, bind } = useCardDrag<string>(
    (id, x, y) => {
      const bin = binAt(x, y);
      if (bin) put(id, bin);
    },
    (id) => setSelected((s) => (s === id ? null : id)),
  );
  const overBin = drag ? binAt(drag.x, drag.y) : null;
  const dragging = drag && sortCards.find((c) => c.id === drag.item);

  return (
    <div className="screen">
      <AppBar
        crumb={title}
        onExit={() => go("")}
      >
        <span className="pill navy">남은 카드 {remaining.length}장</span>
      </AppBar>
      <main className="body">
        <div>
          <b style={{ fontSize: 17 }}>카드를 골라 알맞은 바구니에 넣어 보세요.</b>{" "}
          <span className="sub">끌어서 넣거나, 카드를 누른 다음 바구니를 눌러도 돼요.</span>
        </div>

        <div className="deck" aria-label="분류할 카드">
          {remaining.slice(0, DECK_SIZE).map((c) => (
            <button
              key={c.id}
              className={`scard${selected === c.id ? " lift" : ""}`}
              aria-pressed={selected === c.id}
              {...bind(c.id)}
            >
              <span className="e">
                <Pic image={c.image} />
              </span>
              <b>{c.name}</b>
            </button>
          ))}
          {remaining.length === 0 && (
            <div className="panel" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <b style={{ fontSize: 18 }}>🎉 모두 나눴어요!</b>
              {next.map(([route, label], i) => (
                <button key={route} className={`btn${i === 1 ? " gold" : ""}`} onClick={() => go(route)}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bins" style={{ gridTemplateColumns: `repeat(${bins.length}, 1fr)` }}>
          {bins.map((bin) => (
            <button
              key={bin.key}
              data-bin={bin.key}
              className={`bin${(selected && !drag) || overBin === bin.key ? " target" : ""}`}
              style={{ "--c": bin.color, "--c2": bin.bg } as CSSProperties}
              onClick={() =>
                selected
                  ? put(selected, bin.key)
                  : setToast({ kind: "info", title: "먼저 위에서 카드를 골라요." })
              }
            >
              <h3>
                <span aria-hidden="true">{bin.icon}</span> {bin.name}
              </h3>
              <div className="desc">{bin.desc}</div>
              <div className="got">
                {sortCards
                  .filter((c) => sorted[c.id] && c.bin === bin.key)
                  .map((c) => (
                    <span key={c.id}>
                      <Pic image={c.image} /> {c.name}
                    </span>
                  ))}
              </div>
            </button>
          ))}
        </div>

        <Toast message={toast} />
      </main>

      {drag && dragging && (
        <div className="scard drag-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <span className="e">
            <Pic image={dragging.image} />
          </span>
          <b>{dragging.name}</b>
        </div>
      )}
    </div>
  );
}
