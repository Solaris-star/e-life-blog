import { getPostsByTag } from "@/lib/content";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const posts = getPostsByTag(decodedTag);

  return (
    <div className="space-y-10 pb-8">
      <Link href="/tags" className="inline-flex items-center gap-2 text-sm font-black text-[color:var(--walnut)] transition-colors hover:text-[color:var(--accent-strong)]">
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回所有标签
      </Link>

      <header className="mcm-panel space-y-4 p-7 md:p-10">
        <p className="section-kicker">Tag</p>
        <h1 className="text-4xl font-black tracking-normal text-[color:var(--foreground)] md:text-6xl">
          #{decodedTag}
        </h1>
        <p className="max-w-2xl leading-8 text-[color:var(--walnut)]">
          包含此标签的共有 {posts.length} 篇文章。
        </p>
      </header>

      <div className="space-y-6 border-l border-[color:rgb(107_93_79_/_24%)] pl-5 md:pl-8">
        {posts.map((post) => (
          <article key={post.slug} className="relative group">
            <div className="absolute -left-[25px] top-7 h-3 w-3 rounded-full bg-[color:var(--mustard)] ring-4 ring-[color:var(--background)] transition-colors group-hover:bg-[color:var(--accent)] md:-left-[38px]" />

            <div className="mcm-card p-6">
              <time dateTime={post.meta.date} className="text-xs font-black uppercase text-[color:var(--walnut)]">
                {new Date(post.meta.date).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
              <Link href={`/articles/${post.slug}`} className="mt-3 block">
                <h2 className="text-2xl font-black leading-tight text-[color:var(--foreground)] transition-colors group-hover:text-[color:var(--accent-strong)]">
                  {post.meta.title}
                </h2>
              </Link>
              {post.meta.description && (
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--walnut)]">
                  {post.meta.description}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
