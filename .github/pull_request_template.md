## Summary
<!-- Briefly describe what this PR changes and why -->

## Target Environment
- [ ] `develop` (Preview / Staging)
- [ ] `main` (Production — `pantrybot.dev`)

## Quality Checklist
- [ ] `npm run typecheck` passes (`tsc --noEmit`)
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds without errors
- [ ] Graceful fallback verified when optional API keys are omitted
- [ ] Copilot review completed; all actionable review threads replied to and marked Resolved

## Release Checklist *(Only for `develop` → `main` Release PRs)*
- [ ] Version bumped in `package.json`
- [ ] Release notes added in `docs/releases/vX.Y.Z.md`
- [ ] `CHANGELOG.md`, `ROADMAP.md`, `README.md`, and `docs/wiki/` updated
- [ ] Post-merge: Publish GitHub Release (`gh release create vX.Y.Z --target main --notes-file docs/releases/vX.Y.Z.md`) and close GitHub Milestone
