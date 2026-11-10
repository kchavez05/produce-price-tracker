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

Use GitHub Copilot Code Review for PRs targeting `develop` and `main`. Wait for a completed review of the latest head, address actionable P0/P1/P2 findings (or equivalent severity), reply with the fixing commit or a reason for skipping a suggestion, and resolve each thread before merging. A review request alone is not a completed review. Keep the existing CI, Vercel Preview, and release gates.

Prefer the GitHub connector or `gh`/REST API for review requests, re-reviews, CI/Preview monitoring, comments and thread resolution. Request the reviewer login `copilot-pull-request-reviewer[bot]`; `Copilot` is the display name and is not a reliable reviewer identifier for this operation. The API path was verified against PR #628 on November 9, 2026. Use the browser's **Reviewers → Copilot → Request** only if API access is unavailable or the request fails. [GitHub documents REST support](https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/copilot-code-review).

```bash
# Request or re-request Copilot after pushing the intended head.
gh api repos/{owner}/{repo}/pulls/{pr-number}/requested_reviewers \
  --method POST -f 'reviewers[]=copilot-pull-request-reviewer[bot]' --silent
```

Verify a new `review_requested` event in the issue timeline or a completed Copilot review. Do not rely solely on HTTP success or the requested-reviewer list, which may omit Copilot. After follow-up commits, request a re-review unless automatic review of new pushes is enabled. Keep the PR open if Copilot reports missing access, quota, or setup; a missing review is not approval. Copilot comments are not, by default, approving reviews; preserve any separately configured required approvals.

Keep monitoring output compact: use `gh pr checks`, or query `headRefOid`, review author/state/commit, and check name/status/conclusion with `gh pr view --json ... --jq ...`. Store routine watch output locally or suppress unchanged results; fetch full logs or comment bodies only when a failure or finding needs investigation. Verify the completed review's commit matches the current head and inspect unresolved threads before merging. API monitoring does not relax any review, CI, Preview, or release gate.

### Automatic review setup

1. With repository admin access, create or edit an active branch ruleset targeting `develop` and `main`. Enable **Automatically request Copilot code review** and **Review new pushes**. Leave existing protections and required checks intact.
2. If GitHub blocks rulesets for this private repository under the current plan, eligible PR authors can enable **Automatic Copilot code review** and **Review new pushes** in their personal Copilot code-review settings. This is account-wide and applies to their eligible PRs in other repositories as well; it is not repository-wide enforcement. Otherwise request Copilot manually on each PR and after every push.
3. Verify a completed Copilot review on a PR before relying on automation. Copilot code-review access is required; organization policies may also apply.
4. Disable automatic Codex reviews for this repository in Codex settings to finish the provider switch. Do not uninstall the GitHub integration or remove repository access needed for other Codex work.

These settings are configured outside the repository; editing these instructions does not enable or disable either service. Verify the live settings and a completed review rather than assuming this documentation enforces automation.

Repository-wide Copilot guidance lives in [`.github/copilot-instructions.md`](../.github/copilot-instructions.md), with shared workflow and architecture context in [`AGENTS.md`](../AGENTS.md).

See GitHub's [configuration guide](https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/configure-code-review) and [manual review and re-review guide](https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/copilot-code-review).

## Session and Sync Boundaries

- Read and mutate personal inventory only through an authenticated account or private guest session. Caller-supplied IDs and profile emails are not credentials.
- Preserve pending changes across failed HTTP responses, network failures, and reloads. Never replay one account's queue under another account, and ensure additive operations cannot duplicate data when retried.
- Check returned database errors before acknowledging cloud writes. Preserve cached child records when refreshing profile metadata.
