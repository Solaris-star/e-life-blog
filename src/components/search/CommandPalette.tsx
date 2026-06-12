"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

import { HighlightedText, splitKeywords, type SearchItem } from "./SearchClient";
import "./search.css";

const RECENT_KEY = "blog-recent-searches";
const MAX_RECENT = 5;
const MAX_RESULTS = 8;

const QUICK_LINKS = [
  { label: "首页", href: "/" },
  { label: "文章", href: "/articles" },
  { label: "Daily", href: "/daily" },
  { label: "想法", href: "/ideas" },
  { label: "资源", href: "/resources" },
  { label: "会员", href: "/member" },
] as const;

type PaletteOption =
  | { kind: "result"; item: SearchItem }
  | { kind: "link"; label: string; href: string }
  | { kind: "recent"; value: string };

type PaletteStatus = "idle" | "loading" | "done" | "error";

function loadRecentSearches(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string").slice(0, MAX_RECENT);
  } catch {
    // localStorage 在隐私模式下可能不可用，降级为无历史
    return [];
  }
}

export function CommandPalette() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [status, setStatus] = useState<PaletteStatus>("idle");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);

  const trimmedQuery = query.trim();
  const keywords = splitKeywords(query);

  const options: PaletteOption[] = trimmedQuery
    ? results.map((item) => ({ kind: "result" as const, item }))
    : [
        ...QUICK_LINKS.map((link) => ({ kind: "link" as const, ...link })),
        ...recent.map((value) => ({ kind: "recent" as const, value })),
      ];

  useEffect(() => {
    setMounted(true);
  }, []);

  // 全局快捷键 Cmd+K / Ctrl+K，以及 header 按钮派发的自定义事件
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const handleOpenEvent = () => setOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleOpenEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleOpenEvent);
    };
  }, []);

  // 打开时重置状态、读取最近搜索
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults([]);
    setStatus("idle");
    setActiveIndex(0);
    setRecent(loadRecentSearches());
  }, [open]);

  // 打开期间锁定 body 滚动
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // 防抖请求：250ms 后发起，AbortController 取消过期请求
  useEffect(() => {
    if (!open) return;
    if (!trimmedQuery) {
      setResults([]);
      setStatus("idle");
      return;
    }

    const controller = new AbortController();
    setStatus("loading");

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: trimmedQuery });
        const response = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Search request failed: ${response.status}`);

        const data = (await response.json()) as { items: SearchItem[] };
        setResults(data.items.slice(0, MAX_RESULTS));
        setStatus("done");
        setActiveIndex(0);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Command palette search error:", error);
        setStatus("error");
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [open, trimmedQuery]);

  // 键盘选中项滚动到可视区域
  useEffect(() => {
    if (!open) return;
    document.getElementById(`palette-option-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const close = useCallback(() => setOpen(false), []);

  const rememberSearch = useCallback((value: string) => {
    if (!value) return;
    setRecent((prev) => {
      const next = [value, ...prev.filter((item) => item !== value)].slice(0, MAX_RECENT);
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // localStorage 在隐私模式下可能不可用，仅更新内存状态
      }
      return next;
    });
  }, []);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const activateOption = (option: PaletteOption | undefined) => {
    if (!option) {
      if (trimmedQuery) {
        rememberSearch(trimmedQuery);
        navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
      }
      return;
    }

    if (option.kind === "result") {
      rememberSearch(trimmedQuery);
      navigate(option.item.href);
    } else if (option.kind === "link") {
      navigate(option.href);
    } else {
      setQuery(option.value);
      setActiveIndex(0);
    }
  };

  const handlePaletteKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const visible = trimmedQuery ? status === "done" : true;
      activateOption(visible ? options[activeIndex] : undefined);
      return;
    }
    if (options.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? options.length - 1 : prev - 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    }
  };

  const optionsVisible = trimmedQuery ? status === "done" : true;

  if (!mounted || !open) return null;

  const renderOption = (option: PaletteOption, index: number) => {
    const isActive = index === activeIndex;
    const baseClass = `cursor-pointer rounded-[2px] border-2 px-3 py-2.5 transition ${
      isActive
        ? "border-[color:var(--line)] bg-[color:var(--mustard)] text-[color:var(--ink)] shadow-[2px_2px_0_var(--ink)]"
        : "border-transparent text-[color:var(--foreground)]"
    }`;

    if (option.kind === "result") {
      return (
        <div
          key={`result-${option.item.href}-${option.item.title}`}
          id={`palette-option-${index}`}
          role="option"
          aria-selected={isActive}
          onClick={() => activateOption(option)}
          onMouseEnter={() => setActiveIndex(index)}
          className={baseClass}
        >
          <div className="flex items-center gap-2">
            <span className="mono-label shrink-0 rounded-[2px] border border-[color:var(--line)] bg-[color:var(--paper-light)] px-1.5 py-0.5 text-[11px] font-bold text-[color:var(--walnut)]">
              {option.item.type}
            </span>
            <span className="truncate text-sm font-black">
              <HighlightedText text={option.item.title} keywords={keywords} />
            </span>
          </div>
          {(option.item.snippet || option.item.description) && (
            <p className="mt-1 truncate text-xs leading-5 text-[color:var(--walnut)]">
              <HighlightedText
                text={option.item.snippet || option.item.description}
                keywords={keywords}
              />
            </p>
          )}
        </div>
      );
    }

    const label = option.kind === "link" ? option.label : option.value;
    return (
      <div
        key={`${option.kind}-${label}`}
        id={`palette-option-${index}`}
        role="option"
        aria-selected={isActive}
        onClick={() => activateOption(option)}
        onMouseEnter={() => setActiveIndex(index)}
        className={`${baseClass} flex items-center gap-2 text-sm font-bold`}
      >
        <span className="mono-label text-xs text-[color:var(--walnut)]">
          {option.kind === "link" ? "→" : "↺"}
        </span>
        {label}
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[90]" onKeyDown={handlePaletteKeyDown}>
      <div
        className="palette-backdrop absolute inset-0 bg-[color:var(--ink)]/40 backdrop-blur-[2px]"
        onClick={close}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="快捷搜索"
        className="palette-pop relative mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-xl rounded-[2px] border-[3px] border-[color:var(--line)] bg-[color:var(--paper)] shadow-[8px_8px_0_var(--ink)]"
      >
        <div className="flex items-center gap-3 border-b-2 border-[color:var(--line)] px-4 py-3">
          <span className="mono-label text-xs font-black text-[color:var(--accent-strong)]">搜索</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索文章、想法、项目…"
            autoFocus
            autoComplete="off"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-listbox"
            aria-activedescendant={
              optionsVisible && options.length > 0 ? `palette-option-${activeIndex}` : undefined
            }
            aria-label="快捷搜索"
            className="w-full bg-transparent text-base font-bold text-[color:var(--foreground)] outline-none placeholder:text-[color:var(--walnut)]"
          />
          <kbd className="mono-label shrink-0 rounded-[2px] border border-[color:var(--line)] bg-[color:var(--paper-light)] px-1.5 py-0.5 text-[11px] font-bold text-[color:var(--walnut)]">
            Esc
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {status === "loading" && (
            <p className="mono-label px-3 py-6 text-center text-sm font-bold text-[color:var(--walnut)]" role="status">
              正在检索…
            </p>
          )}

          {status === "error" && (
            <p className="px-3 py-6 text-center text-sm font-bold text-[color:var(--walnut)]">
              搜索出错了，请稍后重试。
            </p>
          )}

          {status === "done" && trimmedQuery && options.length === 0 && (
            <p className="px-3 py-6 text-center text-sm font-bold text-[color:var(--walnut)]">
              没有找到匹配的内容。
            </p>
          )}

          <div id="command-palette-listbox" role="listbox" aria-label="搜索结果" className="space-y-1">
            {trimmedQuery ? (
              status === "done" && options.map((option, index) => renderOption(option, index))
            ) : (
              <>
                <p className="mono-label px-3 pb-1 pt-2 text-[11px] font-black text-[color:var(--walnut)]" aria-hidden="true">
                  快速导航
                </p>
                {options
                  .map((option, index) => ({ option, index }))
                  .filter(({ option }) => option.kind === "link")
                  .map(({ option, index }) => renderOption(option, index))}
                {recent.length > 0 && (
                  <p className="mono-label px-3 pb-1 pt-3 text-[11px] font-black text-[color:var(--walnut)]" aria-hidden="true">
                    最近搜索
                  </p>
                )}
                {options
                  .map((option, index) => ({ option, index }))
                  .filter(({ option }) => option.kind === "recent")
                  .map(({ option, index }) => renderOption(option, index))}
              </>
            )}
          </div>
        </div>

        {trimmedQuery && status === "done" && (
          <button
            type="button"
            onClick={() => {
              rememberSearch(trimmedQuery);
              navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
            }}
            className="block w-full border-t-2 border-[color:var(--line)] px-4 py-3 text-left text-sm font-black text-[color:var(--accent-strong)] transition hover:bg-[color:var(--paper-light)]"
          >
            查看全部结果 →
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
