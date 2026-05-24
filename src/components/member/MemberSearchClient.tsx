"use client";

import { useState } from "react";

interface MemberSearchResult {
  id: string;
  title: string;
  summary: string;
  type: string;
}

export function MemberSearchClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function runSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSearched(true);

    const response = await fetch("/api/member/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    setResults(response.ok ? data.results : []);
    setLoading(false);
  }

  return (
    <div className="space-y-5">
      <form onSubmit={runSearch} className="mcm-panel p-5 md:p-6">
        <label className="block text-sm font-black text-[color:var(--foreground)]" htmlFor="member-search">
          搜索会员内容
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id="member-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="输入资料、群组或主题"
            className="min-h-12 flex-1 rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--surface)] px-4 text-base font-bold text-[color:var(--foreground)] outline-none focus:bg-[color:var(--paper-light)]"
          />
          <button type="submit" className="mcm-button mcm-button-primary">
            {loading ? "搜索中" : "搜索"}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {results.map((item) => (
          <article key={`${item.type}-${item.id}`} className="mcm-card p-5">
            <span className="mcm-tag">{item.type}</span>
            <h2 className="mt-3 text-xl font-black text-[color:var(--foreground)]">
              {item.title}
            </h2>
            <p className="mt-2 text-sm font-bold leading-7 text-[color:var(--walnut)]">
              {item.summary}
            </p>
          </article>
        ))}
        {searched && !loading && results.length === 0 && (
          <div className="mcm-card p-8 text-center text-sm font-bold text-[color:var(--walnut)]">
            没有找到可访问的会员内容。
          </div>
        )}
      </div>
    </div>
  );
}
