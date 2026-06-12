'use client';

import { useEffect, useState } from 'react';
import { Moon, MonitorSmartphone, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

const THEME_ORDER = ['light', 'dark', 'system'] as const;

const THEME_META = {
  light: { label: '亮色主题', Icon: Sun },
  dark: { label: '暗色主题', Icon: Moon },
  system: { label: '跟随系统', Icon: MonitorSmartphone },
} as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // hydration 期间 theme 固定为 server 快照,挂载后再渲染真实图标,避免闪换
  const current = mounted ? theme : 'system';
  const next = THEME_ORDER[(THEME_ORDER.indexOf(current) + 1) % THEME_ORDER.length];
  const { label, Icon } = THEME_META[current];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="inline-flex h-11 w-11 items-center justify-center rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--foreground)] shadow-[3px_3px_0_var(--ink)] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[color:var(--mustard)] hover:shadow-[1px_1px_0_var(--ink)]"
      aria-label={`当前${label},切换到${THEME_META[next].label}`}
      title={`${label} · 点击切换`}
    >
      <span key={current} className="theme-icon-pop inline-flex">
        <Icon className="h-4 w-4" />
      </span>
    </button>
  );
}
