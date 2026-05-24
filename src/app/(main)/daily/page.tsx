import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { dailyBriefs, dailyCategories } from "@/lib/site-data";

export default function DailyPage() {
  const today = dailyBriefs[0];
  const history = dailyBriefs.slice(1);

  return (
    <div className="space-y-10 pb-8">
      <header className="mcm-panel relative overflow-hidden p-7 md:p-10">
        <div className="absolute right-8 top-8 hidden h-24 w-24 rounded-full border-[18px] border-[color:rgb(217_118_66_/_24%)] md:block" />
        <div className="space-y-4">
          <p className="section-kicker">Daily</p>
          <h1 className="text-4xl font-black tracking-normal text-[color:var(--foreground)] md:text-6xl">
            每日简报
          </h1>
          <p className="max-w-2xl leading-8 text-[color:var(--walnut)]">
            每天整理外部信息、一句话摘要和我的短评，不复制新闻全文。
          </p>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="mcm-card p-6 md:p-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker">Today</p>
              <h2 className="mt-3 text-2xl font-black text-[color:var(--foreground)]">
                今日简报
              </h2>
            </div>
            <CalendarDays className="h-8 w-8 text-[color:var(--accent)]" />
          </div>
          <DailyBriefCard brief={today} highlight />
        </article>

        <aside className="mcm-panel p-6 md:p-7">
          <p className="section-kicker">Categories</p>
          <h2 className="mt-3 text-2xl font-black text-[color:var(--foreground)]">
            分类
          </h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {dailyCategories.map((category) => (
              <span key={category} className="mcm-tag">
                {category}
              </span>
            ))}
          </div>
        </aside>
      </section>

      <section className="space-y-5">
        <div>
          <p className="section-kicker">History</p>
          <h2 className="mt-3 text-2xl font-black text-[color:var(--foreground)]">
            历史简报
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {history.map((brief) => (
            <DailyBriefCard key={`${brief.date}-${brief.title}`} brief={brief} />
          ))}
        </div>
      </section>
    </div>
  );
}

function DailyBriefCard({
  brief,
  highlight = false,
}: {
  brief: (typeof dailyBriefs)[number];
  highlight?: boolean;
}) {
  return (
    <div className={highlight ? "space-y-4" : "mcm-card p-6"}>
      <div className="flex flex-wrap items-center gap-3 text-xs font-black uppercase text-[color:var(--walnut)]">
        <time dateTime={brief.date}>
          {new Date(brief.date).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
        <span className="mcm-tag">{brief.category}</span>
      </div>
      <h3 className="mt-4 text-xl font-black text-[color:var(--foreground)]">
        {brief.title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-[color:var(--walnut)]">
        {brief.summary}
      </p>
      <div className="mt-4 border-l-4 border-[color:var(--mustard)] pl-4 text-sm leading-7 text-[color:var(--foreground)]">
        {brief.comment}
      </div>
      <Link
        href={brief.sourceUrl}
        className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[color:var(--accent-strong)]"
      >
        来源：{brief.sourceName}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
