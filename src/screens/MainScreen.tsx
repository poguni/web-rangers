// 01 메인: 테마·모드 선택 (강·바다 테마와 사건 탐구·자유 실험실은 다음 단계에서 열림)
import { AppBar } from "../components/common";
import type { Route } from "../App";

const MODES: { route?: Route; icon: string; bg: string; title: string; desc: string }[] = [
  { route: "sort", icon: "🧺", bg: "var(--producer-2)", title: "분류 놀이", desc: "생산자·소비자·분해자 나누기" },
  { route: "tutorial", icon: "🔗", bg: "var(--consumer-2)", title: "먹이사슬 배우기", desc: "카드 3장을 화살표로 이어요" },
  { route: "build", icon: "🕸️", bg: "var(--producer-2)", title: "먹이그물 만들기", desc: "카드를 화살표로 이어요" },
  { route: "stages", icon: "🔎", bg: "var(--navy-2)", title: "사건 탐구", desc: "예측하고 관찰해요" },
  { route: "lab", icon: "🧪", bg: "var(--gold-2)", title: "자유 실험실", desc: "마음대로 없애고 늘려 봐요" },
];

export function MainScreen({ go }: { go: (r: Route) => void }) {
  return (
    <div className="screen">
      <AppBar />
      <main className="body">
        <div className="hello">
          <div className="badge" aria-hidden="true">
            🎒
          </div>
          <div>
            <h1>탐험대원, 오늘은 숲을 탐험해 볼까요?</h1>
            <div className="sub">생물 카드를 화살표로 이어 먹이그물을 만들어 보세요.</div>
          </div>
        </div>

        <div className="themes">
          <button className="theme forest on" aria-pressed="true">
            <div className="art" aria-hidden="true">
              🌰🐿️🐦🐍🦅
            </div>
            <div className="info">
              <h3>숲</h3>
              <div className="sub">도토리·다람쥐·직박구리·매가 사는 곳</div>
            </div>
          </button>
          <button className="theme river" disabled>
            <div className="art" aria-hidden="true">
              <span className="tag">🔒 곧 열려요</span>🌾🐌🐟🦆🪶
            </div>
            <div className="info">
              <h3>강</h3>
              <div className="sub">붕어마름·다슬기·오리·왜가리가 사는 곳</div>
            </div>
          </button>
          <button className="theme sea" disabled>
            <div className="art" aria-hidden="true">
              <span className="tag">🔒 곧 열려요</span>🌿🪼🐟🐢🐬
            </div>
            <div className="info">
              <h3>바다</h3>
              <div className="sub">미역·해파리·고등어·바다거북이 사는 곳</div>
            </div>
          </button>
        </div>

        <section className="panel">
          <h3>
            무엇을 할까요? <span className="sub">— 숲 선택됨</span>
          </h3>
          <div className="modes">
            {MODES.map((m) => (
              <button key={m.title} className="mode" disabled={!m.route} onClick={() => m.route && go(m.route)}>
                <span className="ic" style={{ background: m.bg }} aria-hidden="true">
                  {m.icon}
                </span>
                <span>
                  <b>{m.title}</b>
                  <span>{m.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
