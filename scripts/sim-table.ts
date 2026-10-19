// 명령줄에서 사건별 8년 결과 표 출력 (PRD M1): npm run sim
import { forestEvents, forestSpecies } from "../src/data/forest";
import { calibrate } from "../src/engine/calibrate";
import { runScenario } from "../src/engine/run";
import { judge, toDisplay } from "../src/engine/scoring";

const YEARS = 8;
const model = calibrate(forestSpecies);
const MARK = { up: "▲", down: "▼", same: "●" };
// 한글은 터미널에서 두 칸을 차지함
const width = (s: string) => [...s].reduce((w, c) => w + (c.charCodeAt(0) > 0x7f ? 2 : 1), 0);
const pad = (s: string, w: number) => s + " ".repeat(Math.max(0, w - width(s)));

for (const event of forestEvents) {
  const { series } = runScenario(model, YEARS, [{ atYear: 0, event }]);
  console.log(`\n■ ${event.title}  (${event.id})`);
  console.log(pad("생물", 10) + series.map((_, y) => (y === 0 ? "처음" : `${y}년`).padStart(6)).join("") + "   판정");
  model.species.forEach((s, i) => {
    const row = series.map((N) => String(toDisplay(N[i])).padStart(6)).join("");
    const last = toDisplay(series[YEARS][i]);
    const mark = last === 0 ? "✕ 사라짐" : MARK[judge(last)];
    console.log(pad(s.name, 10) + row + "   " + mark);
  });
}
