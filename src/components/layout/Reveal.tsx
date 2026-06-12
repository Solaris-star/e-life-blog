'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** 同屏多个元素的级联延迟序号(× 70ms) */
  index?: number;
  /** 使用 stamp-in(盖章式)入场代替默认的 rise-in */
  stamp?: boolean;
};

/**
 * 滚动显现容器:进入视口时播放入场动画。
 * 类名在客户端挂载后才添加,无 JS / 爬虫 / reduced-motion 场景内容照常可见。
 */
export function Reveal({ children, className, index = 0, stamp = false }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    node.classList.add('reveal-init');
    if (stamp) node.classList.add('reveal-stamp');

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -7% 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [stamp]);

  return (
    <div ref={ref} className={className} style={{ '--reveal-i': index } as CSSProperties}>
      {children}
    </div>
  );
}
