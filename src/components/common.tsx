import type { ReactNode } from "react";
import { PLACEHOLDER } from "../data/placeholders";
import { ROLES } from "../data/roles";
import type { Role } from "../data/types";

/** 생물 그림. 지금은 자리 표시 이모지 — 실제 그림이 준비되면 이 컴포넌트만 바꿈 */
export function Pic({ image }: { image: string }) {
  return <span aria-hidden="true">{PLACEHOLDER[image] ?? "❔"}</span>;
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`role ${role}`}>
      <span aria-hidden="true">{ROLES[role].icon}</span>
      {ROLES[role].name}
    </span>
  );
}

export interface ToastMessage {
  kind: "ok" | "bad" | "info";
  title: string;
  text?: string;
}

const TOAST_ICON = { ok: "✅", bad: "🤔", info: "💬" };

export function Toast({ message }: { message: ToastMessage | null }) {
  // 화면 읽기 프로그램이 바뀐 내용을 읽도록 자리는 항상 둠
  return (
    <div role="status" aria-live="polite">
      {message && (
        <div className={`toast ${message.kind === "bad" ? "" : message.kind}`}>
          <span className="ic" aria-hidden="true">
            {TOAST_ICON[message.kind]}
          </span>
          <div>
            <b>{message.title}</b>
            {message.text && <p>{message.text}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export function AppBar({ crumb, children, onExit }: { crumb?: ReactNode; children?: ReactNode; onExit?: () => void }) {
  return (
    <header className="appbar">
      <div className="logo">
        <span className="mark" aria-hidden="true">
          🧭
        </span>
        먹이그물 탐험대
      </div>
      {crumb && <span className="crumb">{crumb}</span>}
      <span className="sp" />
      {children}
      {onExit && (
        <button className="iconbtn" aria-label="처음 화면으로" onClick={onExit}>
          ✕
        </button>
      )}
    </header>
  );
}

export const starText = (stars: number) => "★".repeat(stars) + "☆".repeat(3 - stars);
