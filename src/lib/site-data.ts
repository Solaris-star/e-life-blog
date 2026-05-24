export type DailyCategory = "AI" | "开发" | "科技" | "生活";

export interface DailyBrief {
  title: string;
  category: DailyCategory;
  sourceName: string;
  sourceUrl: string;
  summary: string;
  comment: string;
  date: string;
}

export interface ProjectItem {
  name: string;
  description: string;
  stack: string[];
  githubUrl: string;
  demoUrl?: string;
  type: "开源项目" | "小工具 / Demo";
}

export const dailyBriefs: DailyBrief[] = [
  {
    title: "AI 工具更新摘要",
    category: "AI",
    sourceName: "Example News",
    sourceUrl: "#",
    summary: "这里是一句话摘要，用来说明今天值得关注的 AI 工具变化。",
    comment: "我会先观察它是否真的改善日常工作，而不是只看发布时的热闹。",
    date: "2026-05-19",
  },
  {
    title: "开发者工具小结",
    category: "开发",
    sourceName: "Dev Example",
    sourceUrl: "#",
    summary: "一个新的开发工具版本更新，重点放在本地体验和构建速度。",
    comment: "如果它能减少等待时间，就值得加入我的工具箱观察一阵。",
    date: "2026-05-18",
  },
  {
    title: "生活效率记录",
    category: "生活",
    sourceName: "Life Notes",
    sourceUrl: "#",
    summary: "关于日程、笔记和休息节奏的一条外部信息整理。",
    comment: "工具只是辅助，真正有效的还是更清楚地安排一天。",
    date: "2026-05-17",
  },
];

export const projects: ProjectItem[] = [
  {
    name: "My Awesome Tool",
    description: "一个用来提高开发效率的极简工具，以后可以从数据文件里继续扩展。",
    stack: ["Next.js", "TypeScript", "MDX"],
    githubUrl: "https://github.com",
    demoUrl: "#",
    type: "开源项目",
  },
  {
    name: "Obsidian Sync Demo",
    description: "把本地笔记内容整理成站点页面的小实验，关注内容流转和发布体验。",
    stack: ["Node.js", "Markdown", "Next.js"],
    githubUrl: "https://github.com",
    type: "小工具 / Demo",
  },
];

export const dailyCategories: DailyCategory[] = ["AI", "开发", "科技", "生活"];
