# USDA weekly ingestion and Supabase market history

## Runtime

`GET /api/cron/usda-ingest` runs Wednesday at 13:00 UTC (7 AM MDT / 6 AM MST). It requires the existing cron bearer secret and accepts no URL parameters. Enable it with server-only `USDA_INGEST_ENABLED=true` after applying the migration and validating reports. Loading dashboards, creating recipes, Friday digests, public previews and ordinary manual refreshes never call USDA, even during a cloud outage.

The scheduler makes one shared batch, independent of visitors and ZIP codes. Its limits are 20 USDA requests, a 90-second upstream budget, sequential report retrieval, at most two retries for transport/429/5xx, and a 120-second function limit. An upstream row limit or incomplete selected section fails closed; these validated reports fit in single responses, so no speculative pagination is attempted. Duplicate schedules do not re-fetch. Failed/crashed runs require explicit operator recovery; there is no automatic Thursday or Friday polling.

The five authenticated report identities were confirmed October 28, 2026:

| Slug | Retail report | Selected fields | Compatible sample rows |
| --- | --- | --- | --- |
| 3324 | Weekly Grocery Store Specialty Crops Feature Activity | Report Details; wtd_avg_price, size, store_count | 56 |
| 3228 | Weekly Grocery Store Beef Feature Activity | Report Details; price_avg, price_unit, store_count | 10 |
| 2868 | Weekly Grocery Store Pork Feature Activity | Report Details; price_avg, price_unit, store_count | 6 |
| 2756 | Weekly Grocery Store Chicken Feature Activity | Report Details; price_avg, price_unit, store_count | 6 |
| 2995 | Weekly Grocery Store Dairy Feature Activity | Report Details; wtd_avg_price, package, store_count | 11 distinct rows |

These samples have no Mountain region. Only National/NATIONAL rows are applied, explicitly labeled national retail benchmarks. Do not relabel Northwest/Southwest as Mountain. Prefer an actual compatible Mountain series if one is added later. Exact commodity/cut/variety mappings exclude organic or antibiotic-free premiums and prepared meat; fixed package weights convert to dollars per pound. Ambiguous package ranges and each-sized produce are excluded. Within a compatible series, store counts weight the mean. Feature-rate/wholesale statistics are preserved in raw reports but are not invented from these retail-price averages.

All latest samples covered a period ending October 23 and were published Friday. **Schedule decision:** retain the approved Wednesday-only batch and use the latest available release, usually the preceding Friday. Source date age uses the America/Denver application calendar. The API's publication clock has no timezone offset: it is stored as `timestamp without time zone` for within-report revision ordering, with the original string preserved, rather than asserting a false UTC publication instant. Fetch/check timestamps are UTC.

Definitions and review evidence live in `config/usda/*.json`. Small source excerpts in `tests/fixtures/usda` preserve actual source rows and identify themselves as excerpts; adjusted counts make these bounded test fixtures self-contained. Production validation always uses the complete response and its real section statistics. Full original validation responses were retrieved into private temporary files, not committed.

## Storage and publication

Apply both market-data migrations: `20261028162458_usda_market_history.sql` and `20261028180338_usda_revision_acceptance.sql` from `supabase/migrations/`. All new tables have RLS and no browser-role grants. Server-only invoker functions claim work, publish a report transactionally, finish a run, and read bounded history. Raw reports, observations, publication selections and catalog changes are versioned. Lease IDs fence stale workers; unfinished or malformed reports cannot replace a complete selection. Conflicting content with an equal/older publication clock is quarantined rather than guessed to be newer. Replays of already accepted revisions are unchanged checks, not new conflicts. An append-only acceptance ledger lets explicit backfill admit an older quarantined version for historical reads without modifying its raw classification or moving the active publication. Backfill never moves active publication backward.

Dashboard reads use stored publications. Per-ingredient provenance includes region, report period, normalized unit, selected version, fetched time and last checked time. `current` is within the report's seven-day cadence plus two-day grace; `stale` is still usable through fourteen days after source-period end. Older or unavailable values use explicitly labeled static baselines. `usdaLive` remains a compatibility boolean for usable stored coverage; `usda.status` and provenance describe freshness.

Supabase is the production source of truth for shared six-week market history. Recorded grocery syncs archive current Flipp/Kroger offers; normal page views do not write price history. Immutable offer revisions and separate retrieval receipts distinguish repeated checks from price changes, including a price returning to an earlier value. Six-week reads choose the most recently retrieved revision of each offer and then the best observed price per ingredient/store/week. USDA source-period history is independent of retrieval weeks. Missing store or USDA observations are null, never copied from another source. Fewer than six observed local weeks cannot establish a verified six-week floor. Static wholesale scenarios are confined to keyless local demonstration mode.

`marketHistory.storage` reports cloud/local/unavailable; `archiveStorage` reports an attempted archive. A failed cloud archive returns 503 on recorded sync and is safe to retry. Local SQLite writes never acknowledge a successful cloud archive. SQLite remains available for private guests and offline demonstration history, explicitly marked synthetic. A configured cloud outage does not promote synthetic rows into verified history.

No automatic deletion is configured. At validation, the five complete formatted responses totaled roughly 5 MB (about 3 MB compact JSON) and yielded 89 distinct compatible normalized rows. Expect approximately 12–20 MB of raw logical JSON and 356–445 normalized rows per month before compression, plus offers/receipts/catalog audits and any backfill. Actual storage depends on source changes and retries. Review actual database growth 30 days after enablement; changing retention or paid infrastructure requires a decision.

## Operator commands

Set credentials securely in ignored `.env.local`; never pass keys on the command line. `npm run market:admin` loads that file locally. Production secrets belong in Vercel production, never NEXT_PUBLIC variables. The CLI does not print raw payloads or credentials.

```bash
# Inspect source catalog / sample, saving a private local response.
npm run market:admin -- discover --out /tmp/usda-catalog.json
npm run market:admin -- discover --slug 2756 --out /tmp/usda-2756.json

# Re-fetch and validate a reviewed definition, then enable that catalog entry.
npm run market:admin -- validate-report --definition config/usda/2756.json
# Repeat for all five definitions before activating Wednesday ingestion.

# Explicit recovery or initial controlled ingestion. Requires USDA_INGEST_ENABLED=true.
npm run market:admin -- recover --reason 'Initial controlled source verification'

# One historical week per command; repeat for up to the preceding twelve weeks.
# Backfill uses separate run records and never changes active publications.
npm run market:admin -- backfill --week-ending 2026-10-16 --reason 'Initial verified history backfill'

# Snapshot and quarantine legacy shared SQLite rows; never imports personal tables.
npm run market:admin -- import-sqlite --file data/mead-price-history.sqlite --snapshot /tmp/pantry-history-snapshot.sqlite
# Reuse the same snapshot to resume an interrupted import.

npm run market:admin -- health
```

The legacy import uses a consistent SQLite snapshot, records its checksum/counts, and copies only weekly_offers and usda_snapshots. Seeded USDA/curated offers remain `synthetic_seed`; other legacy rows lacking reliable source validity are `legacy_unverified`. Neither enters verified production history. Retain the private local snapshot for reconciliation; it can contain personal SQLite tables and must never be uploaded or committed.

Wednesday at 16:00 UTC, `.github/workflows/market-health.yml` checks the sanitized `/api/health/market` endpoint. A missing, incomplete, or failed run fails the workflow; the notification destination is normal GitHub Actions workflow-failure notifications for repository subscribers. No USDA or database key is copied into GitHub CI. The check makes no upstream USDA requests and can also be run with workflow_dispatch. Enable repository workflow notifications for the operator responsible for ingestion.

## Deployment and verification

1. Complete local checks and PR CI/Codex review; keep ingestion disabled.
2. Apply the additive migration, verify browser-role denial and server writes/reads, and inspect database advisors.
3. Validate the five definitions using the configured operator USDA key. Perform a controlled recovery ingestion, inspect published versions and normalized values, and repeat to prove idempotency. Seed an initial verified backfill if desired.
4. Configure USDA_MARS_API_KEY and USDA_INGEST_ENABLED only in production. Preview environments must not run upstream ingestion. Release through develop → main; never bypass the release workflow.
5. Verify public dashboard provenance, a recorded grocery archive, cloud history after process restart, forbidden public ingestion, and the health endpoint. Observe the next Wednesday scheduled run and the health workflow; manual verification cannot prove a future scheduler execution.
6. Rollback: disable ingestion, preserve immutable history, and use labeled baselines if reads fail. Do not restore request-time USDA calls. Update mappings by incrementing adapterVersion and revalidating, never rewriting old observations.

Sources: [USDA report catalog](https://mymarketnews.ams.usda.gov/mymarketnews-api/reports), [query examples](https://mymarketnews.ams.usda.gov/mymarketnews-api/examples), and the authenticated October 28 responses. The Friday observation above comes from those samples rather than an assumed universal publication schedule.

## Initial verification — October 28, 2026

The controlled cloud batch published five reports with 89 current normalized observations covering 28 ingredients. Duplicate scheduled execution returned `duplicate` with zero upstream requests. Eleven prior report weeks were then backfilled, for twelve source weeks total; active selections remained on October 23. The legacy snapshot contained 420 offer rows and 210 USDA seed rows, all quarantined outside verified history. Dashboard assembly confirmed cloud benchmark reads and archival of 18 current grocery offers. Production activation follows the reviewed release; the next Wednesday schedule still requires observation.
