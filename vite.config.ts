import { readdirSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

/** 오프라인(PRD 11장): 빌드한 파일 전부(글꼴 포함)를 처음 접속할 때 기기에 저장하는 서비스 워커를 만듦 */
function offline(): Plugin {
  // public 폴더에서 그대로 복사되는 파일. 그림은 앱이 쓰는 것만(256·512px, 사건·행동 카드, 배경)
  const images = readdirSync("public/img", { recursive: true, encoding: "utf8" })
    .map((f) => `img/${f.replace(/\\/g, "/")}`)
    .filter((f) => /-(256|512)\.webp$|^img\/(event|action)\/.*\.webp$|^img\/ui\/ui-bg-.*\.webp$/.test(f));
  const extra = ["manifest.webmanifest", ...images];
  return {
    name: "webrangers-offline",
    apply: "build",
    enforce: "post", // index.html이 만들어진 뒤에 목록을 만듦
    generateBundle(_, bundle) {
      // 크롬·엣지는 woff2 글꼴만 쓰므로 옛 형식(.woff)은 저장하지 않음
      const files = ["./", ...[...Object.keys(bundle), ...extra].filter((f) => !f.endsWith(".woff")).map((f) => `./${f}`)];
      let h = 0;
      for (const ch of files.join("|")) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: `// 자동 생성(vite.config.ts): 한 번 접속하면 인터넷 없이도 앱을 쓸 수 있게 모든 파일을 저장
const CACHE = "webrangers-${h.toString(16)}";
const FILES = ${JSON.stringify(files)};
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("webrangers-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});
// ignoreVary: 서버가 "Vary: Origin"을 붙이면 crossorigin 모듈 요청이 저장본과 어긋나 오프라인에서 빈 화면이 됨
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true, ignoreVary: true }).then((hit) => hit || fetch(e.request)));
});
`,
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), offline()],
  base: "./", // GitHub Pages 하위 경로에서도 동작
});
