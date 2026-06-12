"use client";

// ─────────────────────────────────────────────────────
// XHotspotsPanel — X AI Hotspots (fixed 12 readable items)
// hover / click 使用与 GitHub 热门一致的侧边 AI 解读浮层。
// ─────────────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import type { XHotspotItem } from "../types";
import { SideInsightPopover } from "./SideInsightPopover";

export function XHotspotsPanel({ items }: { items: XHotspotItem[] }) {
  // Fixed 12 readable items: aligns with the 6-card left tab grid without leaving one extra row.
  const display = items.slice(0, 12);
  const [lockedKey, setLockedKey] = useState<string | null>(null);

  return (
    <section className="x-hotspots-panel mcm-panel p-3.5">
      <p className="x-hotspots-title mb-2.5 text-[14px] font-black uppercase tracking-wide text-[var(--foreground)]">
        X 生态热点
      </p>
      {display.length === 0 ? (
        <p className="text-[13px] text-[var(--walnut)]">今日暂无热点数据。</p>
      ) : (
        <div className="x-hotspots-list">
          {display.map((item, i) => {
            const key = item.topic + i;
            return (
              <SideInsightPopover
                key={key}
                insight={item.ai_insight}
                fallback={item.summary}
                locked={lockedKey === key}
                onToggleLock={() =>
                  setLockedKey((prev) => (prev === key ? null : key))
                }
              >
                <div
                  className={`x-row flex items-start gap-2.5 border-b border-dashed border-[var(--line)]/30 py-2${
                    lockedKey === key ? " is-active" : ""
                  }`}
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
              </SideInsightPopover>
            );
          })}
        </div>
      )}
      {display.length > 0 && display.length < 12 && (
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
