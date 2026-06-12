// ─────────────────────────────────────────────────────
// ActionPill — action badge
// 仅用主题 token 配色（.dark 下自动翻转），不用固定 Tailwind 色板
// ─────────────────────────────────────────────────────
import type { ActionType } from "../types";

const COLOR: Record<string, string> = {
  "试用": "bg-[var(--accent)]/15 text-[var(--accent-strong)]",
  "收藏": "bg-[var(--mustard)]/25 text-[var(--walnut)]",
  "跟进": "bg-[var(--olive)]/15 text-[var(--olive-dark)]",
  "略过": "bg-[var(--walnut)]/10 text-[var(--walnut)]",
  "深入阅读": "bg-[var(--ink)]/10 text-[var(--foreground)]",
};

export function ActionPill({ action }: { action: string }) {
  const cls = COLOR[action] ?? COLOR["略过"];
  return (
    <span className={`inline-block rounded-sm px-2 py-0.5 text-[12px] font-bold ${cls}`}>
      {action}
    </span>
  );
}
