'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  THEME_STORAGE_KEY, parseThemePreference, resolveTheme, themeColors,
  type ThemePreference,
} from '@/design/theme';
import type { ThemeName } from '@/design/tokens';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function systemPrefersDark(): boolean {
  try { return window.matchMedia(DARK_QUERY).matches; } catch { return false; }
}

function readStored(): ThemePreference {
  try { return parseThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY)); } catch { return 'system'; }
}

function apply(theme: ThemeName) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  // Browser chrome color only follows the theme once screens adopt the tokens (data-ds, M4).
  if (root.hasAttribute('data-ds')) {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColors[theme]);
  }
}

/**
 * Theme preference (System, Light, Dark), remembered on this device. The stored value is read
 * only after mount so server and first client render agree; the head script already set data-theme.
 */
export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [theme, setTheme] = useState<ThemeName>('light');

  useEffect(() => {
    const sync = () => {
      const next = readStored();
      const resolved = resolveTheme(next, systemPrefersDark());
      setPreferenceState(next);
      setTheme(resolved);
      apply(resolved);
    };
    sync();
    let media: MediaQueryList | undefined;
    try { media = window.matchMedia(DARK_QUERY); } catch { media = undefined; }
    media?.addEventListener('change', sync);
    window.addEventListener('storage', sync);
    return () => {
      media?.removeEventListener('change', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      if (next === 'system') window.localStorage.removeItem(THEME_STORAGE_KEY);
      else window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch { /* storage unavailable: the choice still applies for this page view */ }
    const resolved = resolveTheme(next, systemPrefersDark());
    setPreferenceState(next);
    setTheme(resolved);
    apply(resolved);
  }, []);

  return { preference, theme, setPreference };
}
