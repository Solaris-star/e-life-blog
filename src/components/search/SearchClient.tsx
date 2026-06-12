"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import "./search.css";

export type SearchItemType = "文章" | "想法" | "项目" | "Daily";
export type SearchFilter = "全部" | SearchItemType;

export interface SearchItem {
  title: string;
  description: string;
  href: string;
  type: SearchItemType;
  tags: string[];
  snippet?: string;
  matchedIn: string[];
}

const FILTERS: readonly SearchFilter[] = ["全部", "文章", "想法", "项目", "Daily"];

export function splitKeywords(query: string): string[] {
  return [...new Set(query.trim().toLowerCase().split(/\s+/).filter(Boolean))].slice(0, 8);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 安全的关键词高亮：按关键词拆分文本并包裹 <mark>，不使用 dangerouslySetInnerHTML */
export function HighlightedText({ text, keywords }: { text: string; keywords: string[] }) {
  if (!text || keywords.length === 0) return <>{text}</>;

  const pattern = new RegExp(`(${keywords.map(escapeRegExp).join("|")})`, "gi");
  const keywordSet = new Set(keywords);

  return (
    <>
      {text.split(pattern).map((part, index) =>
        keywordSet.has(part.toLowerCase()) ? (
          <mark
            key={index}
            className="rounded-[2px] bg-[color:var(--mustard)] px-0.5 text-[color:var(--ink)]"
          >
            {part}
          </mark>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}

type SearchStatus = "idle" | "loading" | "done" | "error";

interface SearchClientProps {
  initialQuery?: string;
  initialType?: SearchFilter;
}

export function SearchClient({ initialQuery = "", initialType = "全部" }: SearchClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<SearchFilter>(initialType);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [status, setStatus] = useState<SearchStatus>(initialQuery.trim() ? "loading" : "idle");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [retryToken, setRetryToken] = useState(0);
  const skipUrlSyncRef = useRef(true);

  const trimmedQuery = query.trim();
  const keywords = splitKeywords(query);

  const queryRef = useRef(query);
  queryRef.current = query;
  const filterRef = useRef(filter);
  filterRef.current = filter;

  // 外部导航（如命令面板跳转 /search?q=...）时采用新的 URL 状态；
  // 自身 router.replace 回流时值相同，不会触发更新
  useEffect(() => {
    if (initialQuery.trim() !== queryRef.current.trim()) {
      setQuery(initialQuery);
    }
    if (initialType !== filterRef.current) {
      setFilter(initialType);
    }
  }, [initialQuery, initialType]);

  // 防抖请求：250ms 后发起，AbortController 取消过期请求
  useEffect(() => {
    if (!trimmedQuery) {
      setItems([]);
      setStatus("idle");
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    setStatus("loading");

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: trimmedQuery });
        if (filter !== "全部") params.set("type", filter);

        const response = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Search request failed: ${response.status}`);

        const data = (await response.json()) as { items: SearchItem[] };
        setItems(data.items);
        setStatus("done");
        setActiveIndex(-1);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Search fetch error:", error);
        setStatus("error");
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [trimmedQuery, filter, retryToken]);

  // URL 同步：搜索可分享（跳过首次渲染，避免无意义的 replace）
  useEffect(() => {
    if (skipUrlSyncRef.current) {
      skipUrlSyncRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (trimmedQuery) params.set("q", trimmedQuery);
      if (filter !== "全部") params.set("type", filter);
      const qs = params.toString();
      router.replace(qs ? `/search?${qs}` : "/search", { scroll: false });
    }, 250);

    return () => clearTimeout(timer);
  }, [trimmedQuery, filter, router]);

  // 键盘选中项滚动到可视区域
  useEffect(() => {
    if (activeIndex < 0) return;
    document.getElementById(`search-result-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (items.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
    } else if (event.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < items.length) {
        event.preventDefault();
        router.push(items[activeIndex].href);
      }
    } else if (event.key === "Escape") {
      setActiveIndex(-1);
    }
  };

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
          onKeyDown={handleInputKeyDown}
          placeholder="输入关键词，空格分隔多个关键词"
          autoComplete="off"
          className="mt-3 w-full rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3 text-base font-bold text-[color:var(--foreground)] shadow-[4px_4px_0_var(--ink)] outline-none transition focus:border-[color:var(--line)] focus:bg-[color:var(--paper-light)] focus:shadow-[2px_2px_0_var(--ink)]"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
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

      {status === "idle" && (
        <div className="mcm-panel space-y-3 p-6 text-sm leading-7 text-[color:var(--walnut)]">
          <p className="mono-label text-xs font-black text-[color:var(--accent-strong)]">搜索提示</p>
          <ul className="list-inside list-disc space-y-1">
            <li>支持搜索标题、摘要、标签和文章正文</li>
            <li>多个关键词用空格分隔，结果需同时匹配</li>
            <li>按 ↑ ↓ 选择结果，Enter 跳转</li>
            <li>
              任意页面按{" "}
              <kbd className="rounded-[2px] border border-[color:var(--line)] bg-[color:var(--paper-light)] px-1.5 py-0.5 font-bold">
                Ctrl / ⌘ + K
              </kbd>{" "}
              打开快捷搜索
            </li>
          </ul>
        </div>
      )}

      {status === "loading" && (
        <div className="space-y-4" role="status" aria-label="正在搜索">
          <p className="mono-label text-sm font-black text-[color:var(--walnut)]">正在翻阅卡片盒…</p>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              aria-hidden="true"
              className="mcm-card search-skeleton p-5"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <div className="h-5 w-20 rounded-[2px] border border-[color:var(--line)] bg-[color:var(--paper-light)]" />
              <div className="mt-3 h-6 w-2/3 rounded-[2px] border border-[color:var(--line)] bg-[color:var(--paper-light)]" />
              <div className="mt-3 h-4 w-full rounded-[2px] border border-[color:var(--line)] bg-[color:var(--paper-light)]" />
            </div>
          ))}
        </div>
      )}

      {status === "error" && (
        <div className="mcm-card space-y-4 py-12 text-center text-[color:var(--walnut)]">
          <p className="font-bold">搜索出错了，请稍后重试。</p>
          <button
            type="button"
            onClick={() => setRetryToken((token) => token + 1)}
            className="mcm-button mcm-button-secondary"
          >
            重试
          </button>
        </div>
      )}

      {status === "done" && (
        <div className="space-y-4">
          <p className="mono-label text-sm font-black text-[color:var(--walnut)]" aria-live="polite">
            共 {items.length} 条结果
          </p>

          {items.map((item, index) => (
            <Link
              key={`${item.type}-${item.href}-${item.title}`}
              id={`search-result-${index}`}
              href={item.href}
              onMouseEnter={() => setActiveIndex(index)}
              className={`mcm-card search-result-enter block p-5${index === activeIndex ? " search-result-active" : ""}`}
              style={{ animationDelay: `${Math.min(index, 10) * 45}ms` }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="mcm-tag">{item.type}</span>
                {item.matchedIn.map((field) => (
                  <span
                    key={field}
                    className="mono-label rounded-[2px] border border-[color:var(--line)] bg-[color:var(--paper-light)] px-1.5 py-0.5 text-[11px] font-bold text-[color:var(--accent-strong)]"
                  >
                    {field}命中
                  </span>
                ))}
                {item.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-xs font-bold text-[color:var(--walnut)]">
                    #{tag}
                  </span>
                ))}
              </div>
              <h2 className="mt-3 text-xl font-black text-[color:var(--foreground)]">
                <HighlightedText text={item.title} keywords={keywords} />
              </h2>
              {item.description && (
                <p className="mt-2 text-sm leading-7 text-[color:var(--walnut)]">
                  <HighlightedText text={item.description} keywords={keywords} />
                </p>
              )}
              {item.snippet && (
                <p className="mt-2 border-l-2 border-[color:var(--line)] pl-3 text-sm leading-6 text-[color:var(--walnut)]">
                  <HighlightedText text={item.snippet} keywords={keywords} />
                </p>
              )}
            </Link>
          ))}

          {items.length === 0 && (
            <div className="mcm-card py-12 text-center text-[color:var(--walnut)]">
              没有找到匹配的内容。
            </div>
          )}
        </div>
      )}
    </div>
  );
}
