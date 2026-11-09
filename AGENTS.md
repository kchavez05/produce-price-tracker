# PantryBot (`produce-price-tracker`) — Agent Instructions & Git Workflow

## 1. Branching & Environment Architecture

Never commit or push directly to `main` or `develop`. All changes must flow through Pull Requests with passing CI and Copilot code review:

```
feature/* | fix/* | chore/* | docs/*
        │
        ▼  (PR + CI Quality Gate + GitHub Copilot Code Review)
     develop   ──► Vercel Preview / Staging Environment
        │
        ▼  (Release PR + CI Quality Gate + GitHub Copilot Code Review)
      main     ──► Vercel Production Environment (pantrybot.dev)
```

* **Working Branches (`feature/*`, `fix/*`, `chore/*`, `docs/*`)**: Always branch off the latest `develop`.
* **`develop` (Staging / Preview)**: Integration branch for upcoming features. Deployed automatically by Vercel to the preview environment.
* **`main` (Production / Release)**: Production branch backing [pantrybot.dev](https://pantrybot.dev). Updated only by merging `develop` into `main` via a Release PR.

---

## 2. Mandatory Development & PR Workflow

Whenever implementing a feature, bugfix, chore, or documentation update, follow these steps in order:

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

### Step 3: Push & Open a Pull Request to `develop`
Push the branch to `origin` and open a PR targeting `develop`:
```bash
git push -u origin <branch-name>
gh pr create --base develop --head <branch-name> --title "<title>" --body "<summary>"
```

### Step 4: CI Quality Gate & GitHub Copilot Code Review
Every PR targeting `develop` must pass:
1. **GitHub Actions CI (`CI Quality Gate / Typecheck, Lint & Build`)**: Defined in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml).
2. **Vercel Preview Deployment**: Confirms the preview build succeeds.
3. **GitHub Copilot Code Review**:
   * Configure automatic Copilot reviews for `develop` and `main`, including **Review new pushes**. If repository rulesets are unavailable under the current GitHub plan, enable account-level automatic reviews for eligible PR authors or request Copilot manually. See [`docs/code-review.md`](./docs/code-review.md) for setup and the plan limitation.
   * For manual reviews or re-reviews, use **Reviewers → Copilot → Request** on the PR. Wait for a completed review of the latest head before merging; a review request alone is not completion.
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
Once CI checks are green and Copilot code review feedback is addressed:
* Merge the feature PR into `develop` (via the GitHub UI or `gh pr merge`).
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
   * [ ] Bump `"version": "X.Y.Z"` in [`package.json`](./package.json).
   * [ ] Create detailed release notes in [`docs/releases/vX.Y.Z.md`](./docs/releases/).
   * [ ] Update [`CHANGELOG.md`](./CHANGELOG.md), [`ROADMAP.md`](./ROADMAP.md), [`README.md`](./README.md), and [`docs/wiki/`](./docs/wiki/) to reflect the new version and completed milestone tickets.
2. **Open & Verify the Release PR (`develop` → `main`)**
   * [ ] Open the Release PR targeting `main`:
```bash
gh pr create --base main --head develop --title "Release vX.Y.Z: <Milestone Title>" --body-file docs/releases/vX.Y.Z.md
```
   * [ ] Verify **CI Quality Gate (`Typecheck, Lint & Build`)** and **Vercel Preview** succeed.
   * [ ] Complete **Copilot** review of the latest head (request or re-request Copilot through the PR Reviewers menu if needed), fix all actionable P0/P1/P2 findings via a PR to `develop`, reply to every review comment with the fixing commit SHA, and mark all review threads as **Resolved**.
3. **Merge to `main` & Sync `develop`**
   * [ ] Merge the Release PR into `main` (triggering the production deployment to [pantrybot.dev](https://pantrybot.dev)).
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
   * [ ] Verify all milestone issues are closed and close the GitHub Milestone:
```bash
gh api repos/{owner}/{repo}/milestones/<milestone-number> -X PATCH -f state="closed"
```

---

## 3. Code Quality & Architecture Guardrails

Keep code aligned with [`docs/code-review.md`](./docs/code-review.md):
* **Zero-Key Offline Resilience**: The app must function 100% out-of-the-box without requiring `GEMINI_API_KEY`, `USDA_MARS_API_KEY`, or `KROGER_CLIENT_ID`. Always provide deterministic fallbacks.
* **Gemini SDK**: Use `@google/genai` (`GoogleGenAI`) with `gemini-2.5-flash`. Never use the legacy `@google/generative-ai` package.
* **Strict TypeScript & React Hooks**: Avoid `any`, guard against division-by-zero in unit price/arbitrage calculations, and avoid masking stale closures with `eslint-disable` in React hooks.


## 4. Code Review Focus

* Treat session identity and account ownership as security boundaries. Never trust caller-supplied user IDs as authentication or serve shared personal inventory. Guest mode must retain private ownership without requiring an API key.
* Check sync failures and retries for lost or duplicated data. A cloud error must not acknowledge a pending update; queued changes must remain bound to the account that created them.
* Preserve deterministic keyless behavior, price normalization guards, and authenticated access to server-funded AI generation. Follow the detailed review guide in `docs/code-review.md`.
