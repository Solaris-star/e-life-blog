"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import type { TocItem } from "@/lib/content";

interface TocSidebarProps {
  headings: TocItem[];
}

const DESKTOP_INDENT: Record<number, string> = {
  1: "pl-3",
  2: "pl-6",
  3: "pl-9",
};

const DRAWER_INDENT: Record<number, string> = {
  1: "",
  2: "ml-4",
  3: "ml-8",
};

export default function TocSidebar({ headings }: TocSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const validHeadings = useMemo(() => {
    return headings.filter((h) => h.id && h.id.length > 0);
  }, [headings]);

  useEffect(() => {
    if (validHeadings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const closest = visible.reduce((prev, curr) =>
            curr.intersectionRatio > prev.intersectionRatio ? curr : prev
          );
          setActiveId(closest.target.id);
        }
      },
      {
        rootMargin: "-80px 0px -70% 0px",
        threshold: [0, 0.1, 0.5, 1],
      }
    );

    validHeadings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [validHeadings]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleAnchorClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        const headerHeight = 100;
        const elementTop = el.getBoundingClientRect().top + window.scrollY;
        const targetScroll = elementTop - headerHeight;
        window.scrollTo({ top: targetScroll, behavior: "smooth" });
        history.pushState(null, "", `#${id}`);
        setMobileOpen(false);
        setActiveId(id);
      }
    },
    []
  );

  if (validHeadings.length === 0) return null;

  return (
    <>
      {/* ========== Desktop TOC: sticky sidebar in article layout ========== */}
      <aside
        aria-label="文章目录"
        className="scrollbar-hide hidden w-56 shrink-0 self-start overflow-y-auto xl:block xl:sticky xl:top-[110px] xl:max-h-[calc(100vh-120px)]"
      >
        <nav>
          <p className="mono-label mb-3 flex items-center gap-2 border-b-2 border-[color:var(--line)] pb-2 text-xs font-extrabold uppercase text-[color:var(--walnut)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="14" y2="12" /><line x1="4" y1="18" x2="8" y2="18" />
            </svg>
            目录 · Contents
          </p>
          <ul className="space-y-0.5 border-l-2 border-[color:color-mix(in_srgb,var(--line)_45%,transparent)]">
            {validHeadings.map((item) => {
              const isActive = activeId === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => handleAnchorClick(e, item.id)}
                    aria-current={isActive ? "true" : undefined}
                    className={`-ml-[2px] block rounded-r-[2px] border-l-2 py-1.5 pr-2 leading-snug transition-colors duration-150 ease-[var(--ease-out-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent-strong)] ${DESKTOP_INDENT[item.level] ?? "pl-9"} ${
                      item.level === 1
                        ? "text-sm font-bold"
                        : item.level === 2
                          ? "text-[13px] font-semibold"
                          : "text-[13px] font-medium"
                    } ${
                      isActive
                        ? "border-[color:var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)] font-black text-[color:var(--accent-strong)]"
                        : "border-transparent text-[color:var(--walnut)] hover:border-[color:color-mix(in_srgb,var(--line)_60%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--surface-muted)_55%,transparent)] hover:text-[color:var(--foreground)]"
                    }`}
                  >
                    <span className="block truncate">{item.text}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* ========== Mobile/Tablet: floating button (CSS-controlled visibility) ========== */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="打开目录"
          type="button"
          className="fixed bottom-4 right-4 z-[99999] flex h-14 w-14 items-center justify-center rounded-full border-2 border-[color:var(--line)] bg-[color:var(--accent)] text-[color:var(--paper-light)] shadow-[3px_3px_0_var(--ink)] transition-transform duration-[var(--dur-fast)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent-strong)] xl:hidden"
          style={{
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
            bottom: "calc(1rem + env(safe-area-inset-bottom))",
            right: "calc(1rem + env(safe-area-inset-right))",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
      )}

      {/* ========== Mobile/Tablet: drawer overlay (portal to body) ========== */}
      {mobileOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex justify-end" role="dialog" aria-modal="true" aria-label="文章目录">
          {/* Overlay */}
          <div
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
            className="toc-overlay-enter absolute inset-0 bg-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]"
          />

          {/* Drawer panel */}
          <div className="toc-drawer-enter scrollbar-hide relative z-[1] flex h-full w-[min(20rem,85vw)] flex-col overflow-y-auto border-l-[3px] border-[color:var(--line)] bg-[color:var(--paper-light)] shadow-[-5px_0_0_var(--ink)]">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b-2 border-[color:var(--line)] p-4">
              <span className="mono-label text-lg font-extrabold text-[color:var(--foreground)]">目录</span>
              <button
                onClick={() => setMobileOpen(false)}
                type="button"
                aria-label="关闭目录"
                className="flex h-11 w-11 items-center justify-center rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--paper-deep)] text-[color:var(--foreground)] shadow-[2px_2px_0_var(--ink)] transition-transform duration-[var(--dur-fast)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent-strong)]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 space-y-0.5 p-3">
              {validHeadings.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => handleAnchorClick(e, item.id)}
                    aria-current={isActive ? "true" : undefined}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                    className={`block min-h-11 truncate rounded-[2px] border-2 p-3 leading-snug transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent-strong)] ${DRAWER_INDENT[item.level] ?? "ml-8"} ${
                      item.level === 1
                        ? "text-[17px] font-bold"
                        : item.level === 2
                          ? "text-base font-semibold"
                          : "text-[15px] font-normal"
                    } ${
                      isActive
                        ? "border-[color:var(--line)] bg-[color:var(--accent)] font-black text-[color:var(--paper-light)] shadow-[2px_2px_0_var(--ink)]"
                        : `border-transparent ${item.level === 1 ? "text-[color:var(--foreground)]" : "text-[color:var(--walnut)]"}`
                    }`}
                  >
                    {item.text}
                  </a>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
