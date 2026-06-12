import { NextResponse } from "next/server";
import { getIdeas, getPostListDescription, getPosts } from "@/lib/content";
import { getCurrentUser, type MemberUser } from "@/lib/member-auth";
import { canReadPost } from "@/lib/post-access";
import { dailyBriefs, projects } from "@/lib/site-data";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type SearchResultType = "文章" | "想法" | "项目" | "Daily";
type MatchedField = "标题" | "标签" | "摘要" | "正文";

interface CorpusEntry {
  title: string;
  description: string;
  href: string;
  type: SearchResultType;
  tags: string[];
  /** 已粗略去除 Markdown 语法的正文纯文本；无权限阅读时为空字符串 */
  body: string;
}

interface SearchResultItem {
  title: string;
  description: string;
  href: string;
  type: SearchResultType;
  tags: string[];
  snippet?: string;
  matchedIn: MatchedField[];
}

const TYPE_FILTERS = new Set<string>(["全部", "文章", "想法", "项目", "Daily"]);
const FIELD_ORDER: MatchedField[] = ["标题", "标签", "摘要", "正文"];
const MAX_QUERY_LENGTH = 100;
const MAX_KEYWORDS = 8;
const MAX_RESULTS = 50;
const SNIPPET_LENGTH = 90;
const NO_STORE_HEADERS = { "cache-control": "no-store" } as const;

function stripMarkdown(source: string): string {
  return source
    .replace(/^```[^\n]*$/gm, " ") // 代码围栏标记
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // 图片 -> alt 文本
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // 链接 -> 链接文字
    .replace(/^#{1,6}\s+/gm, "") // 标题标记
    .replace(/^>\s?/gm, "") // 引用标记
    .replace(/[*_~`]+/g, "") // 强调与行内代码标记
    .replace(/\s+/g, " ")
    .trim();
}

function buildCorpus(user: MemberUser | null): CorpusEntry[] {
  const entries: CorpusEntry[] = [];

  for (const post of getPosts()) {
    const readable = canReadPost(user, post.meta.access);
    entries.push({
      title: post.meta.title,
      description: getPostListDescription(post, readable),
      href: `/articles/${post.slug}`,
      type: "文章",
      tags: post.meta.tags ?? [],
      body: readable ? stripMarkdown(post.content) : "",
    });
  }

  for (const idea of getIdeas()) {
    const readable = canReadPost(user, idea.meta.access);
    entries.push({
      title: idea.meta.title,
      description: getPostListDescription(idea, readable),
      href: `/ideas#${idea.slug}`,
      type: "想法",
      tags: idea.meta.tags ?? [],
      body: readable ? stripMarkdown(idea.content) : "",
    });
  }

  for (const project of projects) {
    entries.push({
      title: project.name,
      description: project.description,
      href: "/projects",
      type: "项目",
      tags: project.stack,
      body: "",
    });
  }

  for (const brief of dailyBriefs) {
    entries.push({
      title: brief.title,
      description: `${brief.summary} ${brief.comment}`,
      href: "/daily",
      type: "Daily",
      tags: [brief.category, brief.sourceName],
      body: "",
    });
  }

  return entries;
}

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1 && count < 6) {
    count += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

function buildSnippet(body: string, firstIndex: number): string {
  const start = Math.max(0, firstIndex - 30);
  const end = Math.min(body.length, start + SNIPPET_LENGTH);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < body.length ? "…" : "";
  return `${prefix}${body.slice(start, end).trim()}${suffix}`;
}

function scoreEntry(entry: CorpusEntry, keywords: string[]): { item: SearchResultItem; score: number } | null {
  const titleLower = entry.title.toLowerCase();
  const tagsLower = entry.tags.map((tag) => tag.toLowerCase());
  const descriptionLower = entry.description.toLowerCase();
  const bodyLower = entry.body.toLowerCase();

  let score = 0;
  const fields = new Set<MatchedField>();
  let firstBodyIndex = -1;

  for (const keyword of keywords) {
    let matched = false;

    if (titleLower.includes(keyword)) {
      score += 80;
      fields.add("标题");
      matched = true;
    }
    if (tagsLower.some((tag) => tag.includes(keyword))) {
      score += 40;
      fields.add("标签");
      matched = true;
    }
    if (descriptionLower.includes(keyword)) {
      score += 20;
      fields.add("摘要");
      matched = true;
    }

    const bodyIndex = bodyLower.indexOf(keyword);
    if (bodyIndex !== -1) {
      score += 10 + Math.min(countOccurrences(bodyLower, keyword), 5);
      fields.add("正文");
      matched = true;
      if (firstBodyIndex === -1 || bodyIndex < firstBodyIndex) {
        firstBodyIndex = bodyIndex;
      }
    }

    // AND 语义：任一关键词完全未命中则整条排除
    if (!matched) return null;
  }

  const item: SearchResultItem = {
    title: entry.title,
    description: entry.description,
    href: entry.href,
    type: entry.type,
    tags: entry.tags,
    matchedIn: FIELD_ORDER.filter((field) => fields.has(field)),
  };

  // 仅可读正文（body 非空）才可能产出摘录片段
  if (firstBodyIndex !== -1) {
    item.snippet = buildSnippet(entry.body, firstBodyIndex);
  }

  return { item, score };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH);
    const rawType = (searchParams.get("type") ?? "全部").trim();
    const type = TYPE_FILTERS.has(rawType) ? rawType : "全部";

    if (!q) {
      return NextResponse.json({ items: [] }, { headers: NO_STORE_HEADERS });
    }

    const keywords = [...new Set(q.toLowerCase().split(/\s+/).filter(Boolean))].slice(0, MAX_KEYWORDS);
    const user = await getCurrentUser();

    const corpus = buildCorpus(user).filter((entry) => type === "全部" || entry.type === type);

    const items = corpus
      .map((entry) => scoreEntry(entry, keywords))
      .filter((scored): scored is { item: SearchResultItem; score: number } => scored !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
      .map((scored) => scored.item);

    return NextResponse.json({ items }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "搜索失败，请稍后重试。" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
