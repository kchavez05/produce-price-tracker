# Design System

> Status: foundations for v2.0 ([#685](https://github.com/kchavez05/produce-price-tracker/issues/685), part of release tracker [#682](https://github.com/kchavez05/produce-price-tracker/issues/682)). No shipped screen uses these yet; screens adopt them in M3/M4. Plan: [`docs/specs/v2.0-m1-foundations.md`](../specs/v2.0-m1-foundations.md). Visual direction: **B, Ledger** (decided 2026-11-12).

## Tokens

- Source of truth: [`src/design/tokens.ts`](../../src/design/tokens.ts) (colors per theme, radius, type, elevation, motion, 44px touch target). Sizes are plain numbers so a native theme can be generated from the same file in v2.1.
- `npm run design:tokens` writes `src/design/tokens.css`; CI runs `npm run design:tokens -- --check`, so never edit the CSS by hand.
- Tailwind 4 utilities come from `@theme inline`: `bg-bg`, `bg-surface`, `bg-chip`, `text-ink`, `text-muted`, `border-border`, `border-border-strong`, `text-accent`, `text-on-accent`, `text-save`, `bg-save-bg`, danger and warning pairs, `outline-focus`, `rounded-control`, `rounded-card`, `rounded-pill`, `shadow-card`, `min-h-touch`.
- Use semantic tokens only. Controls whose boundary matters (text fields, selects, unselected checkboxes) use `border-border-strong` (3:1); `border-border` is for decorative dividers.
- Contrast is a unit test (`tests/unit/design/tokens.test.ts`): text pairs 4.5:1 and UI pairs 3:1 in both themes. Add new text or control pairs to `textContrastPairs` / `uiContrastPairs` in `tokens.ts`.

## Themes

- System, Light and Dark. A blocking `<head>` script sets `data-theme` before first paint (no flash); `<html>` has `suppressHydrationWarning`. `useTheme()` reads the stored value only after mount and remembers the choice on the device (`pantrybot-theme`).
- `color-scheme` and the per-theme browser chrome color apply only when `<html>` has `data-ds`. Screens set it when they adopt the tokens (M4), so today's screens are unchanged. Print is always light.
- A CSP must allow the head script (nonce or hash); see [#666](https://github.com/kchavez05/produce-price-tracker/issues/666).

## Primitives (`src/components/ui/`)

Button, IconButton, TextField, Select, Checkbox, SegmentedControl, Chip, Card, Badge, Banner, Sheet/Dialog, TabBar, Sidebar, ListRow/List, EmptyState, Skeleton, PageHeader, VisuallyHidden. Hand-built (no headless UI dependency), strict TypeScript, ref forwarding, 44px targets and a visible focus ring.

- IconButton requires `label`. Banner errors and warnings use `role="alert"`, info uses `role="status"`.
- Sheet/Dialog: `aria-modal`, focus moves in, Tab is trapped, Escape and backdrop press close, scroll is locked, focus returns to the opener.
- SegmentedControl is a native radio group; TabBar and Sidebar are `nav` landmarks with `aria-current="page"`.
- Headings follow spec section 6a (Title Case, no redundant tab titles). EmptyState defaults to `h2`; pass `headingLevel` to match the page outline.

## Style guide

`npm run dev`, then open `/design`: tokens, computed contrast ratios, every primitive and theme switching. The route returns 404 in production builds.

## Tests and guards

- Component tests use `tests/helpers/render.ts` (`renderUi`, `setValue`, `expectNoA11yViolations`); every primitive has keyboard/semantics and axe checks. jsdom has no layout, so axe color contrast is off there.
- `npm run design:palette` is a ratchet: it counts raw Tailwind palette classes (`bg-slate-50`, `text-emerald-600`, ...) per file against `src/design/palette-baseline.json` and fails if a count grows. After migrating a screen, lower the baseline with `npm run design:palette -- --update` (it refuses to raise it).
