import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, BookOpen, Code, Newspaper, Users } from "lucide-react";
import { getAllTags, getIdeas, getPosts, Post } from "@/lib/content";
import { dailyBriefs, projects } from "@/lib/site-data";
import HeroGardenImage from "@/components/HeroGardenImage";

export default function Home() {
  const posts = getPosts().slice(0, 3);
  const ideas = getIdeas().slice(0, 2);
  const tags = getAllTags().slice(0, 7);
  const recentDaily = dailyBriefs.slice(0, 3);
  const featuredProject = projects[0];

  return (
    <div className="archive-sheet overflow-hidden">
      <section className="grid min-h-[25.25rem] items-center border-b-[3px] border-[color:var(--line)] xl:grid-cols-[0.88fr_1.12fr]">
        <div className="min-w-0 space-y-4 p-5 md:p-8 xl:py-8 xl:pr-2">
          <div className="section-kicker">{"// Digital Garden"}</div>
          <div className="space-y-4">
            <h1 className="press-title max-w-full text-[clamp(2.65rem,7vw,5.1rem)] text-[color:var(--foreground)]">
              <span className="block">记录技术、</span>
              <span className="block whitespace-nowrap">生活与思考。</span>
            </h1>
            <p className="max-w-[35.5rem] text-base font-bold leading-7 text-[color:var(--foreground)] md:text-lg">
              这里是一间打开窗的书房，文章、短想法和项目都从 Obsidian 笔记里长出来。页面留一点 1950 年代的温暖感，内容还是当下的日常。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/writing" className="mcm-button mcm-button-primary">
              阅读文章
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/ideas" className="mcm-button mcm-button-secondary">
              查看想法
            </Link>
          </div>
        </div>

        <div className="relative flex min-w-0 items-center justify-end overflow-visible px-2 pb-3 pt-0 md:px-4 md:pb-4 md:pt-1 xl:pb-2 xl:pl-0 xl:pr-0">
          <HeroGardenImage />
        </div>
      </section>

      <section className="archive-grid grid md:grid-cols-2 xl:grid-cols-4">
        <ArchiveBlock
          title="最新文章"
          label="Articles"
          icon={<BookOpen className="h-6 w-6" />}
          href="/writing"
          linkText="查看全部文章"
        >
          <div className="space-y-4">
            {posts.map((post) => (
              <PostClip key={post.slug} post={post} />
            ))}
            {posts.length === 0 && (
              <p className="text-sm font-bold leading-7 text-[color:var(--walnut)]">
                暂无文章，请在 Obsidian 笔记库中添加并设置 <code>published: true</code>。
              </p>
            )}
          </div>
        </ArchiveBlock>

        <ArchiveBlock
          title="Daily · 近期记录"
          label="Daily"
          icon={<Newspaper className="h-6 w-6" />}
          href="/daily"
          linkText="查看所有 Daily"
        >
          <div className="space-y-2">
            {recentDaily.map((brief, index) => (
              <div key={`${brief.date}-${brief.title}`} className="border-b border-dashed border-[color:var(--line)] pb-2 last:border-b-0 last:pb-0">
                <div className="mono-label flex flex-wrap items-center gap-2 text-[0.68rem] font-black leading-4 text-[color:var(--foreground)]">
                  <span>{index === 0 ? "TODAY" : `D-${String(index + 1).padStart(2, "0")}`}</span>
                  <time dateTime={brief.date}>{brief.date.replaceAll("-", "/")}</time>
                </div>
                <h3 className="mt-1 text-[0.95rem] font-black leading-5 text-[color:var(--foreground)]">
                  {brief.title}
                </h3>
                <p className="mt-0.5 text-[0.8125rem] font-bold leading-[1.125rem] text-[color:var(--walnut)]">
                  {brief.summary}
                </p>
              </div>
            ))}
          </div>
        </ArchiveBlock>

        <ArchiveBlock
          title="项目 / 开源"
          label="Project / 001"
          icon={<Code className="h-6 w-6" />}
          href="/projects"
          linkText="查看项目"
        >
          {featuredProject && (
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                {featuredProject.stack.slice(0, 3).map((item) => (
                  <span key={item} className="mcm-tag">
                    {item}
                  </span>
                ))}
              </div>
              <h3 className="text-lg font-black text-[color:var(--foreground)]">
                {featuredProject.name}
              </h3>
              <p className="mt-3 text-sm font-bold leading-7 text-[color:var(--walnut)]">
                {featuredProject.description}
              </p>
              <Link href={featuredProject.githubUrl} className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[color:var(--accent-strong)]">
                GitHub
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </ArchiveBlock>

        <ArchiveBlock
          title="友链"
          label="Friends"
          icon={<Users className="h-6 w-6" />}
          href="/friends"
          linkText="查看全部友链"
        >
          <div className="space-y-4">
            {["John Doe", "Jane Smith", "Olivia Explorer"].map((name, index) => (
              <div key={name} className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[color:var(--line)] bg-[color:var(--olive)] text-sm font-black uppercase text-[color:var(--paper-light)]">
                  {name.slice(0, 1)}
                </span>
                <div>
                  <p className="font-black text-[color:var(--foreground)]">{name}</p>
                  <p className="text-xs font-bold text-[color:var(--walnut)]">
                    {index === 0 ? "Developer" : index === 1 ? "UI/UX Engineer" : "Data Engineer"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ArchiveBlock>
      </section>

      <section className="grid gap-4 border-b-[3px] border-[color:var(--line)] p-5 md:grid-cols-[11rem_1fr] md:items-center md:p-6">
        <div>
          <p className="section-kicker">Tags</p>
          <h2 className="mt-2 text-xl font-black text-[color:var(--foreground)]">
            标签 / TAGS
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <Link key={tag} href={`/tags/${tag}`} className="mcm-tag min-h-9 px-4">
              #{tag}
            </Link>
          ))}
          {tags.length === 0 && (
            <span className="text-sm font-bold text-[color:var(--walnut)]">
              暂无标签
            </span>
          )}
          <Link href="/tags" className="mcm-tag min-h-9 px-4">
            #索引
          </Link>
        </div>
      </section>

      {ideas.length > 0 && (
        <section className="grid gap-4 p-5 md:grid-cols-[11rem_1fr] md:p-6">
          <div>
            <p className="section-kicker">Notes</p>
            <h2 className="mt-2 text-xl font-black text-[color:var(--foreground)]">
              近期想法
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {ideas.map((idea) => (
              <Link key={idea.slug} href="/ideas" className="mcm-card block p-4">
                <time dateTime={idea.meta.date} className="mono-label text-xs font-black text-[color:var(--walnut)]">
                  {new Date(idea.meta.date).toLocaleDateString("zh-CN")}
                </time>
                <p className="mt-2 line-clamp-3 text-sm font-bold leading-7 text-[color:var(--foreground)]">
                  {idea.meta.description || idea.content}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ArchiveBlock({
  title,
  label,
  icon,
  href,
  linkText,
  children,
}: {
  title: string;
  label: string;
  icon: ReactNode;
  href: string;
  linkText: string;
  children: ReactNode;
}) {
  return (
    <article className="archive-cell flex min-h-[20.2rem] flex-col justify-between gap-4 border-b-[3px] border-[color:var(--line)] p-5 md:[&:nth-child(odd)]:border-r-[3px] xl:border-b-0 xl:border-r-[3px] xl:last:border-r-0">
      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="section-kicker">{label}</p>
            <h2 className="mt-2 text-xl font-black text-[color:var(--foreground)]">
              {title}
            </h2>
          </div>
          <span className="text-[color:var(--accent-strong)]">{icon}</span>
        </div>
        {children}
      </div>
      <Link href={href} className="inline-flex items-center gap-2 text-sm font-black text-[color:var(--accent-strong)]">
        {linkText}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

function PostClip({ post }: { post: Post }) {
  return (
    <Link href={`/articles/${post.slug}`} className="block border-b border-dashed border-[color:var(--line)] pb-3 last:border-b-0 last:pb-0">
      <h3 className="text-base font-black leading-snug text-[color:var(--foreground)]">
        {post.meta.title}
      </h3>
      <time dateTime={post.meta.date} className="mono-label mt-1 block text-xs font-black text-[color:var(--walnut)]">
        {new Date(post.meta.date).toLocaleDateString("zh-CN")}
      </time>
      {post.meta.description && (
        <p className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-[color:var(--walnut)]">
          {post.meta.description}
        </p>
      )}
    </Link>
  );
}
