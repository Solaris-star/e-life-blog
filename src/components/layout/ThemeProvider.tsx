'use client';

import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
};

const ThemeProviderContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({
  theme: 'system',
  setTheme: () => null,
});

const THEME_STORAGE_KEY = 'blog-theme';
const THEME_CHANGE_EVENT = 'blog-theme-change';

function isTheme(value: string | null): value is Theme {
  return value === 'dark' || value === 'light' || value === 'system';
}

function subscribeToTheme(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(THEME_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
  };
}

function getThemeSnapshot(defaultTheme: Theme) {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return isTheme(storedTheme) ? storedTheme : defaultTheme;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: ThemeProviderProps) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    () => getThemeSnapshot(defaultTheme),
    () => defaultTheme
  );

  const setTheme = (nextTheme: Theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  useEffect(() => {
    const root = window.document.documentElement;
    const apply = () => {
      const resolved =
        theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : theme;
      root.classList.remove('light', 'dark');
      root.classList.add(resolved);
    };

    apply();

    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', apply);
    return () => mediaQuery.removeEventListener('change', apply);
  }, [theme]);

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
