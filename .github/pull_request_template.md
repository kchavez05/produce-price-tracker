## Summary
<!-- Briefly describe what this PR changes and why -->

## Tracking
- Related issue(s): Refs #<!-- issue number -->
- Release milestone / parent (or documented maintenance exception):
- Approved specification / decision record:
- Remaining activation or production-verification gates:
<!-- Public-feature issues stay open after develop merges. Update their evidence, next action and Status explicitly; closing keywords on develop PRs do not provide this lifecycle. -->

## Target Environment
- [ ] `develop` (Preview / Staging)
- [ ] `main` (Production — `pantrybot.dev`)

## Quality Checklist
- [ ] Tracked issue/project status, acceptance evidence and next action updated (or maintenance exception documented)
- [ ] `npm run typecheck` passes (`tsc --noEmit`)
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds without errors
- [ ] Graceful fallback verified when optional API keys are omitted
- [ ] Codex review completed for the latest head; all actionable review threads replied to and marked Resolved

## Release Checklist *(Only for `develop` → `main` Release PRs)*
- [ ] Version aligned in `package.json`, lockfile top-level/root metadata and applicable OpenAPI exports
- [ ] Release notes added in `docs/releases/vX.Y.Z.md`
- [ ] `CHANGELOG.md`, `ROADMAP.md`, `README.md`, and `docs/wiki/` updated
- [ ] Before GitHub publication: Exact production commit is Ready, live version confirmed and required production acceptance evidenced
- [ ] Post-merge: Attach production acceptance evidence and close verified feature issues/release parent before milestone closure
- [ ] Post-merge: Publish GitHub Release (`gh release create vX.Y.Z --target main --notes-file docs/releases/vX.Y.Z.md`) and close GitHub Milestone
