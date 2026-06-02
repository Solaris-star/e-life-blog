"use client";

// ─────────────────────────────────────────────────────
// TopStoryCard — single Top Story as a vintage paper strip.
// Click (or Enter/Space) toggles an inline AI-insight drawer
// rendered below the row, in normal document flow.
// A brand icon sits by the headline and a cover plate on the right
// (real image when the backend provides one, else a brand logo plate).
// The external-link icon is a sibling of the trigger button
// so there is no interactive element nested inside the button.
// ─────────────────────────────────────────────────────
import { ExternalLink } from "lucide-react";
import type { TopStoryItem } from "../types";
import { faviconUrl, domainOf } from "@/lib/daily/brandIcon";
import { ActionPill } from "./ActionPill";
import { BrandIcon } from "./BrandIcon";
import { ImportanceDots } from "./ImportanceDots";
import { TagList } from "./TagList";
import { InsightCard } from "./InsightCard";

export function TopStoryCard({
  story,
  index,
  isExpanded,
  onToggle,
}: {
  story: TopStoryItem;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const panelId = `top-story-insight-${story.rank ?? index}`;

  // 展开抽屉用 normalize 派生的 ai_insight（无标签自然短评），
  // 缺失时回退纯 summary。彻底替代旧的「做什么/为什么重要」标签行。
  const hasInsight = Boolean(
    story.ai_insight?.summary || (story.summary ?? "").trim(),
  );

  const num = String(index + 1).padStart(2, "0");
  const iconName = story.source || domainOf(story.url) || story.title;

  return (
    <li className={`story-strip${isExpanded ? " is-active" : ""}`}>
      <button
        type="button"
        className="story-trigger"
        aria-expanded={isExpanded}
        aria-controls={hasInsight ? panelId : undefined}
        onClick={onToggle}
      >
        <span className="story-index">{num}</span>

        <span className="story-body">
          <span className="story-headline-row">
            <BrandIcon
              src={faviconUrl(story.url, 64)}
              name={iconName}
              size={22}
              rounded
              className="story-brand"
            />
            {story.source && <span className="story-source">{story.source}</span>}
            <span className="story-title">{story.title}</span>
          </span>

          {story.summary && <span className="story-summary">{story.summary}</span>}

          <span className="story-meta">
            <ImportanceDots level={story.importance} />
            <TagList tags={story.tags} />
            {story.action && <ActionPill action={story.action} />}
          </span>
        </span>

        <span className="story-cover">
          {story.image ? (
            <img
              className="story-cover-img"
              src={story.image}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <BrandIcon src={faviconUrl(story.url, 128)} name={iconName} size={40} />
          )}
        </span>
      </button>

      {story.url && (
        <a
          className="story-link"
          href={story.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="打开原文"
          title="打开原文"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      )}

      {isExpanded && hasInsight && (
        <div id={panelId} className="ai-insight" role="region" aria-label="AI 解读">
          <InsightCard insight={story.ai_insight} fallback={story.summary} />
        </div>
      )}
    </li>
  );
}
