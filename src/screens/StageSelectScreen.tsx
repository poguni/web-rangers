// 사건 탐구 스테이지 고르기(숲 5개, 강·바다 각 3개)
import type { Route } from "../App";
import { AppBar, Pic, starText } from "../components/common";
import { allStages } from "../data/stages";
import type { Theme } from "../data/types";
import { THEMES } from "../game/stage";
import { useStudent } from "../store/progress";

export function StageSelectScreen({ theme, go }: { theme: Theme; go: (r: Route) => void }) {
  const results = useStudent().stages;
  const stages = allStages.filter((s) => s.theme === theme);
  const total = stages.reduce((sum, s) => sum + (results[s.id]?.stars ?? 0), 0);
  return (
    <div className="screen">
      <AppBar crumb={`${THEMES[theme].name} › 사건 탐구`} onExit={() => go("")}>
        <span className="pill gold">⭐ 별 {total}개</span>
      </AppBar>
      <main className="body">
        <div>
          <h1 style={{ fontSize: 26 }}>어떤 사건을 탐구할까요?</h1>
          <div className="sub">사건이 일어나면 무엇이 달라질지 먼저 예측하고, 8년 동안 지켜봐요.</div>
        </div>
        <div className="stage-list">
          {stages.map((s) => {
            const event = THEMES[s.theme].events.find((e) => e.id === s.eventId)!;
            const stars = results[s.id]?.stars ?? 0;
            return (
              <button key={s.id} className="stage-card" onClick={() => go(`stage/${s.id}`)}>
                <span className="no">사건 탐구 {s.number}</span>
                <span className="e" aria-hidden="true">
                  <Pic image={event.image} />
                  {s.compareChain && " 🔗"}
                </span>
                <b>{s.compareChain ? "먹이사슬과 먹이그물 비교" : event.title}</b>
                <span className="sub">{s.focus}</span>
                <span className="stars" aria-label={`별 ${stars}개`}>
                  {starText(stars)}
                </span>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
