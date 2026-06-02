"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { List } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || "heading";
}

export default function TocSidebar() {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [retrying, setRetrying] = useState(true);
  const retryRef = useRef(0);

  const scrollToHeading = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", `#${id}`);
      setMobileOpen(false);
    }
  }, []);

  // Extract headings from article with retry
  useEffect(() => {
    let cancelled = false;
    retryRef.current = 0;

    function tryExtract() {
      if (cancelled) return;

      // Try .post-body first, fall back to article
      const postBody = document.querySelector(".post-body") || document.querySelector("article");
      if (!postBody) {
        // Retry up to 5 times (100, 300, 700, 1500, 3100ms)
        retryRef.current++;
        if (retryRef.current <= 5) {
          setTimeout(tryExtract, 100 * Math.pow(2, retryRef.current - 1));
        } else {
          setRetrying(false);
        }
        return;
      }

      const headings = postBody.querySelectorAll("h1, h2, h3");
      const tocItems: TocItem[] = [];
      const seen = new Map<string, number>();

      headings.forEach((h) => {
        const level = parseInt(h.tagName[1], 10);
        const text = (h.textContent || "").trim();
        if (!text || text.length < 2) return;

        let baseId = slugify(text);
        let id = baseId;
        let counter = seen.get(baseId) || 1;
        if (counter > 1) {
          id = `${baseId}-${counter}`;
        }
        seen.set(baseId, counter + 1);
        h.id = id;

        tocItems.push({ id, text, level });
      });

      setItems(tocItems);
      setRetrying(false);
    }

    tryExtract();
    return () => { cancelled = true; };
  }, []);

  // IntersectionObserver for active heading
  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => {
            const aTop = Math.abs(a.boundingClientRect.top);
            const bTop = Math.abs(b.boundingClientRect.top);
            return aTop - bTop;
          });

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0,
      }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  // Scroll active item into view within sidebar
  useEffect(() => {
    if (!activeId) return;
    const el = document.getElementById(`toc-${activeId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }
  }, [activeId]);

  // Close mobile TOC on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  if (retrying) return null;
  if (items.length === 0) return null;

  const tocList = (
    <ul className="space-y-0.5 border-l-2 border-[color:var(--line)]">
      {items.map((item) => (
        <li key={item.id}>
          <button
            onClick={() => scrollToHeading(item.id)}
            id={`toc-${item.id}`}
            className={`
              group flex w-full items-start text-left
              transition-all duration-150
              border-l-2 -ml-[2px]
              py-1 pr-2
              leading-snug
              ${
                item.level === 1
                  ? "pl-3 text-sm font-bold"
                  : item.level === 2
                  ? "pl-6 text-xs"
                  : "pl-10 text-xs text-[color:var(--walnut)]"
              }
              ${
                activeId === item.id
                  ? "border-[color:var(--accent-strong)] text-[color:var(--accent-strong)] font-bold"
                  : "border-transparent text-[color:var(--walnut)] hover:border-[color:var(--mustard)] hover:text-[color:var(--foreground)]"
              }
            `}
          >
            <span className="truncate">{item.text}</span>
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* Mobile floating button - visible below md */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[color:var(--line)] bg-[color:var(--accent)] text-white shadow-[3px_3px_0_var(--ink)] md:hidden"
        aria-label="打开目录"
      >
        <List className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative ml-auto h-full w-72 max-w-[85vw] overflow-y-auto border-l-2 border-[color:var(--line)] bg-[color:var(--paper)] p-5 shadow-[-5px_0_0_var(--ink)]">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold text-[color:var(--foreground)]">📋 目录</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-lg font-black text-[color:var(--walnut)] hover:text-[color:var(--foreground)]"
              >
                ✕
              </button>
            </div>
            {tocList}
          </div>
        </div>
      )}

      {/* Desktop sidebar - sticky, follows scroll with auto-highlight */}
<nav
        className="
          hidden md:block
          w-56 flex-shrink-0
          py-2 pr-4
          text-sm
          sticky top-28
          self-start
          max-h-[calc(100vh-8rem)]
          overflow-y-auto
          overscroll-contain
        "
        aria-label="文章目录"
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mb-3 flex w-full items-center gap-2 text-xs font-bold uppercase tracking-wider text-[color:var(--walnut)] hover:text-[color:var(--accent-strong)] transition-colors"
        >
          <span className="text-base leading-none">📋</span>
          <span>{isCollapsed ? "展开目录" : "目录"}</span>
          <svg
            className={`h-3 w-3 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {!isCollapsed && tocList}
      </nav>
    </>
  );
}
