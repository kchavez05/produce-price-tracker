# Issue and release tracking

Use the [roadmap project](https://github.com/users/kchavez05/projects/1) for work status and GitHub milestones for release scope. Start with the [current-release board](https://github.com/users/kchavez05/projects/1/views/2), [v1.7.0 milestone](https://github.com/kchavez05/produce-price-tracker/milestone/19), and [release tracker #748](https://github.com/kchavez05/produce-price-tracker/issues/748).

## What belongs where

- **Issues:** outcome, acceptance criteria, owner, target release or Backlog, current status, dependencies/blockers, next action and evidence. Use GitHub issue numbers as identifiers; do not invent a second Ticket numbering scheme.
- **Project:** a view of those issues through the workflow below. Add issues explicitly when working through the API/CLI.
- **Milestone:** committed scope for one release. Create it and a release parent before starting a planned release. Link manageable work items as sub-issues. Several PRs can implement one issue.
- **Specifications and immutable decision records:** detailed approved behavior and decisions. Link them from issues; changing a board status does not change approval or scope.
- **ROADMAP:** release goals and links to the tracker/specification. **Release notes:** what actually shipped and verification evidence. Keep detailed task progress on issues instead of maintaining parallel checklists in roadmap prose.

The existing v0.2–v1.3 milestones and 31 completed project items remain historical evidence. Restore current planning without recreating every task from v1.4–v1.6.1. Older `phase:v...` labels are historical; use the Milestone field for new release assignments.

## Before implementation

Search for an existing issue before creating another. Features, bugs, research/decision work and releases require an issue with an owner and acceptance criteria before implementation. Capture a new request in Backlog if its release is undecided. Routine internal documentation/dependency maintenance can reference the relevant release tracker or state a concrete maintenance exception in its PR. Automated Dependabot PRs do not require a separate issue for each package bump.

Choose the release milestone only when scope is committed, add the issue to the roadmap project, and link its release parent/dependencies. Scope that is still awaiting approval stays Backlog or Blocked with the missing decision named. Existing accepted decisions remain accepted; external provider facts and permissions need their own evidence.

The issue forms cover work items, bugs and decisions. Their `projects` field adds issues for users with project write access; it does not guarantee addition for other submitters or API-created issues. Agents must verify membership and Status after creation. GitHub uses issue-form and PR-template defaults from the default branch; new defaults become selectable when these files reach `main` through the release workflow. Until then, API/CLI-created bodies follow the same structure.

## Status and closure

| Status | Meaning / next action |
| --- | --- |
| Backlog | Unscheduled or needs triage; identify scope and release before starting. |
| Ready | Scope is approved and implementation prerequisites permit work. |
| In Progress | Work is active; record the current branch or activity. |
| In Review | A PR or decision deliverable is being reviewed; link it and the remaining gate. |
| Blocked | Name the exact unmet prerequisite, responsible party and next action. Keep the issue open. |
| Awaiting release | Implementation is merged to `develop`; production acceptance remains. Keep the issue open and list activation/verification gates. |
| Done | The issue's acceptance criteria are met and evidence is linked. Public-feature issues require production acceptance; internal research/process issues can finish when their accepted deliverable is complete. |

A `develop` merge is not proof of production availability. A default-off feature, pending migration, provider permission, artifact delivery or physical-device check must remain visible in its issue and release parent. Release parents and milestones stay open until required outcomes, production verification and release publication are complete, or an explicit scope revision is approved and recorded.

Do not use issue closure as shorthand for "the agent stopped" or "a PR exists." If an issue is reopened, reassess its acceptance and return it to the appropriate non-Done status. Only mark an acceptance checkbox complete when linked evidence supports it.

## Task-boundary updates

1. **Start:** inspect the issue/specification/decisions, confirm owner and scope, and set In Progress. Record the immediate next action.
2. **PR or decision review:** reference the issue in the PR and add the PR URL/evidence to the issue. Set In Review and identify remaining checks or decisions. Use the [PR template](../.github/pull_request_template.md).
3. **Develop merge:** record the merged PR/SHA and completed acceptance items. Public-feature work moves to Awaiting release; retain pending activation and verification items. Internal work can close if its explicit criteria are complete.
4. **Blocker or scope change:** update the issue and release parent promptly, set Blocked and add the `blocked` label. Record who/what can unblock it; do not silently replace committed scope. When unblocked, remove the label and restore the appropriate status.
5. **Verified release:** first verify a Ready production deployment for the exact intended commit, its live version and required production acceptance; only then publish the GitHub Release/tag. Attach production evidence and release/tag links, complete supported criteria, close completed feature issues and set Done. Close the parent and milestone after the release checklist is complete. Preserve historical items.

Use `Refs #<issue>` and explicit PR URLs for traceability. Closing keywords in PR descriptions are interpreted only for PRs targeting the default branch (`main` here), not `develop`. They also cannot prove post-deploy acceptance. Prefer explicit closure after verification; do not depend on `Fixes #...` to maintain staging issues. [GitHub linkage behavior](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue).

Provide a short user update with issue/PR links, what completed, what remains and the next action. The same facts belong on the issue so a new chat can resume from GitHub without reconstructing earlier chats.

## Views and initial v1.6.2 work

The project retains All issues, Current release (board filtered to milestone `v1.6.2`), Backlog (open issues without a milestone) and Blocked (open issues with Blocked Status). Change the current-release filter when starting the next release. Status is authoritative; the `blocked` label helps issue-list discovery and should agree with it. Project/milestone progress is work-item progress, not a claim that a partially implemented release has shipped.

| Issue | Work at restoration |
| --- | --- |
| [#645](https://github.com/kchavez05/produce-price-tracker/issues/645) | Release parent; required outcomes and maintenance PRs |
| [#646](https://github.com/kchavez05/produce-price-tracker/issues/646) | Typed barcode lookup/confirmation: Awaiting release, #642 merged |
| [#647](https://github.com/kchavez05/produce-price-tracker/issues/647) | Camera capture: Ready, iPhone Safari and Android Chrome |
| [#648](https://github.com/kchavez05/produce-price-tracker/issues/648) | Pinned artifact deployment/shared abuse controls: Ready |
| [#649](https://github.com/kchavez05/produce-price-tracker/issues/649) | Real device/account verification: Blocked on #647/#648 |
| [#650](https://github.com/kchavez05/produce-price-tracker/issues/650) | Shared pricing evaluator/UI: Awaiting release, #628/#630 merged |
| [#651](https://github.com/kchavez05/produce-price-tracker/issues/651) | Provider semantics/use/retention: external blocker |
| [#652](https://github.com/kchavez05/produce-price-tracker/issues/652) | Real adapter/coverage: Blocked on #651 |
| [#653](https://github.com/kchavez05/produce-price-tracker/issues/653) | Production verification and publication: Backlog until prerequisites pass |
| [#654](https://github.com/kchavez05/produce-price-tracker/issues/654) | Tracking restoration: internal process deliverable |

This table records the initial migration, not a second live status list. Read the issues/project for current status. Issues #544, #545, #546 and #621 entered Backlog without a milestone; their original reports and attachments remain intact. They are not added to v1.6.2. BQ-01–04 and PQ-01–08 approvals are linked from the work items; the historical proposal artifacts remain unchanged.

## API/CLI operation

Prefer GitHub API/CLI over repeated browser inspection. Examples:

```bash
# Locate committed work and inspect its live criteria/evidence.
gh issue list --repo kchavez05/produce-price-tracker --milestone v1.6.2 --state open
gh issue view 647 --repo kchavez05/produce-price-tracker

# API-created issues need explicit project membership.
gh project item-add 1 --owner kchavez05 --url https://github.com/kchavez05/produce-price-tracker/issues/647

# Read live item/field/option IDs rather than guessing or caching replaced options.
gh project item-list 1 --owner kchavez05 --limit 100 --format json
gh project field-list 1 --owner kchavez05 --format json

# Use the IDs returned above to update Status.
gh project item-edit --id <ITEM_ID> --project-id <PROJECT_ID> \
  --field-id <STATUS_FIELD_ID> --single-select-option-id <OPTION_ID>

# Maintain evidence, blockers and the next action with a structured body file.
gh issue edit 647 --repo kchavez05/produce-price-tracker --body-file /path/to/reviewed-issue-body.md
```

Re-read the issue before replacing its body to preserve concurrent edits, comments and original evidence. Project membership, field updates and milestone assignment are separate operations: verify each. API access errors are not successful updates; preserve completed work and report a concrete missing permission if blocked. Keep routine monitoring output compact.

Status automation: [`project-status.yml`](../.github/workflows/project-status.yml) calls [`.github/scripts/set-project-status.sh`](../.github/scripts/set-project-status.sh) using the repo secret `PROJECT_STATUS_TOKEN` (a classic PAT that includes the `project` scope; `GITHUB_TOKEN` cannot write user projects). Without the secret every job skips. It sets:

- **In Review** when a non-draft PR to `develop` is opened, reopened or marked ready, for each issue named by `Refs/Fixes/Closes/Resolves #N` in the PR body (one keyword per issue: `Refs #1, #2` updates only #1).
- **Awaiting release** when such a PR merges, only if the body has a line `Project-Status: Awaiting release`. Without it Status is left alone, because one issue often spans several PRs.
- **Done** when an issue labeled `release-tracking` is closed. Public-feature issues are never completed automatically.

Not automated: Ready, In Progress, Blocked (including blocker changes) and Done after production verification. Set those explicitly. Locally: `.github/scripts/set-project-status.sh <issue> "<Status>" [--dry-run]`; the workflow's `workflow_dispatch` runs the same script (dry-run by default). GitHub's built-in project workflows may also move Status on close or merge; check the project's Workflows page, since this repo cannot read what they set. Do not rely on the built-ins for the transitions above.

## Ready for the next feature

Before beginning #647, confirm the tracking PR is merged and #654 is complete, inspect the camera issue and approved packet, then set #647 In Progress and record the new branch. Implementing this planning workflow does not start camera work or activate barcode/live pricing.
