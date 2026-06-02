"use client";

// ─────────────────────────────────────────────────────
// TopStoriesList — left-column top stories (fixed 8 items)
// Vintage clipping list; owns which story's AI insight is expanded
// so opening one collapses the previous (single-open accordion).
// ─────────────────────────────────────────────────────
import { useState } from "react";
import type { TopStoryItem } from "../types";
import { TopStoryCard } from "./TopStoryCard";

function storyId(story: TopStoryItem, i: number): string {
  return story.url || String(story.rank ?? i);
}

export function TopStoriesList({ stories }: { stories: TopStoryItem[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!stories.length) {
    return (
      <section className="mcm-panel p-6 text-center">
        <p className="section-kicker">重磅新闻</p>
        <p className="mt-3 text-[14px] text-[var(--walnut)]">今日暂无重磅新闻。</p>
      </section>
    );
  }

  const display = stories.slice(0, 8);

  return (
    <section className="top-stories-panel">
      <div className="top-stories-head">
        <p className="section-kicker">重磅新闻</p>
        <span className="text-[14px] font-bold text-[var(--walnut)]">
          {display.length} 条
        </span>
      </div>

      <ol className="top-stories-list">
        {display.map((story, i) => {
          const id = storyId(story, i);
          return (
            <TopStoryCard
              key={`${story.url}-${i}`}
              story={story}
              index={i}
              isExpanded={expandedId === id}
              onToggle={() =>
                setExpandedId((prev) => (prev === id ? null : id))
              }
            />
          );
        })}
      </ol>

      {stories.length < 8 && (
        <p className="mt-2 px-2 pb-1 text-[13px] text-[var(--walnut)]/70 italic">
          今日仅抓取到 {stories.length} 条 AI 重磅信号
        </p>
      )}
    </section>
  );
}
