import Link from "next/link";
import { Clock3, Pin } from "lucide-react";
import type { Post } from "@/lib/content";
import { Reveal } from "@/components/layout/Reveal";

/** 阅读时长估算：中文按字符计，约 500 字/分钟（与首页 estimateReadTime 口径一致） */
export function estimateReadTime(content: string) {
  const words = content.replace(/\s+/g, "").length;
  return Math.max(1, Math.ceil(words / 500));
}

/**
 * 文章列表卡片：日期 + 阅读时长 + 置顶徽章 + 标题 + 摘要 + 标签。
 * 供 /articles 与 /tags/[tag] 复用；description 须由调用方经
 * getPostListDescription(post, canReadPost(...)) 计算后传入（隐私保护）。
 */
export function PostListCard({
  post,
  description,
  index,
}: {
  post: Post;
  description: string;
  index: number;
}) {
  return (
    <Reveal index={Math.min(index, 6)}>
      <article className="group relative">
        <div
          aria-hidden="true"
          className="absolute -left-[25px] top-7 h-3 w-3 rounded-full bg-[color:var(--mustard)] ring-4 ring-[color:var(--background)] transition-colors group-hover:bg-[color:var(--accent)] md:-left-[38px]"
        />

        <div className="mcm-card p-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-black uppercase text-[color:var(--walnut)]">
            <time dateTime={post.meta.date}>
              {new Date(post.meta.date).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
              {estimateReadTime(post.content)} 分钟阅读
            </span>
            {post.meta.featured && (
              <span className="inline-flex -rotate-2 items-center gap-1 rounded-[2px] border-2 border-[color:var(--accent-strong)] px-2 py-0.5 text-[10px] tracking-widest text-[color:var(--accent-strong)]">
                <Pin aria-hidden="true" className="h-3 w-3" />
                置顶
              </span>
            )}
          </div>

          <Link
            href={`/articles/${post.slug}`}
            className="mt-3 block rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent-strong)]"
          >
            <h2 className="text-2xl font-black leading-tight text-[color:var(--foreground)] transition-colors group-hover:text-[color:var(--accent-strong)]">
              {post.meta.title}
            </h2>
          </Link>

          {description && (
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--walnut)]">
              {description}
            </p>
          )}

          {post.meta.tags && post.meta.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {post.meta.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="mcm-tag focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent-strong)]"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </article>
    </Reveal>
  );
}
