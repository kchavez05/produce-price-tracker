# Cooking catalog curation

This directory implements the decision/replay stage of the [approved ingestion standards](../docs/specs/usda-catalog-ingestion.md). It is separate from the active application catalog.

- `baseline-1.5.2.json` freezes the existing 69 PantryBot ingredient IDs, labels, aliases, fixed estimates, and recipe mappings. It is an inherited app baseline, not a claim that USDA or a maintainer approved new source links.
- `curation-ledger.json` contains 60 approved decisions: the initial ten ingredient/grouping/hold decisions, the October 31 batch of 29 additions plus six provenance updates, and the November 6 batch of ten additions plus five provenance updates. Every approval records its exact payload hash; earlier IDs and approval history remain intact.
- `releases/2026-10-30.1/` retains the approved 72-identity artifact, compact validation/activation manifest, and separate run audit. It remains the exact prior catalog view for rollback. The app consumes a compact projection of `releases/2026-11-06.1/`; provenance and approval records stay outside the browser bundle. See the [integration and rollout guide](../docs/usda-catalog-integration.md).
- `market-link-audit.json` classifies all 111 identities: 15 linked and 96 with no current market counterpart. The build rejects a stale catalog/link fingerprint, an omitted or duplicate identity, or an applicable link missing from the compiled mappings. Re-audit when pantry identities, market item names/units/matching rules, or approved links change.
- `recipe-use-links.json` records separately approved links from market-priced recipe requirements to pantry cooking identities. It does not alter USDA identity evidence or prices. The build verifies reviewed payload hashes and emits compact links separately from the immutable catalog artifact.
- `core-search-fixtures.json` describes the intended compact search results. These fixtures are checked separately against the unapproved preview and the approved artifact. Passing preview searches cannot authorize unapproved ingredients.

## Generate and inspect a proposal

First run discovery using a new output directory; current discovery emits `source-records.json` alongside its existing review files. Every relevant Foundation/SR row has a stable source key, a content fingerprint, and a candidate/excluded/quarantined disposition. The source release date is explicit.

```bash
npm run catalog:fdc -- \
  --input /path/to/extracted/USDA/download \
  --output data/fdc-catalog-review/source-2026-10-29 \
  --release 2026-10-29

npm run catalog:curate -- \
  --review data/fdc-catalog-review/source-2026-10-29 \
  --ledger catalog/curation-ledger.json \
  --previous catalog/releases/2026-11-06.1/catalog.json \
  --output data/fdc-catalog-review/curation-NEXT-RUN \
  --version NEXT-REVIEW-VERSION \
  --fixtures catalog/core-search-fixtures.json
```

Before product approval, the initial real-data run exited **2**, as expected: the 74 quarantined Foundation records had no approved exception, and the approved baseline did not yet pass the new lentil/rice/onion search expectations. Its preview passed all 12 fixtures. After the maintainer approved all ten payloads, the reviewed run exited **0**, with 72 approved identities, zero pending decisions, and all 12 fixtures passing in both preview and approved artifacts. The release-scoped quarantine exception is now approved through April 30, 2027; a source/rules change or expired deadline requires re-review. The command writes review artifacts even when publication is blocked; it never publishes anything. Exit 1 means invalid input or an I/O error; exit 0 means the curation checks passed for staging, with deployment/compatibility gates still required.

Output files:

- `catalog.json`: inherited content plus only unchanged, reviewed approvals. Proposed/stale edits cannot replace existing ingredients or appear here.
- `preview-catalog.json`: explicitly marked `UNAPPROVED_PREVIEW`; includes valid proposals solely for product review. Never import it into the app.
- `report.json` and `report.md`: replay states, evidence/exception blockers, source and catalog diffs, and both preview/approved search checks.
- `audit.json`: unique run/timestamp envelope, source manifest/hash, ledger hash/version, rules version, parent catalog, report hash, counts, and staged/blocked outcome. It always records `published: false`. Fatal validation errors emit a structured failure envelope on stderr; capture it in operator logs.

Outputs must be new directories separate from input files/directories, including symlink aliases. Review work is never intentionally overwritten. Timestamps/run IDs are excluded from deterministic catalog/report content. Artifact writes are staged; invalid inputs leave the previous artifact and source data untouched.

## Record a product review

A maintainer must review each proposed payload, including source equivalence, labels, grouping, forms/varieties, existing identity preservation, aliases, recipe implications, and estimates. Approval of the standards is not approval of these individual choices. Do not invent reviewer names or approve proposals just to make checks pass.

Inspect exact proposed payload hashes with:

```bash
npm run catalog:curate -- --ledger catalog/curation-ledger.json --decision-hashes
```

After the maintainer explicitly approves a payload, record `status: "approved"` and `review: {by, date, payloadSha256}` using that reviewer, the actual approval date, and the reviewed hash. The hash excludes status/review metadata and covers the entire decision payload. This is a change-detection safeguard, not a cryptographic proof of a human signature; protected repository review supplies the authority.

Append a new consecutive revision for corrections. Never edit or remove an already published approval. New revisions can upsert an identity, exclude/defer source evidence, add compatibility, or explicitly remove compatibility. A changed existing family/form/variety requires a new identity/transition plan, not a silent reinterpretation. A full curated upsert explicitly replaces prior source links; source history remains in previous artifacts and ledger revisions.

Quarantine deferrals require approved source-row hashes, source release, an accountable owner, and a review-by date. They expire at that deadline and must be renewed for a new source release even if row bytes are unchanged. They cannot justify an active source link to quarantined evidence. The initial hold was explicitly approved under the Catalog maintainer role through April 30, 2027 for release 2026-10-29. It must be reconsidered for the next source release.

## Repeat a source refresh

Supply the last approved `catalog.json` as `--previous` and the preceding discovery directory as `--previous-review`. The report distinguishes new/modified/missing source rows from changes in user-facing identities. Identical relevant rows/rules replay approvals; changed/missing evidence becomes `needs_review`. Previously accepted IDs remain present. Unresolved active links and unapproved quarantines block publication. A new source record or name similarity never establishes a replacement.

Use a unique catalog version for changed content or approval history. Repeating the same version is allowed only for the identical artifact. Retired entries remain accepted identities while new-add search hides them. Additive database migrations, old-client/queue compatibility, isolated staging, rollout, and rollback verification remain required before activating any new IDs.

## Implementation boundary

The app now uses the reviewed catalog through its generated runtime projection. Grouped search, optional varieties, directional coverage, installed-ID readiness checks, and forward-compatible storage are integrated behind the existing pantry feature gate. See the [integration guide](../docs/usda-catalog-integration.md) for migration order, baseline presentation rollback, and verification. This tooling still does not apply hosted migrations, change Preview/Production flags, or schedule recurring work.

## v1.6.1 expansion proposals

The [first batch review](../docs/research/v1.6.1-legumes-grains-flours-review.md) records explicit October 31 approval of 29 additions and six existing-ingredient provenance updates. `proposals/2026-10-31-legumes-grains-flours/` retains the complete replay ledger (including unchanged earlier approvals), exact new decision hashes, 36 source-evidence rows, 56 search expectations, and a validation record. Every new decision remains proposed in that frozen historical package; the active ledger records the exact approved payloads. The evidence subset is not a full discovery input; replay uses the complete retained checksum-matching source snapshot and a new output directory. See the review for the exact command and expected exit 2.

`proposals/2026-10-31-follow-up-triage.json` records 42 research choices and candidate-description comparisons for all 74 held Foundation rows. It is research, not a curation ledger or replacement source. Neither proposals nor triage are runtime imports. The reviewed `releases/2026-10-31.1/` artifact now compiles 101 identities with no pending decisions. The build consumes that artifact, audits all 101 identities (15 linked, 86 no-current-counterpart), and retains the prior 72-identity view for rollback. Install `20261031143749_pantry_legumes_grains_flours.sql` before account clients can save the additions. Hosted verification and repository release gates remain.

The [vegetable/aromatic review](../docs/research/v1.6.1-vegetables-aromatics-review.md) records November 6 approval of ten additions and five provenance updates. `proposals/2026-11-06-vegetables-aromatics/` freezes the original 15 proposed payloads, hashes, evidence, and 72 search checks. The active ledger and `releases/2026-11-06.1/` record the approved 111-identity artifact. The build now consumes this artifact, audits all 111 entries, and retains exact 101- and 72-identity views. Install `20261106155015_pantry_vegetables_aromatics.sql` after the first expansion migration before account clients can save the ten additions. Hosted rollout remains pending; the other 32 research choices remain unapproved.

The [staples/proteins review](../docs/research/v1.6.1-staples-proteins-review.md) presents 23 proposed additions (13 oils/spices/condiments/sweeteners and ten protein/dairy/nut/seed choices). `proposals/2026-11-06-staples-proteins/` retains all 60 prior approvals plus the 23 proposed payloads, exact hashes, 23 source rows, and 123 search expectations. Sugar/honey overrides are explicit rationales for their selected excluded rows; discovery dispositions and rules remain intact. The active 111-identity ledger, artifact, runtime, prices, market links, and compatibility remain unchanged pending exact review and integration. Nine other shortlisted choices retain their separate granularity or market-mapping work.
