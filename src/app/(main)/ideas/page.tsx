import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

import { getIdeas, type Post } from "@/lib/content";
import { Reveal } from "@/components/layout/Reveal";
import "./ideas.css";

/* 日期戳章文本,如 2026/05/19 14:30 */
function formatStamp(date: string) {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function IdeasPage() {
  const ideas = getIdeas();

  // 按年分组(getIdeas 已按时间倒序,分组保持原序)
  const yearGroups: { year: number; ideas: Post[] }[] = [];
  for (const idea of ideas) {
    const year = new Date(idea.meta.date).getFullYear();
    const group = yearGroups[yearGroups.length - 1];
    if (group?.year === year) {
      group.ideas.push(idea);
    } else {
      yearGroups.push({ year, ideas: [idea] });
    }
  }
  const showYearDividers = yearGroups.length > 1;

  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-8">
      <header className="mcm-panel space-y-4 p-7 md:p-10">
        <p className="section-kicker">Ideas</p>
        <h1 className="press-title text-4xl font-black tracking-normal text-[color:var(--foreground)] md:text-6xl">
          想法 & 碎碎念
        </h1>
        <p className="max-w-2xl leading-8 text-[color:var(--walnut)]">
          一些不够写成文章的短思考、日常记录和灵感火花。
        </p>
      </header>

      <div className="space-y-10">
        {yearGroups.map((group) => (
          <section key={group.year} className="space-y-6">
            {showYearDividers && (
              <Reveal>
                <h2 className="idea-year-divider mono-label text-sm font-black uppercase">
                  {group.year}
                </h2>
              </Reveal>
            )}
            <div className="space-y-6">
              {group.ideas.map((idea, i) => (
                <Reveal key={idea.slug} index={i % 3} className="ideas-item">
                  <article
                    id={idea.slug}
                    className="mcm-card idea-note scroll-mt-28 p-6 md:p-7"
                  >
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <time dateTime={idea.meta.date} className="idea-stamp mono-label">
                        {formatStamp(idea.meta.date)}
                      </time>
                      <a
                        href={`/ideas#${idea.slug}`}
                        aria-label={`想法固定链接(${formatStamp(idea.meta.date)})`}
                        className="idea-permalink"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                      </a>
                    </div>
                    <div className="post-body max-w-none space-y-4 text-base leading-8 text-[color:var(--foreground)]">
                      <MDXRemote
                        source={idea.content}
                        options={{
                          mdxOptions: {
                            remarkPlugins: [remarkGfm],
                          },
                        }}
                      />
                    </div>
                    {idea.meta.tags && idea.meta.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {idea.meta.tags.map((tag) => (
                          <Link key={tag} href={`/tags/${tag}`} className="mcm-tag">
                            #{tag}
                          </Link>
                        ))}
                      </div>
                    )}
                  </article>
                </Reveal>
              ))}
            </div>
          </section>
        ))}

        {ideas.length < 3 && (
          <Reveal index={1}>
            <aside className="mcm-panel flex flex-col items-center gap-6 p-7 text-center sm:flex-row sm:text-left md:p-8">
              <div className="idea-garden-art" aria-hidden="true">
                <div className="starburst" />
              </div>
              <div className="space-y-3">
                <p className="section-kicker">Digital Garden</p>
                <h2 className="text-2xl font-black text-[color:var(--foreground)]">
                  花园刚开垦
                </h2>
                <p className="leading-7 text-[color:var(--walnut)]">
                  想法还在发芽。订阅之后,新的碎碎念一长出来就会送到你面前。
                </p>
                <Link href="/subscribe" className="mcm-button mcm-button-primary">
                  订阅更新
                </Link>
              </div>
            </aside>
          </Reveal>
        )}
      </div>
    </div>
  );
}
