// 02 분류 놀이(F11-1): 생물 카드를 생산자·소비자·분해자 바구니에 넣기
import { useState, type CSSProperties } from "react";
import type { Route } from "../App";
import { AppBar, Pic, Toast, type ToastMessage } from "../components/common";
import { ROLES } from "../data/roles";
import { sortCards } from "../data/sort";
import type { Role } from "../data/types";
import { useCardDrag } from "../hooks/useCardDrag";
import { josa } from "../utils/korean";

const BINS: Role[] = ["producer", "consumer", "decomposer"];
const DECK_SIZE = 6; // 한 번에 보여 주는 카드 수

function binAt(x: number, y: number): Role | null {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-bin]");
  return (el?.dataset.bin as Role) ?? null;
}

export function SortScreen({ go }: { go: (r: Route) => void }) {
  const [sorted, setSorted] = useState<Record<string, true>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const remaining = sortCards.filter((c) => !sorted[c.id]);

  function put(cardId: string, bin: Role) {
    const card = sortCards.find((c) => c.id === cardId)!;
    setSelected(null);
    if (card.role === bin) {
      setSorted((s) => ({ ...s, [cardId]: true }));
      setToast({ kind: "ok", title: `맞아요! ${josa(card.name, "은/는")} ${ROLES[bin].name}예요.`, text: card.how });
    } else {
      setToast({
        kind: "bad",
        title: `${josa(card.name, "은/는")} ${josa(ROLES[bin].name, "이/가")} 아니에요.`,
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
        crumb="분류 놀이"
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
              <button className="btn" onClick={() => go("tutorial")}>
                먹이사슬 배우기 →
              </button>
              <button className="btn gold" onClick={() => go("build")}>
                먹이그물 만들기 →
              </button>
            </div>
          )}
        </div>

        <div className="bins">
          {BINS.map((role) => (
            <button
              key={role}
              data-bin={role}
              className={`bin${(selected && !drag) || overBin === role ? " target" : ""}`}
              style={{ "--c": `var(--${role})`, "--c2": `var(--${role}-2)` } as CSSProperties}
              onClick={() =>
                selected
                  ? put(selected, role)
                  : setToast({ kind: "info", title: "먼저 위에서 카드를 골라요." })
              }
            >
              <h3>
                <span aria-hidden="true">{ROLES[role].icon}</span> {ROLES[role].name}
              </h3>
              <div className="desc">{ROLES[role].desc}</div>
              <div className="got">
                {sortCards
                  .filter((c) => sorted[c.id] && c.role === role)
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
