'use client';

import { useEffect, useRef, useState } from 'react';

interface ReadingProgressProps {
  /** 文章正文容器的 id,默认 post-body */
  targetId?: string;
}

/**
 * 阅读进度条:固定在粘性 Header 正下方的 3px 细条,
 * 宽度 = 视口滚过正文的进度。rAF 节流,直接写 DOM 避免高频 re-render。
 * 仅变化宽度,对 prefers-reduced-motion 友好。
 */
export default function ReadingProgress({ targetId = 'post-body' }: ReadingProgressProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState<number | null>(null);

  useEffect(() => {
    const article = document.getElementById(targetId);
    if (!article) return;

    const header = document.querySelector('header');
    const measureTop = () => {
      setTop(header ? Math.max(0, Math.round(header.getBoundingClientRect().bottom)) : 0);
    };

    let raf = 0;
    const update = () => {
      raf = 0;
      const bar = barRef.current;
      if (!bar) return;
      const rect = article.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress =
        total > 0
          ? Math.min(1, Math.max(0, -rect.top / total))
          : rect.top < 0
            ? 1
            : 0;
      bar.style.width = `${(progress * 100).toFixed(2)}%`;
    };
    const onScroll = () => {
      if (raf === 0) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measureTop();
      onScroll();
    };

    measureTop();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [targetId]);

  if (top === null) {
    // 挂载完成前不渲染,避免进度条闪现在视口顶部
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 z-40"
      style={{ top }}
    >
      <div ref={barRef} className="h-[3px] w-0 bg-[color:var(--accent)]" />
    </div>
  );
}
