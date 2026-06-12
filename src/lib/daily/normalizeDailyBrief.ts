import { mockDailyRadar } from './mock';
/**
 * normalizeDailyBrief — Adapter layer between DailyBrief raw JSON
 * and the DailyRadarDTO consumed by the AI Radar daily page.
 *
 * Phase 1: map legacy fields → new radar DTO with ai_commentary.
 * Phase 2 (future): pass-through when DailyBrief outputs new schema.
 */
import type {
  DailyRadarDTO,
  DailyRadarSummary,
  DailyRadarSections,
  TopStoryItem,
  GithubTrendingItem,
  XHotspotItem,
  AIDealItem,
  AgentPodcastItem,
  AIToolItem,
  ResearchItem,
  BusinessPolicyItem,
  RiskItem,
  SourceItem,
  AICommentary,
  GithubLLMInsight,
  GithubInsight,
  AIInsight,
  InsightStyle,
  ActionType,
  MarketArea,
  LegacyBriefItem,
  LegacyDailyDTO,
} from "@/app/(main)/daily/types";

// ─────────────────────────────────────────────────────
// Whitelist — NEVER pass these through
// ─────────────────────────────────────────────────────
const FORBIDDEN_KEYS = new Set([
  "raw_articles", "articles_cache", "source_reading_notes",
  "search_queries", "prompt", "provider", "api_key",
  "debug", "_internal", "articles_json",
]);

// ─────────────────────────────────────────────────────
// Public helper
// ─────────────────────────────────────────────────────

export function normalizeDailyBrief(raw: unknown): DailyRadarDTO | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  // Phase 2: already in new schema
  if ("sections" in obj) {
    return sanitizeRadar(raw as DailyRadarDTO);
  }

  // Phase 1: map legacy
  return mapLegacyToRadar(raw as LegacyDailyDTO);
}

// ─────────────────────────────────────────────────────
// Phase 1: Legacy → DailyRadarDTO
// ─────────────────────────────────────────────────────

function mapLegacyToRadar(legacy: LegacyDailyDTO): DailyRadarDTO {
  const date = legacy.date ?? "unknown";
  const generatedAt = legacy.updated_at
    ? new Date(legacy.updated_at).toISOString()
    : new Date().toISOString();
  const updatedAt = generatedAt;

  const allBriefs: Array<LegacyBriefItem & { _cat: "ai" | "business" | "policy" }> = [
    ...(legacy.tech_briefs ?? []).map((b) => ({ ...b, _cat: "ai" as const })),
    ...(legacy.finance_briefs ?? []).map((b) => ({ ...b, _cat: "business" as const })),
    ...(legacy.politics_briefs ?? []).map((b) => ({ ...b, _cat: "policy" as const })),
  ];

  const topStories = buildTopStories(allBriefs);
  const githubTrending = buildGithubTrending(allBriefs);
  const xHotspots = buildXHotspots(allBriefs, legacy.keywords ?? []);
  const aiDeals = buildAiDeals(allBriefs);
  const agentPodcasts = buildPodcastStubs(allBriefs);
  const aiTools = buildAiTools(allBriefs);
  const research = buildResearch(allBriefs);
  const businessPolicy = buildBusinessPolicy(allBriefs);
  const risks = buildRisks(allBriefs);
  const sources = buildSources(allBriefs);

  const summary: DailyRadarSummary = {
    // Generate AI-focused headline instead of forwarding political hero_headline
    headline: buildAiHeadline(topStories, legacy),
    bullets: topStories.slice(0, 3).map((s) => s.title) ?? [],
  };

  const sections: DailyRadarSections = {
    top_stories: topStories,
    github_trending: githubTrending,
    x_ai_hotspots: xHotspots,
    ai_deals: aiDeals,
    agent_podcasts: agentPodcasts,
    ai_tools: aiTools,
    research_directions: research,
    business_policy: businessPolicy,
    risks,
    sources,
  };

  return sanitizeRadar({
    date,
    generated_at: generatedAt,
    updated_at: updatedAt,
    sync_count: 1,
    source_count: sources.length,
    summary,
    sections,
  });
}

// ─────────────────────────────────────────────────────
// Section builders
// ─────────────────────────────────────────────────────

// ── Top Stories (P0-P3 priority, AI only) ───────

const P0_KEYWORDS = [
  "openai", "anthropic", "deepmind", "meta ai", "xai", "grok",
  "claude code", "codex", "cursor", "gemini cli",
  "mcp", "agent workflow", "ai coding", "rag",
];
const P1_KEYWORDS = [
  "model", "embedding", "long context", "reasoning", "multimodal",
  "inference", "api price", "ai safe", "copyright",
];
const P2_KEYWORDS = [
  "funding", "chip", "cloud", "datacenter", "energy",
  "crypto", "blockchain", "stock", "market",
];
const P3_BLOCK = [
  "美伊", "俄乌", "乌克兰", "基辅", "加沙", "以色列", "热浪",
  "地震", "洪水", "选举", "国会", "白宫", "特朗普",
];

function topStoryPriority(b: LegacyBriefItem): number {
  if (b._cat !== "ai") return 999;
  const text = `${b.title} ${b.summary}`.toLowerCase();
  for (const kw of P3_BLOCK) if (text.includes(kw)) return 999;
  for (const kw of P0_KEYWORDS) if (text.includes(kw)) return 0;
  for (const kw of P1_KEYWORDS) if (text.includes(kw)) return 1;
  for (const kw of P2_KEYWORDS) if (text.includes(kw)) return 2;
  if (text.includes("ai")) return 3;
  return 999;
}

function buildTopStories(
  briefs: Array<LegacyBriefItem & { _cat: string }>,
): TopStoryItem[] {
  const aiBriefs = briefs
    .filter((b) => b._cat === "ai")
    .filter((b) => {
      const t = `${b.title} ${b.summary}`.toLowerCase();
      return !P3_BLOCK.some((kw) => t.includes(kw));
    });

  const sorted = [...aiBriefs].sort((a, b) => {
    const pa = topStoryPriority(a), pb = topStoryPriority(b);
    if (pa !== pb) return pa - pb;
    return (b.importance ?? 0) - (a.importance ?? 0);
  });

  return sorted.slice(0, 8).map((b, i) => mapToTopStory(b, i + 1));
}

function mapToTopStory(
  b: LegacyBriefItem & { _cat: string }, rank: number,
): TopStoryItem {
  const importance = clampImportance(b.importance);
  const summary = truncate(b.summary ?? "", 40);
  const why = inferWhy(b.importance);
  const action = inferAction(b);
  return {
    rank,
    title: b.title,
    source: b.source ?? "",
    url: b.url ?? "",
    category: mapCategory(b._cat),
    importance,
    summary,
    why_it_matters: why,
    who_should_care: "适合关注 AI 工具和开发者生态的人。",
    action,
    risk_or_note: "",
    tags: extractTags(b.title, b.source).slice(0, 4),
    ai_commentary: makeAICommentary(b, summary, why, action),
  };
}

// ── GitHub / Open Source Radar ──────────────────

function buildGithubTrending(
  briefs: Array<LegacyBriefItem & { _cat: string }>,
): GithubTrendingItem[] {
  const gh = briefs.filter(
    (b) =>
      b.source?.toLowerCase().includes("github") ||
      b.url?.includes("github.com") ||
      b.title?.toLowerCase().includes("github"),
  );

  return gh.slice(0, 10).map((b, i) => {
    const [owner, repo] = extractRepoOwner(b.url ?? "");
    const description = truncate(b.summary ?? "", 50);
    const why = inferTrendingWhy(b.importance);
    const action = inferAction(b);
    const githubInsight: GithubInsight = {
      core: b.summary ?? description,
      capabilities: [],
      parameters: [],
      outputs: [],
      runModes: [],
    };
    const llmInsight: GithubLLMInsight = {
      what_it_is: b.summary ?? description,
      why_trending: why,
      who_should_care: "适合对 AI 工具和开发者生态感兴趣的人关注。",
      action,
      risk: "注意项目的维护状态和许可证风险。",
    };
    return {
      rank: i + 1,
      repo: repo || guessRepoName(b.title),
      owner: owner || "unknown",
      url: b.url ?? "",
      description,
      stars: 0,
      today_stars: 0,
      language: guessLanguage(b.title, b.summary),
      tags: extractTags(b.title, b.source).slice(0, 3),
      llm_insight: llmInsight,
    };
  });
}

// ── X AI Hotspots ───────────────────────────────

function buildXHotspots(
  briefs: Array<LegacyBriefItem & { _cat: string }>,
  keywords: string[],
): XHotspotItem[] {
  const aiBriefs = briefs.filter((b) => b._cat === "ai" && b.url);
  const fromBriefs = aiBriefs.slice(0, 8).map((b, i) => {
    const summary = truncate(b.summary ?? "", 40);
    return {
      topic: b.title.length > 30 ? b.title.slice(0, 28) + "…" : b.title,
      heat: clampImportance(b.importance),
      summary,
      why_it_matters: inferWhy(b.importance),
      representative_source_url: b.url ?? "",
      tags: extractTags(b.title, b.source).slice(0, 3),
      ai_commentary: makeAICommentary(b, summary, inferWhy(b.importance), "跟进"),
    };
  });
  if (fromBriefs.length >= 3) return fromBriefs.slice(0, 8);

  // Fallback: use keywords
  const fromKeywords = keywords
    .filter((kw) => !fromBriefs.some((f) => f.topic.includes(kw)))
    .slice(0, 8 - fromBriefs.length)
    .map((kw) => ({
      topic: kw,
      heat: 2,
      summary: `社区讨论方向：${kw}`,
      why_it_matters: "值得关注的社区讨论方向。",
      representative_source_url: "",
      tags: [kw],
      ai_commentary: {
        summary: `社区讨论方向：${kw}`,
        why_it_matters: "值得关注的社区讨论方向。",
        who_should_care: "关注 AI 社区的开发者。",
        action: "跟进",
        risk_or_note: "",
      },
    }));

  return [...fromBriefs, ...fromKeywords].slice(0, 8);
}

// ── AI Deals ────────────────────────────────────

function buildAiDeals(
  _briefs: Array<LegacyBriefItem & { _cat: string }>,
): AIDealItem[] {
  // No legacy data source for deals — return empty
  return [];
}

// ── Agent Podcast / Newsletter ──────────────────

const TRACKED_SOURCES = [
  "Latent Space", "The Cognitive Revolution", "No Priors",
  "AI Engineer", "Ben's Bites", "TLDR AI",
  "The Batch", "Import AI",
];

function buildPodcastStubs(
  briefs: Array<LegacyBriefItem & { _cat: string }>,
): AgentPodcastItem[] {
  return TRACKED_SOURCES.map((name) => {
    const matched = briefs.find(
      (b) =>
        b.title?.toLowerCase().includes(name.toLowerCase()) ||
        b.summary?.toLowerCase().includes(name.toLowerCase()),
    );
    const latestTitle = matched?.title ?? "";
    const summary = matched ? truncate(matched.summary ?? "", 30) : "";
    return {
      name,
      updated: !!matched,
      latest_title: latestTitle,
      url: matched?.url ?? "",
      summary,
      tags: ["Podcast"],
      ai_commentary: matched
        ? makeAICommentary(matched, summary, "值得关注的 AI 播客更新。", "跟进")
        : {
            summary: "本期暂无更新。",
            why_it_matters: "持续关注 AI 行业动态。",
            who_should_care: "AI 从业者和爱好者。",
            action: "略过",
            risk_or_note: "",
          },
    };
  }).slice(0, 6);
}

// ── AI Tools Update ─────────────────────────────

function buildAiTools(
  briefs: Array<LegacyBriefItem & { _cat: string }>,
): AIToolItem[] {
  return briefs
    .filter((b) => b._cat === "ai")
    .slice(0, 8)
    .map((b) => {
      const summary = truncate(b.summary ?? "", 40);
      const why = inferWhy(b.importance);
      return {
        title: b.title,
        tool_name: b.source ?? "",
        update_type: guessUpdateType(b),
        url: b.url ?? "",
        summary,
        why_it_matters: why,
        action: "试用" as ActionType,
        tags: extractTags(b.title, b.source).slice(0, 4),
        ai_commentary: makeAICommentary(b, summary, why, "试用"),
      };
    });
}

function guessUpdateType(b: LegacyBriefItem): string {
  const t = `${b.title} ${b.summary}`.toLowerCase();
  if (t.includes("mcp")) return "MCP";
  if (t.includes("agent") || t.includes("workflow")) return "Agent";
  if (t.includes("api") || t.includes("sdk")) return "API/SDK";
  if (t.includes("update") || t.includes("feature")) return "功能更新";
  if (t.includes("price") || t.includes("free")) return "价格变动";
  return "产品更新";
}

// ── Research / New Directions ───────────────────

function buildResearch(
  briefs: Array<LegacyBriefItem & { _cat: string }>,
): ResearchItem[] {
  return briefs
    .filter(
      (b) =>
        b._cat === "ai" &&
        (b.title?.includes("研究") || b.title?.includes("模型") ||
         b.title?.includes("论文") || b.summary?.includes("研究") ||
         b.title?.toLowerCase().includes("research")),
    )
    .slice(0, 6)
    .map((b) => {
      const summary = truncate(b.summary ?? "", 40);
      const why = inferWhy(b.importance);
      return {
        title: b.title,
        source: b.source ?? "",
        url: b.url ?? "",
        summary,
        why_it_matters: why,
        practical_impact: "可能影响 AI 模型能力和开发者工具链。",
        tags: extractTags(b.title, b.source).slice(0, 4),
        ai_commentary: makeAICommentary(b, summary, why, "深入阅读"),
      };
    });
}

// ── Business / Policy / Market Signal ───────────

function buildBusinessPolicy(
  briefs: Array<LegacyBriefItem & { _cat: string }>,
): BusinessPolicyItem[] {
  return briefs
    .filter((b) => b._cat === "business" || b._cat === "policy")
    .slice(0, 6)
    .map((b) => {
      const summary = truncate(b.summary ?? "", 40);
      const why = inferWhy(b.importance);
      const market = guessMarketArea(b);
      return {
        title: b.title,
        market_area: market,
        url: b.url ?? "",
        summary,
        trend_interpretation: why,
        who_is_affected: "AI 从业者、投资者和行业观察者。",
        tags: extractTags(b.title, b.source).slice(0, 4),
        ai_commentary: makeAICommentary(b, summary, why, "跟进"),
      };
    });
}

function guessMarketArea(b: LegacyBriefItem): MarketArea {
  const t = `${b.title} ${b.summary}`.toLowerCase();
  if (t.includes("chip") || t.includes("芯片")) return "芯片";
  if (t.includes("cloud") || t.includes("云")) return "云";
  if (t.includes("funding") || t.includes("融资") || t.includes("invest")) return "融资";
  if (t.includes("stock") || t.includes("股市") || t.includes("ipo")) return "股市";
  if (t.includes("crypto") || t.includes("加密") || t.includes("blockchain")) return "加密";
  if (t.includes("regulat") || t.includes("监管") || t.includes("ban")) return "监管";
  if (t.includes("energy") || t.includes("能源") || t.includes("datacenter")) return "能源";
  if (t.includes("saas")) return "SaaS";
  if (t.includes("search") || t.includes("搜索")) return "搜索";
  if (t.includes("ad") || t.includes("广告")) return "广告";
  return "融资";
}

// ── Risks / Controversies ───────────────────────

const RISK_KEYWORDS = ["风险", "争议", "崩溃", "危机", "制裁", "禁止", "泄露", "滥用", "封号"];

function buildRisks(
  briefs: Array<LegacyBriefItem & { _cat: string }>,
): RiskItem[] {
  return briefs
    .filter((b) =>
      RISK_KEYWORDS.some((kw) => b.title?.includes(kw) || b.summary?.includes(kw)),
    )
    .slice(0, 5)
    .map((b) => {
      const summary = truncate(b.summary ?? "", 40);
      const why = inferWhy(b.importance);
      const severity = Math.min(5, clampImportance(b.importance));
      return {
        title: b.title,
        risk_type: guessRiskType(b),
        severity,
        url: b.url ?? "",
        summary,
        why_it_matters: why,
        mitigation: "建议关注官方动态和社区反馈，及时调整使用策略。",
        tags: extractTags(b.title, b.source).slice(0, 4),
        ai_commentary: makeAICommentary(b, summary, why, "跟进"),
      };
    });
}

function guessRiskType(b: LegacyBriefItem): string {
  const t = `${b.title} ${b.summary}`.toLowerCase();
  if (t.includes("安全") || t.includes("leak") || t.includes("漏洞")) return "安全漏洞";
  if (t.includes("版权") || t.includes("copyright")) return "版权风险";
  if (t.includes("封号") || t.includes("ban") || t.includes("tos")) return "平台风险";
  if (t.includes("监管") || t.includes("制裁") || t.includes("regulat")) return "监管风险";
  if (t.includes("价格") || t.includes("price") || t.includes("api cost")) return "成本风险";
  return "行业风险";
}

// ── Sources ─────────────────────────────────────

function buildSources(
  briefs: Array<LegacyBriefItem & { _cat: string }>,
): SourceItem[] {
  const map = new Map<string, number>();
  for (const b of briefs) {
    const name = b.source ?? "unknown";
    map.set(name, (map.get(name) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name, count]) => ({ name, url: "", count }));
}

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────

function mapCategory(cat: string): string {
  switch (cat) {
    case "ai": return "ai_coding";
    case "business": return "ai_business";
    case "policy": return "ai_policy";
    default: return "general";
  }
}

function clampImportance(raw: number | undefined): number {
  if (!raw) return 3;
  const scaled = Math.round(raw / 2);
  return Math.max(1, Math.min(5, scaled));
}

function truncate(text: string, maxChars: number): string {
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "…";
}

function extractTags(title: string, source?: string): string[] {
  const tags: string[] = [];
  const keywords = [
    "AI", "Agent", "Codex", "Claude", "Gemini", "MCP", "RAG",
    "GitHub", "OpenAI", "Anthropic", "Meta", "DeepSeek", "Cursor",
    "LLM", "Embedding", "Multimodal",
  ];
  for (const kw of keywords) {
    if (title?.toLowerCase().includes(kw.toLowerCase())) tags.push(kw);
  }
  if (source) tags.push(source);
  return [...new Set(tags)];
}

function extractRepoOwner(url: string): [string, string] {
  const match = url?.match(/github\.com\/([^/]+)\/([^/?#]+)/);
  return match ? [match[1], match[2]] : ["", ""];
}

function guessRepoName(title: string): string {
  const words = title.split(/[\s\-:：]+/);
  return words[0] || "unknown";
}

function guessLanguage(title: string, summary?: string): string {
  const combined = (title + " " + (summary ?? "")).toLowerCase();
  if (combined.includes("python")) return "Python";
  if (combined.includes("typescript") || combined.includes("ts ")) return "TypeScript";
  if (combined.includes("rust")) return "Rust";
  if (combined.includes("go ")) return "Go";
  if (combined.includes("javascript") || combined.includes("js ")) return "JavaScript";
  return "Unknown";
}

function inferWhy(importance?: number): string {
  if (!importance) return "可作为信息参考。";
  if (importance >= 9) return "重大事件，可能影响行业走向。";
  if (importance >= 7) return "值得关注的趋势信号。";
  return "可作为信息参考。";
}

function inferTrendingWhy(importance?: number): string {
  if (!importance) return "社区关注度上升，值得跟进。";
  if (importance >= 9) return "突然爆火，可能代表新的技术方向。";
  if (importance >= 7) return "社区关注度上升，值得跟进。";
  return "有一定关注度。";
}

function inferAction(b: LegacyBriefItem): ActionType {
  if (b.url?.includes("github.com")) return "收藏";
  if (b.importance && b.importance >= 8) return "跟进";
  if (b.title?.includes("研究") || b.title?.includes("论文")) return "深入阅读";
  return "略过";
}

function makeAICommentary(
  b: LegacyBriefItem, summary: string, why: string, action: string,
): AICommentary {
  return {
    summary,
    why_it_matters: why,
    who_should_care: "适合关注 AI 工具和开发者生态的人。",
    action,
    risk_or_note: "",
  };
}

function aiOnlyHeadline(headline?: string): string {
  if (!headline) return "";
  const blocked = ["美伊", "俄乌", "乌克兰", "加沙", "以色列", "伊朗", "热浪", "选举", "国会", "白宫", "袭击", "军事打击", "孟加拉", "麻疹"];
  if (blocked.some((kw) => headline.includes(kw))) {
    return "今日 AI 领域动态丰富，涵盖工具更新、模型进展与开发者生态。";
  }
  return headline;
}

function buildAiHeadline(stories: TopStoryItem[], legacy: LegacyDailyDTO): string {
  // Use legacy hero_headline if it's AI-clean
  const clean = aiOnlyHeadline(legacy.hero_headline);
  if (clean && clean !== "今日 AI 领域动态丰富，涵盖工具更新、模型进展与开发者生态。") {
    return clean;
  }
  // Build from top 3 stories
  if (stories.length >= 3) {
    return `${stories[0].title.split("：")[0].slice(0, 20)}、${stories[1].title.split("：")[0].slice(0, 15)}、${stories[2].title.split("：")[0].slice(0, 15)} — 今日 AI 圈重点速览。`;
  }
  if (stories.length > 0) {
    return `${stories[0].title} — 今日 AI 圈重点速览。`;
  }
  return "今日 AI 领域动态丰富，涵盖工具更新、模型进展与开发者生态。";
}

// ─────────────────────────────────────────────────────
// 后端字段 → 前端字段 重映射辅助函数
// 后端 API 返回的字段名与前端类型不完全一致，需要在此处进行字段名转换
// ─────────────────────────────────────────────────────

type BackendItem = Record<string, unknown>;

/** 辅助：安全读取 ai_commentary 嵌套对象 */
function getAI(item: BackendItem): Record<string, unknown> {
  return (item.ai_commentary ?? {}) as Record<string, unknown>;
}

/** 取首个非空字符串（已 trim） */
function firstNonEmpty(...vals: (string | undefined)[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/**
 * 从现有评论槽位（ai_commentary / llm_insight）派生统一的 AIInsight。
 * 自然语言短评，无「做什么/为什么重要」机械标签；按 style 在前端差异化渲染。
 * summary 为空则返回 undefined → 前端回退纯摘要（不渲染空卡）。
 */
function buildInsight(opts: {
  style: InsightStyle;
  summary?: string;
  secondary?: string;
  risk?: string;
  badges?: (string | undefined)[];
  caps: { s: number; sec: number; risk?: number };
}): AIInsight | undefined {
  const summary = truncate(firstNonEmpty(opts.summary), opts.caps.s);
  if (!summary) return undefined;
  const secondary =
    truncate(firstNonEmpty(opts.secondary), opts.caps.sec) || undefined;
  const risk = truncate(firstNonEmpty(opts.risk), opts.caps.risk ?? 60) || undefined;
  const badges = (opts.badges ?? []).filter(
    (b): b is string => typeof b === "string" && b.trim().length > 0,
  );
  return {
    style: opts.style,
    summary,
    secondary,
    risk,
    badges: badges.length ? badges : undefined,
  };
}

/** 严重程度映射：high=5, medium=3, low=1 */
function toSeverity(s: unknown): number {
  if (s === "high") return 5;
  if (s === "medium") return 3;
  if (s === "low") return 1;
  return 3; // 默认中等
}

/** 从 "owner/name" 格式的 repo 字段中提取 owner */
function extractOwner(repo: string): string {
  const parts = repo.split("/");
  return parts.length >= 2 ? parts[0] : "";
}

/** 默认的 AICommentary 兜底值 */
function defaultAI(action: string = "略过"): AICommentary {
  return { summary: "", why_it_matters: "", who_should_care: "", action, risk_or_note: "" };
}

// ── 各 section 的单项重映射函数 ────────────────────

/** TopStoryItem：后端有 rank, source, title, url, summary, importance, tags, ai_commentary
 *  前端额外需要 category (=source)，以及从 ai_commentary 扁平化提取的
 *  why_it_matters / who_should_care / action / risk_or_note */
function remapTopStory(item: BackendItem): TopStoryItem {
  const ai = getAI(item);
  return {
    rank: (item.rank as number) ?? 0,
    title: (item.title as string) ?? "",
    source: (item.source as string) ?? "",
    url: (item.url as string) ?? "",
    category: (item.source as string) ?? "",
    importance: (item.importance as number) ?? 3,
    summary: ((ai.summary as string) || (item.summary as string)) ?? "",    // 优先用中文 ai.summary
    why_it_matters: (ai.why_it_matters as string) ?? "",
    who_should_care: (ai.who_should_care as string) ?? "",
    action: (ai.action as ActionType) ?? "略过",
    risk_or_note: (ai.risk_or_note as string) ?? "",
    image: (item.image as string) ?? undefined,
    tags: Array.isArray(item.tags) ? (item.tags as string[]) : [],
    ai_commentary: (item.ai_commentary as AICommentary) ?? defaultAI(),
    ai_insight: buildInsight({
      style: "editorial",
      summary: (ai.summary as string) || (item.summary as string),
      secondary: ai.why_it_matters as string,
      risk: ai.risk_or_note as string,
      caps: { s: 70, sec: 70 },
    }),
  };
}

/** GithubTrendingItem：后端有 rank, repo, url, description, language, stars, stars_today, forks, tags, llm_insight
 *  前端需要 owner（从 repo "owner/name" 提取）, today_stars（即 stars_today） */
function remapGithubTrending(item: BackendItem): GithubTrendingItem {
  const repo = (item.repo as string) ?? "";
  const ai = getAI(item);
  const li = (item.llm_insight ?? {}) as Record<string, unknown>;
  return {
    rank: (item.rank as number) ?? 0,
    repo,
    owner: extractOwner(repo),
    url: (item.url as string) ?? "",
    description: ((ai.summary as string) || (item.description as string)) ?? "",  // 优先用中文 ai.summary
    stars: (item.stars as number) ?? 0,
    today_stars: (item.stars_today as number) ?? 0,
    language: (item.language as string) ?? "Unknown",
    tags: Array.isArray(item.tags) ? (item.tags as string[]) : [],
    githubInsight: (item.githubInsight as GithubInsight) || ({ core: (li.what_it_is || item.description) + '', capabilities: [], parameters: [], outputs: [], runModes: [] } as GithubInsight),
    llm_insight: (item.llm_insight as GithubLLMInsight) ?? {
      what_it_is: "", why_trending: "", who_should_care: "", action: "", risk: "",
    },
    ai_insight: buildInsight({
      style: "github",
      summary: (li.what_it_is as string) || (item.description as string),
      secondary: li.why_trending as string,
      risk: li.risk as string,
      caps: { s: 60, sec: 60 },
    }),
  };
}

/** XHotspotItem：后端有 rank, title, url, author, engagement, heat, representative_source_url
 *  前端需要 topic (=title)，tags 数组（缺失则补空数组） */
function remapXHotspot(item: BackendItem): XHotspotItem {
  const ai = getAI(item);
  return {
    topic: (item.title as string) ?? (item.topic as string) ?? "",
    heat: (item.heat as number) ?? 0,
    summary: ((ai.summary as string) || (item.summary as string)) ?? "",   // 优先用中文 ai.summary
    why_it_matters: (ai.why_it_matters as string) ?? "",
    representative_source_url: (item.representative_source_url as string) ?? "",
    tags: Array.isArray(item.tags) ? (item.tags as string[]) : [],
    ai_commentary: (item.ai_commentary as AICommentary) ?? defaultAI(),
    ai_insight: buildInsight({
      style: "social",
      summary: (ai.summary as string) || (item.summary as string),
      secondary: ai.why_it_matters as string,
      risk: ai.risk_or_note as string,
      caps: { s: 50, sec: 40 },
    }),
  };
}

/** AIDealItem：后端有 rank, title, url, description, category, confidence
 *  前端需要 summary (=description), provider (=category)，tags 空数组 */
function remapAIDeal(item: BackendItem): AIDealItem {
  const ai = getAI(item);
  return {
    title: (item.title as string) ?? "",
    provider: (item.category as string) ?? "",
    url: (item.url as string) ?? "",
    summary: ((ai.summary as string) || (item.description as string)) ?? "",   // 优先用中文 ai.summary
    valid_until: (item.valid_until as string) ?? "",
    confidence: (item.confidence as "high" | "medium" | "low") ?? "medium",
    tags: Array.isArray(item.tags) ? (item.tags as string[]) : [],
    ai_commentary: (item.ai_commentary as AICommentary) ?? defaultAI(),
    ai_insight: buildInsight({
      style: "deal",
      summary: (ai.summary as string) || (item.description as string),
      secondary: ai.why_it_matters as string,
      risk: ai.risk_or_note as string,
      caps: { s: 50, sec: 40 },
    }),
  };
}

/** AgentPodcastItem：后端有 rank, source, title, url, description, updated
 *  前端需要 name (=source), latest_title (=title), summary (=description)，tags 空数组 */
function remapAgentPodcast(item: BackendItem): AgentPodcastItem {
  const ai = getAI(item);
  return {
    name: (item.source as string) ?? (item.name as string) ?? "",
    updated: Boolean(item.updated) || false,
    latest_title: (item.title as string) ?? "",
    url: (item.url as string) ?? "",
    summary: ((ai.summary as string) || (item.description as string)) ?? (item.summary as string) ?? "",
    tags: Array.isArray(item.tags) ? (item.tags as string[]) : [],
    ai_commentary: (item.ai_commentary as AICommentary) ?? defaultAI(),
  };
}

/** AIToolItem：后端有 rank, tool_name, url, description, category
 *  前端需要 title (=tool_name), update_type (=category), summary (=description)，tags 空数组 */
function remapAITool(item: BackendItem): AIToolItem {
  const ai = getAI(item);
  return {
    title: (item.title as string) ?? (item.tool_name as string) ?? "",
    tool_name: (item.title as string) ?? (item.tool_name as string) ?? "",
    update_type: (item.category as string) ?? "产品更新",
    url: (item.url as string) ?? "",
    summary: ((ai.summary as string) || (item.description as string)) ?? (item.summary as string) ?? "",
    why_it_matters: (ai.why_it_matters as string) ?? "",
    action: (ai.action as ActionType) ?? "试用",
    tags: Array.isArray(item.tags) ? (item.tags as string[]) : [],
    ai_commentary: (item.ai_commentary as AICommentary) ?? defaultAI("试用"),
    ai_insight: buildInsight({
      style: "editorial",
      summary:
        (ai.summary as string) ||
        (item.description as string) ||
        (item.summary as string),
      secondary: ai.why_it_matters as string,
      risk: ai.risk_or_note as string,
      caps: { s: 70, sec: 70 },
    }),
  };
}

/** ResearchItem：后端有 rank, title, url, source, summary, tags
 *  前端额外需要 why_it_matters, practical_impact（从 ai_commentary 获取，不存在则为空字符串）*/
function remapResearch(item: BackendItem): ResearchItem {
  const ai = getAI(item);
  return {
    title: (item.title as string) ?? "",
    source: (item.source as string) ?? "",
    url: (item.url as string) ?? "",
    summary: ((ai.summary as string) || (item.summary as string)) ?? "",
    why_it_matters: (ai.why_it_matters as string) ?? "",
    practical_impact: (ai.practical_impact as string) ?? "",
    tags: Array.isArray(item.tags) ? (item.tags as string[]) : [],
    ai_commentary: (item.ai_commentary as AICommentary) ?? defaultAI("深入阅读"),
    ai_insight: buildInsight({
      style: "research",
      summary: (ai.summary as string) || (item.summary as string),
      secondary: ai.why_it_matters as string,
      risk: ai.risk_or_note as string,
      caps: { s: 70, sec: 70 },
    }),
  };
}

/** BusinessPolicyItem：后端有 rank, title, url, source, summary, category
 *  前端需要 market_area (=category), trend_interpretation 和 who_is_affected（从 ai_commentary 获取）*/
function remapBusinessPolicy(item: BackendItem): BusinessPolicyItem {
  const ai = getAI(item);
  return {
    title: (item.title as string) ?? "",
    market_area: (item.category as MarketArea) ?? (item.market_area as MarketArea) ?? "融资",
    url: (item.url as string) ?? "",
    summary: ((ai.summary as string) || (item.summary as string)) ?? "",
    trend_interpretation: (ai.trend_interpretation as string) ?? (ai.why_it_matters as string) ?? "",
    who_is_affected: (ai.who_is_affected as string) ?? (ai.who_should_care as string) ?? "",
    tags: Array.isArray(item.tags) ? (item.tags as string[]) : [],
    ai_commentary: (item.ai_commentary as AICommentary) ?? defaultAI("跟进"),
    ai_insight: buildInsight({
      style: "market",
      summary: (ai.summary as string) || (item.summary as string),
      secondary:
        (ai.why_it_matters as string) || (ai.trend_interpretation as string),
      risk: ai.risk_or_note as string,
      caps: { s: 60, sec: 60 },
    }),
  };
}

/** RiskItem：后端有 rank, title, url, source, summary, risk_category, severity（字符串 "high"/"medium"/"low"）
 *  前端需要 risk_type (=risk_category), severity（数字: high=5, medium=3, low=1）
 *  why_it_matters 和 mitigation 从 ai_commentary 获取 */
function remapRisk(item: BackendItem): RiskItem {
  const ai = getAI(item);
  return {
    title: (item.title as string) ?? "",
    risk_type: (item.risk_category as string) ?? (item.risk_type as string) ?? "行业风险",
    severity: toSeverity(item.severity),
    url: (item.url as string) ?? "",
    summary: ((ai.summary as string) || (item.summary as string)) ?? "",
    why_it_matters: (ai.why_it_matters as string) ?? "",
    mitigation: (ai.mitigation as string) ?? "",
    tags: Array.isArray(item.tags) ? (item.tags as string[]) : [],
    ai_commentary: (item.ai_commentary as AICommentary) ?? defaultAI("跟进"),
    ai_insight: buildInsight({
      style: "editorial",
      summary: (ai.summary as string) || (item.summary as string),
      secondary: ai.why_it_matters as string,
      risk: (ai.risk_or_note as string) || (ai.mitigation as string),
      badges: [`严重度 ${toSeverity(item.severity)}/5`],
      caps: { s: 70, sec: 70 },
    }),
  };
}

/** SourceItem：后端有 name, count；前端额外需要 url（空字符串即可） */
function remapSource(item: BackendItem): SourceItem {
  return {
    name: (item.name as string) ?? "unknown",
    url: (item.url as string) ?? "",                                // 后端无 url，补空字符串
    count: (item.count as number) ?? 0,
  };
}

// ─────────────────────────────────────────────────────
// Sanitizer — 最终白名单 + 字段重映射
// ─────────────────────────────────────────────────────

function sanitizeRadar(radar: DailyRadarDTO): DailyRadarDTO {
  const safe: DailyRadarDTO = {
    date: radar.date ?? "",
    generated_at: radar.generated_at ?? "",
    updated_at: radar.updated_at ?? radar.generated_at ?? "",
    sync_count: radar.sync_count ?? 1,
    source_count: radar.source_count ?? 0,
    summary: {
      headline: aiOnlyHeadline(radar.summary?.headline),
      bullets: (radar.summary?.bullets ?? []).slice(0, 3),
    },
    sections: {
      top_stories: (radar.sections?.top_stories ?? []).slice(0, 8).map(item => remapTopStory(item as unknown as BackendItem)),
      github_trending: (radar.sections?.github_trending ?? []).slice(0, 10).map(item => remapGithubTrending(item as unknown as BackendItem)),
      x_ai_hotspots: (radar.sections?.x_ai_hotspots ?? []).slice(0, 12).map(item => remapXHotspot(item as unknown as BackendItem)),
      ai_deals: (radar.sections?.ai_deals ?? []).slice(0, 6).map(item => remapAIDeal(item as unknown as BackendItem)),
      agent_podcasts: (radar.sections?.agent_podcasts ?? []).slice(0, 6).map(item => remapAgentPodcast(item as unknown as BackendItem)),
      ai_tools: (radar.sections?.ai_tools ?? []).slice(0, 8).map(item => remapAITool(item as unknown as BackendItem)),
      research_directions: (radar.sections?.research_directions ?? []).slice(0, 8).map(item => remapResearch(item as unknown as BackendItem)),
      business_policy: (radar.sections?.business_policy ?? []).slice(0, 8).map(item => remapBusinessPolicy(item as unknown as BackendItem)),
      risks: (radar.sections?.risks ?? []).slice(0, 8).map(item => remapRisk(item as unknown as BackendItem)),
      sources: (radar.sections?.sources ?? []).slice(0, 20).map(item => remapSource(item as unknown as BackendItem)),
    },
  };

  

  stripForbidden(safe);
  return safe;
}

function stripForbidden(obj: unknown): void {
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key)) {
      delete (obj as Record<string, unknown>)[key];
    } else if (
      typeof (obj as Record<string, unknown>)[key] === "object" &&
      (obj as Record<string, unknown>)[key] !== null
    ) {
      stripForbidden((obj as Record<string, unknown>)[key]);
    }
  }
}
