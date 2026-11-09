# PantryBot review instructions

Follow the repository workflow and architecture context in `AGENTS.md` and the review criteria in `docs/code-review.md`.

When reviewing changes:
- Prioritize actionable correctness, security, and data-loss findings. Explain the concrete failure scenario and affected code; identify severity when possible.
- Treat authenticated account and private guest-session ownership as security boundaries. Caller-supplied user IDs and profile emails are not authentication. Require authenticated access to server-funded AI generation.
- Preserve queued writes after cloud errors, keep queues bound to the account that created them, and check retry/idempotency behavior for lost or duplicated inventory. Check returned database errors before acknowledging writes.
- Preserve deterministic operation without optional API keys. Never expose server secrets in client bundles.
- Guard price normalization and arbitrage calculations against zero divisors, non-finite values, and mismatched units.
- Enforce strict TypeScript and React hook correctness. Flag unsafe `any`, stale closures hidden by lint suppression, hydration mismatches, and unawaited Next.js async route inputs.
- Use `@google/genai` with `gemini-2.5-flash`; do not introduce the legacy `@google/generative-ai` SDK.
- Keep PRs, CI checks, preview verification, completed latest-head review, and resolution of actionable review threads in the merge workflow.
