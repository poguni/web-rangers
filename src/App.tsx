import { useEffect, useState } from "react";
import { BuildScreen } from "./screens/BuildScreen";
import { MainScreen } from "./screens/MainScreen";
import { SortScreen } from "./screens/SortScreen";
import { TutorialScreen } from "./screens/TutorialScreen";

// 주소 뒤 #/sort 처럼 화면을 나눔(GitHub Pages에서도 새로 고침해도 같은 화면)
export type Route = "" | "sort" | "tutorial" | "build";
const ROUTES: Route[] = ["", "sort", "tutorial", "build"];

const readRoute = (): Route => {
  const r = location.hash.replace(/^#\/?/, "") as Route;
  return ROUTES.includes(r) ? r : "";
};
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

  switch (route) {
    case "sort":
      return <SortScreen go={go} />;
    case "tutorial":
      return <TutorialScreen go={go} />;
    case "build":
      return <BuildScreen go={go} />;
    default:
      return <MainScreen go={go} />;
  }
}
