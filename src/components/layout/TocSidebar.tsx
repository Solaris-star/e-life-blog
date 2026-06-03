"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import type { TocItem } from "@/lib/content";

interface TocSidebarProps {
  headings: TocItem[];
}

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
      {/* ========== Desktop TOC: fixed sidebar on the left ========== */}
      <aside
        className="hidden lg:block"
        style={{
          position: "fixed",
          top: "110px",
          left: "max(1rem, calc((100vw - 90rem) / 2 + 1rem))",
          width: "14rem",
          maxHeight: "calc(100vh - 120px)",
          overflowY: "auto",
          zIndex: 30,
        }}
      >
          <div className="scrollbar-hide">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/60">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="8" y2="18"/>
              </svg>
              <span className="font-semibold text-base text-foreground tracking-wide">目录</span>
            </div>
            <ul className="space-y-0.5">
              {validHeadings.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <li key={item.id} className={item.level === 1 ? "" : item.level === 2 ? "ml-4" : "ml-8"}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => handleAnchorClick(e, item.id)}
                      className={`block py-1.5 px-2 rounded-md transition-all duration-150 ${
                        item.level === 1 ? "text-[17px] font-semibold text-foreground" :
                        item.level === 2 ? "text-[16px] font-medium text-muted-foreground" :
                        "text-[15px] font-normal text-muted-foreground/60"
                      } ${isActive ? "bg-primary/8 text-primary" : "hover:text-foreground hover:bg-muted/60"}`}
                    >
                      <span className="truncate block">{item.text}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

      {/* ========== Mobile/Tablet: floating button (CSS-controlled visibility) ========== */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="打开目录"
          type="button"
          className="fixed bottom-8 right-6 z-[99999] flex h-14 w-14 items-center justify-center rounded-full border-2 border-[color:var(--line)] bg-[color:var(--accent)] text-[color:var(--paper-light)] shadow-[3px_3px_0_var(--ink)] lg:hidden"
          style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
      )}

      {/* ========== Mobile/Tablet: drawer overlay (portal to body) ========== */}
      {mobileOpen && createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          {/* Overlay */}
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
            }}
          />

          {/* Drawer panel */}
          <div
            className="scrollbar-hide"
            style={{
              position: "relative",
              zIndex: 1,
              width: "min(20rem, 85vw)",
              height: "100%",
              backgroundColor: "var(--paper-light)",
              borderLeft: "3px solid var(--line)",
              boxShadow: "-5px 0 0 var(--ink)",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "1rem",
              borderBottom: "2px solid var(--line)",
              flexShrink: 0,
            }}>
              <span style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--ink)" }}>目录</span>
              <button
                onClick={() => setMobileOpen(false)}
                type="button"
                aria-label="关闭目录"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "2.25rem",
                  height: "2.25rem",
                  border: "2px solid var(--line)",
                  backgroundColor: "var(--paper-deep)",
                  borderRadius: "0.125rem",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div style={{ padding: "0.75rem", flex: 1 }}>
              {validHeadings.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => handleAnchorClick(e, item.id)}
                    style={{
                      display: "block",
                      padding: "0.75rem",
                      borderRadius: "0.125rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      WebkitTapHighlightColor: "transparent",
                      marginLeft: item.level === 1 ? 0 : item.level === 2 ? "1rem" : "2rem",
                      fontSize: item.level === 1 ? "17px" : item.level === 2 ? "16px" : "15px",
                      fontWeight: item.level === 1 ? 700 : item.level === 2 ? 600 : 400,
                      color: isActive
                        ? "var(--paper-light, #fff8ea)"
                        : item.level === 1
                          ? "var(--ink, #241f18)"
                          : "var(--ink-soft, #5e5548)",
                      backgroundColor: isActive ? "var(--accent, #d96d3a)" : "transparent",
                      border: isActive ? "2px solid var(--line, #2a241d)" : "2px solid transparent",
                      boxShadow: isActive ? "2px 2px 0 var(--ink, #241f18)" : "none",
                      textDecoration: "none",
                    }}
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
