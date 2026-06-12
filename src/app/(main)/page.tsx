import Link from "next/link";
import type { ElementType } from "react";
import {
  Archive,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Cloud,
  Clock3,
  CreditCard,
  Gift,
  Layers,
  Lightbulb,
  PenLine,
  Server,
  Sparkles,
} from "lucide-react";
import { getIdeas, getPostListDescription, getPosts, type Post } from "@/lib/content";
import { getCurrentUser, type MemberUser } from "@/lib/member-auth";
import { canReadPost } from "@/lib/post-access";
import HeroGardenImage from "@/components/HeroGardenImage";
import { FluidInk } from "@/components/FluidInk";
import { Reveal } from "@/components/layout/Reveal";
import { getRadarData } from "@/lib/daily/getRadarData";
import type { TopStoryItem } from "./daily/types";

export const dynamic = "force-dynamic";

const topics = [
  {
    title: "海外支付",
    description: "海外账户、虚拟卡与订阅支付",
    count: "指南整理",
    href: "/tags/海外支付",
    icon: CreditCard,
  },
  {
    title: "域名邮箱",
    description: "域名注册、邮箱与账号体系",
    count: "资料整理",
    href: "/tags/域名邮箱",
    icon: Cloud,
  },
  {
    title: "云服网络",
    description: "VPS、Cloudflare 与自建服务",
    count: "实践记录",
    href: "/tags/云服网络",
    icon: Server,
  },
  {
    title: "福利羊毛",
    description: "优惠额度、低成本方案与活动",
    count: "线索归档",
    href: "/tags/福利羊毛",
    icon: Gift,
  },
  {
    title: "OPC实战",
    description: "OPC 清单、流程与复盘",
    count: "实操笔记",
    href: "/tags/OPC实战",
    icon: Layers,
  },
  {
    title: "AI研究",
    description: "AI 工具、Agent 与模型研究",
    count: "研究笔记",
    href: "/tags/AI研究",
    icon: Sparkles,
  },
];

export default async function Home() {
  const posts = getPosts().slice(0, 8);
  const radar = await getRadarData();
  const topStories = radar?.sections.top_stories.slice(0, 3) ?? [];
  const latestIdea = getIdeas()[0];
  const latestPost = posts[0];
  const compactPosts = posts.slice(1, 8);
  const latestDaily = topStories[0];
  const user = await getCurrentUser();

  return (
    <div className="archive-sheet overflow-hidden">
      <HeroSection />
      <RecentUpdateStrip
        latestPost={latestPost}
        latestDaily={latestDaily}
        latestIdea={latestIdea}
      />

      <section className="grid gap-0 border-b-[3px] border-[color:var(--line)] lg:grid-cols-[2fr_1fr]">
        <RecentArticles posts={posts} compactPosts={compactPosts} user={user} />
        <aside className="grid gap-0 border-t-[3px] border-[color:var(--line)] lg:border-l-[3px] lg:border-t-0">
          <DailyPreview stories={topStories} />
          <ThoughtPreview idea={latestIdea} />
        </aside>
      </section>

      <TopicGrid />
      <ArchivePanel />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative grid min-h-[25rem] items-center overflow-hidden border-b-[3px] border-[color:var(--line)] lg:grid-cols-[42fr_58fr]">
      {/* 未来感流体墨水背景:移动端也可见,弥补原静态插画 <768px 隐藏的缺口 */}
      <div aria-hidden className="absolute inset-0 z-0">
        <FluidInk className="h-full w-full" />
      </div>
      <div
        aria-hidden
        className="absolute inset-0 z-0 bg-[linear-gradient(105deg,var(--paper)_0%,var(--paper)_26%,transparent_70%)]"
      />
      <div className="hero-stagger relative z-10 min-w-0 space-y-4 p-5 md:p-8 lg:py-9 lg:pr-2">
        <div className="section-kicker">{"// DIGITAL GARDEN"}</div>
        <div className="space-y-4">
          <h1 className="press-title max-w-full text-[clamp(2.55rem,6.6vw,5rem)] text-[color:var(--foreground)]">
            <span className="block">记录技术、</span>
            <span className="block whitespace-nowrap">生活与思考。</span>
          </h1>
          <p className="max-w-[33rem] text-base font-bold leading-7 text-[color:var(--foreground)] md:text-lg">
            这里是一间打开窗的书房，文章、短想法和日常记录从 Obsidian 笔记里长出来，保留一点复古纸张的温暖感。
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

      <div className="relative z-10 flex min-w-0 items-center justify-end overflow-visible px-2 pb-3 pt-0 md:px-4 md:pb-4 md:pt-1 lg:pb-2 lg:pl-0 lg:pr-0">
        <HeroGardenImage />
      </div>
    </section>
  );
}

function RecentUpdateStrip({
  latestPost,
  latestDaily,
  latestIdea,
}: {
  latestPost?: Post;
  latestDaily?: TopStoryItem;
  latestIdea?: Post;
}) {
  const lastUpdateDate = getLatestDate([latestPost?.meta.date, latestIdea?.meta.date]);

  return (
    <section className="grid border-b-[3px] border-[color:var(--line)] bg-[color:var(--surface)] sm:grid-cols-2 xl:grid-cols-4">
      <InfoCell
        icon={Clock3}
        label="最近更新"
        title={formatDateTime(lastUpdateDate)}
        meta="站点内容索引"
      />
      <InfoCell
        icon={BookOpen}
        label="最新文章"
        title={latestPost?.meta.title ?? "暂无文章"}
        meta={latestPost ? relativeTime(latestPost.meta.date) : "等待发布"}
        href={latestPost ? `/articles/${latestPost.slug}` : "/writing"}
      />
      <InfoCell
        icon={CalendarDays}
        label="Top Stories / News"
        title={latestDaily?.title ?? "暂无新闻"}
        meta={latestDaily ? latestDaily.source : "等待同步"}
        href="/news"
      />
      <InfoCell
        icon={Lightbulb}
        label="最新想法"
        title={latestIdea?.meta.description || latestIdea?.content || "暂无想法"}
        meta={latestIdea ? relativeTime(latestIdea.meta.date) : "等待记录"}
        href="/ideas"
        withArrow
      />
    </section>
  );
}

function InfoCell({
  icon: Icon,
  label,
  title,
  meta,
  href,
  withArrow = false,
}: {
  icon: ElementType;
  label: string;
  title: string;
  meta: string;
  href?: string;
  withArrow?: boolean;
}) {
  const cellClassName =
    "group block border-b border-[color:rgb(42_36_29_/_24%)] transition-colors hover:bg-[color:var(--paper-light)] sm:[&:nth-child(odd)]:border-r sm:[&:nth-child(odd)]:border-[color:rgb(42_36_29_/_24%)] xl:border-b-0 xl:border-r xl:border-[color:rgb(42_36_29_/_24%)] xl:last:border-r-0";
  const content = (
    <div className="flex min-h-[6.4rem] items-start gap-3 p-4">
      <Icon className="mt-1 h-4 w-4 shrink-0 text-[color:var(--accent-strong)]" />
      <div className="min-w-0 flex-1">
        <p className="mono-label text-[0.68rem] font-black uppercase text-[color:var(--walnut)]">
          {label}
        </p>
        <p className="mt-2 line-clamp-2 text-sm font-black leading-5 text-[color:var(--foreground)]">
          {title}
        </p>
        <p className="mt-1 text-xs font-bold text-[color:var(--walnut)]">{meta}</p>
      </div>
      {withArrow && <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[color:var(--accent-strong)]" />}
    </div>
  );

  if (!href) {
    return <div className={cellClassName}>{content}</div>;
  }

  return (
    <Link href={href} className={cellClassName}>
      {content}
    </Link>
  );
}

function RecentArticles({ posts, compactPosts, user }: { posts: Post[]; compactPosts: Post[]; user: MemberUser | null }) {
  const featured = posts[0];

  return (
    <section className="p-5 md:p-6">
      <SectionHeading title="最近文章" label="Articles" href="/articles" linkText="查看全部文章" />

      {featured ? (
        <Link
          href={`/articles/${featured.slug}`}
          className="mcm-card mt-5 grid overflow-hidden p-0 md:grid-cols-[15rem_1fr] lg:grid-cols-[17rem_1fr]"
        >
          <div className="relative min-h-[13rem] overflow-hidden border-b-2 border-[color:var(--line)] bg-[color:var(--paper-deep)] md:border-b-0 md:border-r-2">
            {featured.meta.cover ? (
              <img
                src={featured.meta.cover}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgb(36_31_24_/_12%)_0_1px,transparent_1.4px),repeating-linear-gradient(135deg,rgb(36_31_24_/_8%)_0_1px,transparent_1px_14px)]" />
            )}
            <div className="absolute left-4 top-4 border-2 border-[color:var(--line)] bg-[color:var(--accent)] px-3 py-1 text-xs font-black text-[color:var(--paper-light)] shadow-[2px_2px_0_var(--ink)]">
              置顶
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <p className="mono-label text-xs font-black uppercase text-[color:var(--foreground)]">
                FEATURED ARTICLE
              </p>
              <div className="mt-2 h-2 w-24 bg-[color:var(--accent)]" />
            </div>
          </div>
          <div className="flex min-w-0 flex-col justify-between p-5 md:p-6">
            <div>
              <time dateTime={featured.meta.date} className="mono-label text-xs font-black text-[color:var(--walnut)]">
                {formatDate(featured.meta.date)}
              </time>
              <h3 className="mt-3 text-2xl font-black leading-tight text-[color:var(--foreground)] transition-colors hover:text-[color:var(--accent-strong)]">
                {featured.meta.title}
              </h3>
              <p className="mt-3 line-clamp-3 text-sm font-bold leading-7 text-[color:var(--walnut)]">
                {getPostListDescription(featured, canReadPost(user, featured.meta.access)) || "一篇新的记录，关于技术、生活与持续整理。"}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-black text-[color:var(--walnut)]">
              <span>{estimateReadTime(featured.content)} 分钟阅读</span>
              {featured.meta.tags?.slice(0, 2).map((tag) => (
                <span key={tag} className="border-2 border-[color:var(--line)] bg-[color:var(--paper)] px-2 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Link>
      ) : (
        <div className="mcm-card mt-5 p-6 text-sm font-bold text-[color:var(--walnut)]">
          暂无文章，请在 Obsidian 笔记库中添加并设置 <code>published: true</code>。
        </div>
      )}

      <div className="mt-4 divide-y-2 divide-dashed divide-[color:rgb(42_36_29_/_34%)] border-t-2 border-[color:var(--line)]">
        {compactPosts.map((post, index) => (
          <CompactArticle key={post.slug} post={post} index={index} />
        ))}
        {compactPosts.length < 7 && (
          <Link
            href="/articles"
            className="group flex items-center justify-between gap-3 py-4 text-sm font-black text-[color:var(--accent-strong)]"
          >
            <span>继续查看全部文章</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>
    </section>
  );
}

function CompactArticle({ post, index }: { post: Post; index: number }) {
  return (
    <Link href={`/articles/${post.slug}`} className="group grid grid-cols-[2.75rem_1fr_auto] items-center gap-3 py-3">
      <span className="flex h-9 w-9 items-center justify-center border-2 border-[color:var(--line)] bg-[color:var(--surface-muted)] text-sm font-black text-[color:var(--foreground)]">
        {String(index + 2).padStart(2, "0")}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-black text-[color:var(--foreground)] group-hover:text-[color:var(--accent-strong)]">
          {post.meta.title}
        </span>
        <span className="mt-1 block text-xs font-bold text-[color:var(--walnut)]">
          {post.meta.tags?.[0] ?? "文章"} · {formatDate(post.meta.date)}
        </span>
      </span>
      <ArrowRight className="h-4 w-4 text-[color:var(--accent-strong)] transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function DailyPreview({ stories }: { stories: TopStoryItem[] }) {
  return (
    <section className="border-b-[3px] border-[color:var(--line)] p-5 md:p-6">
      <SectionHeading title="Daily / 近期记录" label="Daily" href="/news" linkText="查看全部" />
      <div className="mt-5 space-y-3">
        {stories.map((item) => (
          <Link
            key={`${item.url}-${item.title}`}
            href={item.url || "/news"}
            className="group grid grid-cols-[3.5rem_1fr_auto] gap-3 border-2 border-[color:var(--line)] bg-[color:var(--surface)] p-3 shadow-[3px_3px_0_var(--ink)] transition hover:translate-y-[-1px]"
          >
            <span className="flex h-14 flex-col items-center justify-center border-2 border-[color:var(--line)] bg-[color:var(--paper-deep)] text-center">
              <span className="text-[0.66rem] font-black">TOP</span>
              <span className="text-lg font-black leading-none">{String(item.rank).padStart(2, "0")}</span>
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black leading-5 text-[color:var(--foreground)]">{item.title}</span>
              <span className="mt-1 line-clamp-1 text-xs font-bold leading-5 text-[color:var(--walnut)]">
                {item.summary}
              </span>
            </span>
            <ArrowRight className="mt-1 h-4 w-4 text-[color:var(--accent-strong)] transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
        {stories.length === 0 && (
          <Link
            href="/news"
            className="block border-2 border-[color:var(--line)] bg-[color:var(--surface)] p-4 text-sm font-bold text-[color:var(--walnut)] shadow-[3px_3px_0_var(--ink)]"
          >
            暂无 Top Stories，前往新闻页查看同步状态。
          </Link>
        )}
      </div>
    </section>
  );
}

function ThoughtPreview({ idea }: { idea?: Post }) {
  return (
    <section className="p-5 md:p-6">
      <SectionHeading title="最近想法" label="Notes" href="/ideas" linkText="查看全部" />
      <Link
        href="/ideas"
        className="mt-5 block border-2 border-[color:var(--line)] bg-[color:var(--paper-light)] p-5 shadow-[5px_5px_0_var(--ink)] transition hover:translate-y-[-1px] hover:shadow-[6px_6px_0_var(--ink)]"
      >
        <div className="mb-4 flex items-center justify-between border-b-2 border-dashed border-[color:var(--line)] pb-3">
          <span className="mono-label text-xs font-black text-[color:var(--accent-strong)]">MARGIN NOTE</span>
          <PenLine className="h-4 w-4 text-[color:var(--accent-strong)]" />
        </div>
        <p className="line-clamp-5 text-sm font-bold leading-7 text-[color:var(--foreground)]">
          {idea?.meta.description || idea?.content || "暂无想法记录。"}
        </p>
        <time dateTime={idea?.meta.date} className="mt-4 block text-xs font-black text-[color:var(--walnut)]">
          {idea ? formatDate(idea.meta.date) : "等待记录"}
        </time>
      </Link>
    </section>
  );
}

function TopicGrid() {
  return (
    <section className="border-b-[3px] border-[color:var(--line)] p-5 md:p-6">
      <SectionHeading title="写作专题" label="Topics" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {topics.map((topic, index) => (
          <Reveal key={topic.title} index={index} stamp className="h-full">
            <TopicCard topic={topic} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function TopicCard({ topic }: { topic: (typeof topics)[number] }) {
  const Icon = topic.icon;

  return (
    <Link
      href={topic.href}
      className="group grid h-full min-h-[8.5rem] grid-cols-[3rem_1fr_auto] items-center gap-3 border-2 border-[color:var(--line)] bg-[color:var(--surface)] p-4 shadow-[4px_4px_0_var(--ink)] transition hover:translate-y-[-1px] hover:shadow-[5px_5px_0_var(--ink)]"
    >
      <span className="flex h-12 w-12 items-center justify-center border-2 border-[color:var(--line)] bg-[color:var(--accent)] text-[color:var(--paper-light)]">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-base font-black text-[color:var(--foreground)]">{topic.title}</span>
        <span className="mt-1 block text-xs font-bold leading-5 text-[color:var(--walnut)]">{topic.description}</span>
        <span className="mt-2 block text-xs font-black text-[color:var(--accent-strong)]">{topic.count}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-[color:var(--accent-strong)] transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function ArchivePanel() {
  return (
    <section className="border-b-[3px] border-[color:var(--line)] p-5 md:p-6">
      <Reveal>
        <div className="mcm-panel flex min-h-[13rem] flex-col justify-between p-5 md:p-6">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center border-2 border-[color:var(--line)] bg-[color:var(--surface-muted)] text-[color:var(--foreground)]">
              <Archive className="h-6 w-6" />
            </span>
            <div>
              <p className="section-kicker">Archive</p>
              <h2 className="mt-1 text-xl font-black text-[color:var(--foreground)]">
                归档 / Archive
              </h2>
            </div>
          </div>
          <p className="max-w-md text-sm font-bold leading-7 text-[color:var(--walnut)]">
            按月份浏览所有文章与记录，回到过去，继续生长。
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/archive" className="mcm-button mcm-button-secondary">
            浏览归档
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        </div>
      </Reveal>
    </section>
  );
}

function SectionHeading({
  title,
  label,
  href,
  linkText,
}: {
  title: string;
  label: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="section-kicker">{label}</p>
        <h2 className="mt-2 text-xl font-black text-[color:var(--foreground)]">{title}</h2>
      </div>
      {href && linkText && (
        <Link href={href} className="inline-flex items-center gap-2 text-sm font-black text-[color:var(--accent-strong)]">
          {linkText}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function getLatestDate(values: Array<string | undefined>) {
  const dates = values.filter(Boolean).map((value) => new Date(value as string).getTime());
  if (dates.length === 0) return new Date().toISOString();
  return new Date(Math.max(...dates)).toISOString();
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function relativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))} 分钟前`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} 小时前`;
  return `${Math.floor(diffMs / day)} 天前`;
}

function estimateReadTime(content: string) {
  const words = content.replace(/\s+/g, "").length;
  return Math.max(1, Math.ceil(words / 500));
}
