// ─────────────────────────────────────────────────────
// SourceStatsPanel — 数据源统计
// ─────────────────────────────────────────────────────
import type { SourceItem } from "../types";

export function SourceStatsPanel({ sources }: { sources: SourceItem[] }) {
  if (!sources.length) return null;

  return (
    <section className="mcm-panel p-4">
      <div className="mb-3 flex items-center gap-3">
        <p className="text-[15px] font-black text-[var(--foreground)]">数据源统计</p>
        <span className="text-[13px] font-bold text-[var(--walnut)]">
          {sources.length} 个来源
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {sources.map((s) => (
          <span
            key={s.name}
            className="inline-flex items-center gap-1.5 text-[13px] text-[var(--walnut)]"
          >
            <span className="font-bold text-[var(--foreground)]/80">{s.name}</span>
            <span className="text-[12px] tabular-nums text-[var(--walnut)]/60">
              ×{s.count}
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
