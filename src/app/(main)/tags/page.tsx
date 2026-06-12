import Link from "next/link";
import { getPosts } from "@/lib/content";
import { Reveal } from "@/components/layout/Reveal";

/** 按热度分级：越热门的标签字号越大、铅字感越重（复古活字印刷风） */
function tagTierClass(count: number, max: number) {
  const ratio = count / Math.max(1, max);
  if (ratio >= 0.75) return "min-h-14 px-6 text-2xl shadow-[4px_4px_0_var(--ink)]";
  if (ratio >= 0.5) return "min-h-12 px-5 text-lg shadow-[3px_3px_0_var(--ink)]";
  if (ratio >= 0.25) return "min-h-11 px-4 text-sm shadow-[2px_2px_0_var(--ink)]";
  return "min-h-11 px-3.5 text-xs shadow-[2px_2px_0_var(--ink)]";
}

export default function TagsPage() {
  const posts = getPosts();

  const tagCounts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.meta.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const tags = Array.from(tagCounts.entries()).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN")
  );
  const maxCount = tags[0]?.[1] ?? 1;

  return (
    <div className="space-y-10 pb-8">
      <header className="mcm-panel space-y-4 p-7 md:p-10">
        <p className="section-kicker">Tags</p>
        <h1 className="text-4xl font-black tracking-normal text-[color:var(--foreground)] md:text-6xl">
          标签
        </h1>
        <p className="max-w-2xl leading-8 text-[color:var(--walnut)]">
          通过标签浏览所有文章。共 {tags.length} 个标签、{posts.length} 篇文章。
        </p>
      </header>

      <Reveal stamp>
        <section aria-label="标签索引" className="mcm-panel p-6 md:p-8">
          <p className="mono-label text-xs font-black uppercase text-[color:var(--walnut)]">
            标签索引 / Tag Index
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {tags.map(([tag, count]) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                className={`mono-label inline-flex max-w-full items-center rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--surface)] font-black text-[color:var(--foreground)] transition-all duration-[var(--dur-fast)] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[color:var(--mustard)] hover:shadow-[1px_1px_0_var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent-strong)] ${tagTierClass(count, maxCount)}`}
              >
                #{tag}
                <span className="ml-2 border-l-2 border-[color:var(--line)] pl-2 text-[0.6em] font-black text-[color:var(--accent-strong)]">
                  {count} 篇
                </span>
              </Link>
            ))}
            {tags.length === 0 && (
              <p className="text-[color:var(--walnut)]">暂无标签。</p>
            )}
          </div>
        </section>
      </Reveal>
    </div>
  );
}
