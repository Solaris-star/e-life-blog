'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface ContentProtectionProps {
  children: ReactNode;
  protectedContent: boolean;
}

export default function ContentProtection({ children, protectedContent }: ContentProtectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const protected_ = protectedContent;

  useEffect(() => {
    if (!protected_ || !containerRef.current) return;

    const container = containerRef.current;
    const shouldAllow = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return Boolean(target.closest('.copy-btn'));
    };
    const blockUnlessAllowed = (event: Event) => {
      if (shouldAllow(event.target)) return;
      event.preventDefault();
    };

    container.addEventListener('contextmenu', blockUnlessAllowed);
    container.addEventListener('selectstart', blockUnlessAllowed);
    container.addEventListener('copy', blockUnlessAllowed);
    container.addEventListener('cut', blockUnlessAllowed);
    container.addEventListener('dragstart', blockUnlessAllowed);

    return () => {
      container.removeEventListener('contextmenu', blockUnlessAllowed);
      container.removeEventListener('selectstart', blockUnlessAllowed);
      container.removeEventListener('copy', blockUnlessAllowed);
      container.removeEventListener('cut', blockUnlessAllowed);
      container.removeEventListener('dragstart', blockUnlessAllowed);
    };
  }, [protected_]);

  return (
    <div ref={containerRef} className={protected_ ? 'content-protected' : ''}>
      {children}
    </div>
  );
}
