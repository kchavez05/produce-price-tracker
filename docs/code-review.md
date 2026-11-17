# PantryBot (produce-price-tracker) Code Review Style Guide

## Stack & Architecture
- **Framework:** Next.js 15 (App Router), React 19, TypeScript 5.8 (strict mode), Tailwind CSS v4.
- **Zero-Key Offline Resilience:** The application must work 100% out-of-the-box without requiring API keys (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `USDA_MARS_API_KEY`, `KROGER_CLIENT_ID`). Any live API integration must gracefully fall back to deterministic local baselines or cached feeds.
- **Selected AI adapters:** Provisional recipes use `gpt-6.1-terra`; speech uses `gpt-transcribe` → `gpt-6-luna` (#731/#752, November 16). Enforce full input/output/audio bounds, one attempt per stage, safe errors, and shared pre-dispatch reservations. No automatic failover. The retained Gemini compatibility adapter uses `@google/genai`; never introduce deprecated `@google/generative-ai`.

## Review Focus Areas
1. **Type Safety:** Flag `any` types, unsafe type assertions, or unhandled `null`/`undefined` edge cases in price normalization (`$/lb`, `$/oz`, `$/ea`) and grocery item parsing.
2. **Security & Secrets:** Ensure API keys are never exposed in client-rendered bundles. Personal AI keys are retired and must never authorize dispatch. Server-side environment variables must stay inside Route Handlers (`src/app/api/**`) or server modules.
3. **Price & Arbitrage Math:** Verify division-by-zero guards when computing unit prices, wholesale club comparisons, and explicit Pantry availability and additional grocery cost estimates.
4. **React 19 & Next.js 15 Patterns:** Ensure client components declare `'use client'`, avoid hydration mismatches when reading `localStorage`, and properly await async `params`/`searchParams` in Next.js 15 route handlers or pages.

## Review Workflow

Use Claude Code Review for PRs targeting `develop` and `main`. The maintainer moved review from Codex to Claude in November 2026. Existing findings from earlier providers (Copilot, Codex) still need resolution; changing providers does not waive any finding. Review is **one round**: the hosted review runs once, when a PR is opened (non-draft) or marked ready for review, not on every push or on drafts. Wait for that completed Claude assessment, address actionable P0/P1/P2 findings (or equivalent severity), reply with the fixing commit or a reason for skipping a suggestion, and resolve each thread before merging. A request alone is not a completed review. Keep the existing CI, Vercel Preview, release gates, and separately required approvals.

Prefer the GitHub connector or `gh`/REST API for review requests, CI/Preview monitoring, comments and thread resolution. Claude is requested through a PR comment:

```bash
# After pushing the intended head, first check whether an automatic review started.
# If none has started, request one review through the GitHub API/CLI.
gh pr comment <pr-number> --repo <owner>/<repo> --body '@claude review the latest head against AGENTS.md and docs/code-review.md'
```

A local `/code-review --comment` run from Claude Code can supplement or substitute for the hosted review when the GitHub app is unavailable; it posts findings as inline PR comments. Inspect Claude bot activity (login `claude[bot]`, confirmed on PR #660; completion shows as a top-level "Code review" comment), submitted reviews, completion comments and inline threads. A successful comment API response or reaction only confirms submission/acknowledgment. Require an explicit completed assessment of the opening review. Missing access, quota errors and setup prompts are not reviews. After addressing the comments, merge once CI is green; do not request a second round unless the fixes are substantial or the maintainer asks (use an `@claude` comment or local `/code-review`). Avoid duplicate requests while a review is active.

Keep monitoring output compact: use `gh pr checks`, or query `headRefOid`, review author/state/commit, and check name/status/conclusion with `gh pr view --json ... --jq ...`. Store routine watch output locally or suppress unchanged results; fetch full logs or comment bodies only when a failure or finding needs investigation. Inspect unresolved threads before merging. API monitoring does not relax any review, CI, Preview, or release gate.

### Automatic review setup

The Claude GitHub app is installed and hosted review is live. A local `/code-review --comment` run against the PR head is the completed review only when the hosted job cannot run (app unavailable, quota exhausted, or one of the failure modes below); do not wait for a hosted reply that cannot arrive.

1. The Claude GitHub app must stay installed on this repository (`/install-github-app` in Claude Code) so `claude-code-action` can review PRs and respond to `@claude` mentions.
2. Configure the workflow trigger (opened and ready-for-review only, non-draft) and verify it covers the intended PR event; otherwise use the manual comment above.
3. Disable automatic Codex and Copilot reviews for this repository where configured, so providers do not duplicate or consume quota. Do not change broader account-level preferences without authorization.
4. Verify an actual completed Claude assessment on the latest PR head before relying on automation. Leave existing branch protections, CI checks and required approvals intact.

### Hosted review failure modes (false green)

The `claude-review` job can report `success` while no review exists. Two causes have been observed (runs 43490104081 and 43489370396, November 2026):

1. **Workflow-validation skip.** `claude-code-action` exchanges the job's OIDC token with an Anthropic endpoint that checks the workflow file against the default branch (`main`); the check runs server-side and its exact rule is not public. The action logs "Skipping action due to workflow validation" and exits green without retrying.
   * Expected: the PR's `claude-code-review.yml` differs from `main`. Workflow edits reach `main` only through a release (or a dedicated sync PR), so a PR that edits it, or any PR to `develop` while `develop` is ahead of `main` on that file, is unreviewed by the hosted job.
   * Intermittent: PR #734 hit the skip with the file identical on `main`, `develop` and the head; a re-run of the same job passed validation. Re-run the job before concluding anything.
2. **Silent no-op.** The earlier `code-review` plugin launched an async agent and the action ended the session first (anthropics/claude-code-action#1646), so most runs finished in about 10 seconds with no comment. The workflow now uses a plain prompt with background tasks disabled to avoid this (unverified until the first hosted run after it reaches `main`); if a hosted run again ends in a few turns without a `claude[bot]` comment, treat it as this mode.

The job's fallback step posts a "no assessment was recorded" comment and a warning annotation. It names the cause when the file differs from `main`, or when the action exited before running Claude despite matching files. Treat that comment as a missing review. The reliable path is a PR comment `@claude review the latest head against AGENTS.md and docs/code-review.md`: `claude.yml` runs from the default-branch workflow file for comment events, so it is not subject to the skip and does not depend on the PR's workflow edits. A local `/code-review --comment` run on the head also counts. A green `claude-review` check alone is never proof of review; look for a `claude[bot]` "Code review" comment.

These settings live outside the repository. Editing instructions does not enable or disable any service; check actual PR activity to verify access.

Repository-wide review rules live in [`AGENTS.md`](../AGENTS.md) (imported by `CLAUDE.md`), alongside shared workflow and architecture context. The review criteria above and session boundaries below remain applicable.

## Session and Sync Boundaries

- Read and mutate personal inventory only through an authenticated account or private guest session. Caller-supplied IDs and profile emails are not credentials.
- Preserve pending changes across failed HTTP responses, network failures, and reloads. Never replay one account's queue under another account, and ensure additive operations cannot duplicate data when retried.
- Check returned database errors before acknowledging cloud writes. Preserve cached child records when refreshing profile metadata.

## Component Tests and Accessibility

- New jsdom component tests use `tests/helpers/render.ts` (`renderUi`, `expectNoA11yViolations`) instead of repeating the `createRoot` and `act` boilerplate. The file still declares `// @vitest-environment jsdom`. Existing component tests are not migrated.
- Primitives and screens that gain interactive behavior need a keyboard and screen-reader check plus an axe check. `axe-core` is a dev dependency only; jsdom has no layout, so `color-contrast` is disabled in the helper and contrast is verified by the token contrast unit test (v2.0 M1).

## Design System Rules (v2.0)

- New and changed UI uses semantic token utilities and the primitives in `src/components/ui/` (see the [Design System wiki page](./wiki/Design-System.md)). Do not add raw palette classes such as `bg-slate-50` or `text-emerald-600`; `npm run design:palette` fails if a file's count grows, and the baseline only goes down.
- Do not edit `src/design/tokens.css` by hand: change `src/design/tokens.ts` and run `npm run design:tokens`. New text or control color pairs belong in the contrast pair lists so the unit test covers both themes.
- Control boundaries use `border-border-strong`, not the decorative `border-border`. Targets are at least 44px, focus is visible, and status is never conveyed by color alone.
- Modals use `Sheet` (focus trap, Escape, return focus) rather than ad hoc overlays. Theme and `data-ds` changes must not cause a flash or a hydration warning; keep the head script inline-safe for a future CSP (#666).
- The `/design` route is development-only and must stay out of production. Its guard is `designGuideEnabled` (`src/design/guide-access.ts`): it is served in development and in builds made with `E2E_DESIGN_GUIDE=1` (the browser-test builds), and never on Vercel production. Do not set `E2E_DESIGN_GUIDE` in a deployed environment, and keep the unit test that covers the guard passing.
