"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type SearchItemType = "文章" | "想法" | "项目" | "Daily";

export interface SearchItem {
  title: string;
  description: string;
  href: string;
  type: SearchItemType;
  tags?: string[];
}

const filters: Array<"全部" | SearchItemType> = ["全部", "文章", "想法", "项目", "Daily"];

export function SearchClient({ items }: { items: SearchItem[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("全部");

  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return items.filter((item) => {
      const typeMatched = filter === "全部" || item.type === filter;
      if (!typeMatched) return false;
      if (!keyword) return true;

      const haystack = [
        item.title,
        item.description,
        item.type,
        ...(item.tags ?? []),
      ].join(" ").toLowerCase();

      return haystack.includes(keyword);
    });
  }, [filter, items, query]);

  return (
    <div className="space-y-6">
      <div className="mcm-panel p-5 md:p-6">
        <label className="block text-sm font-black text-[color:var(--foreground)]" htmlFor="site-search">
          搜索站内内容
        </label>
        <input
          id="site-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="输入标题、摘要、标签或关键词"
          className="mt-3 w-full rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3 text-base font-bold text-[color:var(--foreground)] shadow-[4px_4px_0_var(--ink)] outline-none transition focus:border-[color:var(--line)] focus:bg-[color:var(--paper-light)] focus:shadow-[2px_2px_0_var(--ink)]"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={
                item === filter
                  ? "mcm-tag border-[color:var(--accent)] bg-[color:rgb(217_118_66_/_14%)] text-[color:var(--accent-strong)]"
                  : "mcm-tag"
              }
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {results.map((item) => (
          <Link key={`${item.type}-${item.href}-${item.title}`} href={item.href} className="mcm-card block p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mcm-tag">{item.type}</span>
              {item.tags?.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs font-bold text-[color:var(--walnut)]">
                  #{tag}
                </span>
              ))}
            </div>
            <h2 className="mt-3 text-xl font-black text-[color:var(--foreground)]">
              {item.title}
            </h2>
            <p className="mt-2 text-sm leading-7 text-[color:var(--walnut)]">
              {item.description}
            </p>
          </Link>
        ))}

        {results.length === 0 && (
          <div className="mcm-card py-12 text-center text-[color:var(--walnut)]">
            没有找到匹配的内容。
          </div>
        )}
      </div>
    </div>
  );
}
