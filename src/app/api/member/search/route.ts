import { requireApiActiveSubscription } from "@/lib/member-auth";
import { getPosts, type PostAccessLevel } from "@/lib/content";
import { logMemberAccess } from "@/lib/member-access-log";
import { canReadPost } from "@/lib/post-access";

export const dynamic = "force-dynamic";

interface SearchResult {
  slug: string;
  title: string;
  description: string;
  date: string;
  access: string;
  tags: string[];
  excerpt: string;
  relevance: number;
}

const ALLOWED_ACCESS_FILTERS = new Set<PostAccessLevel | "all">(["all", "public", "free", "basic", "pro", "lifetime"]);

export async function POST(request: Request) {
  const user = await requireApiActiveSubscription();
  if (user instanceof Response) return user;

  try {
    const body = await request.json();
    const query = String(body.query || "").trim();
    const tag = String(body.tag || "").trim();
    const requestedAccess = String(body.access || "").trim();
    const access = ALLOWED_ACCESS_FILTERS.has(requestedAccess as PostAccessLevel | "all") ? requestedAccess : "";

    if (!query && !tag && !access) {
      return Response.json({ error: "请输入搜索关键词、标签或选择访问级别。" }, { status: 400 });
    }

    let filteredPosts = getPosts().filter((post) => canReadPost(user, post.meta.access ?? "public"));

    if (access && access !== "all") {
      filteredPosts = filteredPosts.filter((post) => (post.meta.access ?? "public") === access);
    }

    if (tag) {
      filteredPosts = filteredPosts.filter((post) => post.meta.tags?.includes(tag));
    }

    let matchedResults: SearchResult[];

    if (query) {
      const lowerQuery = query.toLowerCase();
      matchedResults = filteredPosts
        .map((post) => {
          let relevance = 0;
          const title = post.meta.title.toLowerCase();
          const description = (post.meta.description || "").toLowerCase();
          const content = post.content.toLowerCase();
          const tags = (post.meta.tags || []).join(" ").toLowerCase();

          if (title === lowerQuery) relevance += 100;
          else if (title.includes(lowerQuery)) relevance += 50;
          if (description.includes(lowerQuery)) relevance += 30;
          if (tags.includes(lowerQuery)) relevance += 20;

          if (content.includes(lowerQuery)) {
            relevance += 10;
            const matches = content.split(lowerQuery).length - 1;
            relevance += Math.min(matches * 2, 20);
          }

          let excerpt = post.meta.description || "";
          if (!excerpt && relevance > 0) {
            const index = content.indexOf(lowerQuery);
            if (index !== -1) {
              const start = Math.max(0, index - 60);
              const end = Math.min(content.length, index + lowerQuery.length + 60);
              excerpt = `${start > 0 ? "..." : ""}${content.slice(start, end)}${end < content.length ? "..." : ""}`;
            }
          }

          return {
            slug: post.slug,
            title: post.meta.title,
            description: post.meta.description || "",
            date: post.meta.date,
            access: post.meta.access || "public",
            tags: post.meta.tags || [],
            excerpt,
            relevance,
          };
        })
        .filter((result) => result.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance);
    } else {
      matchedResults = filteredPosts
        .map((post) => ({
          slug: post.slug,
          title: post.meta.title,
          description: post.meta.description || "",
          date: post.meta.date,
          access: post.meta.access || "public",
          tags: post.meta.tags || [],
          excerpt: post.meta.description || "",
          relevance: 0,
        }))
        .sort((a, b) => b.date.localeCompare(a.date));
    }

    const results = matchedResults.slice(0, 50);

    await logMemberAccess({
      action: "search",
      userId: user.id,
      targetId: query || tag || access,
    });

    return Response.json({
      results,
      total: matchedResults.length,
      query,
      tag,
      access,
    });
  } catch (error) {
    console.error("Search error:", error);
    return Response.json({ error: "搜索失败，请重试。" }, { status: 500 });
  }
}
