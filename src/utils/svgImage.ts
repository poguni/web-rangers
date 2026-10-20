// F3-11 먹이그물을 그림(PNG)으로 저장: 화면의 SVG를 복사해 그림으로 그림
// SVG를 그림으로 바꾸면 CSS 파일의 모양이 빠지므로, 화면에 적용된 모양을 각 요소에 직접 옮겨 담음
const PROPS = [
  "fill",
  "stroke",
  "stroke-width",
  "stroke-dasharray",
  "opacity",
  "font-size",
  "font-family",
  "font-weight",
  "paint-order",
  "text-anchor",
  "dominant-baseline",
  "display",
  "transform",
];

function inlineStyles(src: Element, dst: Element) {
  const cs = getComputedStyle(src);
  (dst as SVGElement).setAttribute("style", PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(";"));
  dst.removeAttribute("class");
  for (let i = 0; i < src.children.length; i++) inlineStyles(src.children[i], dst.children[i]);
}

/** svg → PNG 내려받기. 위에 제목 한 줄을 넣음 */
export async function saveSvgAsPng(svg: SVGSVGElement, fileName: string, title: string) {
  const [, , w, h] = svg.getAttribute("viewBox")!.split(" ").map(Number);
  const SCALE = 2; // 학습지에 인쇄해도 흐리지 않게
  const TOP = 56;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  inlineStyles(svg, clone);
  clone.querySelectorAll("animate, .rubber, .hit").forEach((el) => el.remove());
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(h));
  clone.removeAttribute("style");

  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("그림을 만들지 못했어요"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = w * SCALE;
    canvas.height = (h + TOP) * SCALE;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(SCALE, SCALE);
    ctx.fillStyle = "#FFFDF7";
    ctx.fillRect(0, 0, w, h + TOP);
    ctx.fillStyle = "#24466B";
    ctx.font = "bold 24px 'Noto Sans KR', sans-serif";
    ctx.fillText(title, 20, 36);
    ctx.drawImage(img, 0, TOP, w, h);
    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  } finally {
    URL.revokeObjectURL(url);
  }
}
