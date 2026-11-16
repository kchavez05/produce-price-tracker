// Design tokens, direction B "Ledger" (v2.0 M1, decided 2026-11-12).
// Source of truth for web now and native (v2.1 shared package). Sizes are plain numbers
// (px / ms) so a React Native theme can be generated from this file.
// `npm run design:tokens` writes src/design/tokens.css; CI runs it with --check.

export const THEMES = ['light', 'dark'] as const;
export type ThemeName = (typeof THEMES)[number];

export const colorTokens = {
  bg: { light: '#F2F2F7', dark: '#000000' },
  surface: { light: '#FFFFFF', dark: '#1C1C1E' },
  chip: { light: '#E5E5EA', dark: '#2C2C2E' },
  ink: { light: '#111114', dark: '#F5F5F7' },
  muted: { light: '#5A5A63', dark: '#9A9AA3' },
  border: { light: '#D8D8DE', dark: '#38383A' },
  'border-strong': { light: '#85858C', dark: '#6C6C72' },
  accent: { light: '#0062CC', dark: '#4DA3FF' },
  'on-accent': { light: '#FFFFFF', dark: '#00122B' },
  save: { light: '#1B7A3A', dark: '#5BD58A' },
  'save-bg': { light: '#E3F4E8', dark: '#12301D' },
  // Seeds beyond the decided table; the contrast test is authoritative.
  danger: { light: '#B3261E', dark: '#FF6B63' },
  'danger-bg': { light: '#FCE8E6', dark: '#3A1512' },
  warning: { light: '#8A4B00', dark: '#FFB340' },
  'warning-bg': { light: '#FFF1D6', dark: '#3A2A08' },
  focus: { light: '#0062CC', dark: '#4DA3FF' },
  overlay: { light: '#00000066', dark: '#000000A6' },
} as const satisfies Record<string, Record<ThemeName, string>>;
export type ColorToken = keyof typeof colorTokens;

export const radiusTokens = { control: 10, card: 12, pill: 6 } as const;

export const typeTokens = {
  family: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif",
  size: { title: 28, heading: 20, body: 16, caption: 13 },
  weight: { regular: 400, semibold: 600, bold: 700 },
} as const;

export const elevationTokens = {
  none: 'none',
  card: '0 1px 2px rgb(0 0 0 / 0.08)',
  sheet: '0 -8px 32px rgb(0 0 0 / 0.18)',
} as const;

export const motionTokens = { fast: 120, base: 200 } as const;

/** Minimum touch target (px). */
export const touchTarget = 44;

/** Text pairs need 4.5:1; UI pairs need 3:1 (WCAG 2.x). Checked in both themes. */
export const textContrastPairs: ReadonlyArray<readonly [ColorToken, ColorToken]> = [
  ['ink', 'bg'], ['ink', 'surface'], ['ink', 'chip'],
  ['muted', 'bg'], ['muted', 'surface'], ['muted', 'chip'],
  ['accent', 'bg'], ['accent', 'surface'], ['on-accent', 'accent'],
  ['save', 'save-bg'], ['save', 'surface'],
  ['danger', 'danger-bg'], ['danger', 'surface'],
  ['warning', 'warning-bg'], ['warning', 'surface'],
];
export const uiContrastPairs: ReadonlyArray<readonly [ColorToken, ColorToken]> = [
  ['border-strong', 'bg'], ['border-strong', 'surface'],
  ['focus', 'bg'], ['focus', 'surface'],
  ['accent', 'surface'],
];
