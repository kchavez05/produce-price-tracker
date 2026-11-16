import { colorTokens, type ThemeName } from './tokens';

export const THEME_STORAGE_KEY = 'pantrybot-theme';
export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

/** Browser chrome color per resolved theme (the page background token). */
export const themeColors: Record<ThemeName, string> = {
  light: colorTokens.bg.light,
  dark: colorTokens.bg.dark,
};

export function parseThemePreference(value: unknown): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean): ThemeName {
  if (preference === 'system') return systemDark ? 'dark' : 'light';
  return preference;
}

/**
 * Blocking <head> script: sets data-theme on <html> before first paint so there is no flash.
 * Storage and matchMedia failures fall back to the light theme. <html> carries
 * suppressHydrationWarning because this attribute differs from the server render.
 */
export const themeInitScript = `(function(){try{var p=null;try{p=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}var d=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light')}catch(e){}})();`;
