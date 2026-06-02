"use client";

// ─────────────────────────────────────────────────────
// SideInsightPopover — GitHub 列表专用「左侧批注浮层」。
// hover 300ms 预览；click 锁定常驻；点外部 / Esc 关闭。
// 锁定状态由父级（GithubTrendingPanel）以 lockedKey 提升管理，
// 因此「click 另一条」会自动关闭上一条（单开）。
// NEVER calls LLM — 仅渲染传入的 README 概括 / normalize 派生内容。
// ─────────────────────────────────────────────────────
import {
  useState,
  useRef,
  useEffect,
  type ReactNode,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { InsightCard } from "./InsightCard";
import { GithubInsightCard } from "./GithubInsightCard";
import type { AIInsight, GithubInsight } from "../types";

export function SideInsightPopover({
  insight,
  fallback,
  locked,
  githubInsight,
  onToggleLock,
  children,
}: {
  insight?: AIInsight;
  githubInsight?: GithubInsight;
  fallback?: string;
  locked: boolean;
  onToggleLock: () => void;
  children: ReactNode;
}) {
  const [hover, setHover] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = hover || locked;

  // 锁定时：点外部 / Esc 关闭（hover 态交给 mouseleave 自行收起）
  useEffect(() => {
    if (!locked) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onToggleLock();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onToggleLock();
    }
    // 延后一帧注册，避免「锁定时的那次 click」立即触发关闭
    const t = setTimeout(() => {
      document.addEventListener("click", onDocClick);
      document.addEventListener("keydown", onKey);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [locked, onToggleLock]);

  // 卸载时清理 hover 定时器
  useEffect(
    () => () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    },
    [],
  );

  const handleMouseEnter = () => {
    hoverTimer.current = setTimeout(() => setHover(true), 300);
  };
  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHover(false);
  };
  const handleClick = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHover(false); // 是否常驻交给 locked 决定
    onToggleLock();
  };
  const handleKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  // 无内容则不包浮层，直接渲染行（避免空 region / 无意义交互）
  const hasContent = Boolean(githubInsight?.core || insight?.summary || (fallback ?? "").trim());

  if (!hasContent) {
    return <div className="gh-row">{children}</div>;
  }

  return (
    <div
      ref={ref}
      className="gh-row"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="cursor-pointer"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label="查看 AI 解读"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>

      {open && (
        <div className="gh-insight-pop" role="region" aria-label="AI 解读">
          {githubInsight ? (
            <GithubInsightCard insight={githubInsight} fallback={fallback} />
          ) : (
            <InsightCard insight={insight} fallback={fallback} compact />
          )}
        </div>
      )}
    </div>
  );
}
