// 카드 "끌어서 놓기"와 "누르기"를 한 카드에서 함께 처리(Pointer Events: 마우스·터치패드·터치)
// 누르기는 onClick으로 받아 키보드(Enter·Space)로도 동작함
import { useRef, useState, type PointerEvent } from "react";

const DRAG_START = 8; // 이만큼 움직여야 끌기로 봄(px)

export function useCardDrag<T>(onDrop: (item: T, x: number, y: number) => void, onTap: (item: T) => void) {
  const [drag, setDrag] = useState<{ item: T; x: number; y: number } | null>(null);
  const start = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const dropping = useRef(false); // 끌기를 끝낸 pointerup 바로 뒤에 오는 click 하나만 무시

  const bind = (item: T) => ({
    onPointerDown(e: PointerEvent<HTMLElement>) {
      if (e.button !== 0) return;
      start.current = { x: e.clientX, y: e.clientY, moved: false };
      // 누르는 순간 붙잡아야 빠르게 끌어 한 번에 카드 밖으로 나가도 이동·놓기를 받음
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      const s = start.current;
      if (!s) return;
      if (!s.moved) {
        if (Math.hypot(e.clientX - s.x, e.clientY - s.y) < DRAG_START) return;
        s.moved = true;
      }
      setDrag({ item, x: e.clientX, y: e.clientY });
    },
    onPointerUp(e: PointerEvent<HTMLElement>) {
      const s = start.current;
      start.current = null;
      if (!s?.moved) return;
      setDrag(null);
      dropping.current = true;
      setTimeout(() => (dropping.current = false));
      onDrop(item, e.clientX, e.clientY);
    },
    onPointerCancel() {
      start.current = null;
      setDrag(null);
    },
    onClick() {
      if (dropping.current) return;
      onTap(item);
    },
  });

  return { drag, bind };
}
