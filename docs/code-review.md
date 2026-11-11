# PantryBot (produce-price-tracker) Code Review Style Guide

## Stack & Architecture
- **Framework:** Next.js 15 (App Router), React 19, TypeScript 5.8 (strict mode), Tailwind CSS v4.
- **Zero-Key Offline Resilience:** The application must work 100% out-of-the-box without requiring API keys (`GEMINI_API_KEY`, `USDA_MARS_API_KEY`, `KROGER_CLIENT_ID`). Any live API integration must gracefully fall back to deterministic local baselines or cached feeds.
- **Gemini SDK:** Always use `@google/genai` (`GoogleGenAI`) and current models (`gemini-2.5-flash`). Never introduce the deprecated `@google/generative-ai` package.

## Review Focus Areas
1. **Type Safety:** Flag `any` types, unsafe type assertions, or unhandled `null`/`undefined` edge cases in price normalization (`$/lb`, `$/oz`, `$/ea`) and grocery item parsing.
2. **Security & Secrets:** Ensure API keys are never exposed in client-rendered bundles unless explicitly user-supplied via `localStorage` in the client modal. Server-side environment variables must stay inside Route Handlers (`src/app/api/**`) or server modules.
3. **Price & Arbitrage Math:** Verify division-by-zero guards when computing unit prices, wholesale club comparisons, and Virtual Freezer `$0.00` protein substitutions.
4. **React 19 & Next.js 15 Patterns:** Ensure client components declare `'use client'`, avoid hydration mismatches when reading `localStorage`, and properly await async `params`/`searchParams` in Next.js 15 route handlers or pages.

## Review Workflow

Use Codex Code Review for PRs targeting `develop` and `main`. The maintainer restored this provider on November 11, 2026, after Copilot review quota was exhausted. Existing Copilot findings still need resolution; changing providers does not waive any finding. Wait for a completed Codex assessment of the latest head, address actionable P0/P1/P2 findings (or equivalent severity), reply with the fixing commit or a reason for skipping a suggestion, and resolve each thread before merging. A request alone is not a completed review. Keep the existing CI, Vercel Preview, release gates, and separately required approvals.

Prefer the GitHub connector or `gh`/REST API for review requests, CI/Preview monitoring, comments and thread resolution. Codex is requested through a PR comment, rather than the Copilot reviewer API:

```bash
# After pushing the intended head, first check whether an automatic review started.
# If none has started, request one review through the GitHub API/CLI.
gh pr comment <pr-number> --repo <owner>/<repo> --body '@codex review'
```

Inspect Codex bot activity (normally `chatgpt-codex-connector[bot]`), submitted reviews, completion comments and inline threads. A successful comment API response or eyes reaction only confirms submission/acknowledgment. Require an explicit completed assessment for the current head; inspect review commit IDs or completion permalinks and timing against the head. If a comment's head association is unclear, do not infer completion. Missing access, quota errors and setup prompts are not reviews. After follow-up commits, wait for an automatic latest-head review or request one if none started; avoid duplicate requests while a review is active.

Keep monitoring output compact: use `gh pr checks`, or query `headRefOid`, review author/state/commit, and check name/status/conclusion with `gh pr view --json ... --jq ...`. Store routine watch output locally or suppress unchanged results; fetch full logs or comment bodies only when a failure or finding needs investigation. Inspect unresolved threads before merging. API monitoring does not relax any review, CI, Preview, or release gate.

### Automatic review setup

1. Keep this GitHub repository connected to Codex. Enable code review for it in Codex settings.
2. Configure **Automatic review** and **Review trigger** under the applicable repository/personal preferences. Verify the configured trigger covers the intended PR event; otherwise use the manual comment above.
3. Disable automatic Copilot reviews for this repository where configured, so both providers do not consume review quota. Account-level Copilot preferences may affect other repositories; do not change those broader settings without authorization.
4. Verify an actual completed Codex assessment on the latest PR head before relying on automation. Leave existing branch protections, CI checks and required approvals intact.

These settings live outside the repository. Editing instructions does not enable or disable either service. The maintainer handles re-enabling Codex in settings; check actual PR activity to verify access.

Repository-wide Codex review rules live in [`AGENTS.md`](../AGENTS.md), alongside shared workflow and architecture context. The review criteria above and session boundaries below remain applicable.

See the official [Codex GitHub review documentation](https://learn.chatgpt.com/docs/third-party/github) for setup, the `@codex review` trigger, automatic reviews and `AGENTS.md` rules.

## Session and Sync Boundaries

- Read and mutate personal inventory only through an authenticated account or private guest session. Caller-supplied IDs and profile emails are not credentials.
- Preserve pending changes across failed HTTP responses, network failures, and reloads. Never replay one account's queue under another account, and ensure additive operations cannot duplicate data when retried.
- Check returned database errors before acknowledging cloud writes. Preserve cached child records when refreshing profile metadata.
