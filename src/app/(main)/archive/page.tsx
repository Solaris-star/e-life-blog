import Link from "next/link";
import { getIdeas, getPosts } from "@/lib/content";
import { Reveal } from "@/components/layout/Reveal";

interface ArchiveItem {
  title: string;
  date: string;
  href: string;
  type: "文章" | "想法";
}

export default function ArchivePage() {
  const items: ArchiveItem[] = [
    ...getPosts().map((post) => ({
      title: post.meta.title,
      date: post.meta.date,
      href: `/articles/${post.slug}`,
      type: "文章" as const,
    })),
    ...getIdeas().map((idea) => ({
      title: idea.meta.title,
      date: idea.meta.date,
      href: "/ideas",
      type: "想法" as const,
    })),
  ].sort((a, b) => (new Date(a.date) < new Date(b.date) ? 1 : -1));

  // 按 年 → 月 分组（条目已按日期倒序，组内顺序自然保持）
  const yearGroups = new Map<number, Map<number, ArchiveItem[]>>();
  for (const item of items) {
    const d = new Date(item.date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const months = yearGroups.get(year) ?? new Map<number, ArchiveItem[]>();
    const monthItems = months.get(month) ?? [];
    monthItems.push(item);
    months.set(month, monthItems);
    yearGroups.set(year, months);
  }
  const years = Array.from(yearGroups.entries()).sort((a, b) => b[0] - a[0]);

  return (
    <div className="space-y-10 pb-8">
      <header className="mcm-panel space-y-4 p-7 md:p-10">
        <p className="section-kicker">Archive</p>
        <h1 className="text-4xl font-black tracking-normal text-[color:var(--foreground)] md:text-6xl">
          归档
        </h1>
        <p className="max-w-2xl leading-8 text-[color:var(--walnut)]">
          按时间浏览所有文章和想法。共 {items.length} 篇。
        </p>
      </header>

      <div className="space-y-12">
        {years.map(([year, months], yearIndex) => {
          const monthEntries = Array.from(months.entries()).sort((a, b) => b[0] - a[0]);
          const yearCount = monthEntries.reduce((sum, [, list]) => sum + list.length, 0);

          return (
            <Reveal key={year} index={Math.min(yearIndex, 3)}>
              <section aria-labelledby={`archive-year-${year}`} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h2
                    id={`archive-year-${year}`}
                    className="press-title text-4xl text-[color:var(--foreground)] md:text-5xl"
                  >
                    {year}
                  </h2>
                  <span className="mono-label shrink-0 text-xs font-black uppercase text-[color:var(--walnut)]">
                    年鉴 · {yearCount} 篇
                  </span>
                  <span aria-hidden="true" className="h-[3px] flex-1 bg-[color:var(--line)]" />
                </div>

                {monthEntries.map(([month, monthItems]) => (
                  <div key={month} className="space-y-3">
                    <p className="mono-label border-b-2 border-dashed border-[color:var(--line)] pb-1.5 text-xs font-black uppercase text-[color:var(--walnut)]">
                      {String(month).padStart(2, "0")} 月 / {monthItems.length} 篇
                    </p>
                    <div className="space-y-3">
                      {monthItems.map((item) => (
                        <Link
                          key={`${item.type}-${item.title}-${item.date}`}
                          href={item.href}
                          className="mcm-card flex items-center gap-4 p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent-strong)] md:p-5"
                        >
                          <time
                            dateTime={item.date}
                            className="mono-label grid h-11 w-11 shrink-0 place-items-center rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--paper)] text-lg font-black text-[color:var(--foreground)]"
                          >
                            {String(new Date(item.date).getDate()).padStart(2, "0")}
                          </time>
                          <h3 className="min-w-0 flex-1 text-base font-black leading-snug text-[color:var(--foreground)] md:text-lg">
                            {item.title}
                          </h3>
                          <span className="mcm-tag shrink-0">{item.type}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            </Reveal>
          );
        })}

        {items.length === 0 && (
          <p className="mcm-card p-8 text-center text-[color:var(--walnut)]">
            暂无内容。
          </p>
        )}
      </div>
    </div>
  );
}
