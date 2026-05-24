import Link from "next/link";
import { Archive, ArrowRight, FileText, Lightbulb, Tags } from "lucide-react";
import { getAllTags, getIdeas, getPosts } from "@/lib/content";

const writingEntrances = [
  {
    title: "文章 Articles",
    description: "较完整的技术笔记、生活观察和长期思考。",
    href: "/articles",
    icon: FileText,
  },
  {
    title: "想法 Notes",
    description: "更短、更松散，适合记录临时灵感和日常片段。",
    href: "/ideas",
    icon: Lightbulb,
  },
];

export default function WritingPage() {
  const posts = getPosts();
  const ideas = getIdeas();
  const tags = getAllTags();

  return (
    <div className="space-y-10 pb-8">
      <header className="mcm-panel relative overflow-hidden p-7 md:p-10">
        <div className="absolute right-8 top-8 hidden md:block">
          <div className="starburst" />
        </div>
        <div className="space-y-4">
          <p className="section-kicker">Writing</p>
          <h1 className="text-4xl font-black tracking-normal text-[color:var(--foreground)] md:text-6xl">
            写作
          </h1>
          <p className="max-w-2xl leading-8 text-[color:var(--walnut)]">
            长期文章、短想法和日常记录都在这里。
          </p>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {writingEntrances.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="mcm-card group p-6 md:p-7">
              <div className="flex items-start justify-between gap-5">
                <div className="space-y-3">
                  <Icon className="h-8 w-8 text-[color:var(--accent)]" />
                  <h2 className="text-2xl font-black text-[color:var(--foreground)]">
                    {item.title}
                  </h2>
                  <p className="text-sm leading-7 text-[color:var(--walnut)]">
                    {item.description}
                  </p>
                </div>
                <ArrowRight className="mt-1 h-5 w-5 text-[color:var(--accent-strong)] transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="mcm-panel p-6 md:p-7">
          <div className="flex items-center gap-3">
            <Tags className="h-6 w-6 text-[color:var(--accent)]" />
            <div>
              <p className="section-kicker">Tags</p>
              <h2 className="mt-2 text-2xl font-black text-[color:var(--foreground)]">
                标签
              </h2>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {tags.map((tag) => (
              <Link key={tag} href={`/tags/${tag}`} className="mcm-tag">
                #{tag}
              </Link>
            ))}
            {tags.length === 0 && (
              <p className="text-sm text-[color:var(--walnut)]">暂无标签。</p>
            )}
          </div>
        </div>

        <Link href="/archive" className="mcm-panel group flex flex-col justify-between p-6 md:p-7">
          <div className="space-y-3">
            <Archive className="h-7 w-7 text-[color:var(--olive)]" />
            <p className="section-kicker">Archive</p>
            <h2 className="text-2xl font-black text-[color:var(--foreground)]">
              归档
            </h2>
            <p className="text-sm leading-7 text-[color:var(--walnut)]">
              目前收录 {posts.length} 篇文章和 {ideas.length} 条想法，按时间慢慢排开。
            </p>
          </div>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[color:var(--accent-strong)]">
            查看归档
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </section>
    </div>
  );
}
