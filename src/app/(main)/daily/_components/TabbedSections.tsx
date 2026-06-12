"use client";

// ─────────────────────────────────────────────────────
// TabbedSections — AI Tools / Research / Business as tabs.
// 每个 item 是复古卡片（品牌图标 + 标题 + 摘要）。整卡可点击：
// click 在网格中「跨整行」内联展开 AI 短评（grid-column:1/-1，Fragment 平铺）。
// 单开手风琴：click 另一条关闭当前；切换 tab 自动收起。
// 文案口吻由 normalize 派生的 ai_insight.style 决定（tools=editorial、
// research=research、business=market）。NEVER calls LLM。
// ─────────────────────────────────────────────────────
import { Fragment, useRef, useState } from "react";
import Link from "next/link";
import type {
  DailyRadarSections,
  AIToolItem,
  ResearchItem,
  BusinessPolicyItem,
  AIDealItem,
  ActionType,
} from "../types";
import { faviconUrl } from "@/lib/daily/brandIcon";
import { BrandIcon } from "./BrandIcon";
import { InsightCard } from "./InsightCard";
import { TagList } from "./TagList";
import { ActionPill } from "./ActionPill";

type Variant = "tools" | "research" | "business" | "deals";
type SectionItem = AIToolItem | ResearchItem | BusinessPolicyItem | AIDealItem;

interface TabDef {
  key: Variant;
  label: string;
  items: SectionItem[];
  max: number;
  empty: string;
}

export function TabbedSections({ sections }: { sections: DailyRadarSections }) {
  const tabs: TabDef[] = [
    { key: "tools", label: "AI 工具", items: sections.ai_tools, max: 6, empty: "今日暂无工具更新。" },
    { key: "research", label: "研究动态", items: sections.research_directions, max: 6, empty: "今日暂无新研究方向。" },
    { key: "business", label: "OPC 产品", items: sections.business_policy, max: 6, empty: "今日暂无新的 AI 创客产品。" },
    { key: "deals", label: "福利羊毛", items: sections.ai_deals, max: 6, empty: "今日暂无可靠福利信号。" },
  ];

  const [active, setActive] = useState<Variant>("tools");
  // 展开项 key 提升到此处：单开 + 切换 tab 时清空
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function selectTab(key: Variant) {
    setActive(key);
    setExpandedKey(null);
  }

  const activeIdx = tabs.findIndex((t) => t.key === active);
  const current = tabs[activeIdx] ?? tabs[0];
  const display = current.items.slice(0, current.max);

  function onKeyDown(e: React.KeyboardEvent, idx: number) {
    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    selectTab(tabs[next].key);
    tabRefs.current[next]?.focus();
  }

  return (
    <section className="daily-tabbed-panel mcm-panel p-4">
      {/* Tab bar */}
      <div className="daily-tabs" role="tablist" aria-label="板块切换">
        {tabs.map((tab, idx) => {
          const selected = tab.key === active;
          return (
            <button
              key={tab.key}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              type="button"
              role="tab"
              id={`daily-tab-${tab.key}`}
              aria-selected={selected}
              aria-controls={`daily-tabpanel-${tab.key}`}
              tabIndex={selected ? 0 : -1}
              className={`daily-tab${selected ? " is-active" : ""}`}
              onClick={() => selectTab(tab.key)}
              onKeyDown={(e) => onKeyDown(e, idx)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div
        id={`daily-tabpanel-${current.key}`}
        role="tabpanel"
        aria-labelledby={`daily-tab-${current.key}`}
        tabIndex={0}
        className="daily-tabpanel mt-4"
      >
        {display.length === 0 ? (
          <p className="text-[14px] text-[var(--walnut)]">{current.empty}</p>
        ) : (
          <div className="section-cards">
            {display.map((item, i) => {
              const key = item.url + i;
              const isExpanded = expandedKey === key;
              const panelId = `section-insight-${current.key}-${i}`;
              const hasInsight = Boolean(
                item.ai_insight?.summary || (item.summary ?? "").trim(),
              );
              return (
                <Fragment key={key}>
                  <SectionCard
                    item={item}
                    variant={current.key}
                    isExpanded={isExpanded}
                    hasInsight={hasInsight}
                    panelId={panelId}
                    onToggle={() => setExpandedKey(isExpanded ? null : key)}
                  />
                  {isExpanded && hasInsight && (
                    <div
                      id={panelId}
                      className="ai-insight section-insight"
                      role="region"
                      aria-label="AI 解读"
                    >
                      <InsightCard insight={item.ai_insight} fallback={item.summary} />
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Single card ──────────────────────────────────────
function SectionCard({
  item,
  variant,
  isExpanded,
  hasInsight,
  panelId,
  onToggle,
}: {
  item: SectionItem;
  variant: Variant;
  isExpanded: boolean;
  hasInsight: boolean;
  panelId: string;
  onToggle: () => void;
}) {
  const { iconName, subtitle } = cardFields(item, variant);
  const cover = (item as { image?: string }).image || faviconUrl(item.url, 128);
  const action = "action" in item ? (item.action as ActionType) : undefined;
  const showMeta = variant !== "tools";

  return (
    <article
      className={`section-card${isExpanded ? " is-active" : ""}`}
      role={hasInsight ? "button" : undefined}
      tabIndex={hasInsight ? 0 : undefined}
      aria-expanded={hasInsight ? isExpanded : undefined}
      aria-controls={hasInsight && isExpanded ? panelId : undefined}
      onClick={hasInsight ? onToggle : undefined}
      onKeyDown={
        hasInsight
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggle();
              }
            }
          : undefined
      }
    >
      <BrandIcon
        src={cover}
        name={iconName}
        size={40}
        className="section-card-icon"
      />
      <div className="section-card-body">
        {item.url ? (
          <Link
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="section-card-title"
            onClick={(e) => e.stopPropagation()}
          >
            {item.title}
          </Link>
        ) : (
          <span className="section-card-title">{item.title}</span>
        )}

        {subtitle && <span className="section-card-sub">{subtitle}</span>}

        {item.summary && <p className="section-card-summary">{item.summary}</p>}

        {showMeta && (item.tags?.length > 0 || action) && (
          <div className="section-card-meta">
            <TagList tags={item.tags} max={3} />
            {action && <ActionPill action={action} />}
          </div>
        )}
      </div>
    </article>
  );
}

// ── Per-variant field mapping (migrated from CompactSectionPanel) ──
function cardFields(
  item: SectionItem,
  variant: Variant,
): { iconName: string; subtitle: string } {
  switch (variant) {
    case "tools": {
      const t = item as AIToolItem;
      return {
        iconName: t.tool_name || t.title,
        subtitle: t.tool_name ? `${t.tool_name} · ${zhMeta(t.update_type)}` : zhMeta(t.update_type),
      };
    }
    case "research": {
      const r = item as ResearchItem;
      return { iconName: r.source || r.title, subtitle: r.source };
    }
    case "business": {
      const bp = item as BusinessPolicyItem;
      return { iconName: bp.title, subtitle: zhMeta(bp.market_area) };
    }
    case "deals": {
      const d = item as AIDealItem;
      const conf = d.confidence === "high" ? "高可信" : d.confidence === "medium" ? "中信" : "低信";
      const provider = d.provider ? `${d.provider} · ` : "";
      return { iconName: d.provider || d.title, subtitle: `${provider}${conf}${d.valid_until ? ` · 至${d.valid_until}` : ""}` };
    }
    default:
      return { iconName: item.title, subtitle: "" };
  }
}

function zhMeta(value: string | undefined): string {
  if (!value) return "";
  const normalized = value.trim().toLowerCase();
  const map: Record<string, string> = {
    general: "综合",
    update: "更新",
    launch: "发布",
    release: "发布",
    pricing: "定价",
    api: "API",
    model: "模型",
    safety: "安全",
    regulation: "监管",
    market: "市场",
  };
  return map[normalized] ?? value;
}
