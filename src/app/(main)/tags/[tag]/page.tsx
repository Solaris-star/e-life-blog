import { getPostListDescription, getPostsByTag } from "@/lib/content";
import { getCurrentUser } from "@/lib/member-auth";
import { canReadPost } from "@/lib/post-access";
import Link from "next/link";
import { PostListCard } from "../../articles/PostListCard";

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const posts = getPostsByTag(decodedTag);
  const user = await getCurrentUser();

  return (
    <div className="space-y-10 pb-8">
      <nav
        aria-label="面包屑"
        className="flex flex-wrap items-center gap-2 text-sm font-black text-[color:var(--walnut)]"
      >
        <Link
          href="/articles"
          className="inline-flex min-h-11 items-center rounded-[2px] transition-colors hover:text-[color:var(--accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent-strong)]"
        >
          所有文章
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href="/tags"
          className="inline-flex min-h-11 items-center rounded-[2px] transition-colors hover:text-[color:var(--accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent-strong)]"
        >
          标签
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-[color:var(--foreground)]">
          #{decodedTag}
        </span>
      </nav>

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
        {posts.map((post, index) => (
          <PostListCard
            key={post.slug}
            post={post}
            description={getPostListDescription(post, canReadPost(user, post.meta.access))}
            index={index}
          />
        ))}

        {posts.length === 0 && (
          <p className="mcm-card p-8 text-center text-[color:var(--walnut)]">
            该标签下暂无文章。
          </p>
        )}
      </div>
    </div>
  );
}
