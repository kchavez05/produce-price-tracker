# Weekly USDA ingestion and durable market history

**Status:** Approved. Implementation and operational decisions are documented in [the v1.5.0 runbook](../usda-market-data.md).
**Prepared:** October 28, 2026.  
**Scope:** Activate scheduled USDA ingestion and move shared market history to Supabase. Deliver in two milestones within this improvement.

## 1. Outcome

PantryBot retrieves USDA market reports in one controlled batch each Wednesday, saves verified results in Supabase, and serves those saved results throughout the week. Loading a dashboard, generating recipes, running a Friday digest, or clicking ordinary refresh never contacts USDA. Historical observations remain available beyond the dashboard's six-week window for future analysis.

The USDA key stays server-only. Reducing calls reduces credential use and unnecessary upstream traffic; secrecy still depends on secret storage, HTTPS, redacted logs, and restricted execution paths. No browser or repository file receives the key.

## 2. Current implementation and gaps

Verified against the repository and production schema on October 28:

- `buildDashboardPayload()` calls `checkUsdaMarsStatus()` on every request. If configured, the connector attempts five parallel MARS requests with `cache: 'no-store'`.
- The configured slug IDs are `3324`, `3228`, `2868`, `2756`, and `2995`. Their current report identities, sections, release schedules, regions, and units have not been verified using authenticated responses. Treat these as candidates, not a validated catalog.
- Matching currently uses broad keyword checks and accepts Mountain or national rows. It does not establish compatible measurement units or a deterministic aggregation rule, and later matches can overwrite earlier matches.
- USDA results affect that response's baseline overrides; they are not persisted by this connector. SQLite `usda_snapshots` is populated by deterministic seed data. Local history can also substitute a store price for a missing USDA observation. Neither behavior establishes verified USDA history.
- SQLite defaults to `data/mead-price-history.sqlite`, supports a configured path, and falls back to memory if opening the file fails. A repository file or serverless instance is not a durable shared production history service.
- The production Supabase schema currently contains `weekly_refresh_audit`, but no USDA observations or market-offer history tables. Audit records describe retrieval activity, not the underlying report data.
- Wednesday grocery sync currently runs at 13:00 UTC; Friday digest at 22:00 UTC. The dashboard's planning cycle starts Wednesday midnight in America/Denver. Report publication dates need not match this planning cycle.

## 3. Scope and boundaries

**Milestone A — USDA ingestion and consumption:** validate report sources, add durable raw and normalized history, schedule ingestion, replace request-time USDA calls with stored reads, expose freshness, and supply initial verified history.

**Milestone B — shared market-history migration:** persist actual Flipp/Kroger observations and migrate shared six-week history queries to Supabase. This is necessary to support analysis of local prices alongside USDA benchmarks. Milestone A may ship first; the overall storage migration is complete only after B.

Keep deterministic keyless operation and local development support. SQLite may continue serving private guest sessions and offline fixtures; this proposal does not migrate personal accounts, preferences, inventories, or saved recipes. Existing authenticated ownership boundaries remain intact.

Exclude new recipe providers, live USDA calls on demand, new wholesale forecasting models, analytics screens, new paid infrastructure, and any promise that every ingredient will have a USDA match. Flipp/Kroger fetching cadence is unchanged; only their durable history moves in B.

## 4. Ingestion schedule and request budget

Use a dedicated authenticated worker route, proposed `GET /api/cron/usda-ingest`, scheduled Wednesday at **13:00 UTC**. This retains the existing Wednesday time: 7 AM MDT / 6 AM MST. It is a fixed UTC schedule, not a fixed Mountain clock time. The batch runs once for the shared report catalog, not once per ZIP or visitor.

The existing grocery sync must not initiate USDA requests. It can use the previous valid snapshot if the new batch has not finished. This avoids a dependency on execution order between scheduled jobs.

Within a run:

1. Authenticate the scheduler before any upstream or database write work. Require the existing server-only cron bearer secret; never trust `x-vercel-cron` alone.
2. Claim a database-backed lease for `(source, planning_cycle_start)`. A duplicate successful run exits without upstream calls. Concurrent requests cannot both acquire the lease. Expired leases can be recovered with a fencing token so an old worker cannot publish after recovery.
3. Fetch a bounded window of recent source data for each enabled report. Start with a proposed 14-day lookback to capture recent revisions; validate query support per report. Fetch all required sections/pages and record completeness before publication.
4. Validate, preserve raw payloads, normalize compatible observations, and publish each complete report independently in an atomic transaction. A report with an incomplete page set cannot replace its previous complete version.
5. Save per-report outcomes and finish the run as `succeeded`, `partial`, `unchanged`, or `failed`. HTTP 200 or a stored raw response alone does not establish usable USDA coverage.

Steady-state budget: one logical request per enabled report when one response contains the required sections and records. Five validated reports would normally mean five requests, not a single multi-report API call. Discovery and historical backfill are separately metered administrative operations. Establish a maximum of 20 upstream requests and 90 seconds per weekly run, including pagination and retries; tune downward or adjust explicitly after source discovery and hosting-limit verification. Use concurrency at most two and abort unfinished work at the deadline.

Retry only transport errors, 429, and retryable 5xx: at most two retries per request, with jitter and `Retry-After` when it fits the run deadline. Authentication failures and schema/validation errors do not retry. Log counts and safe error codes. No automatic Thursday/Friday catch-up or per-visitor fallback calls. A report not yet published on Wednesday retains its previous version until next Wednesday unless an operator requests a recovery run.

An operator-only recovery command may retry failed reports or explicitly force a revision check. It uses server credentials, records the operator's run reason, and cannot be reached through the public dashboard's manual-refresh endpoint. Do not expose a public `force=true` bypass.

## 5. Source discovery and normalization gate

Before enabling ingestion, use an operator-owned USDA account and its report catalog to validate each candidate report. Record title, slug, report type, sections, publication cadence/timezone, source-date fields, correction identifiers, geography, units, and supported date filters. Save redacted representative fixtures and versioned per-report adapters.

The first implementation milestone must demonstrate real parseable data; do not declare success after merely adding an environment variable. If the candidate slugs are wrong, replace them with validated sources. If suitable reports are published after Wednesday's batch, document that Wednesday uses the latest available release and present a schedule decision before rollout. Do not silently increase frequency.

Normalization requirements:

- Preserve source price, unit, currency, report period, geography, commodity/product dimensions, and any sample counts or weights. Normalize only through explicit tested conversion rules, including package size and dozen-versus-each handling.
- Distinguish retail advertised prices, wholesale prices, feature percentages, and volumes. Only comparable retail observations may replace a retail regional baseline; never treat a wholesale cutout as a grocery shelf price.
- Select Mountain-region compatible observations first. National values are allowed only as an explicitly labeled fallback; never average national and regional rows together without a defined methodology.
- Use a versioned mapping from source dimensions to canonical ingredient IDs. Ambiguous or incompatible rows remain in raw history and are counted as unmapped; they do not silently update scoring.
- For multiple compatible rows, define the grain and aggregation per adapter: use documented weights when available; otherwise publish separate dimensions or a clearly labeled unweighted statistic. Never use response order as the selection rule.
- Reject invalid dates, future-dated observations for current scoring, nonpositive/nonfinite prices, incompatible units, and percentages outside 0–100. Zero is a valid feature percentage; missing remains null.
- Preserve publication/correction order independently of fetch time. A late-arriving older report cannot displace a newer release. When revision ordering cannot be established, quarantine the conflicting payload for review.

## 6. Proposed Supabase data model

Names are proposed. Implementation must provide migrations, constraints, indexes, permissions, and generated application types.

| Entity | Purpose and principal fields |
| --- | --- |
| `market_ingestion_runs` | Source, planning-cycle date, trigger, attempt/parent IDs, status, start/end times, lease/fencing token, request counts, report outcomes and sanitized errors. All attempts remain auditable; a separate unique cycle claim controls execution. |
| `usda_report_catalog` | Validated report identity, enabled state, sections/query configuration, expected cadence, measurement type, adapter/mapping versions and geography rules. Configuration history is retained. |
| `usda_report_versions` | Immutable full report-period payload, report slug, source publication/revision metadata, source period, fetched time, content hash, parser version, completeness and validation state. Use JSONB initially, with measured payload caps. Oversized data fails safely; private object storage is a later explicit decision. |
| `usda_observations` | Report-version FK, stable source-row identity, ingredient mapping, original dimensions/unit/value, normalized value/unit, metric kind, source region/period, mapping version and quality flags. Use decimal numeric columns rather than floating-point monetary storage. |
| `usda_cycle_publications` | Planning cycle + report → validated selected version, publishing run, published time and previous selection. Publishes atomically after raw and normalized rows are durable. Preserve prior publication selections for reproducibility. |
| `market_offer_observations` (B) | Source, source offer ID, store/location or ZIP scope, ingredient, original and normalized prices/units, deal conditions, source validity window, observed time, content hash and provenance. Preserve materially changed offer versions instead of overwriting history. |

Deduplicate report versions by report identity + source period + canonical payload hash; normalization of JSON ordering must not alter meaningful row content. Deduplicate normalized rows by report version + full source-row dimensions + mapping version. An unchanged weekly retrieval records another check linked to the existing version; it does not invent a new price observation. A correction creates a new version without deleting the earlier one.

For market offers, distinguish the offer's identity, revision, and retrieval event. Identical observations from repeated dashboard requests must not inflate history or request-derived sample counts. Retain source validity dates; a planning-cycle label never replaces them.

Index USDA observations by ingredient, metric, region and source period; report versions by slug and period; offers by ingredient, location/store and observation/validity dates. Add unique constraints for deduplication and foreign keys for provenance. Bound and paginate historical queries rather than loading every raw response into dashboard requests.

Raw versions and normalized observations must be committed with the selected publication reference in one database transaction per report; separate Supabase HTTP inserts are not a transaction. Use a narrowly granted server-only SQL function or a server transaction mechanism, with authorization and fencing verified inside the publication transaction.

## 7. Application reads and freshness

Replace `checkUsdaMarsStatus()` in dashboard assembly with a server-side repository call that retrieves published USDA values from Supabase. A short application cache is acceptable, keyed by published version and geography; publication must invalidate it or it must expire within five minutes. No database failure or cache miss may trigger USDA fetching.

Freshness is tracked per report and per ingredient, not as a single HTTP-success flag:

- `current`: newest eligible source period falls within the adapter's expected publication cadence and grace period.
- `stale`: a previous verified value remains available after the expected release was missed.
- `fallback`: no compatible verified value is available, the source period is more than 14 days old, or Supabase cannot be read and no valid cached value exists.

The 14-day maximum is a proposed initial scoring policy for weekly reports; retain older records for analysis. Measure age from the source period's end date in its documented timezone, not retrieval time. Set cadence/grace explicitly during discovery. Recent retrieval of an old report does not make it current.

Responses expose source report/period, geography, normalized unit, fetched/checked time, published version, status and fallback reason. Example display: “USDA Mountain retail benchmark • report week ending Oct 23 • checked Oct 28.” Label national fallbacks accordingly. Store-price freshness and USDA-benchmark freshness remain separate.

Replace or deprecate the ambiguous `usdaLive` field: a cached verified USDA value is useful without a request-time upstream call. During compatibility rollout, document its meaning and add `usdaStatus` plus per-ingredient provenance so clients never infer freshness from that boolean alone. Update dashboard, digest, API specification and setup documentation together.

Do not populate missing USDA history with a local store price. Represent missing observations explicitly; charts and analysis must distinguish gaps, real zero percentages, static estimates and verified source data. Never fabricate wholesale momentum from a retail-price change. Recipes continue using existing matching and weekly rotation, with newly stored benchmarks feeding their usual price scoring.

## 8. History migration, analysis and retention

Supabase becomes the production source of truth for shared market observations. The displayed six-week series is a query window, not a retention policy. Initial policy: retain normalized observations, report versions and ingestion receipts without automatic deletion. Record expected monthly row/byte growth from fixtures before rollout and review actual storage after 30 days; material cost or retention changes require an explicit decision.

For B, introduce an asynchronous history repository and load bounded history in bulk before scoring, replacing per-ingredient SQLite reads. Scheduled grocery refreshes must archive live offers durably. Existing request-time live offers may also be archived with deduplication, but avoid unbounded writes on every page view. Cloud write failures remain visible and retryable; do not report durable archival success based on a local SQLite write.

Import only verifiable existing records. The current SQLite seed generator produces synthetic store and USDA histories: exclude these from verified datasets. If retained for demonstrations, mark them `synthetic_seed` and exclude them from production analytics by default. Snapshot the source file for an import audit, record checksums and counts, and preserve original provenance. Existing live records without trustworthy source dates may enter a labeled legacy dataset, not the verified time series.

A separate, bounded backfill command can retrieve actual published USDA history after adapters are validated. Default proposal: the previous 12 weeks, throttled and resumable, using the same deduplication and validation rules. Log its requests separately from the Wednesday budget. Backfill changes source-period history and must not move the active publication backward or imply PantryBot observed those values in the past.

Support future queries by ingredient, region, store, source period, observation time, unit, metric and provenance. Preserve both source-effective time and system-observed time so future analysis can distinguish corrected historical values from what the app knew at a given date. Analysis features and their statistical models are separate work.

## 9. Security and operations

- Store `USDA_MARS_API_KEY`, `SUPABASE_SECRET_KEY` and `CRON_SECRET` in server-side deployment secrets. Never request a key in chat or commit it. Configure USDA only for production ingestion initially; preview tests use fixtures or an explicitly isolated test configuration.
- The ingestion module owns upstream authentication. Dashboard modules must not import or call it. All upstream requests use HTTPS and the documented Basic authentication username/key with empty password; no credentials in URLs, payload snapshots, client bundles or logs.
- New shared-data tables contain no user inventory or identity. Enable RLS on exposed tables, revoke browser-role access, and grant only required server operations. Serve sanitized read models through server routes. Future public analytics can receive an explicit narrower read surface later.
- Restrict any publication function to the server role, fix its search path, and prefer invoker privileges. A scheduler token alone must not grant general SQL or arbitrary upstream URL access. Use a fixed upstream host and validated report allowlist.
- Track run success/partial/failure, missing credentials, rejected/unmapped rows, source-period age, request count, latency, payload size and database write failures. Distinguish “no new release,” “no compatible rows” and “source unavailable.” Keep raw bodies out of routine logs.
- A deployment/operations check must detect a missing Wednesday run after its allowed window; no audit row cannot be treated as success. Define the notification destination during implementation without adding another USDA polling job.
- First credential setup and first authenticated source-validation batch are implementation prerequisites. This specification does not provision or activate them.

## 10. Delivery and acceptance

1. **Validate sources:** demonstrate report identities, release timing, date filtering, complete responses and unit conversions with redacted fixtures. Record any change to the candidate catalog or schedule before enabling cron.
2. **Create storage:** migration adds durable versioned data, deduplication, publication transaction and least-privilege grants. Confirm browser roles cannot read raw tables or invoke publishing; server writes and bounded reads succeed.
3. **Implement A:** deploy ingestion disabled, run an authenticated controlled batch, verify data and retries, then switch dashboard reads to Supabase and enable Wednesday scheduling. Keep deterministic fallback when keys or cloud storage are unavailable.
4. **Implement B:** archive live market offers, import only eligible legacy history, switch production history queries to Supabase, and stop treating production SQLite as durable shared storage. Reconcile counts and representative six-week series before retiring old reads.
5. **Verify rollout:** follow branch/PR/release rules in `AGENTS.md`, with all required local checks, CI, preview and completed Codex review. Production enablement follows the release process. Preserve stored history on rollback; disable ingestion and return to labeled static baselines if necessary, never restore per-request USDA calls.

Acceptance tests must prove:

- Wednesday produces at most one normal batch per cycle under concurrent/duplicate invocation; authorized failed-run recovery is safe, and stale workers cannot publish.
- Dashboard loads, public sync/preview requests, Friday digests and ordinary manual refresh produce **zero USDA requests**, including during Supabase failures and empty-cache conditions.
- Across the following week, stored values remain usable with accurate source dates; server restart/redeployment does not lose history. Re-reading a cached report does not change its source age.
- Changed reports create immutable revisions; identical bodies do not duplicate observations. Late arrivals, corrections, partial pages, pagination limits, 429s, deadline expiry and cloud write failures preserve the last complete published version.
- Unit conversion, valid zero percentages, invalid prices, geographic precedence, ambiguous ingredient mapping and retail-versus-wholesale separation behave as specified.
- Freshness transitions and the 14-day cutoff work at date/timezone boundaries. Missing data remains missing in verified history. Keyless/offline dashboards remain deterministic.
- A process can be killed after raw retrieval or normalization and safely recover. No partial writes or a successful local fallback acknowledge cloud publication.
- B preserves actual live offer history, excludes synthetic seeds from verified analysis, provides bounded six-week reads, and keeps provenance across migration and backfill.
- No credential is present in client bundles, logs, raw snapshots, errors or API responses. Anonymous callers cannot invoke ingestion or force retries.

## 11. Decisions to confirm during implementation

The proposed defaults are fixed Wednesday 13:00 UTC, five candidate report families subject to validation, a 14-day usable-source-age ceiling, optional 12-week verified backfill, and no automatic history deletion. Source discovery may require changing these defaults; document the evidence and decision before rollout.

The main product tradeoff is release timing: a Wednesday-only batch cannot guarantee inclusion of reports published later in the week. This design favors controlled weekly ingestion and transparently dated benchmarks. Moving to more frequent or live calls remains a future decision.

## References

- Current code: `src/lib/connectors/usda-and-kroger.ts`, `src/lib/scoring-and-matcher.ts`, `src/lib/db/sqlite.ts`, `src/lib/refresh-audit.ts`, `src/app/api/cron/weekly-sync/route.ts`, `vercel.json`.
- Existing operational context: [Weekly refresh](../weekly-refresh.md).
- USDA: [Authentication](https://mymarketnews.ams.usda.gov/mymarketnews-api/authentication), [report catalog and identifiers](https://mymarketnews.ams.usda.gov/mymarketnews-api/reports), [query and section examples](https://mymarketnews.ams.usda.gov/mymarketnews-api/examples). These establish authentication and report-specific access; they do not validate the repository's five candidate slugs or response adapters.
- Supabase: [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security). Proposed schema, retention and freshness rules above are PantryBot design decisions.
