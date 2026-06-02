"use client";

// ─────────────────────────────────────────────────────
// AIInsightPopover — shared hover/tap AI insight for all item types
// Desktop: hover 300ms delay → show popover
// Mobile: tap → toggle popover
// NEVER calls LLM — only renders pre-generated ai_commentary / llm_insight
// ─────────────────────────────────────────────────────
import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";

export interface AIInsightPopoverProps {
  /** Pre-generated AI commentary from DailyBrief backend */
  insight: {
    summary?: string;
    what_it_is?: string;
    why_it_matters?: string;
    why_trending?: string;
    who_should_care?: string;
    action?: string;
    risk?: string;
    risk_or_note?: string;
  } | null;
  /** Fallback description when no insight available */
  fallback?: string;
  /** Container className */
  className?: string;
  children: ReactNode;
}

export function AIInsightPopover({
  insight,
  fallback,
  className = "",
  children,
}: AIInsightPopoverProps) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = useCallback(() => setShow(true), []);
  const close = useCallback(() => setShow(false), []);

  // Click outside to close
  useEffect(() => {
    if (!show) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close();
      }
    }
    const t = setTimeout(() => document.addEventListener("click", handleClick), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", handleClick);
    };
  }, [show, close]);

  const handleMouseEnter = () => {
    hoverTimer.current = setTimeout(open, 300);
  };
  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    close();
  };
  const handleClick = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setShow((prev) => !prev);
  };

  const hasInsight = insight &&
    (insight.summary || insight.what_it_is ||
     insight.why_it_matters || insight.why_trending);

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div onClick={handleClick} className="cursor-pointer">
        {children}
      </div>

      {show && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 border-2 border-[var(--line)] bg-[var(--surface)] p-3 text-[13px] leading-relaxed shadow-[var(--shadow-small)]">
          {hasInsight ? (
            <div className="space-y-1.5">
              <p className="font-black text-[var(--foreground)] text-[14px]">AI 解读</p>
              <div className="space-y-1 text-[var(--walnut)]">
                {(insight.summary || insight.what_it_is) && (
                  <p><b>做什么：</b>{insight.summary || insight.what_it_is}</p>
                )}
                {(insight.why_it_matters || insight.why_trending) && (
                  <p><b>为什么重要：</b>{insight.why_it_matters || insight.why_trending}</p>
                )}
                {insight.who_should_care && (
                  <p><b>适合谁：</b>{insight.who_should_care}</p>
                )}
                {insight.action && (
                  <p><b>建议：</b>{insight.action}</p>
                )}
                {(insight.risk || insight.risk_or_note) && (
                  <p className="text-[var(--accent)]">
                    <b>⚠ 注意：</b>{insight.risk || insight.risk_or_note}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-[var(--walnut)]">{fallback || "暂无 AI 解读。"}</p>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); close(); }}
            className="mt-2 text-[12px] font-bold text-[var(--accent-strong)] underline"
          >
            关闭
          </button>
        </div>
      )}
    </div>
  );
}
