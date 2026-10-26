// 07 카드 도감(F2): 테마별 수집 현황, 얻지 못한 카드는 카드 뒷면, 카드 상세는 뒤집는 큰 카드(앞: 512px 그림, 뒤: 사는 곳·먹이·나를 먹는 동물·특징)
import { useState, type CSSProperties } from "react";
import type { Route } from "../App";
import { AppBar, Pic, RoleBadge } from "../components/common";
import type { Species, Theme } from "../data/types";
import { predatorNames, preyNames, THEME_CARDS } from "../game/cards";
import { THEME_IDS, THEMES } from "../game/stage";
import { useProgress, useStudent } from "../store/progress";
import { allCardsOpen } from "../store/settings";

const SPECIAL = {
  endangered: { label: "⭐ 보호가 필요해요", text: "수가 크게 줄어 보호하고 있는 생물이에요." },
  invasive: { label: "⚠️ 생태계를 어지럽히는 생물", text: "원래 살지 않던 곳에 들어와 다른 생물을 크게 줄게 해요." },
};

export function CardsScreen({ go }: { go: (r: Route) => void }) {
  const owned = useStudent().cards;
  const [theme, setTheme] = useState<Theme>(useProgress.getState().theme);
  const [selected, setSelected] = useState<string | null>(null);
  const open = allCardsOpen();
  const has = (id: string) => open || owned.includes(id);
  const cards = THEME_CARDS[theme];
  const card = cards.find((c) => c.id === selected) ?? null;

  return (
    <div className="screen">
      <AppBar crumb="카드 도감" onExit={() => go("")}>
        {open && <span className="pill gold">선생님이 모든 카드를 열었어요</span>}
      </AppBar>
      <main className="body">
        <div className="seg" role="tablist" aria-label="테마">
          {THEME_IDS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={theme === t}
              aria-pressed={theme === t}
              onClick={() => {
                setTheme(t);
                setSelected(null);
              }}
            >
              {THEMES[t].name} {THEME_CARDS[t].filter((c) => has(c.id)).length}/{THEME_CARDS[t].length}
            </button>
          ))}
        </div>
        <div className="codex">
          <div className="card-grid" role="list" aria-label={`${THEMES[theme].name} 카드`}>
            {cards.map((c) => {
              const got = has(c.id);
              const special = c.tags?.length ? " special" : "";
              return (
                <button
                  key={c.id}
                  role="listitem"
                  className={`ccard${got ? special : " locked"}`}
                  aria-pressed={selected === c.id}
                  aria-label={got ? c.name : "아직 얻지 못한 카드"}
                  onClick={() => setSelected(c.id)}
                  style={{ borderBottomColor: got ? `var(--${c.role})` : undefined }}
                >
                  <span className="e" aria-hidden="true">
                    <Pic image={got ? c.image : "img/ui/ui-card-back"} />
                  </span>
                  <b>{got ? c.name : "???"}</b>
                </button>
              );
            })}
          </div>
          <section className="panel side card-detail" aria-live="polite">
            {!card ? (
              <p className="sub" style={{ margin: "auto", textAlign: "center" }}>
                카드를 누르면 자세히 볼 수 있어요.
              </p>
            ) : has(card.id) ? (
              <Detail key={card.id} s={card} />
            ) : (
              <p className="sub" style={{ margin: "auto", textAlign: "center" }}>
                아직 얻지 못한 카드예요.
                <br />
                먹이그물을 완성하거나 사건 탐구에서 별을 얻으면 받을 수 있어요.
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

/** 큰 카드: 누르면 뒤집혀 사는 곳·특징이 나옴. 다른 카드를 고르면(key가 바뀌어) 앞면부터 */
function Detail({ s }: { s: Species }) {
  const [back, setBack] = useState(false);
  const prey = preyNames(s);
  const predators = predatorNames(s);
  const food = s.role === "producer" ? "햇빛을 받아 스스로 양분을 만들어요." : s.role === "decomposer" ? "죽은 생물과 배출물을 분해해요." : prey.join(", ");
  return (
    <>
      <div className={`flip-card${back ? " back" : ""}`} onClick={() => setBack(!back)}>
        <div className="flip-inner" style={{ "--c": `var(--${s.role})` } as CSSProperties}>
          <div className="face front" aria-hidden={back}>
            <div className="big">
              <Pic image={s.image} big />
            </div>
            <h2>{s.name}</h2>
            <RoleBadge role={s.role} />
            {s.tags?.map((t) => (
              <div key={t} className="special-note">
                <b>{SPECIAL[t].label}</b> {SPECIAL[t].text}
              </div>
            ))}
          </div>
          <div className="face back" aria-hidden={!back}>
            <h2>{s.name}</h2>
            <dl className="facts">
              <dt>사는 곳</dt>
              <dd>{s.habitat}</dd>
              <dt>{s.role === "consumer" ? "먹이" : "양분"}</dt>
              <dd>{food}</dd>
              <dt>나를 먹는 동물</dt>
              <dd>{predators.length ? predators.join(", ") : "이 먹이그물에는 없어요."}</dd>
            </dl>
            <p className="fact">
              <b>특징</b> {s.fact}
            </p>
          </div>
        </div>
      </div>
      <button className="btn ghost sm" aria-pressed={back} onClick={() => setBack(!back)}>
        🔄 {back ? "앞면 보기" : "뒤집어서 사는 곳·특징 보기"}
      </button>
    </>
  );
}
