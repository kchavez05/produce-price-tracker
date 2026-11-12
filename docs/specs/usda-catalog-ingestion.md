# USDA catalog ingestion and cooking-ingredient standards

Status: Approved October 30, 2026. Standards version: 1. This specifies the ingestion and publication process to implement; it does not approve the current candidate pool, activate new ingredients, schedule a job, or change the application version.

## 1. Purpose and success criteria

PantryBot needs a useful, accurate cooking-ingredient catalog that can be refreshed regularly from USDA FoodData Central (FDC). A user answering “Do I have this?” should not have to understand nutrient research records or choose among many near-identical preparations.

The primary rule is **one understandable cooking choice per search result, with optional precision where it changes cooking behavior**. Source coverage and source-record counts are internal measures. Success means people find the ingredient they mean, can add it without extra details, and do not acquire inaccurate recipe matches.

This spec supplements the [Virtual Pantry specification](v1.6.0-virtual-pantry.md). Its family/variety presentation and one-way recipe compatibility require a separate implementation and review. Until that implementation ships, the current exact-ID matching contract remains in force. The existing [importer guide](../usda-pantry-catalog.md) documents today's discovery tool; it is not the publication policy.

“MUST” denotes a release requirement. “SHOULD” denotes the normal policy; an exception must record a reason and maintainer approval.

## 2. Scope and source policy

| Source | Role | Policy |
| --- | --- | --- |
| Foundation Foods | Preferred reference for basic cooking ingredients | Review for cooking relevance; do not publish every record or assume complete coverage. |
| SR Legacy | Fill generic ingredient and preparation gaps | Retain provenance and historical status; prefer an appropriate Foundation reference where both describe the same form. |
| FNDDS / survey foods | Supplemental research | Excluded from the initial generic ingest; prepared survey dishes do not become pantry ingredients automatically. |
| Branded Foods | Separate packaged-product lookup for v1.6.2 | Preserve products and barcodes separately from generic ingredients. No branded result enters the basic search list automatically. |
| Samples, acquisitions, experimental foods | Research evidence | Excluded from user-facing discovery unless a later spec explicitly approves a use. |
| Maintainer-curated ingredients | Cover legitimate source gaps and preserve existing ingredients | Require documented cooking rationale and reviewed identity; never fabricate a USDA reference. |

USDA currently publishes Foundation updates in April and October, Branded updates monthly, and the final SR Legacy release dates to April 2018. These are source characteristics, not a guarantee that every ingredient is covered. [USDA data-type documentation](https://fdc.nal.usda.gov/data-documentation/)

The generic pipeline MUST remain separate from USDA MARS pricing. FDC references do not provide current local grocery prices. Nutrition imports, portion conversions, dynamic prices, automated substitutions, inventory deductions, and a barcode scanner implementation are outside this spec. Barcode data boundaries are defined here so future ingestion does not pollute the generic catalog.

## 3. What qualifies as a cooking ingredient

Include a food that a home cook can reasonably buy or keep and use as an identifiable recipe ingredient. Processing alone is not a reason to exclude it: canned beans, broth, yogurt, tofu, bread, tortillas, oils, spices, and condiments can qualify.

Exclude by default:

- Finished mixed dishes and restaurant meals, including lentil soup and lentil curry presented as substitutes for lentils.
- Nutritional survey codes, research samples, acquisition lots, laboratory variants, and quality-control materials.
- Separate entries created only by analytical method, sampling date/location, added-salt treatment, or research-specific descriptions.
- Brand/package duplicates in generic ingredient search.

A prepared product regularly used as a recipe ingredient may receive a documented exception, such as condensed soup used in cooking. It must have its own clear identity and must not satisfy ownership of its individual components.

Categories and keyword rules are triage tools, not automatic approval or permanent rejection. An exclusion such as the current soup keyword rule MUST be overrideable through a recorded decision. Rejected/deferred records remain auditable and do not appear in normal search.

Catalog reviews SHOULD cover ingredients across cooking traditions, including legumes, grains, flours, vegetables, proteins, oils, spices, sauces, and condiments. USDA gaps must not force removal of an existing valid ingredient or prevent private custom entry.

## 4. Granularity and search presentation

Use these tests in order:

1. Does the distinction materially change preparation, cooking time, texture, recipe suitability, or a meaningful dietary property? Preserve it as an identity/form or optional specific variant.
2. Is it a detail a user may want to record without changing what ingredient they own? Keep it as optional context rather than another default result.
3. Is it only a source/analytical distinction? Keep it in provenance, not the pantry label.

| Example | Default presentation | Precision policy |
| --- | --- | --- |
| Lentils | Dried lentils; Canned lentils | Optional variety, such as red, green, brown, or black, where supported by reviewed catalog entries. Unspecified is allowed. |
| Beans | Named bean family and material form, such as Canned black beans; Dried black beans | Do not collapse bean species or dry/canned forms into one interchangeable identity. |
| Rice | A compact rice group with clear named choices | Basmati, jasmine, brown, and other cooking-relevant distinctions remain available; unspecified rice never establishes every variety. |
| Flour | Clear choices such as All-purpose wheat flour; Rice flour | Wheat, rice, and other cooking/dietary distinctions remain separate. |
| Lentils boiled with/without salt | No separate default results | Source preparations may support references; salt treatment alone does not create a cooking ingredient. |
| Sprouted/stir-fried lentils | Not in default “lentils” results | A reviewed cooking-relevant sprouted ingredient may be available through a specific query or optional choices; a finished stir-fried preparation is excluded by default. |

For the initial lentil experience, the generic query `lentils` MUST return the two primary choices above once their catalog entries are approved. Varieties MUST be collapsed behind optional choices. They MUST NOT be required to add an item. A specific query such as `red lentils` may surface the specific reviewed option directly, with its form visible.

Other broad queries SHOULD group related variants behind a clear family/form choice rather than show every source record. The initial result limit SHOULD remain 12; truncation is not a substitute for grouping. Representative broad-query tests MUST assert the intended primary results and the absence of prepared meals and analytical duplicates.

Labels MUST use ordinary cooking language. Preserve the original USDA description separately. Aliases may cover reviewed synonyms, spelling variants, and culinary names, such as chickpeas/garbanzo beans. Aliases MUST NOT imply substitution, collapse meaningful varieties, infer dietary guarantees, or silently map private custom names.

## 5. Logical identity and provenance model

The implementation must distinguish these concepts; it need not create a table for each concept.

| Concept | Required information |
| --- | --- |
| Ingredient family | Stable PantryBot family ID, cooking name, grouping/display policy |
| Cooking identity | Stable PantryBot ingredient ID, family, material form, specific variety or unspecified, label, aliases, lifecycle status |
| Source record | Data type, FDC ID, NDB number if supplied, original description/category, publication date, source-row fingerprint, snapshot reference |
| Source link | One or more source records linked to a cooking identity, purpose (identity evidence versus nutrition reference), review decision and rationale |
| Curation decision | Decision ID, affected records/identities, include/exclude/defer/group/link action, rule version, evidence/reason, approver, approval date |
| Published catalog | Catalog version, content hash, parent version, included approved decisions, application compatibility requirements, release/rollback manifest |

Existing PantryBot ingredient IDs MUST remain stable. Family grouping must not rename or replace `red-lentils-dried`, existing rice/flour IDs, or other inventory references. A specific optional variety can resolve to an existing specific ingredient ID; the design does not require storing a free-text variety as a new inventory field.

Multiple USDA records may support one cooking identity. One general USDA record does not justify assigning its nutrition values or exact identity to every specific variety. Grouping for display MUST NOT create recipe compatibility automatically.

**Shared general-reference clarification, authorized November 6, 2026:** when USDA does not distinguish whole/ground forms, the available matching generic record may be referenced by both separate cooking identities. Record `sourcePurpose: "general-reference"` in each reviewed USDA upsert; the artifact emits `purpose: "general-reference"` with the explicit matching `familyId`. Such a reference supports the family only and does not claim that USDA establishes the form, nutrition, price, recipe coverage, or substitution. Both forms retain their own IDs, labels, aliases, and Yes/No availability. Legacy identity links remain exclusive and keep their previous hashes/meaning. Shared links must use the same source key, fingerprint, purpose and family; mixed exact/general claims, cross-family reuse, or inconsistent fingerprints fail validation. Source withdrawal affects only that ingredient/reference pair. A changed shared source requires coordinated review of all linked forms before publication. Update curation tooling before reading artifacts with this new purpose; older tooling fails closed. Browser inventory/cache/queue contracts do not change, and provenance remains outside the runtime bundle.

FDC IDs identify source records, not permanent PantryBot identities. USDA documents that an updated record receives a new FDC ID, while an NDB number identifies a food in a specific form across Foundation/SR updates. NDB is a review/grouping aid; changed descriptions or forms still require examination. Preserve identifiers as strings, including leading zeros. [USDA identifier documentation](https://fdc.nal.usda.gov/help/)

## 6. Availability and recipe matching

Availability remains a user-selected boolean. Quantities, units, dates, USDA nutrition, and source refreshes MUST NOT infer, deduct, or modify availability. Optional varieties provide specificity, not automatic substitutions.

The future family model may add a **reviewed, directional compatibility rule** from a specific variant to a general requirement of the same form. It MUST NOT create the reverse rule or compatibility between forms. These rules are separate approved records, not consequences of aliases, text similarity, or a shared family ID.

| Inventory evidence | General dried-lentil requirement | Red dried-lentil requirement |
| --- | --- | --- |
| Red dried lentils Yes; general entry unrecorded | Covered only after approving that directional compatibility rule | Covered |
| Unspecified dried lentils Yes; red entry unrecorded | Covered | Not marked available |
| Canned lentils Yes | Not marked available | Not marked available |
| General dried lentils No; red dried lentils Yes | Not available: explicit No for the required identity takes precedence over derived coverage | Covered |
| Unspecified dried lentils Yes; red dried lentils No | Covered | Not available |

No is scoped to the exact recorded identity; it is not a family-wide deletion. Different specific varieties may coexist. An explicit No for a required identity MUST override a derived compatibility match for that identity. The interface must explain this case without silently changing either record. Tombstones must retain existing concurrency semantics and must not be resurrected by ingestion.

Coverage MUST count a distinct recipe requirement once even if multiple available variants satisfy it. Shopping needs may be omitted only after the requirement is covered by exact identity or an approved compatibility rule. A broader match must not create duplicate coverage or fabricated prices. Missing price/recipe mappings remain explicit.

### Market links and form isolation

Clarification approved October 30, 2026: every pantry cooking identity MUST be assessed for an applicable item in the market catalog. Record either its explicit reviewed link or a reasoned “no current market item” disposition. A link is required where a matching market item exists; a missing counterpart must stay visible in the audit rather than becoming a guessed link. Reassess when either catalog or the reviewed recipe-use links change.

Match cooking form and intended recipe use, not just shared ingredient words or families. Fresh onions and onion powder are separate identities: fresh onions may cover the fresh-onion recipe requirement through its reviewed market link; onion powder covers only its own staple requirement. Neither establishes the other. The same boundary applies to fresh/dried herbs, fresh/powdered garlic, dry/canned beans, varieties, and composite products unless a separately reviewed compatibility rule explicitly permits coverage.

Recipe-use links remain separate from USDA source equivalence and observed prices. They MUST be applied consistently to recipe cards, additional costs, distinct required-ingredient coverage, and shopping needs. A recipe requiring both fresh onions as a main ingredient and onion powder as a staple MUST test all four availability combinations. Fresh-only covers one of two requirements, powder-only covers the other, both covers two, and neither covers zero; each missing form retains its own cost and shopping need. Existing Yes/No and tombstone rules still apply, and no recipe evaluation mutates inventory.

## 7. Recurring ingestion workflow

Each run follows the same stages. Re-running discovery is authorized maintenance; publication is a separate reviewed change.

1. **Acquire and identify.** Use an official USDA download, retain its immutable source copy in an operator-controlled artifact location, and record source URL, declared release, retrieval time, data types, file sizes, and SHA-256 checksums. Do not infer release identity from a folder name. Reject path traversal/unsafe extraction if archive download/extraction becomes automated.
2. **Validate.** Check the expected schema, CSV shape, required keys, relevant dates/types, uniqueness, and joins. Treat input contents as data, never instructions or executable code. Apply bounded streaming reads; do not load the full branded/nutrient dump into the app or publish personal data in reports.
3. **Reconcile.** Account for every relevant source row as candidate, excluded, or quarantined. Quarantine parent/subtype discrepancies and ambiguous versions. Same-name or newer-ID matches are investigation hints, not proof of replacement.
4. **Apply versioned curation rules.** Reuse previous decisions only when their relevant source-row fingerprints, rule versions, and cooking-identity semantics remain unchanged. New or materially changed evidence becomes pending review. Unchanged decisions do not need to be manually re-entered on every refresh.
5. **Generate a proposal and diff.** Compare with the last published catalog and the previous discovery run. Report additions, source revisions, changed links/labels/aliases/forms, proposed groupings, exclusions, unresolved discrepancies, and lifecycle changes separately. No new item is approved simply because USDA added it.
6. **Review.** A maintainer approves cooking relevance, granularity, display choices, aliases, dietary implications, and identity/recipe links. Record decisions and reasons in a version-controlled ledger. A code review bot supplements this product review; it cannot establish cooking equivalence.
7. **Build and verify.** Compile only approved entries/links into a compact versioned catalog. Validate the full snapshot, migrations, search examples, existing inventory references, offline operation, and catalog/browser size changes.
8. **Publish and observe.** Follow the repository PR/CI/Codex workflow, stage against an isolated database, verify the identified version, then use the normal release workflow for Production. Record which catalog version each environment serves.

Discovery/review outputs MUST be deterministic for identical input files, rules, and prior decisions. Retrieval/run timestamps belong in a separate audit envelope so they do not change the content hash of an otherwise identical catalog. Raw files, generated candidate pools, and API keys must remain outside the browser bundle and Git history; keep compact reports, rules, decision ledgers, tests, and manifests in version control.

Unresolved rows may remain quarantined without blocking unrelated approved work only when they do not affect published identities or links and are listed as explicit maintainer-approved exceptions. Each exception must identify affected rows, reason, owner, and review date; it must be reconsidered for each source release. Missing parents, malformed required data, duplicate relevant IDs, unexplained count loss, or invalid approved links block publication. The October snapshot's 74 parent-only Foundation records do not become an implicit permanent allowlist.

## 8. Cadence, audit, and operating responsibility

| Activity | Standard |
| --- | --- |
| Check generic source releases | Monthly metadata check; prepare a proposal within 14 days of a newly detected Foundation release, normally April/October |
| SR Legacy | Reuse the approved fingerprinted snapshot; do not expect new releases, but detect changed download bytes |
| Rule/curation corrections | Run on demand and publish through the same diff/review gates |
| Branded refresh, once v1.6.2 exists | Monthly versioned refresh or cached server-side lookups; no automatic generic-catalog publication |
| Unresolved review items | Keep an owned backlog; revisit at the next source release or sooner if they affect a reported ingredient |

These are the approved operational standards. This document creates no recurring automation. The maintainer initiating a run owns its validation and report; the publishing maintainer owns the approval ledger, exceptions, deployment verification, and rollback readiness. The same person may perform both roles, with repository review gates still required.

Each run audit MUST record run ID, source manifest, importer/rule/decision-ledger versions, previous catalog version, outcome, row-count reconciliation, validation failures, reviewer decisions, and published version if any. Failures must leave the last approved catalog available and must never report a partial import as successfully published. Interrupted runs use a new output location or a verified resumable staging area; never overwrite human review work.

## 9. Update, deprecation, and rollback rules

- Source disappearance, a new FDC ID, or an excluded new source record MUST NOT delete a cooking identity or a user's inventory. Mark the source link for review and retain its history.
- A label/alias correction keeps the ingredient ID. A changed cooking meaning requires a new identity and explicit transition plan; do not silently reinterpret saved inventory.
- Retiring an identity may remove it from new-add search, but existing inventory must remain readable, editable, exportable, and valid for sync. Preserve the catalog row and defined recipe behavior. A retirement that would change coverage must be reviewed and visible.
- Consolidating duplicate identities MUST NOT silently merge Yes/No values, quantities, metadata, tombstones, or pending edits. Existing IDs remain valid until a separately reviewed migration defines collision and conflict behavior.
- A release artifact is immutable and has a unique catalog version/content hash. Activation must be atomic; use the last approved artifact on failure. A client must not save a new identity until its server-side catalog accepts it.
- Additive database IDs must be installed before clients publish references to them. Do not remove IDs during rollback. Older clients must preserve unfamiliar entries on reads/edits/exports and must never replace inventory with a filtered list.
- Rollback changes the active catalog artifact while retaining accepted identities, source history, review records, and user data. Test rollback after creating an entry with a newly introduced ID.
- Preview must use an isolated database for migration tests. A shared Preview/Production database is a blocking deployment condition for tests that could migrate account inventory or fence legacy writes.

## 10. Branded/API boundaries for v1.6.2

Keep the product record (brand, barcode, package, ingredients, market, source version) separate from its proposed generic cooking identity. Barcodes MUST be strings; preserve the original value and leading zeros. Any normalization must be explicitly validated, not a blanket numeric cast or padding rule. Account for multiple revisions and market-country differences; select a current applicable record using documented dates and retain history. Ties, invalid codes, missing products, and ambiguous mappings require a recoverable choice or custom entry.

A product's ingredient list MUST NOT mark each listed component as available. User confirmation of the proposed generic pantry match remains required. Cached source lookups must never mutate inventory without that action.

FDC's API requires a key and documents a default 1,000-request/hour/IP limit; recheck the current quota before implementation. Keep credentials server-side, honor rate-limit responses with bounded retries/backoff, retain the approved offline generic catalog, and never make a network/API key a prerequisite for basic pantry search. API responses go through the same provenance and mapping-review standards. [USDA API guide](https://fdc.nal.usda.gov/api-guide/)

## 11. Acceptance and release gates

Before the first curated catalog activates, and on each applicable subsequent refresh:

1. An identical snapshot/rules/decisions run reproduces identical catalog content and review diffs; source files and prior review work are unchanged.
2. Every relevant input row reconciles to a documented disposition. Parent-only records and source revisions are visible; unmatched IDs are never silently discarded.
3. Generic `lentils` shows only the approved dried/canned primary choices. Varieties are optional; `red lentils` can find a reviewed specific option. Lentil soup and USDA boiled-with/without-salt duplicates do not crowd the list.
4. Every pantry identity has a current market-link applicability audit; applicable links are installed and missing counterparts are explicit. Search fixtures cover rice varieties, canned/dry beans, wheat/rice flour, garlic, onions, broth, cumin, paprika, tahini, and reviewed aliases. Specific ingredient identities remain reachable when grouped.
5. Generic and specific recipe coverage follows the table in section 6, including explicit No precedence. Dry/canned forms and unrelated varieties never match by string similarity. Multiple matching entries count a requirement once.
6. Quantity zero, missing quantity, and past date do not change availability. Planning, cooking, saving recipes, source refresh, and catalog publication do not write pantry inventory.
7. Existing ingredient IDs, private custom items, pending mutations, tombstones, account isolation, exports/deletion, and old-client compatibility survive the update and rollback tests.
8. Public output includes only approved catalog records. No research samples, unreviewed candidates, private custom names, secrets, fabricated prices, or inferred dietary certifications enter it.
9. Diff reports separate source-row growth from user-visible choices; a maintainer reviews primary-result counts and bundle-size changes. A larger source dump alone cannot justify more search results.
10. The PR records product curation approval, exceptions, catalog/migration compatibility, local typecheck/lint/unit/smoke/build results, green CI/Preview, completed Codex review, isolated staging verification, and rollback evidence. Production also follows the release checklist and regression gate in `AGENTS.md`.

## 12. Implementation sequence and current gap

The current importer and [October review report](../research/usda-fdc-2026-10-29.md) provide discovery, basic triage, fingerprints, suggestions, and discrepancy reporting. Their 6,463 candidates are not an approved cooking catalog. The following work remains:

1. Establish the decision ledger, cooking relevance/granularity rules, and core search fixtures under these approved standards.
2. Extend discovery to replay unchanged decisions, report material diffs, and compile approved versioned artifacts.
3. Curate the initial cooking catalog, starting with Foundation-backed entries and targeted SR/curated gaps. Preserve existing IDs and explicitly approve aliases and source links.
4. Implement grouped search and optional varieties, the reviewed directional compatibility contract, and update/rollback compatibility tests. These are future behavior; do not enable them by documenting them.
5. Publish the reviewed generic catalog through the normal environment/release gates. Keep product/barcode lookup in v1.6.2. The November 12 [scope amendment](../research/v1.6.2-static-pricing-scope-amendment.md) defers new live store API pricing to separate multi-store work; MVP staple estimates remain static/unpriced.

Approval of this spec governs future runs; it does not automatically approve any candidate, source-to-ingredient mapping, or deployment.

## References

- [FoodData Central downloads and field documentation](https://fdc.nal.usda.gov/download-datasets/)
- [USDA data types and update frequency](https://fdc.nal.usda.gov/data-documentation/)
- [USDA identifiers, dates, and search concepts](https://fdc.nal.usda.gov/help/)
- [USDA API access, limits, and public-domain licensing](https://fdc.nal.usda.gov/api-guide/)
- [Current importer operations](../usda-pantry-catalog.md)
- [Virtual Pantry product contract](v1.6.0-virtual-pantry.md)
