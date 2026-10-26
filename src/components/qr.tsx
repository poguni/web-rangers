// 앱 접속 QR 코드(시작 화면·교사 메뉴). 외부 서비스 없이 기기 안에서 만들어 오프라인에서도 보임
import qrcode from "qrcode-generator";
import { useEffect, useMemo, useRef } from "react";

/** 지금 주소(#/ 뒷부분 제외)를 담은 QR 코드. 오프라인에서도 기기 안에서 만듦 */
export function QrCode({ size }: { size: number }) {
  const path = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(appUrl());
    qr.make();
    const n = qr.getModuleCount();
    let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + 2},${r + 2}h1v1h-1z`;
    return { d, n: n + 4 }; // 둘레 2칸 여백
  }, []);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${path.n} ${path.n}`} shapeRendering="crispEdges" aria-hidden="true">
      <rect width={path.n} height={path.n} fill="#fff" />
      <path d={path.d} fill="#1f2a37" />
    </svg>
  );
}

const appUrl = () => location.origin + location.pathname;

export function QrDialog({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="qr-overlay" onClick={onClose}>
      <div className="panel qr-dialog" role="dialog" aria-modal="true" aria-label="접속 QR 코드" onClick={(e) => e.stopPropagation()}>
        <h2>📷 카메라로 QR 코드를 찍어 접속해요</h2>
        <QrCode size={360} />
        <p className="qr-url">{appUrl()}</p>
        <button ref={closeRef} className="btn ghost" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
