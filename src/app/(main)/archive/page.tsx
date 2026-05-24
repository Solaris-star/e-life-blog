import Link from "next/link";
import { getIdeas, getPosts } from "@/lib/content";

export default function ArchivePage() {
  const items = [
    ...getPosts().map((post) => ({
      title: post.meta.title,
      date: post.meta.date,
      href: `/articles/${post.slug}`,
      type: "文章",
    })),
    ...getIdeas().map((idea) => ({
      title: idea.meta.title,
      date: idea.meta.date,
      href: "/ideas",
      type: "想法",
    })),
  ].sort((a, b) => (new Date(a.date) < new Date(b.date) ? 1 : -1));

  return (
    <div className="space-y-10 pb-8">
      <header className="mcm-panel space-y-4 p-7 md:p-10">
        <p className="section-kicker">Archive</p>
        <h1 className="text-4xl font-black tracking-normal text-[color:var(--foreground)] md:text-6xl">
          归档
        </h1>
        <p className="max-w-2xl leading-8 text-[color:var(--walnut)]">
          按时间浏览所有文章和想法。
        </p>
      </header>

      <div className="space-y-5 border-l border-[color:rgb(107_93_79_/_24%)] pl-5 md:pl-8">
        {items.map((item) => (
          <article key={`${item.type}-${item.href}-${item.date}`} className="group relative">
            <div className="absolute -left-[25px] top-6 h-3 w-3 rounded-full bg-[color:var(--mustard)] ring-4 ring-[color:var(--background)] transition-colors group-hover:bg-[color:var(--accent)] md:-left-[38px]" />
            <Link href={item.href} className="mcm-card block p-5">
              <div className="flex flex-wrap items-center gap-3 text-xs font-black uppercase text-[color:var(--walnut)]">
                <time dateTime={item.date}>
                  {new Date(item.date).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <span className="mcm-tag">{item.type}</span>
              </div>
              <h2 className="mt-3 text-xl font-black text-[color:var(--foreground)]">
                {item.title}
              </h2>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
