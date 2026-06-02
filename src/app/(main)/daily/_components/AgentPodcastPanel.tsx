"use client";

// ─────────────────────────────────────────────────────
// AgentPodcastPanel — Agent Podcast / Newsletter (fixed 6 items)
// ─────────────────────────────────────────────────────
import Link from "next/link";
import type { AgentPodcastItem } from "../types";
import { AIInsightPopover } from "./AIInsightPopover";

export function AgentPodcastPanel({ items }: { items: AgentPodcastItem[] }) {
  const display = items.slice(0, 6);

  // Sort: updated first
  const sorted = [...display].sort((a, b) => (b.updated ? 1 : 0) - (a.updated ? 1 : 0));

  return (
    <section className="mcm-panel p-3.5">
      <p className="mb-2.5 text-[14px] font-black uppercase tracking-wide text-[var(--foreground)]">
        Agent Podcast / NL
      </p>
      {sorted.length === 0 ? (
        <p className="text-[13px] text-[var(--walnut)]">暂无播客数据。</p>
      ) : (
        <div>
          {sorted.map((pod, i) => (
            <AIInsightPopover
              key={pod.name + i}
              insight={pod.ai_commentary}
              fallback={pod.summary || `${pod.name} — ${pod.updated ? "已更新" : "未更新"}`}
            >
              <div className="flex items-start gap-2.5 border-b border-dashed border-[var(--line)]/30 py-2">
                {/* Status dot */}
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    pod.updated ? "bg-[var(--accent)]" : "bg-[var(--line)]"
                  }`}
                />

                <div className="min-w-0 flex-1">
                  {/* Name + status */}
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[var(--foreground)]">
                      {pod.name}
                    </span>
                    <span className={`text-[12px] ${pod.updated ? "text-[var(--accent-strong)] font-bold" : "text-[var(--walnut)]/60"}`}>
                      {pod.updated ? "● 已更新" : "○ 未更新"}
                    </span>
                  </div>

                  {/* Latest title */}
                  {pod.latest_title && (
                    <div className="mt-0.5">
                      {pod.url ? (
                        <Link
                          href={pod.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate text-[12px] leading-relaxed text-[var(--walnut)] hover:text-[var(--accent-strong)]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {pod.latest_title}
                        </Link>
                      ) : (
                        <p className="truncate text-[12px] leading-relaxed text-[var(--walnut)]">
                          {pod.latest_title}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Summary */}
                  {pod.summary && (
                    <p className="mt-0.5 truncate text-[12px] leading-relaxed text-[var(--walnut)]/85">
                      {pod.summary}
                    </p>
                  )}
                </div>
              </div>
            </AIInsightPopover>
          ))}
        </div>
      )}
      {sorted.length > 0 && sorted.length < 6 && (
        <p className="mt-2 text-[12px] text-[var(--walnut)]/70 italic">
          仅追踪到 {sorted.length} 个来源
        </p>
      )}
    </section>
  );
}
