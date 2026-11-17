# PantryBot (`produce-price-tracker`) — Agent Instructions & Git Workflow

## 1. Branching & Environment Architecture

Never commit or push directly to `main` or `develop`. All changes must flow through Pull Requests with passing CI and code review (Claude):

```
feature/* | fix/* | chore/* | docs/*
        │
        ▼  (PR + CI Quality Gate + Claude Code Review)
     develop   ──► Vercel Preview / Staging Environment
        │
        ▼  (Release PR + CI Quality Gate + Claude Code Review)
      main     ──► Vercel Production Environment (pantrybot.dev)
```

* **Working Branches (`feature/*`, `fix/*`, `chore/*`, `docs/*`)**: Always branch off the latest `develop`.
* **`develop` (Staging / Preview)**: Integration branch for upcoming features. Deployed automatically by Vercel to the preview environment.
* **`main` (Production / Release)**: Production branch backing [pantrybot.dev](https://pantrybot.dev). Updated only by merging `develop` into `main` via a Release PR.

---

## 2. Mandatory Development & PR Workflow

Whenever implementing a feature, bugfix, chore, or documentation update, follow these steps in order:

### Step 0: Locate the Tracked Work
Before feature, bug, research/decision or release implementation, find or create its GitHub issue, confirm an owner and acceptance criteria, assign the agreed release milestone (or Backlog), and add it to the [roadmap project](https://github.com/users/kchavez05/projects/1). Read the linked specification and existing decisions; do not infer approval from a board status. Planned releases need a milestone and release parent with linked work items before implementation starts. Use GitHub issue numbers, not a separate Ticket numbering scheme.

Follow [`docs/issue-release-tracking.md`](./docs/issue-release-tracking.md). Maintain issue evidence, blockers and next action plus project Status at task start, PR/decision review, develop merge, blocker changes and verified release. Routine internal docs/dependency maintenance can reference the relevant release tracker or explain a concrete maintenance exception in the PR; automated Dependabot PRs do not require one issue per package.

### Step 1: Create a Feature Branch from `develop`
```bash
git checkout develop
git pull origin develop
git checkout -b <type>/<short-description>
```
*(Use prefixes: `feature/`, `fix/`, `chore/`, or `docs/`.)*

### Step 2: Run Local Quality Checks Before Pushing
Before pushing a branch or opening a PR, verify all CI checks pass locally:
```bash
npm run typecheck
npm run lint
npm run test:unit       # Mandatory Tier 1 unit tests on feature branches
npm run test:smoke      # Mandatory Tier 2 smoke tests for PRs to develop
npm run test:regression # Mandatory Tier 3 regression tests for PRs to main
npm run build
```
Browser tests (Playwright, WebKit) are recommended locally and mandatory in CI: `npm run test:e2e:smoke` (Tier 2, runs on PRs to `develop`) and `npm run test:e2e:regression` (Tier 3, runs on PRs to `main` and on `develop` PRs labeled `run-tier3`; apply the label before pushing, because labeling alone does not retrigger CI). Install browsers once with `npx playwright install webkit chromium`. `npm run ci:local:browser` and `npm run ci:local:tier3` run `ci:local` plus the matching browser tier locally. Visual snapshot baselines are generated only by the `Visual Baselines` workflow on CI (label `update-visual-baselines`), never locally. See [`docs/wiki/Testing.md`](./docs/wiki/Testing.md).

### Step 3: Push & Open a Pull Request to `develop`
Push the branch to `origin` and open a PR targeting `develop`. Reference its issue/release parent and update the issue with the PR URL, remaining gates and In Review status:
```bash
git push -u origin <branch-name>
gh pr create --base develop --head <branch-name> --title "<title>" --body "<summary>"
```

### Step 4: CI Quality Gate & Claude Code Review
Every PR targeting `develop` must pass:
1. **GitHub Actions CI (`CI Quality Gate / Typecheck, Lint & Build`)**: Defined in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml).
2. **Vercel Preview Deployment**: Confirms the preview build succeeds.
3. **Claude Code Review**:
   * **Prerequisite:** the Claude GitHub app must be installed on the repo (`/install-github-app` from the `claude` CLI). If the hosted job cannot run (app unavailable, quota, or a skip/no-op failure mode described in `docs/code-review.md`, such as a PR that edits the review workflow), a local `/code-review --comment` run on the PR head counts as the completed review. A green `claude-review` check is not proof of review; look for a `claude[bot]` comment.
   * Review runs through the Claude GitHub app / `claude-code-action` (automatic or on an `@claude` mention) and/or a local `/code-review --comment` pass before merge. The automatic review runs once, on non-draft open or ready-for-review, not on every push; if it did not start or left only a "no assessment was recorded" fallback comment, re-run the job once (a stale fallback comment stays; ignore it if the re-run posts a review), then use the manual `@claude review` comment (the reliable path, since it runs from the default-branch workflow). See [`docs/code-review.md`](./docs/code-review.md).
   * Prefer the GitHub API/CLI for requesting reviews, monitoring checks, and inspecting comments. Request a review with a PR comment mentioning Claude (for example, `gh pr comment <number> --body '@claude review the latest head against AGENTS.md and docs/code-review.md'`). Check for an existing automatic review before requesting another. Wait for the completed opening review before merging, address its comments, then merge once CI is green without a second review round unless the fixes are substantial or the maintainer asks; a request or eyes reaction alone is not completion. Inspect both review submissions and bot completion comments, plus all inline threads.
   * Inspect all review comments (via the GitHub web UI, `gh pr view --comments`, or `gh api repos/{owner}/{repo}/pulls/<pr-number>/comments`) and fix all actionable P0/P1/P2 findings on the feature branch before merging.
   * After pushing fixes (or explaining why a suggestion is skipped), **reply to each review comment thread** with a brief summary/commit SHA and **mark the review thread as resolved**:
```bash
# 1. Reply to the inline review comment
gh api repos/{owner}/{repo}/pulls/<pr-number>/comments/<comment-id>/replies \
  -f body="Resolved in <commit-sha>: <brief explanation>"

# 2. Mark the review thread as resolved via GraphQL
gh api graphql -f query='
  mutation($threadId: ID!) {
    resolveReviewThread(input: {threadId: $threadId}) {
      thread { isResolved }
    }
  }' -f threadId="<PRRT_thread_id>"
```

### Step 5: Merge into `develop` & Clean Up
Once CI checks are green and Claude code review feedback is addressed:
* Merge the feature PR into `develop` (via the GitHub UI or `gh pr merge`).
* Record the PR/SHA and supported acceptance evidence on its issue. Public-feature issues stay open in **Awaiting release** until production acceptance passes; default-off or unverified work is not shipped. Internal research/process work can close when its explicit deliverable is accepted. Keep blocker/dependency and next-action information current. Closing keywords on PRs to `develop` do not maintain these issue states automatically.
* Switch back to `develop`, pull the latest changes, and delete the feature branch:
```bash
git checkout develop
git pull origin develop
git branch -d <branch-name>
git push origin --delete <branch-name>
```

### Step 6: Production Release Checklist (`develop` → `main`)
When cutting a release (`vX.Y.Z`) to production (`main`), complete every item in this checklist:

1. **Pre-Release Documentation & Version Bump (on `develop` via PR)**
   * [ ] Bump `"version": "X.Y.Z"` in [`package.json`](./package.json) and the top-level/root package metadata in [`package-lock.json`](./package-lock.json); keep applicable OpenAPI source/exports aligned.
   * [ ] Create detailed release notes in [`docs/releases/vX.Y.Z.md`](./docs/releases/).
   * [ ] Update [`CHANGELOG.md`](./CHANGELOG.md), [`ROADMAP.md`](./ROADMAP.md), [`README.md`](./README.md), and [`docs/wiki/`](./docs/wiki/) to reflect the new version and completed milestone tickets.
2. **Open & Verify the Release PR (`develop` → `main`)**
   * [ ] Open the Release PR targeting `main`:
```bash
gh pr create --base main --head develop --title "Release vX.Y.Z: <Milestone Title>" --body-file docs/releases/vX.Y.Z.md
```
   * [ ] Verify **CI Quality Gate (`Typecheck, Lint & Build`)** and **Vercel Preview** succeed.
   * [ ] Complete the one-round **Claude** review (see Step 4), fix all actionable P0/P1/P2 findings via a PR to `develop`, reply to every review comment with the fixing commit SHA, and mark all review threads as **Resolved**.
3. **Merge to `main` & Sync `develop`**
   * [ ] Merge the Release PR into `main` (triggering the production deployment to [pantrybot.dev](https://pantrybot.dev)).
   * [ ] Before publishing the GitHub Release/tag, verify the intended main commit has a **Ready production deployment**, confirm its live version and complete the required production acceptance checks. Attach dated evidence and explicit limits; a Preview build or pending deployment is not production verification. A failed/pending deployment or unmet production gate blocks publication.
   * [ ] Pull `main` and fast-forward `develop` if any merge/hotfix commits landed on `main`:
```bash
git checkout main && git pull origin main
git checkout develop && git pull origin develop
git merge --ff-only main && git push origin develop
```
4. **Publish the GitHub Release & Close Milestone**
   * [ ] Create and publish the official GitHub Release & tag on `main`:
```bash
gh release create vX.Y.Z --target main --title "vX.Y.Z — <Milestone Title>" --notes-file docs/releases/vX.Y.Z.md
git fetch --tags
```
   * [ ] Attach production verification and release/tag evidence, close feature issues whose acceptance passes, and mark them Done. Resolve any remaining committed scope through implementation or an explicit approved scope revision. Close the release parent and GitHub Milestone only after the release checklist and required outcomes are complete:
```bash
gh api repos/{owner}/{repo}/milestones/<milestone-number> -X PATCH -f state="closed"
```

---

## 3. Code Quality & Architecture Guardrails

Keep code aligned with [`docs/code-review.md`](./docs/code-review.md):
* **Zero-Key Offline Resilience**: The app must function 100% out-of-the-box without requiring `OPENAI_API_KEY`, `GEMINI_API_KEY`, `USDA_MARS_API_KEY`, or `KROGER_CLIENT_ID`. Always provide deterministic fallbacks.
* **AI provider selection (#731/#752, November 16, 2026)**: Provisional production models are `gpt-6.1-terra` for recipes and `gpt-transcribe` → `gpt-6-luna` for speech. Use application-owned adapters, bounded requests, durable reservations and no automatic retries or provider failover. The retained Gemini compatibility adapter uses `@google/genai` (`GoogleGenAI`); never introduce legacy `@google/generative-ai`. Selection does not waive billing/retention, hosted control or production acceptance gates.
* **Strict TypeScript & React Hooks**: Avoid `any`, guard against division-by-zero in unit price/arbitrage calculations, and avoid masking stale closures with `eslint-disable` in React hooks.


## 4. Code Review Rules

* Treat session identity and account ownership as security boundaries. Never trust caller-supplied user IDs as authentication or serve shared personal inventory. Guest mode must retain private ownership without requiring an API key.
* Check sync failures and retries for lost or duplicated data. A cloud error must not acknowledge a pending update; queued changes must remain bound to the account that created them.
* Preserve deterministic keyless behavior, price normalization guards, and authenticated access to server-funded AI generation. Follow the detailed review guide in `docs/code-review.md`.
