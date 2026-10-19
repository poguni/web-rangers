import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// 글꼴을 앱에 함께 넣음(오프라인·학교 와이파이 대응, DESIGN 5장)
import "@fontsource/jua/400.css";
import "@fontsource/noto-sans-kr/400.css";
import "@fontsource/noto-sans-kr/700.css";
import "./styles/tokens.css";
import "./styles/app.css";
import "./styles/investigate.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
