@AGENTS.md

# Claude Code notes

- `AGENTS.md` is the single source of truth for branching, PR workflow, and review rules; this file only adds Claude-specific notes.
- Never commit or push to `main` or `develop`; branch from the latest `develop` (`feature/`, `fix/`, `chore/`, `docs/`) and open PRs with `gh pr create --base develop`.
- Before pushing, run: `npm run typecheck`, `npm run lint`, `npm run test:unit`, `npm run test:smoke`, `npm run build` (plus `npm run test:regression` for PRs to `main`, and `npm run catalog:build -- --check` when touching `catalog/`).
- Keep the app fully functional with no API keys (`GEMINI_API_KEY`, `USDA_MARS_API_KEY`, `KROGER_CLIENT_ID`); always provide deterministic fallbacks.
- Use `@google/genai` with `gemini-2.5-flash`; never `@google/generative-ai`.
- Do not edit historical provenance in `catalog/` ledgers/manifests (e.g. "approval in Codex chat"); they are an audit trail.
- Use `/code-review` before requesting hosted review; mark review threads resolved only after replying with the fixing commit.
