@AGENTS.md

# Claude Code notes

`AGENTS.md` is the single source of truth for branching, checks, PR workflow, and architecture rules; do not restate them here. Claude-specific notes only:

- Do not edit historical provenance in `catalog/` ledgers/manifests (e.g. "approval in Codex chat"); they are an audit trail.
- Run `/code-review` before requesting hosted review.
- `.claude/settings.json` blocks pushes to `main`/`develop` as a guardrail, not a substitute for following the PR workflow.
