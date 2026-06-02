"use client";

// ─────────────────────────────────────────────────────
// GithubTrendingPanel — Github Trending
// Fixed 10 items. hover 300ms 在列表「左侧」预览开发者点评浮层；
// click 锁定常驻，再 click 或点外部 / Esc 关闭；单开（lockedKey 提升到本面板）。
// NEVER calls LLM — 仅渲染 normalize 派生的 ai_insight。
// ─────────────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { GithubTrendingItem } from "../types";
import { githubAvatarUrl } from "@/lib/daily/brandIcon";
import { SideInsightPopover } from "./SideInsightPopover";
import { BrandIcon } from "./BrandIcon";

export function GithubTrendingPanel({ items }: { items: GithubTrendingItem[] }) {
  const display = items.slice(0, 10);
  const [lockedKey, setLockedKey] = useState<string | null>(null);

  if (!display.length) {
    return (
      <div className="mcm-panel p-3.5">
        <p className="text-[14px] font-black uppercase tracking-wide text-[var(--foreground)]">
          GitHub 热门
        </p>
        <p className="mt-2 text-[13px] text-[var(--walnut)]">暂无数据。</p>
      </div>
    );
  }

  return (
    <section className="mcm-panel p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[14px] font-black uppercase tracking-wide text-[var(--foreground)]">
          GitHub 热门
        </p>
        <span className="text-[13px] font-bold text-[var(--walnut)]">
          前 {display.length}
        </span>
      </div>
      <div>
        {display.map((item) => {
          const key = `${item.owner}/${item.repo}`;
          return (
            <GithubRow
              key={key}
              item={item}
              locked={lockedKey === key}
              onToggleLock={() =>
                setLockedKey((prev) => (prev === key ? null : key))
              }
            />
          );
        })}
      </div>
    </section>
  );
}

function GithubRow({
  item,
  locked,
  onToggleLock,
}: {
  item: GithubTrendingItem;
  locked: boolean;
  onToggleLock: () => void;
}) {
  return (
    <SideInsightPopover
      insight={item.ai_insight}
      githubInsight={item.githubInsight}
      fallback={item.description}
      locked={locked}
      onToggleLock={onToggleLock}
    >
      <div className="group flex items-start gap-2.5 border-b border-dashed border-[var(--line)]/30 py-2">
        {/* Rank */}
        <span className="w-5 shrink-0 text-right text-[13px] font-black tabular-nums text-[var(--walnut)]">
          {item.rank}
        </span>

        {/* Owner avatar */}
        <BrandIcon
          src={githubAvatarUrl(item.owner, 64)}
          name={item.owner}
          size={26}
          rounded
          className="mt-0.5 shrink-0"
        />

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <Link
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-[13px] font-bold text-[var(--foreground)] hover:text-[var(--accent-strong)]"
              onClick={(e) => e.stopPropagation()}
            >
              {item.repo}
            </Link>
            <span className="shrink-0 text-[12px] font-bold text-[var(--walnut)]">
              ⭐ {fmtStars(item.today_stars || 0)}
            </span>
          </div>
          <p className="truncate text-[12px] leading-relaxed text-[var(--walnut)]/85 mt-0.5">
            {item.description}
          </p>
          <div className="mt-1 flex items-center gap-2.5 text-[12px] text-[var(--walnut)]">
            <span>{item.language}</span>
            <span>★ {fmtStars(item.stars)}</span>
          </div>
        </div>

        <ExternalLink className="mt-1 h-3 w-3 shrink-0 text-[var(--walnut)]/30" />
      </div>
    </SideInsightPopover>
  );
}

function fmtStars(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}
