import Link from "next/link";
import { ArrowRight, BookOpen, Crown, LockKeyhole } from "lucide-react";
import { Reveal } from "@/components/layout/Reveal";
import { getPostListDescription, getPosts } from "@/lib/content";
import { getPostAccessLabel } from "@/lib/post-access";
import { logMemberAccess } from "@/lib/member-access-log";
import { requireActiveSubscription } from "@/lib/member-auth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function MemberPage() {
  const user = await requireActiveSubscription();
  const memberPosts = getPosts().filter((post) => (post.meta.access ?? "public") !== "public");
  await logMemberAccess({ action: "visit_member", userId: user.id, targetId: "/member" });

  return (
    <div className="space-y-10 pb-8">
      <header className="mcm-panel space-y-4 p-7 md:p-10">
        <p className="section-kicker">Member Articles</p>
        <h1 className="press-title text-4xl font-black text-[color:var(--foreground)] md:text-6xl">
          会员文章
        </h1>
        <p className="max-w-2xl font-bold leading-8 text-[color:var(--walnut)]">
          欢迎回来，{user.name}。当前账号等级是 {user.plan}，订阅状态是 {user.subscription.status}。会员文章上线后会在这里出现。
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mcm-tag border-[color:var(--accent)] uppercase text-[color:var(--accent-strong)]">
            <Crown className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            {user.plan}
          </span>
          <span className="mcm-tag">按等级解锁</span>
        </div>
      </header>

      {memberPosts.length > 0 ? (
        <section className="grid gap-5 md:grid-cols-2">
          {memberPosts.map((post, index) => (
            <Reveal key={post.slug} index={index} className="min-w-0">
              <Link href={`/articles/${post.slug}`} className="mcm-card group block h-full p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mcm-tag border-[color:var(--accent)] text-[color:var(--accent-strong)]">
                    {getPostAccessLabel(post.meta.access)}
                  </span>
                  <span className="mcm-tag">文章</span>
                </div>
                <h2 className="mt-4 text-2xl font-black text-[color:var(--foreground)] transition-colors group-hover:text-[color:var(--accent-strong)]">
                  {post.meta.title}
                </h2>
                {getPostListDescription(post) && (
                  <p className="mt-3 text-sm font-bold leading-7 text-[color:var(--walnut)]">
                    {getPostListDescription(post)}
                  </p>
                )}
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[color:var(--accent-strong)]">
                  阅读
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            </Reveal>
          ))}
        </section>
      ) : (
        <section className="grid gap-5 md:grid-cols-3">
          <Reveal index={0} className="min-w-0">
            <div className="mcm-card h-full p-6">
              <BookOpen className="h-7 w-7 text-[color:var(--accent-strong)]" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-black text-[color:var(--foreground)]">公开文章保持免费</h2>
              <p className="mt-3 text-sm font-bold leading-7 text-[color:var(--walnut)]">现有博客文章默认仍然不登录也能看。</p>
            </div>
          </Reveal>
          <Reveal index={1} className="min-w-0">
            <div className="mcm-card h-full p-6">
              <LockKeyhole className="h-7 w-7 text-[color:var(--accent-strong)]" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-black text-[color:var(--foreground)]">新文章可分级</h2>
              <p className="mt-3 text-sm font-bold leading-7 text-[color:var(--walnut)]">文章 frontmatter 写 access 后，就会按会员等级解锁。</p>
            </div>
          </Reveal>
          <Reveal index={2} className="min-w-0">
            <div className="mcm-card h-full p-6">
              <Crown className="h-7 w-7 text-[color:var(--accent-strong)]" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-black text-[color:var(--foreground)]">当前等级：{user.plan}</h2>
              <p className="mt-3 text-sm font-bold leading-7 text-[color:var(--walnut)]">订阅有效时可阅读不高于当前等级的会员文章。</p>
            </div>
          </Reveal>
        </section>
      )}
    </div>
  );
}
