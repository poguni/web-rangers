import type { ReactNode } from "react";
import { imageUrl } from "../data/images";
import { cardById } from "../game/cards";
import { ROLES } from "../data/roles";
import type { Role } from "../data/types";

/** 생물·사건·행동 그림. 글자 크기(em)에 맞춰 커지므로 이모지 자리였던 곳에 그대로 들어감 */
export function Pic({ image }: { image: string }) {
  return <img className="pic" src={imageUrl(image)} alt="" draggable={false} />;
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

/** 카드 보상 알림(F2-3): "🎁 새 카드 2장: 붕어마름, 부들" */
export function RewardNote({ ids }: { ids: string[] }) {
  if (ids.length === 0) return null;
  return (
    <div className="reward" role="status">
      <b>🎁 새 카드 {ids.length}장!</b>
      {ids.map((id) => {
        const s = cardById.get(id)!;
        return (
          <span key={id} className="reward-card">
            <Pic image={s.image} /> {s.name}
          </span>
        );
      })}
    </div>
  );
}

export const starText = (stars: number) => "★".repeat(stars) + "☆".repeat(3 - stars);
