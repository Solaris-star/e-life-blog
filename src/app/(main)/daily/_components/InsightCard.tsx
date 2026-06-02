// ─────────────────────────────────────────────────────
// InsightCard — 纯展示组件，按 AIInsight 渲染「无标签」自然语言短评。
// 不含 "use client"：可服务端渲染，也可被客户端容器（抽屉 / 浮层）包裹复用。
// 视觉外壳（复古纸条 / GitHub 左侧浮层）由各容器决定，这里只负责内容排版。
//
// 关键设计：
//  - 顶部 kicker 是「栏目级口吻标签」（编辑短评 / 开发者点评 / 舆论温度计…），
//    按 style 区分，正面满足「不同模块不同口吻」；它不是「做什么：」式字段标签。
//  - 正文无任何字段标签；风险行用「⚠ 」而非「注意：」。
//  - data-style 透传给 CSS，便于按类型做细微强调（不改变整体纸条风格）。
// ─────────────────────────────────────────────────────
import type { AIInsight, InsightStyle } from "../types";

/** 每种 style 对应的栏目口吻标签 */
const VOICE_LABEL: Record<InsightStyle, string> = {
  editorial: "编辑短评",
  github: "开发者点评",
  research: "研究价值",
  market: "市场信号",
  deal: "值不值得看",
  social: "舆论温度计",
};

export function InsightCard({
  insight,
  fallback,
  compact = false,
}: {
  insight?: AIInsight;
  fallback?: string;
  compact?: boolean;
}) {
  const cls = `ai-note${compact ? " ai-note--compact" : ""}`;

  // 有派生短评 → kicker + 分层渲染（主短评 + 可选补充 + 可选风险 + 可选 chip）
  if (insight?.summary) {
    return (
      <div className={cls} data-style={insight.style}>
        <p className="ai-note-kicker">{VOICE_LABEL[insight.style]}</p>
        <p className="ai-note-lead">{insight.summary}</p>
        {insight.secondary && <p className="ai-note-sub">{insight.secondary}</p>}
        {insight.risk && <p className="ai-note-risk">⚠ {insight.risk}</p>}
        {insight.badges?.length ? (
          <div className="ai-note-badges">
            {insight.badges.map((b) => (
              <span key={b} className="ai-note-chip">
                {b}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  // 无派生短评但有原始摘要 → 单行降级（无 kicker / 无风险行 / 不留空卡）
  const fb = (fallback ?? "").trim();
  if (fb) {
    return (
      <div className={cls}>
        <p className="ai-note-lead">{fb}</p>
      </div>
    );
  }

  // 都为空 → 不渲染
  return null;
}
