import { getPostListDescription, getPosts } from "@/lib/content";
import { getCurrentUser } from "@/lib/member-auth";
import { canReadPost } from "@/lib/post-access";
import Link from "next/link";
import { Reveal } from "@/components/layout/Reveal";
import ClientGardenStage from "@/components/garden/ClientGardenStage";
import { PostListCard } from "./PostListCard";

export default async function ArticlesPage() {
  const posts = getPosts();
  const user = await getCurrentUser();

  // 置顶（featured）优先，组内保持原有日期倒序（稳定排序）
  const orderedPosts = [...posts].sort(
    (a, b) => Number(b.meta.featured === true) - Number(a.meta.featured === true)
  );

  // 标签按文章数倒序，同数按拼音序
  const tagCounts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.meta.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const rankedTags = Array.from(tagCounts.entries()).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN")
  );

  return (
    <div className="space-y-12 pb-8">
      <ClientGardenStage page="articles" />
      <div className="space-y-5">
        <header className="mcm-panel relative overflow-hidden p-7 md:p-10">
          <div className="absolute right-8 top-7 hidden md:block">
            <div className="starburst" />
          </div>
          <div className="space-y-4">
            <p className="section-kicker">Articles</p>
            <h1 className="text-4xl font-black tracking-normal text-[color:var(--foreground)] md:text-6xl">
              所有文章
            </h1>
            <p className="max-w-2xl leading-8 text-[color:var(--walnut)]">
              记录技术、生活与思考的碎片。共 {posts.length} 篇文章。
            </p>
          </div>
        </header>

        {rankedTags.length > 0 && (
          <Reveal>
            <nav
              aria-label="标签导航"
              className="-my-1 overflow-x-auto py-1 scrollbar-hide"
            >
              <div className="flex w-max items-center gap-2.5 pr-4">
                <span className="mono-label shrink-0 text-xs font-black uppercase text-[color:var(--walnut)]">
                  标签导航 /
                </span>
                {rankedTags.map(([tag, count]) => (
                  <Link
                    key={tag}
                    href={`/tags/${encodeURIComponent(tag)}`}
                    className="mono-label inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--surface)] px-4 text-sm font-black text-[color:var(--walnut)] shadow-[2px_2px_0_var(--ink)] transition-all duration-[var(--dur-fast)] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[color:var(--mustard)] hover:text-[color:var(--foreground)] hover:shadow-[1px_1px_0_var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent-strong)]"
                  >
                    #{tag}
                    <span className="ml-2 border-l-2 border-[color:var(--line)] pl-2 text-[11px] text-[color:var(--accent-strong)]">
                      {count}
                    </span>
                  </Link>
                ))}
              </div>
            </nav>
          </Reveal>
        )}
      </div>

      <div className="space-y-6 border-l border-[color:rgb(107_93_79_/_24%)] pl-5 md:pl-8">
        {orderedPosts.map((post, index) => (
          <PostListCard
            key={post.slug}
            post={post}
            description={getPostListDescription(post, canReadPost(user, post.meta.access))}
            index={index}
          />
        ))}

        {orderedPosts.length === 0 && (
          <p className="mcm-card p-8 text-center text-[color:var(--walnut)]">
            暂无文章发布。
          </p>
        )}
      </div>
    </div>
  );
}
