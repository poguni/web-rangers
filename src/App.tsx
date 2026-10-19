import { useEffect, useState } from "react";
import { BuildScreen } from "./screens/BuildScreen";
import { InvestigateScreen } from "./screens/InvestigateScreen";
import { LabScreen } from "./screens/LabScreen";
import { MainScreen } from "./screens/MainScreen";
import { SortScreen } from "./screens/SortScreen";
import { StageSelectScreen } from "./screens/StageSelectScreen";
import { TutorialScreen } from "./screens/TutorialScreen";

// 주소 뒤 #/sort, #/stage/forest-1 처럼 화면을 나눔(GitHub Pages에서도 새로 고침해도 같은 화면)
export type Route = "" | "sort" | "tutorial" | "build" | "stages" | "lab" | `stage/${string}`;

const readRoute = (): Route => location.hash.replace(/^#\/?/, "") as Route;
const go = (r: Route) => {
  location.hash = `/${r}`;
};

export function App() {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  if (route.startsWith("stage/")) {
    const id = route.slice("stage/".length);
    return <InvestigateScreen key={id} stageId={id} go={go} />;
  }
  switch (route) {
    case "sort":
      return <SortScreen go={go} />;
    case "tutorial":
      return <TutorialScreen go={go} />;
    case "build":
      return <BuildScreen go={go} />;
    case "stages":
      return <StageSelectScreen go={go} />;
    case "lab":
      return <LabScreen go={go} />;
    default:
      return <MainScreen go={go} />;
  }
}
