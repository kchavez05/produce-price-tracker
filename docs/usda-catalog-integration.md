# Cooking catalog integration

The app now compiles reviewed catalog `2026-11-06.3`: 138 accepted identities across the initial catalog, the 29-addition legumes/grains/flours batch, ten-addition vegetables/aromatics batch, 23-addition staples/proteins batch, and four distinct spice forms with shared general USDA references. Eleven existing identities received provenance updates. The single approved red dried → general dried compatibility rule is unchanged. Catalog `2026-10-30.1` remains the exact prior 72-identity rollback view. The feature remains behind `PANTRYBOT_PANTRY_ENABLED`; this implementation does not enable hosted environments or apply hosted migrations.

## Runtime behavior

Search offers Canned lentils and Dried lentils as the primary results for `lentils`. Red lentils is an optional variety and remains directly searchable. Rice flour appears in flour-qualified search. Existing IDs, prices, custom entries, quantities, dates, and tombstones are retained. The new lentils/onions entries remain unpriced as approved; AI and shopping costs must show missing-price uncertainty.

Availability is resolved from explicit Yes/No entries once, before converting to recipe IDs. Only the reviewed one-hop edge derives coverage. Explicit No for general dried lentils wins over red lentils Yes. General cannot establish red, and canned cannot establish dried. Shopping and recipe evaluation consume that resolved set without deriving coverage again. Search grouping never grants coverage, and planning/buying/cooking does not write inventory.

`src/data/cooking-catalog.json` contains only the compact approved runtime projection. `npm run catalog:build` generates it from the reviewed release; `npm run catalog:build -- --check` verifies it in CI. Source pools, source links, audit records, and approval metadata are excluded from that projection. The frozen 69-item catalog remains the rollback reference.

## Storage and compatibility

GET `/api/pantry` supplies `catalogVersion` and `acceptedCatalogIds`. The latter is read from the authenticated database catalog for cloud accounts, not inferred from the client bundle. Missing metadata or an uninstalled ID blocks creating a new reference, including guest imports, before a mutation is queued. Existing entries remain editable. Cloud query failures retain pending edits and do not acknowledge writes. Private local guests can use the bundled accepted IDs without a key or connection.

Cache and queue readers preserve well-formed unfamiliar catalog IDs instead of filtering or converting them to custom names. Their details, tombstones, revisions, and owner binding survive reload. Unfamiliar IDs confer no recipe coverage. The editor retains the current unfamiliar ID; cloud SQL validates it against the durable accepted-ID registry, so queued edits from a newer client can still replay after presentation rollback. SQLite also retains an additive accepted-ID registry and checks it within the mutation transaction, preserving already-owned unfamiliar identities as a legacy fallback. Receipt lookup precedes this fallback check, so lost acknowledgments remain idempotent. New arbitrary unknown IDs are rejected.

Clients from before this compatibility implementation may refuse a newer snapshot. Their original bytes remain preserved, but they must reload to a compatibility-capable build. Do not roll back to those builds after activating new identities.

## Deployment order

1. Keep `PANTRYBOT_PANTRY_ENABLED=false` on hosted environments while staging. Use an isolated database, never the shared Preview/Production database, for migration/inventory tests.
2. Install the existing pantry persistence/staple migrations, then `20261030173404_reviewed_cooking_catalog.sql`. The new migration only inserts three accepted IDs with `ON CONFLICT DO NOTHING`; it changes no grants, policies, account rows, or inventory.
3. Deploy this compatibility-capable application with `NEXT_PUBLIC_PANTRYBOT_CATALOG_VERSION=baseline-1.5.2` for the compatibility phase. This build-time setting presents the prior 69-item catalog and disables derived edges while retaining all accepted IDs for reads, edits, and sync. Allow old tabs to reload before activation.
4. In isolated staging, verify installed IDs, owner isolation, a save/reload/retry of a new ID, custom entries, old pending edits, tombstones, exports/deletion, search, explicit No, and rollback. Existing database/RLS and client suites cover these contracts.
5. Build with `NEXT_PUBLIC_PANTRYBOT_CATALOG_VERSION=2026-10-30.1` (the default), then enable the pantry through the normal reviewed release workflow. Record the served version and environment-specific verification in release evidence. This is separate from approving ingredient identities.

## Rollback

Build the same compatibility-capable code with `NEXT_PUBLIC_PANTRYBOT_CATALOG_VERSION=baseline-1.5.2`. This hides the three additions from new-add search and removes derived edges. It retains accepted IDs and their exact saved-recipe behavior, so new entries remain readable, editable, exportable, and syncable. Never delete catalog rows, rewrite inventory identities, clear pending queues, or restore a database backup as a presentation rollback. A rollback to code predating forward-compatible readers is unsupported after activation.

The PGlite suite applies the SQL in an isolated database, saves a new lentil entry, reapplies the additive migration, and edits the entry while preserving other inventory. Client tests cover unfamiliar IDs, owner-bound pending queues, server rejection/retry, exports, and guest reload. The rollback view is compared with the frozen baseline. Hosted staging and Production activation remain release operations; no shared hosted database was changed by this implementation.

## Recipe-use links to market-priced cards

A cooking identity and a market pricing category can have different IDs. Their reviewed recipe-use relationships are recorded separately in `catalog/recipe-use-links.json`; the build checks approval payload hashes, referenced IDs, and conflicting links, then emits only the compact mappings plus their hash. The original USDA catalog artifact remains immutable.

The maintainer's October 30 request explicitly links `onions-fresh` to recipes priced using `yellow-white-onions`. Pantry Onions Yes covers that general fresh cooking-onion requirement, zeroes its additional slot cost, and omits it from shopping. No/deletion restores purchase needs. Onion powder, private custom text, and other grouped market categories do not gain a match. This recipe-use link makes no claim about onion variety, nutrition, or the USDA/market source identities and creates no new price.

Recipe selection, saved-recipe repricing, coverage, shopping, and explicit availability controls use the same link. Coverage counts the normalized cooking requirement once; market aliases do not inflate the number of pantry identities. Available ingredient cards retain recipe quantities under “Make sure you have” and display $0.00. Quantity zero and dates never change explicit Yes/No, and recipe evaluation does not mutate inventory.

The market-link applicability audit covers every current pantry identity and is checked by `catalog:build` in CI. It fingerprints the pantry artifact, market IDs/names/units/matching rules, and reviewed recipe-use links. New batches and market additions require re-audit; a valid “no current market item” classification does not infer any substitute or price. Fresh onions as a market-priced ingredient and onion powder as a staple are tested together for neither/fresh-only/powder-only/both ownership, including their separate costs and shopping needs.

## v1.6.1 first expansion batch

The maintainer explicitly approved all 35 unchanged payloads on October 31, 2026. See the [batch review](research/v1.6.1-legumes-grains-flours-review.md), [reviewed artifact](../catalog/releases/2026-10-31.1/catalog.json), and [manifest](../catalog/releases/2026-10-31.1/manifest.json). The earlier deployment steps describe initial v1.6.0 activation; existing installations do not repeat that rollout.

For this expansion, install `20261031143749_pantry_legumes_grains_flours.sql` after the existing pantry migrations. It inserts only the 29 newly accepted IDs, idempotently, and changes no grants, RLS policies, user rows, or inventory. Clients query the installed registry and refuse to queue a new account identity until acceptance is present. Private local guest use requires no provider key.

The reviewed runtime has 101 identities, 39 USDA identity source links (38 distinct ingredients), unchanged fixed estimates, no new prices, and no new recipe compatibility. The full market audit has 15 explicit links and 86 no-current-counterpart dispositions. Rice-flour variants are optional and cannot establish general rice-flour availability without a separately reviewed compatibility edge. Broad grain queries exclude flour variants.

Before rollout, verify migration/reapply, a new-ID write and idempotent retry, guest reload, account isolation, existing inventory preservation, export/deletion, and client readiness. The isolated PGlite suite tests a new ID being rejected before migration and accepted afterward without acknowledging the earlier rejected attempt. The SQLite smoke suite exercises quantity-free guest save/reopen/retry and a fresh private session. UI tests cover database readiness and optional flour variants.

Use `NEXT_PUBLIC_PANTRYBOT_CATALOG_VERSION=2026-10-31.1` (default) to present the expansion. Build the same compatibility-capable code with `NEXT_PUBLIC_PANTRYBOT_CATALOG_VERSION=2026-10-30.1` to restore the exact previous 72 ingredients and compatibility edges. The original `baseline-1.5.2` view remains available. Both rollback paths retain all 101 accepted IDs for existing entries, queues, edits, and exports; never delete registry IDs or restore old inventory data as presentation rollback.

This implementation does not apply hosted migrations, enable a feature flag, publish v1.6.1, approve the 42 follow-up research choices, or schedule ingestion. Complete the required release and environment verification before hosted activation.

## v1.6.1 vegetable and aromatic batch

The maintainer approved the [15 exact payloads](research/v1.6.1-vegetables-aromatics-review.md) on November 6, 2026. Catalog `2026-11-06.1` has 111 ingredients, 54 USDA identity source links across 53 identities, unchanged prices and recipe compatibility, and a full market audit of 15 linked identities plus 96 with no current counterpart.

Install `20261106155015_pantry_vegetables_aromatics.sql` after `20261031143749_pantry_legumes_grains_flours.sql`. It only inserts the ten new accepted IDs with idempotent conflict handling. It changes no grants, policies, user inventory, or authentication. Clients must continue checking installed acceptance before queueing a new account reference; local guests use the bundled registry. No hosted database is changed by preparing the migration.

For the second-batch build, the default runtime view was `2026-11-06.1`; the current default is described below. Build the same compatibility-capable code with `NEXT_PUBLIC_PANTRYBOT_CATALOG_VERSION=2026-10-31.1` for the exact 101-identity view, or `2026-10-30.1` for the exact 72-identity view. The original baseline remains supported. Retain all 111 accepted IDs and owned inventory during either rollback, including pending edits and exports.

Verify pre-migration rejection and post-migration acceptance, preserved existing inventory/details, idempotent reapply/retry, fresh-herb search/readiness, owner isolation, exports/deletion, and both retained views before hosted rollout. Source evidence and search aliases do not create recipe compatibility: cilantro leaves cannot establish coriander seed, and spearmint cannot establish peppermint. Missing prices remain explicit. Complete CI, Preview, Codex review, environment verification, and the release workflow before production activation.

## v1.6.1 staples/proteins batch

The maintainer explicitly approved all [23 exact payloads](research/v1.6.1-staples-proteins-review.md), including the source-specific granulated-sugar/brown-sugar/honey overrides and yogurt-qualified search, on November 6, 2026. Reviewed catalog `2026-11-06.2` contains 134 ingredients, 77 source links across 76 identities, unchanged prices/compatibility, and a full market audit of 15 links plus 119 no-current-counterpart dispositions. Discovery exclusions and the separate Foundation quarantine hold are preserved; these three approved upserts are not a global filter override.

Install `20261106161943_pantry_staples_proteins.sql` after the existing pantry migrations and both earlier expansion migrations. It inserts only the 23 new accepted IDs with idempotent conflict handling, changing no grants, policies, account rows, or inventory. Existing readiness checks refuse to queue account references before acceptance. Private keyless guests use the bundled registry.

The default runtime view is now `2026-11-06.2`. The exact `2026-11-06.1` (111), `2026-10-31.1` (101), `2026-10-30.1` (72), and original baseline views remain supported through `NEXT_PUBLIC_PANTRYBOT_CATALOG_VERSION`. Retain all 134 server IDs, owned inventory, pending edits, and export/recovery data on presentation rollback. Never delete accepted rows or restore old inventory snapshots as a UI rollback.

Verify pre-migration rejection and same-ID post-migration retry for all three sweeteners and yogurt, repeated migration, preserved inventory/details, owner isolation, anonymous/direct-write denial, export/deletion, keyless disk persistence, yogurt discovery/readiness, exact milk/yogurt and ground/fresh-ginger coverage, and all retained views. Missing prices remain explicit, while marked-available requirements have zero additional grocery cost. Complete local checks, CI, Preview, Codex review and hosted release verification before activation. No hosted migration or production activation is performed by this implementation.

## v1.6.1 shared USDA spice references

The maintainer authorized whole/ground coriander and cardamom to use available generic USDA records when form is unspecified. See the [recorded directive](research/v1.6.1-shared-spice-references.md) and ingestion-standard clarification. Catalog `2026-11-06.3` has 138 identities, 77 exclusive identity links and four explicit family-scoped general references to two additional USDA rows. General references do not establish form, nutrition, price or recipe coverage; all previous identities and compatibility remain intact.

Install `20261106170650_pantry_spice_forms.sql` after prior migrations. It only inserts the four new accepted IDs. Account readiness, owner isolation, idempotency and explicit guest import remain unchanged. The current default is `2026-11-06.3`; exact 134-/111-/101-/72-identity views and the baseline remain available through `NEXT_PUBLIC_PANTRYBOT_CATALOG_VERSION`. Retain all 138 IDs, inventory and pending data on rollback.

Use updated curation tooling for artifacts containing `general-reference`; older tooling fails closed. A shared source change requires coordinated approvals for all linked forms. No hosted migration or production activation is performed by this implementation. Complete environment verification and the release workflow separately.
