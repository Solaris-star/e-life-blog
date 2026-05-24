import { getPosts } from "@/lib/content";
import Link from "next/link";

export default function ArticlesPage() {
  const posts = getPosts();

  return (
    <div className="space-y-12 pb-8">
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

      <div className="space-y-6 border-l border-[color:rgb(107_93_79_/_24%)] pl-5 md:pl-8">
        {posts.map((post) => (
          <article key={post.slug} className="group relative">
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
              {post.meta.tags && post.meta.tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {post.meta.tags.map((tag) => (
                    <Link key={tag} href={`/tags/${tag}`} className="mcm-tag">
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}

        {posts.length === 0 && (
          <p className="mcm-card p-8 text-center text-[color:var(--walnut)]">
            暂无文章发布。
          </p>
        )}
      </div>
    </div>
  );
}
