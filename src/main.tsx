import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// 글꼴을 앱에 함께 넣음(오프라인·학교 와이파이 대응, DESIGN 5장)
import "@fontsource/jua/400.css";
import "@fontsource/noto-sans-kr/400.css";
import "@fontsource/noto-sans-kr/700.css";
import "./styles/tokens.css";
import "./styles/app.css";
import "./styles/investigate.css";
import "./styles/classroom.css";
import "./styles/cards.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// 오프라인: 배포판에서만 서비스 워커 등록(개발 서버에서는 저장된 옛 파일이 보이지 않게 끔)
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
}
