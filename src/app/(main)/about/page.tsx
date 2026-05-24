import Link from "next/link";
import type { ReactNode } from "react";

const stack = ["Next.js", "TypeScript", "Tailwind CSS", "MDX", "Obsidian"];

export default function AboutPage() {
  return (
    <div className="space-y-10 pb-8">
      <header className="mcm-panel space-y-4 p-7 md:p-10">
        <p className="section-kicker">About</p>
        <h1 className="text-4xl font-black tracking-normal text-[color:var(--foreground)] md:text-6xl">
          关于
        </h1>
        <p className="max-w-2xl leading-8 text-[color:var(--walnut)]">
          一点关于我、这个博客，以及它背后那套朴素的写作流程。
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <InfoCard title="关于我" kicker="Me">
          我喜欢把技术、生活和一些还没完全想明白的念头写下来。这个站点更像一个长期打开的笔记本。
        </InfoCard>
        <InfoCard title="关于这个博客" kicker="Blog">
          它从 Obsidian 笔记里长出来，保留一点复古、温暖的视觉语气，也尽量让内容比装饰更重要。
        </InfoCard>
      </section>

      <section className="mcm-card p-6 md:p-7">
        <p className="section-kicker">Stack</p>
        <h2 className="mt-3 text-2xl font-black text-[color:var(--foreground)]">
          技术栈
        </h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {stack.map((item) => (
            <span key={item} className="mcm-tag">
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <InfoCard title="Now" kicker="Now">
          最近在整理个人内容流，把长文章、Daily 简报、项目和短想法放到更清楚的位置。
        </InfoCard>
        <InfoCard title="联系方式" kicker="Contact">
          可以从页脚的 GitHub 找到我。更正式的联系方式之后会补上。
        </InfoCard>
      </section>

      <Link href="/writing" className="inline-flex items-center gap-2 text-sm font-black text-[color:var(--accent-strong)]">
        去看写作
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}

function InfoCard({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker: string;
  children: ReactNode;
}) {
  return (
    <article className="mcm-card p-6 md:p-7">
      <p className="section-kicker">{kicker}</p>
      <h2 className="mt-3 text-2xl font-black text-[color:var(--foreground)]">
        {title}
      </h2>
      <p className="mt-4 text-sm leading-7 text-[color:var(--walnut)]">
        {children}
      </p>
    </article>
  );
}
