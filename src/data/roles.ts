// 교과서 47쪽 생산자·소비자·분해자 (역할 색은 tokens.css의 --producer 등)
import type { Role } from "./types";

export const ROLES: Record<Role, { name: string; icon: string; desc: string }> = {
  producer: { name: "생산자", icon: "🌱", desc: "햇빛 등을 이용해 스스로 양분을 만들어요." },
  consumer: { name: "소비자", icon: "🐾", desc: "다른 생물을 먹이로 하여 살아가요." },
  decomposer: {
    name: "분해자",
    icon: "🍄",
    desc: "죽은 생물이나 배출물을 분해해 양분을 얻고, 다른 생물이 이용할 수 있게 해요.",
  },
};
