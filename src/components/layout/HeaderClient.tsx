'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { CommandPalette } from '@/components/search/CommandPalette';

const navItems = [
  { href: '/', label: '首页' },
  { href: '/writing', label: '写作' },
  { href: '/daily', label: 'Daily' },
  { href: '/resources', label: '资源' },
  { href: '/account', label: '会员' },
];

export function HeaderClient() {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string>();

  useEffect(() => {
    let alive = true;

    fetch('/api/member/me', { cache: 'no-store', credentials: 'include' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { authenticated?: boolean; name?: string } | null) => {
        if (alive && data?.authenticated && data.name) setUserName(data.name);
      })
      .catch(() => undefined);

    return () => {
      alive = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-[color:var(--paper)]/95">
      <CommandPalette />
      <div className="shell-container border-x-[3px] border-b-[3px] border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-[10px] md:px-5">
        <div className="flex min-h-14 min-w-0 items-center justify-between gap-3 md:gap-4">
          <div className="inline-flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="group inline-flex min-w-0 items-center gap-3 text-[color:var(--foreground)]"
              aria-label="返回首页"
            >
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--accent)] text-sm font-black text-[color:var(--paper-light)] shadow-[3px_3px_0_var(--ink)]">
                E
              </span>
              <span className="min-w-0 leading-none tracking-normal">
                <span className="block text-xl font-black uppercase">E-Life</span>
                <span className="mt-1 block text-[0.7rem] font-extrabold uppercase text-[color:var(--foreground)]">
                  Blog
                </span>
              </span>
            </Link>
          </div>

          <nav className="hidden items-stretch border-2 border-[color:var(--line)] bg-[color:var(--paper-light)] md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'border-r-2 border-[color:var(--line)] px-5 py-2 text-sm font-extrabold transition last:border-r-0',
                  pathname === item.href
                    ? 'bg-[color:var(--foreground)] text-[color:var(--paper-light)] shadow-[inset_0_-4px_0_var(--accent)]'
                    : 'text-[color:var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[color:var(--mustard)]'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            {userName ? (
              <Link
                href="/account"
                className="hidden min-h-11 items-center gap-2 rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--surface)] px-4 text-sm font-black text-[color:var(--foreground)] shadow-[3px_3px_0_var(--ink)] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[color:var(--mustard)] hover:shadow-[1px_1px_0_var(--ink)] sm:inline-flex"
              >
                <UserRound className="h-4 w-4" />
                {userName}
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden min-h-11 items-center justify-center rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--foreground)] px-4 text-sm font-black text-[color:var(--paper-light)] shadow-[3px_3px_0_var(--ink)] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[color:var(--accent)] hover:shadow-[1px_1px_0_var(--ink)] sm:inline-flex"
              >
                登录 / 注册
              </Link>
            )}
            <Link
              href={userName ? '/account' : '/login'}
              className="inline-flex h-11 w-11 items-center justify-center rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--foreground)] text-[color:var(--paper-light)] shadow-[3px_3px_0_var(--ink)] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[color:var(--accent)] hover:shadow-[1px_1px_0_var(--ink)] sm:hidden"
              aria-label={userName ? '账户中心' : '登录 / 注册'}
              title={userName ? '账户中心' : '登录 / 注册'}
            >
              <UserRound className="h-4 w-4" />
            </Link>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
              className="inline-flex h-11 w-11 items-center justify-center rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--foreground)] shadow-[3px_3px_0_var(--ink)] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[color:var(--mustard)] hover:shadow-[1px_1px_0_var(--ink)]"
              aria-label="搜索(快捷键 ⌘K)"
              title="搜索 · ⌘K"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto overscroll-x-contain pb-1 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'shrink-0 rounded-[2px] border-2 border-[color:var(--line)] px-4 py-2 text-sm font-extrabold shadow-[2px_2px_0_var(--ink)] transition',
                pathname === item.href
                  ? 'bg-[color:var(--foreground)] text-[color:var(--paper-light)]'
                  : 'bg-[color:var(--surface)] text-[color:var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[color:var(--mustard)] hover:shadow-[1px_1px_0_var(--ink)]'
              )}
            >
              {item.label}
            </Link>
          ))}
          {userName && (
            <Link href="/account" className="shrink-0 rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--mustard)] px-4 py-2 text-sm font-extrabold shadow-[2px_2px_0_var(--ink)]">
              {userName}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
