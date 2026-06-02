// ─────────────────────────────────────────────────────
// ActionPill — action badge
// ─────────────────────────────────────────────────────
import type { ActionType } from "../types";

const COLOR: Record<string, string> = {
  "试用": "bg-[var(--accent)]/15 text-[var(--accent-strong)]",
  "收藏": "bg-yellow-500/10 text-yellow-700",
  "跟进": "bg-blue-500/10 text-blue-700",
  "略过": "bg-[var(--walnut)]/10 text-[var(--walnut)]",
  "深入阅读": "bg-purple-500/10 text-purple-700",
};

export function ActionPill({ action }: { action: string }) {
  const cls = COLOR[action] ?? COLOR["略过"];
  return (
    <span className={`inline-block rounded-sm px-2 py-0.5 text-[12px] font-bold ${cls}`}>
      {action}
    </span>
  );
}
