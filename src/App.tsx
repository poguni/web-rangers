import { useEffect, useState } from "react";
import type { Theme } from "./data/types";
import { BuildScreen } from "./screens/BuildScreen";
import { CardsScreen } from "./screens/CardsScreen";
import { DiagnosticScreen } from "./screens/DiagnosticScreen";
import { GuideScreen } from "./screens/GuideScreen";
import { InvestigateScreen } from "./screens/InvestigateScreen";
import { LabScreen } from "./screens/LabScreen";
import { MainScreen } from "./screens/MainScreen";
import { SortScreen } from "./screens/SortScreen";
import { StageSelectScreen } from "./screens/StageSelectScreen";
import { StartScreen } from "./screens/StartScreen";
import { TeacherGate, TeacherScreen } from "./screens/TeacherScreen";
import { TeamScreen } from "./screens/TeamScreen";
import { TutorialScreen } from "./screens/TutorialScreen";
import { useProgress } from "./store/progress";

// 주소 뒤 #/sort, #/stage/forest-1 처럼 화면을 나눔(GitHub Pages에서도 새로 고침해도 같은 화면)
export type Route =
  | ""
  | "sort"
  | "sort/abiotic"
  | "tutorial"
  | "build"
  | "stages"
  | "lab"
  | "cards"
  | `${"build" | "stages" | "lab"}/${Theme}`
  | "diag"
  | "diag/pre"
  | "diag/post"
  | "teacher"
  | "team"
  | "guide"
  | `stage/${string}`;

const readRoute = (): Route => location.hash.replace(/^#\/?/, "") as Route;
const go = (r: Route) => {
  location.hash = `/${r}`;
};
const TEACHER_ROUTES: Route[] = ["teacher", "team", "guide"];

export function App() {
  const [route, setRoute] = useState(readRoute);
  const current = useProgress((s) => s.current);
  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  if (TEACHER_ROUTES.includes(route)) {
    return (
      <TeacherGate go={go}>
        {route === "team" ? <TeamScreen go={go} /> : route === "guide" ? <GuideScreen go={go} /> : <TeacherScreen go={go} />}
      </TeacherGate>
    );
  }
  // 학생 번호를 고르기 전에는 시작 화면(F1-1)
  if (!current) return <StartScreen />;

  if (route.startsWith("stage/")) {
    const id = route.slice("stage/".length);
    return <InvestigateScreen key={id} stageId={id} go={go} />;
  }
  // build·stages·lab 뒤에 테마(없으면 숲): #/build/river
  const [screen, arg] = route.split("/");
  const theme: Theme = arg === "river" || arg === "sea" ? arg : "forest";
  switch (screen) {
    case "build":
      return <BuildScreen key={theme} theme={theme} go={go} />;
    case "stages":
      return <StageSelectScreen key={theme} theme={theme} go={go} />;
    case "lab":
      return <LabScreen key={theme} theme={theme} go={go} />;
  }
  switch (route) {
    case "sort":
    case "sort/abiotic":
      return <SortScreen key={route} kind={route === "sort" ? "role" : "abiotic"} go={go} />;
    case "tutorial":
      return <TutorialScreen go={go} />;
    case "cards":
      return <CardsScreen go={go} />;
    case "diag":
    case "diag/pre":
    case "diag/post":
      return <DiagnosticScreen key={route} kind={route === "diag" ? null : route === "diag/pre" ? "pre" : "post"} go={go} />;
    default:
      return <MainScreen go={go} />;
  }
}
