// ─────────────────────────────────────────────────────
// DailyRadar DTO — "今日 AI Radar" public types
// ─────────────────────────────────────────────────────

// ── Shared AI Commentary ────────────────────────────

export interface AICommentary {
  summary: string;
  why_it_matters: string;
  who_should_care: string;
  action: string;
  risk_or_note: string;
}


export interface GithubInsight {
  core: string;
  capabilities: string[];
  parameters: string[];
  outputs: string[];
  runModes: string[];
  limitations?: string;
}

export interface GithubLLMInsight {
  what_it_is: string;
  why_trending: string;
  who_should_care: string;
  action: string;
  risk: string;
}

// ── Derived per-type AI insight (frontend-composed in normalize) ──
// 由 normalize 从 ai_commentary / llm_insight 派生，前端按 style 渲染
// 不同口吻的「编辑短评」卡，彻底替代旧的「做什么/为什么重要」机械模板。
export type InsightStyle =
  | "editorial" // Top Stories / AI Tools / Risks —— 编辑短评
  | "github"    // GitHub —— 开发者点评
  | "research"  // 学术 —— 研究价值判断
  | "market"    // 财金 / 政策 —— 市场影响判断
  | "deal"      // 羊毛 —— 「值不值得看」
  | "social";   // X 热点 —— 舆论温度计

export interface AIInsight {
  style: InsightStyle;
  summary: string;        // 主短评（自然语言，无标签）
  secondary?: string;     // 补充判断（可选）
  risk?: string;          // 风险 / 注意（红色行，可选）
  badges?: string[];      // 小 chip（action / 类目 / 严重度 / 可信度）
}

export type ActionType = "试用" | "收藏" | "跟进" | "略过" | "深入阅读";

// ── Section Item Types ──────────────────────────────

/** Top Stories — 8 items */
export interface TopStoryItem {
  rank: number;
  title: string;
  source: string;
  url: string;
  image?: string;
  category: string;
  importance: number;
  summary: string;
  why_it_matters: string;
  who_should_care: string;
  action: ActionType;
  risk_or_note: string;
  tags: string[];
  ai_commentary: AICommentary;
  ai_insight?: AIInsight;
}

/** GitHub / Open Source Radar — 10 items */
export interface GithubTrendingItem {
  rank: number;
  repo: string;
  owner: string;
  url: string;
  description: string;
  stars: number;
  today_stars: number;
  language: string;
  tags: string[];
  llm_insight?: GithubLLMInsight;
  githubInsight?: GithubInsight;
  ai_insight?: AIInsight;
}

/** X AI Hotspots — 8 items */
export interface XHotspotItem {
  topic: string;
  heat: number;
  summary: string;
  why_it_matters: string;
  representative_source_url: string;
  tags: string[];
  ai_commentary: AICommentary;
  ai_insight?: AIInsight;
}

/** AI Deals / 羊毛福利 — 5 items */
export interface AIDealItem {
  title: string;
  provider: string;
  url: string;
  summary: string;
  valid_until: string;
  confidence: "high" | "medium" | "low";
  tags: string[];
  ai_commentary: AICommentary;
  ai_insight?: AIInsight;
}

/** Agent Podcast / Newsletter — 6 items */
export interface AgentPodcastItem {
  name: string;
  updated: boolean;
  latest_title: string;
  url: string;
  summary: string;
  tags: string[];
  ai_commentary: AICommentary;
}

/** AI Tools Update — 8 items */
export interface AIToolItem {
  title: string;
  tool_name: string;
  update_type: string;
  url: string;
  image?: string;
  summary: string;
  why_it_matters: string;
  action: ActionType;
  tags: string[];
  ai_commentary: AICommentary;
  ai_insight?: AIInsight;
}

/** Research / New Directions — 6 items */
export interface ResearchItem {
  title: string;
  source: string;
  url: string;
  image?: string;
  summary: string;
  why_it_matters: string;
  practical_impact: string;
  tags: string[];
  ai_commentary: AICommentary;
  ai_insight?: AIInsight;
}

/** Business / Policy / Market Signal — 6 items */
export type MarketArea =
  | "股市" | "加密" | "芯片" | "云" | "监管"
  | "融资" | "能源" | "SaaS" | "搜索" | "广告" | "内容产业";

export interface BusinessPolicyItem {
  title: string;
  market_area: MarketArea;
  url: string;
  image?: string;
  summary: string;
  trend_interpretation: string;
  who_is_affected: string;
  tags: string[];
  ai_commentary: AICommentary;
  ai_insight?: AIInsight;
}

/** Risks / Controversies — 5 items */
export interface RiskItem {
  title: string;
  risk_type: string;
  severity: number;
  url: string;
  image?: string;
  summary: string;
  why_it_matters: string;
  mitigation: string;
  tags: string[];
  ai_commentary: AICommentary;
  ai_insight?: AIInsight;
}

/** Source stats */
export interface SourceItem {
  name: string;
  url: string;
  count: number;
}

// ── DTO Aggregates ──────────────────────────────────

export interface DailyRadarSummary {
  headline: string;
  bullets: string[];
}

export interface DailyRadarSections {
  top_stories: TopStoryItem[];
  github_trending: GithubTrendingItem[];
  x_ai_hotspots: XHotspotItem[];
  ai_deals: AIDealItem[];
  agent_podcasts: AgentPodcastItem[];
  ai_tools: AIToolItem[];
  research_directions: ResearchItem[];
  business_policy: BusinessPolicyItem[];
  risks: RiskItem[];
  sources: SourceItem[];
}

export interface DailyRadarDTO {
  date: string;
  generated_at: string;
  updated_at: string;
  sync_count: number;
  source_count: number;
  summary: DailyRadarSummary;
  sections: DailyRadarSections;
}

// ── Legacy types (Phase 1 mapping fallback) ─────────

export interface LegacyBriefItem {
  title: string;
  source?: string;
  url?: string;
  summary?: string;
  importance?: number;
  _cat?: string;
}

export interface LegacyDailyDTO {
  date?: string;
  updated_at?: string;
  hero_headline?: string;
  daily_overview?: string;
  tech_briefs?: LegacyBriefItem[];
  finance_briefs?: LegacyBriefItem[];
  politics_briefs?: LegacyBriefItem[];
  keywords?: string[];
}
