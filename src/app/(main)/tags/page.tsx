import { getAllTags } from "@/lib/content";
import Link from "next/link";

export default function TagsPage() {
  const tags = getAllTags();

  return (
    <div className="space-y-10 pb-8">
      <header className="mcm-panel space-y-4 p-7 md:p-10">
        <p className="section-kicker">Tags</p>
        <h1 className="text-4xl font-black tracking-normal text-[color:var(--foreground)] md:text-6xl">
          标签
        </h1>
        <p className="max-w-2xl leading-8 text-[color:var(--walnut)]">
          通过标签浏览所有文章。
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => (
          <Link
            key={tag}
            href={`/tags/${tag}`}
            className="mcm-tag min-h-11 px-5 text-sm"
          >
            #{tag}
          </Link>
        ))}
        {tags.length === 0 && (
          <p className="text-[color:var(--walnut)]">暂无标签。</p>
        )}
      </div>
    </div>
  );
}
