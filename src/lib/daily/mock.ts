/**
 * dailyRadar.mock.ts — Dev-only mock data for testing AI Radar UI
 * NEVER used in production — not imported by normalizeDailyBrief.
 */
import type { DailyRadarDTO } from "@/app/(main)/daily/types";

export const mockDailyRadar: DailyRadarDTO = {
  date: "2026-05-27",
  generated_at: "2026-05-27T07:30:00+08:00",
  updated_at: "2026-05-27T07:30:00+08:00",
  sync_count: 1,
  source_count: 28,
  summary: {
    headline: "Codex 引爆 AI Coding 讨论，GitHub 上多个 AI 工具走热，Gemini 模型能力持续升级。",
    bullets: [
      "OpenAI Codex 与 AI 开发工具生态持续升温",
      "MoneyPrinterTurbo 等自动化内容工具在 GitHub 走热",
      "Gemini Embedding / Agent workflow 相关讨论增加",
    ],
  },
  sections: {
    top_stories: [
      {
        rank: 1, title: "OpenAI Codex 引发新一轮 AI Coding 讨论",
        source: "OpenAI / X", url: "https://openai.com/index/introducing-codex/",
        category: "ai_coding", importance: 5,
        summary: "Codex 相关讨论推动 AI coding 工具生态升温，开发者社区反响强烈。",
        why_it_matters: "将深刻影响开发者工作流和 Agent 编程产品方向。",
        who_should_care: "AI 开发者、Agent 产品经理。",
        action: "深入阅读", risk_or_note: "",
        tags: ["Codex", "AI Coding", "Agent"],
        ai_commentary: { summary: "Codex 推动 AI coding 生态。", why_it_matters: "影响开发者工作流。", who_should_care: "开发者。", action: "深入阅读", risk_or_note: "" },
      },
      {
        rank: 2, title: "MoneyPrinterTurbo 登顶 GitHub Trending",
        source: "GitHub Trending", url: "https://github.com/harry0703/MoneyPrinterTurbo",
        category: "ai_tool", importance: 5,
        summary: "AI 短视频生成工具，一键生成高清短视频。",
        why_it_matters: "内容自动化赛道持续升温。",
        who_should_care: "内容创作者、AI 工具开发者。",
        action: "收藏", risk_or_note: "",
        tags: ["AI Video", "Automation", "GitHub"],
        ai_commentary: { summary: "AI 视频生成爆火。", why_it_matters: "创作者工具门槛降低。", who_should_care: "创作者。", action: "收藏", risk_or_note: "" },
      },
      {
        rank: 3, title: "Google 发布多模态嵌入模型 Gemini Embedding 2",
        source: "Google AI Blog", url: "https://blog.google/technology/ai/gemini-embedding-2/",
        category: "ai_model", importance: 4,
        summary: "原生支持文本、图像、视频 embedding。",
        why_it_matters: "RAG 和多模态搜索能力显著提升。",
        who_should_care: "RAG 开发者、搜索工程师。",
        action: "试用", risk_or_note: "",
        tags: ["Gemini", "Embedding", "Multimodal"],
        ai_commentary: { summary: "多模态 embedding 模型。", why_it_matters: "提升 RAG 能力。", who_should_care: "开发者。", action: "试用", risk_or_note: "" },
      },
      {
        rank: 4, title: "Claude Code 工作流在 X 上引发热议",
        source: "X / Anthropic", url: "#",
        category: "ai_coding", importance: 4,
        summary: "社区分享 Claude Code 与 repo 级开发工作流实战经验。",
        why_it_matters: "Agent 编程从 demo 走向工程化。",
        who_should_care: "AI 开发者、工程团队。",
        action: "跟进", risk_or_note: "",
        tags: ["Claude Code", "Workflow", "Agent"],
        ai_commentary: { summary: "Claude Code 工作流实战。", why_it_matters: "Agent 编程工程化。", who_should_care: "开发者。", action: "跟进", risk_or_note: "" },
      },
      {
        rank: 5, title: "MCP Server 生态持续扩张",
        source: "GitHub", url: "#",
        category: "ai_coding", importance: 4,
        summary: "社区贡献 MCP server 数量快速增长，工具链日趋完善。",
        why_it_matters: "Agent 工具生态的基础设施正在成型。",
        who_should_care: "Agent 开发者。",
        action: "跟进", risk_or_note: "",
        tags: ["MCP", "Agent", "GitHub"],
        ai_commentary: { summary: "MCP 生态扩张。", why_it_matters: "Agent 基础设施成型。", who_should_care: "开发者。", action: "跟进", risk_or_note: "" },
      },
    ],
    github_trending: [
      { rank: 1, repo: "MoneyPrinterTurbo", owner: "harry0703", url: "https://github.com/harry0703/MoneyPrinterTurbo", description: "AI 短视频生成工具", stars: 15200, today_stars: 2300, language: "Python", tags: ["AI", "Video"], llm_insight: { what_it_is: "AI 短视频生成工具", why_trending: "突然爆火", who_should_care: "内容创作者", action: "收藏", risk: "MIT 许可证" }, githubInsight: { core: "MoneyPrinterTurbo 是一套 AI 短视频自动生成工具，把选题、脚本、素材、字幕、配音和合成串成完整流程。", capabilities: ["批量生成", "多语言配音", "字幕生成", "视频合成"], parameters: ["topic", "language", "voice", "duration", "aspect_ratio", "output_dir"], outputs: ["短视频文件", "字幕", "脚本"], runModes: ["Python", "Web UI", "Docker"] } },
      { rank: 2, repo: "OpenHands", owner: "All-Hands-AI", url: "https://github.com/All-Hands-AI/OpenHands", description: "AI 自动化编程 Agent 平台", stars: 48500, today_stars: 1200, language: "Python", tags: ["Agent", "AI Coding"], llm_insight: { what_it_is: "AI Agent 编程平台", why_trending: "Agent 编程持续走热", who_should_care: "开发者", action: "跟进", risk: "Apache 2.0" }, githubInsight: { core: "OpenHands 是一个 AI 自动化编程 Agent 平台，能够自主编写代码、修复 bug 并与开发者协作。", capabilities: ["自主编程", "Bug 修复", "环境沙箱", "多语言支持"], parameters: [], outputs: ["代码补丁", "运行日志"], runModes: ["Docker", "Hosted SaaS"] } },
      { rank: 3, repo: "composio", owner: "ComposioHQ", url: "https://github.com/ComposioHQ/composio", description: "Agent 工具集成平台，连接 250+ 工具", stars: 22300, today_stars: 950, language: "Python", tags: ["Agent", "Tool"], llm_insight: { what_it_is: "Agent 工具集成", why_trending: "MCP 生态扩展", who_should_care: "Agent 开发者", action: "试用", risk: "" }, githubInsight: { core: "Composio 是一个强大的 Agent 工具集成平台，允许 AI Agents 连接并使用 250+ 种外部工具和 API。", capabilities: ["250+ 工具集成", "认证管理", "MCP 支持", "工作流编排"], parameters: ["api_key", "tool_name", "auth_token", "workspace_id"], outputs: ["API 服务", "JSON", "集成鉴权"], runModes: ["Python package", "npm install"] } },
    ],
    x_ai_hotspots: [
      { topic: "Claude Code workflow", heat: 5, summary: "开发者分享 Claude Code 实战经验。", why_it_matters: "Agent 编程走向工程化。", representative_source_url: "#", tags: ["Claude Code", "Workflow"], ai_commentary: { summary: "", why_it_matters: "", who_should_care: "", action: "跟进", risk_or_note: "" } },
      { topic: "Codex 使用反馈", heat: 4, summary: "Codex 用户分享 repo 级任务实战。", why_it_matters: "AI coding 工具竞争加剧。", representative_source_url: "#", tags: ["Codex", "AI Coding"], ai_commentary: { summary: "", why_it_matters: "", who_should_care: "", action: "跟进", risk_or_note: "" } },
      { topic: "MCP Server 分享", heat: 4, summary: "社区贡献新 MCP server。", why_it_matters: "Agent 工具生态成型。", representative_source_url: "#", tags: ["MCP", "Agent"], ai_commentary: { summary: "", why_it_matters: "", who_should_care: "", action: "跟进", risk_or_note: "" } },
    ],
    ai_deals: [],
    agent_podcasts: [
      { name: "Latent Space", updated: true, latest_title: "AI Agent 新时代", url: "#", summary: "深度解析 AI Agent 发展。", tags: ["Podcast"], ai_commentary: { summary: "", why_it_matters: "", who_should_care: "", action: "跟进", risk_or_note: "" } },
      { name: "The Cognitive Revolution", updated: false, latest_title: "", url: "", summary: "", tags: ["Podcast"], ai_commentary: { summary: "", why_it_matters: "", who_should_care: "", action: "略过", risk_or_note: "" } },
      { name: "No Priors", updated: false, latest_title: "", url: "", summary: "", tags: ["Podcast"], ai_commentary: { summary: "", why_it_matters: "", who_should_care: "", action: "略过", risk_or_note: "" } },
      { name: "AI Engineer", updated: false, latest_title: "", url: "", summary: "", tags: ["Podcast"], ai_commentary: { summary: "", why_it_matters: "", who_should_care: "", action: "略过", risk_or_note: "" } },
      { name: "Ben's Bites", updated: false, latest_title: "", url: "", summary: "", tags: ["Podcast"], ai_commentary: { summary: "", why_it_matters: "", who_should_care: "", action: "略过", risk_or_note: "" } },
      { name: "TLDR AI", updated: false, latest_title: "", url: "", summary: "", tags: ["Podcast"], ai_commentary: { summary: "", why_it_matters: "", who_should_care: "", action: "略过", risk_or_note: "" } },
    ],
    ai_tools: [
      { title: "Claude Code 新增 repo 级编辑能力", tool_name: "Claude Code", update_type: "功能更新", url: "#", summary: "支持跨文件重构和批量修改。", why_it_matters: "Agent 编程能力进一步提升。", action: "试用", tags: ["Claude Code", "Agent"], ai_commentary: { summary: "", why_it_matters: "", who_should_care: "", action: "试用", risk_or_note: "" } },
      { title: "Cursor 0.48 发布 Multi-File Edit", tool_name: "Cursor", update_type: "功能更新", url: "#", summary: "支持跨文件 AI 编辑和智能合并。", why_it_matters: "IDE 级 AI 编程体验升级。", action: "试用", tags: ["Cursor", "AI IDE"], ai_commentary: { summary: "", why_it_matters: "", who_should_care: "", action: "试用", risk_or_note: "" } },
    ],
    research_directions: [
      { title: "Agent 推理能力新突破", source: "arXiv", url: "#", summary: "新方法提升 Agent 多步推理准确率 30%。", why_it_matters: "Agent 自主任务执行能力提升。", practical_impact: "可提升 Agent 在复杂 coding 任务中的表现。", tags: ["Agent", "Reasoning"], ai_commentary: { summary: "", why_it_matters: "", who_should_care: "", action: "深入阅读", risk_or_note: "" } },
    ],
    business_policy: [
      { title: "NVIDIA 发布新一代 AI 推理芯片", market_area: "芯片", url: "#", summary: "性能提升 4 倍，推理成本大幅下降。", trend_interpretation: "AI 推理成本下降将推动更多应用落地。", who_is_affected: "AI 应用开发者、云服务商。", tags: ["NVIDIA", "芯片"], ai_commentary: { summary: "", why_it_matters: "", who_should_care: "", action: "跟进", risk_or_note: "" } },
      { title: "欧盟 AI Act 实施细则发布", market_area: "监管", url: "#", summary: "对 Agent 和开源模型提出新要求。", trend_interpretation: "监管趋严可能影响开源模型生态。", who_is_affected: "AI 公司、开源社区。", tags: ["监管", "EU"], ai_commentary: { summary: "", why_it_matters: "", who_should_care: "", action: "跟进", risk_or_note: "" } },
    ],
    risks: [
      { title: "MCP Server 安全漏洞披露", risk_type: "安全漏洞", severity: 4, url: "#", summary: "部分 MCP server 存在权限绕过漏洞。", why_it_matters: "Agent 工具链安全需要重视。", mitigation: "及时更新 MCP server，限制敏感操作权限。", tags: ["MCP", "安全"], ai_commentary: { summary: "", why_it_matters: "", who_should_care: "", action: "跟进", risk_or_note: "" } },
    ],
    sources: [
      { name: "GitHub Trending", url: "", count: 5 },
      { name: "OpenAI News", url: "", count: 4 },
      { name: "arXiv", url: "", count: 3 },
      { name: "HuggingFace Papers", url: "", count: 3 },
      { name: "X / Twitter", url: "", count: 3 },
    ],
  },
};

/** Dev fallback (NOT used in production) */
export function getDevFallback(): DailyRadarDTO {
  return mockDailyRadar;
}
