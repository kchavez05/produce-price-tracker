# Retrospective release audit — November 11, 2026

Audit work: [#656](https://github.com/kchavez05/produce-price-tracker/issues/656). Scope: published releases v1.3.1–v1.6.1 that had no release milestone. Eight closed milestones now link the existing release PRs; no historical implementation tickets were recreated. Existing milestones and active v1.6.2 remain intact.

These are retrospective records created/closed November 11, not backdated milestones. Original publication dates appear below and in each milestone description; no original planned due date is invented. A closed retrospective milestone records an already-published release, **not certification that every historical gate passed**. Known gaps stay visible here and in follow-up #657.

## Method and limits

Compared the requirements in each tagged AGENTS.md and release notes with GitHub Releases/tags, package/lock/OpenAPI versions, release-PR check/review/comment/thread metadata, retained Vercel production deployment records, and published production receipts. The [machine-readable record](retrospective-audit-2026-11-11.json) retains commit IDs, timestamps and source links. Publication dates below use America/Denver; detailed evidence timestamps are UTC.

The Vercel connector returned 403. The CLI's existing credentials succeeded against the same explicitly scoped project/team, with project inspect confirming `prj_Wsdf9H7QLU5yggxDU1thOJt1KtAC` / `kchavez05-4094`. Only deployment metadata was read; no deployment, migration, configuration change or collection job was triggered. GitHub's deployments endpoint returned no records for these tag SHAs, so an empty GitHub response was not treated as evidence of missing deployments.

A Ready deployment proves build/readiness, not functional acceptance or scheduler execution. Missing retained proof is distinguished from demonstrated failure. Historical tests, OAuth flows and production functionality were not re-run or re-certified by this audit. Current tests validate this documentation/metadata-guard PR only. Current branch ancestry proves containment, not exactly when a historical develop sync occurred. The historical authorizations described in release records, including v1.6.0's approved direct-production verification exception, remain valid.

## Release index

| Release | Published (Denver date) | Closed milestone | Production release PR | Retained review evidence | Tagged versions |
| --- | --- | --- | --- | --- | --- |
| [v1.3.1](https://github.com/kchavez05/produce-price-tracker/releases/tag/v1.3.1) | 2026-10-19 | [#9](https://github.com/kchavez05/produce-price-tracker/milestone/9) | [#538](https://github.com/kchavez05/produce-price-tracker/pull/538) | Final-head completion not evidenced | Package/lock aligned; OpenAPI not introduced |
| [v1.4.0](https://github.com/kchavez05/produce-price-tracker/releases/tag/v1.4.0) | 2026-10-19 | [#10](https://github.com/kchavez05/produce-price-tracker/milestone/10) | [#543](https://github.com/kchavez05/produce-price-tracker/pull/543) | Review completed after merge | Lock still 1.3.1; package/OpenAPI 1.4.0 |
| [v1.4.1](https://github.com/kchavez05/produce-price-tracker/releases/tag/v1.4.1) | 2026-10-28 | [#11](https://github.com/kchavez05/produce-price-tracker/milestone/11) | [#561](https://github.com/kchavez05/produce-price-tracker/pull/561) | Final-head completion not evidenced | Package/lock/OpenAPI aligned |
| [v1.5.0](https://github.com/kchavez05/produce-price-tracker/releases/tag/v1.5.0) | 2026-10-28 | [#12](https://github.com/kchavez05/produce-price-tracker/milestone/12) | [#567](https://github.com/kchavez05/produce-price-tracker/pull/567) | Final-head completion before merge | Package/lock/OpenAPI aligned |
| [v1.5.1](https://github.com/kchavez05/produce-price-tracker/releases/tag/v1.5.1) | 2026-10-29 | [#13](https://github.com/kchavez05/produce-price-tracker/milestone/13) | [#572](https://github.com/kchavez05/produce-price-tracker/pull/572) | Final-head completion before merge | Package/lock/OpenAPI aligned |
| [v1.5.2](https://github.com/kchavez05/produce-price-tracker/releases/tag/v1.5.2) | 2026-10-29 | [#14](https://github.com/kchavez05/produce-price-tracker/milestone/14) | [#574](https://github.com/kchavez05/produce-price-tracker/pull/574) | Final-head completion before merge | Package/lock/OpenAPI aligned |
| [v1.6.0](https://github.com/kchavez05/produce-price-tracker/releases/tag/v1.6.0) | 2026-10-31 | [#15](https://github.com/kchavez05/produce-price-tracker/milestone/15) | [#591](https://github.com/kchavez05/produce-price-tracker/pull/591) | Final-head completion before merge | Package/lock/OpenAPI aligned |
| [v1.6.1](https://github.com/kchavez05/produce-price-tracker/releases/tag/v1.6.1) | 2026-11-08 | [#16](https://github.com/kchavez05/produce-price-tracker/milestone/16) | [#615](https://github.com/kchavez05/produce-price-tracker/pull/615) | Final-head completion before merge | Package/lock/OpenAPI aligned |

All eight release PRs retain successful CI Quality Gate completion before merge and successful Preview status. All eight tags have matching retained Ready production deployments. Seven tags equal their primary release merge; v1.6.1 intentionally tags the later reviewed production-record merge #620, described below.

## Findings and disposition

### Missing milestones — repaired

Created v1.3.1, v1.4.0, v1.4.1, v1.5.0, v1.5.1, v1.5.2, v1.6.0 and v1.6.1. Each description links publication, tag commit, release PR and this audit, with the retrospective caveat. Existing release PRs are assigned to those milestones; v1.6.1 also includes final-record PR #620. They remain useful historical release records without inventing a task history.

### v1.3.1

[PR #538](https://github.com/kchavez05/produce-price-tracker/pull/538) merged at 22:45:16Z on October 19. Gemini reviewed `db9870a`, but the merged head was `817561e`; the eight review threads are currently resolved and fix replies exist, while a completed assessment of the final head is not retained. Record this as a follow-up review evidence gap, not a claim that no review occurred. The then-current guide requested review after follow-up commits; today's explicit latest-head completion rule prevents that ambiguity.

The GitHub Release was published at 22:45:27Z. Its retained production deployment became Ready at 22:45:51.388Z, about 24 seconds later. Publication therefore preceded that deployment's readiness. The old checklist did not state a distinct post-deploy Ready/functional gate as clearly as the current feature specs do; this PR makes the ordering explicit in the shared checklist. README/CHANGELOG changed between v1.3.0 and v1.3.1, but ROADMAP/wiki did not, despite the broad release-doc checklist. The retrospective index now records the process release without rewriting its tag.

### v1.4.0

[PR #543](https://github.com/kchavez05/produce-price-tracker/pull/543) merged at 23:13:38Z and was published at 23:13:50Z on October 19. Its first completed Gemini review arrived at 23:17:35Z, after both merge and publication; the second arrived at 23:20:15Z. The review had been requested, but completion was not awaited. This is a demonstrated miss of the documented pre-merge review gate. The retained production deployment became Ready at 23:14:39.468Z, about 49 seconds after publication.

The tag's package.json/OpenAPI say 1.4.0, but package-lock.json top-level and root package metadata still say 1.3.1. This historical mismatch was corrected by v1.4.1. No tag is rewritten. A lockfile/package consistency assertion is now added alongside the existing OpenAPI/package assertions to prevent repetition.

Two duplicate export-loader comments remained unresolved. During this audit, the original tagged TypeScript spec loaded through plain `require` on the documented supported Node 22.22.2 runtime and exactly matched both tagged JSON exports. Both threads were replied to and resolved as not applicable to that runtime. This reproduction does not reconstruct the exact historical Node patch or repair the historical review timing. Sources: [first comment](https://github.com/kchavez05/produce-price-tracker/pull/543#discussion_r4319848586), [duplicate](https://github.com/kchavez05/produce-price-tracker/pull/543#discussion_r4319864849).

### v1.4.1

[PR #561](https://github.com/kchavez05/produce-price-tracker/pull/561) retains review of `ed31551`, while merged head `a9716e8` includes subsequent account/sync fixes and tests. Threads are currently resolved, but no completed final-head assessment is retained. Record the missing follow-up assessment; current latest-head gating now explicitly covers this case.

The published GitHub Release records production cycle/Flipp/cron-auth/durable-audit spot checks. The retained production deployment was Ready before publication. Repository notes still said publication was pending; that stale preparation wording is corrected and linked to the original publication. Lack of retained prior-week scheduler logs was explicitly acknowledged, not silently treated as successful scheduling.

Between v1.4.0 and v1.4.1, dependency PRs [#555](https://github.com/kchavez05/produce-price-tracker/pull/555) and [#557](https://github.com/kchavez05/produce-price-tracker/pull/557) targeted main directly from Dependabot branches, bypassing the documented develop → main release path. No exception is present in the retained records examined; earlier chat authorization cannot be reconstructed here. Current Dependabot configuration targets develop, addressing that routing problem.

### v1.5.0

[PR #567](https://github.com/kchavez05/produce-price-tracker/pull/567) has final-head completion for `7bb064d` before merge, resolved findings, aligned versions, and a Ready production deployment before publication. Two production records share the tag SHA; this audit uses the earliest matching Ready record, rather than treating a later rebuild as the first production deployment.

The runbook documents controlled source/database ingestion checks and duplicate safety, but the published record still instructs post-activation verification and says the next natural Wednesday run must be observed. A distinct retained post-merge functional/scheduler receipt was not located in the inspected release/PR/runbook sources. This is an evidence gap, not proof the migration or scheduler failed. Follow-up #657 owns authentic recovery/current observation.

### v1.5.1

[PR #572](https://github.com/kchavez05/produce-price-tracker/pull/572) has a final-head no-findings receipt for `ca27c99` before merge, even though the formal reviews array is empty. Codex completion comments are valid review evidence and must be inspected. Versions align, CI/Preview pass and production was Ready before publication.

Live archive/UI checks are documented, but the published verification section still lists post-merge production checks as future actions. An equivalent distinct post-merge functional receipt was not located. Preserve that uncertainty through #657 rather than declaring those checks passed retrospectively.

### v1.5.2

[PR #574](https://github.com/kchavez05/produce-price-tracker/pull/574) likewise has a final-head completion receipt for `0c95d5f` before merge, aligned versions and passing CI/Preview; production was Ready before publication. Published notes still describe migration/worker verification and the first natural scheduler execution as required future actions, without an equivalent retained post-merge receipt in the inspected sources. This remains #657's operational-evidence follow-up.

### v1.6.0

[PR #591](https://github.com/kchavez05/produce-price-tracker/pull/591) has final-head completion for `8567722` before merge, resolved findings, aligned versions and production Ready before publication. The [published release](https://github.com/kchavez05/produce-price-tracker/releases/tag/v1.6.0) appends detailed October 31 authenticated/second-client, guest/browser, migration/flag, runtime-error and cleanup verification. The repository preparation note alone lacks that final appendix, so it must not be read in isolation. The direct-production verification path was explicitly authorized and documented, not an unapproved staging bypass.

Deployment occurred October 30; GitHub publication was October 31. Those are distinct events, not a date inconsistency to erase. Milestone absence is repaired and the local notes now link the published final record. Speech was later explicitly resequenced to the [approved catalog-expansion scope](../specs/v1.6.1-pantry-catalog-expansion.md); it is not a silently missing v1.6.1 requirement.

### v1.6.1

[PR #615](https://github.com/kchavez05/produce-price-tracker/pull/615) has final-head completion for `3319fc1` before merge, resolved findings, aligned versions and retained production verification of 222 IDs, authenticated/second-client isolation/persistence, guest behavior and cleanup. The tag points to `3a542d8`, the subsequent production-record merge [#620](https://github.com/kchavez05/produce-price-tracker/pull/620). That PR also has passing pre-merge CI and completed final-head review (`c65c44c`); application/catalog/migration content matches the initially verified release commit. Its production deployment was Ready before publication. This tag/primary-merge difference is intentional and evidenced.

The [published record](https://github.com/kchavez05/produce-price-tracker/releases/tag/v1.6.1) explicitly limits what was repeated: it did not redo Google/Apple OAuth UI login or a physical browser offline switch, while unit/regression tests cover queue recovery. Those limits are retained. Earlier migration-readiness gaps were resolved before release; scope boundaries have explicit approval records.

## Follow-ups and current prevention

- **#657:** one cross-release operational-evidence investigation for v1.5.x post-merge records and natural USDA/active-market scheduling. It is Backlog without a release commitment, not a claim of a confirmed runtime defect or an automatic addition to v1.6.2.
- **Review discipline:** current AGENTS/PR workflow requires completed assessment of the intended head, resolved actionable findings and green checks before merge. Historical missing or late review cannot be repaired by backdating a new review.
- **Publication ordering:** this PR explicitly requires the exact production commit to be Ready, its version checked, and required production acceptance evidenced before publishing the GitHub Release/tag.
- **Version metadata:** the checklist and automated invariant cover package.json, both lockfile version fields and applicable OpenAPI exports.
- **Documentation drift:** release notes, ROADMAP and wiki now point to the retrospective index/milestones. Original tagged artifacts, published release bodies and approval packets remain unchanged.

Outside the requested published-release window, a `v1.0.0` tag and existing v1.0 milestone exist, but no GitHub Release is currently retrievable for that tag. This does not establish whether a release was never published or later removed, and the formal AGENTS workflow was introduced afterward. No replacement release is published as part of this bookkeeping task.
