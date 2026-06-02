"use client";

// ─────────────────────────────────────────────────────
// AIDealsPanel — AI Deals / 羊毛福利 (fixed 5 items)
// 行可点击：click 在条目下方内联展开「值不值得看」短评（deal 口吻）。
// 单开手风琴：click 另一条关闭当前。可信度 chip 仍常驻行首。
// ─────────────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import type { AIDealItem } from "../types";
import { InsightCard } from "./InsightCard";

export function AIDealsPanel({ items }: { items: AIDealItem[] }) {
  const display = items.slice(0, 5);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  return (
    <section className="mcm-panel p-3.5">
      <p className="mb-2.5 text-[14px] font-black uppercase tracking-wide text-[var(--foreground)]">
        AI 福利羊毛
      </p>
      {display.length === 0 ? (
        <p className="text-[13px] text-[var(--walnut)]">今日暂无可靠福利信号。</p>
      ) : (
        <div>
          {display.map((deal, i) => {
            const key = deal.title + i;
            const isExpanded = expandedKey === key;
            const panelId = `deal-insight-${i}`;
            const hasInsight = Boolean(
              deal.ai_insight?.summary || (deal.summary ?? "").trim(),
            );
            const toggle = () => setExpandedKey(isExpanded ? null : key);
            return (
              <div key={key}>
                <div
                  className={`deal-row flex items-start gap-2 border-b border-dashed border-[var(--line)]/30 py-2${
                    hasInsight ? " cursor-pointer" : ""
                  }${isExpanded ? " is-active" : ""}`}
                  role={hasInsight ? "button" : undefined}
                  tabIndex={hasInsight ? 0 : undefined}
                  aria-expanded={hasInsight ? isExpanded : undefined}
                  aria-controls={hasInsight && isExpanded ? panelId : undefined}
                  onClick={hasInsight ? toggle : undefined}
                  onKeyDown={
                    hasInsight
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggle();
                          }
                        }
                      : undefined
                  }
                >
                  {/* Confidence badge */}
                  <span
                    className={`mt-0.5 shrink-0 rounded px-1 text-[11px] font-bold ${
                      deal.confidence === "high"
                        ? "bg-[var(--accent)]/15 text-[var(--accent-strong)]"
                        : deal.confidence === "medium"
                          ? "bg-[var(--walnut)]/10 text-[var(--walnut)]"
                          : "bg-[var(--walnut)]/5 text-[var(--walnut)]/60"
                    }`}
                  >
                    {deal.confidence === "high" ? "高" : deal.confidence === "medium" ? "中" : "低"}
                  </span>

                  <div className="min-w-0 flex-1">
                    {/* Title */}
                    {deal.url ? (
                      <Link
                        href={deal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] font-bold text-[var(--foreground)] hover:text-[var(--accent-strong)]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {deal.title}
                      </Link>
                    ) : (
                      <span className="text-[13px] font-bold text-[var(--foreground)]">
                        {deal.title}
                      </span>
                    )}

                    {/* Provider + valid until */}
                    <div className="mt-0.5 flex items-center gap-2 text-[12px] text-[var(--walnut)]">
                      {deal.provider && <span>{deal.provider}</span>}
                      {deal.valid_until && (
                        <span className="text-[var(--walnut)]/60">
                          截至 {deal.valid_until}
                        </span>
                      )}
                    </div>

                    {/* Summary（截断作为预览，展开后由短评卡承载完整解读） */}
                    {deal.summary && (
                      <p className="mt-0.5 truncate text-[12px] leading-relaxed text-[var(--walnut)]/85">
                        {deal.summary}
                      </p>
                    )}
                  </div>
                </div>

                {isExpanded && hasInsight && (
                  <div
                    id={panelId}
                    className="ai-insight deal-insight"
                    role="region"
                    aria-label="AI 解读"
                  >
                    <InsightCard insight={deal.ai_insight} fallback={deal.summary} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {display.length > 0 && display.length < 5 && (
        <p className="mt-2 text-[12px] text-[var(--walnut)]/70 italic">
          今日暂无更多可靠福利信号
        </p>
      )}
    </section>
  );
}
