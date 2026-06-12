"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Tag, Lock } from "lucide-react";

interface SearchResult {
  slug: string;
  title: string;
  description: string;
  date: string;
  access: string;
  tags: string[];
  excerpt: string;
  relevance: number;
}

export default function MemberSearchClientPage() {
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedAccess, setSelectedAccess] = useState("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !selectedTag && selectedAccess === "all") {
      setError("请输入搜索关键词或选择筛选条件。");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const response = await fetch("/api/member/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          tag: selectedTag,
          access: selectedAccess,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "搜索失败，请重试。");
        setResults([]);
        return;
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError("网络错误，请重试。");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const accessLabels: Record<string, string> = {
    all: "全部",
    public: "公开",
    free: "Free",
    basic: "Basic",
    pro: "Pro",
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="mcm-panel space-y-4 p-7 md:p-10">
        <p className="section-kicker">Member Search</p>
        <h1 className="text-4xl font-black text-[color:var(--foreground)] md:text-6xl">会员搜索</h1>
        <p className="max-w-2xl font-bold leading-8 text-[color:var(--walnut)]">
          搜索会员文章内容，支持按标签和访问级别筛选。
        </p>
      </header>

      <section className="mcm-card space-y-5 p-6 md:p-7">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[color:var(--walnut)]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索文章标题、内容..."
                className="w-full border-2 border-[color:var(--line)] bg-[color:var(--surface)] py-3 pl-12 pr-4 font-bold outline-none focus:border-[color:var(--accent)]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mcm-button mcm-button-primary whitespace-nowrap disabled:opacity-50"
            >
              {loading ? "搜索中..." : "搜索"}
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={selectedAccess}
              onChange={(e) => setSelectedAccess(e.target.value)}
              className="border-2 border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-2 font-bold outline-none"
            >
              {Object.entries(accessLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  访问级别：{label}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              placeholder="按标签筛选（选填）"
              className="border-2 border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-2 font-bold outline-none"
            />
          </div>

          {error && (
            <p className="border-l-4 border-[color:var(--accent)] pl-4 text-sm font-black text-[color:var(--accent-strong)]">
              {error}
            </p>
          )}
        </form>
      </section>

      {searched && (
        <section className="space-y-4">
          {results.length > 0 ? (
            <>
              <p className="font-bold text-[color:var(--walnut)]">找到 {results.length} 篇文章</p>
              <div className="grid gap-4">
                {results.map((result) => (
                  <Link
                    key={result.slug}
                    href={`/articles/${result.slug}`}
                    className="mcm-card group p-5 transition-shadow hover:shadow-lg"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {result.access !== "public" && (
                        <span className="inline-flex items-center gap-1 rounded bg-[color:var(--accent)] px-2 py-1 text-xs font-black text-white">
                          <Lock className="h-3 w-3" />
                          {accessLabels[result.access] || result.access}
                        </span>
                      )}
                      {result.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded bg-[color:var(--surface)] px-2 py-1 text-xs font-bold text-[color:var(--walnut)]"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                      <span className="text-xs font-bold text-[color:var(--walnut)]">{result.date}</span>
                    </div>

                    <h2 className="mt-3 text-xl font-black text-[color:var(--foreground)] group-hover:text-[color:var(--accent)]">
                      {result.title}
                    </h2>

                    {result.excerpt && (
                      <p className="mt-2 text-sm font-bold leading-6 text-[color:var(--walnut)]">
                        {result.excerpt}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="mcm-card p-8 text-center">
              <p className="font-bold text-[color:var(--walnut)]">未找到匹配的文章。</p>
              <p className="mt-2 text-sm text-[color:var(--walnut)]">尝试调整搜索关键词或筛选条件。</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
