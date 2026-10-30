# Initial cooking catalog integration

The app uses reviewed catalog `2026-10-30.1`: 72 accepted identities, three new choices, and the single approved red dried → general dried compatibility rule. The feature remains behind `PANTRYBOT_PANTRY_ENABLED`; this implementation does not enable hosted environments or apply hosted migrations.

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
