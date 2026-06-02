"use client";

// ─────────────────────────────────────────────────────
// XHotspotsPanel — X AI Hotspots (fixed 8 items)
// 行可点击：click 在条目下方内联展开「舆论温度计」短评（social 口吻）。
// 单开手风琴：click 另一条关闭当前。hover 仅由 CSS 轻高亮。
// ─────────────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import type { XHotspotItem } from "../types";
import { InsightCard } from "./InsightCard";

export function XHotspotsPanel({ items }: { items: XHotspotItem[] }) {
  const display = items.slice(0, 8);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  return (
    <section className="mcm-panel p-3.5">
      <p className="mb-2.5 text-[14px] font-black uppercase tracking-wide text-[var(--foreground)]">
        X 生态热点
      </p>
      {display.length === 0 ? (
        <p className="text-[13px] text-[var(--walnut)]">今日暂无热点数据。</p>
      ) : (
        <div>
          {display.map((item, i) => {
            const key = item.topic + i;
            const isExpanded = expandedKey === key;
            const panelId = `x-insight-${i}`;
            const hasInsight = Boolean(
              item.ai_insight?.summary || (item.summary ?? "").trim(),
            );
            const toggle = () => setExpandedKey(isExpanded ? null : key);
            return (
              <div key={key}>
                <div
                  className={`x-row flex items-start gap-2.5 border-b border-dashed border-[var(--line)]/30 py-2${
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
                  {/* Heat indicator */}
                  <span className="mt-0.5 shrink-0 text-[14px]">
                    {item.heat >= 4 ? "🔥" : item.heat >= 3 ? "📈" : "💬"}
                  </span>

                  <div className="min-w-0 flex-1">
                    {/* Topic */}
                    <div className="flex items-center gap-2">
                      {item.representative_source_url ? (
                        <Link
                          href={item.representative_source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[13px] font-bold text-[var(--foreground)] hover:text-[var(--accent-strong)]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.topic}
                        </Link>
                      ) : (
                        <span className="text-[13px] font-bold text-[var(--foreground)]">
                          {item.topic}
                        </span>
                      )}
                      <span className="text-[12px] text-[var(--walnut)]">
                        {heatLabel(item.heat)}
                      </span>
                    </div>

                    {/* Summary（截断作为预览，展开后由短评卡承载完整解读） */}
                    {item.summary && (
                      <p className="mt-0.5 truncate text-[12px] leading-relaxed text-[var(--walnut)]/85">
                        {item.summary}
                      </p>
                    )}

                    {/* Tags */}
                    {item.tags?.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-block border border-[var(--line)] px-1.5 text-[11px] font-bold text-[var(--walnut)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {isExpanded && hasInsight && (
                  <div
                    id={panelId}
                    className="ai-insight x-insight"
                    role="region"
                    aria-label="AI 解读"
                  >
                    <InsightCard insight={item.ai_insight} fallback={item.summary} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {display.length > 0 && display.length < 8 && (
        <p className="mt-2 text-[12px] text-[var(--walnut)]/70 italic">
          今日仅抓取到 {display.length} 条热点
        </p>
      )}
    </section>
  );
}

function heatLabel(h: number): string {
  if (h >= 5) return "爆";
  if (h >= 4) return "热";
  if (h >= 3) return "趋势";
  return "讨论";
}
