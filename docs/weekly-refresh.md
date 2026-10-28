# Weekly price refresh

The dashboard fetches grocery prices on each request. Scheduled and manual syncs call the same ingestion path. Flipp and USDA fetches bypass Next.js caching; dashboard responses are private and not cached.

The displayed planning cycle rolls over at Wednesday midnight in America/Denver, including daylight saving changes. It is a planning window, not a guarantee that every retailer uses those dates. Flipp offers must have source validity dates and be active now; exact timestamps are preserved. Kroger prices are same-day observations with no invented promotion expiration.

Expired, future and undated circulars do not participate in ranking or live history. A live price replaces the historical estimate for that store and ingredient. Recommendations and optimal shopping selections prefer verified prices over estimates in other stores. Single-store and two-store recommendations rank verified item coverage before cost, and pair totals follow the same preference as the checklist. Missing coverage retains deterministic historical estimates, with explicit labels and no coupon requirements. Store comparison totals may include estimates; check the item descriptions before shopping.

The dashboard reports response generation time, refresh attempt time, usable offer counts, source availability, and the latest successful retrieval. When the current request has no live prices, the last recorded successful sync is shown if available. A successful HTTP response alone does not mean live prices were retrieved: `refreshStatus` distinguishes `live` from `estimates_only`. `syncedOffersCount` counts actual usable live offers, not baseline ingredients.

## Recipe rotation

Recipes use the existing curated blueprint library and the current session's saved recipes, not an external weekly recipe feed. Prices and ingredient substitutions are recalculated on dashboard requests. The strongest scoring recipe remains the value anchor; the other two slots rotate through the remaining recipes at Wednesday midnight in America/Denver. The rotation is deterministic within a planning week for unchanged prices and preferences, and uses the same completed-retrieval planning cycle as the value board. All recipes remain available in the cost-ranked browser. With four or more eligible recipes, unchanged inputs produce a different trio in adjacent weeks; three or fewer cannot provide a new trio without expanding the source. Current prices and preferences can also change recommendations within a week. User-selected or AI-generated plans override the automatic trio until reset.

### Production audit: October 28, 2026

The public dashboard for ZIP 80542 retrieved 18 usable Flipp offers at 15:57 UTC (9:57 AM MDT). Eleven of 35 ingredients had a live best offer; 24 retained historical estimates. Nine of those eleven live best offers began October 28, one began October 25, and one began October 14 but remained valid. USDA and Kroger reported inactive; Gemini was unconfigured. Static comparison baselines, fallback market signals, and the curated recipe library are not weekly external updates. Supabase contained successful 18-offer audit rows for the Wednesday sync at 13:23 UTC and release verification at 15:38 UTC. No earlier audit rows were available, so this confirms current retrieval and new circular dates, not a complete comparison with last week's prices or executions. Before rotation, the trio was chicken-butternut curry, pork green chile, and Tuscan sausage stew.

## Schedules and security

`vercel.json` configures Wednesday at 13:00 UTC (7 AM MDT / 6 AM MST) and Friday at 22:00 UTC (4 PM MDT / 3 PM MST). Vercel schedules use UTC, so local times shift with daylight saving. Vercel cron runs on production deployments; use manual sync to test previews.

Set a random server-only `CRON_SECRET` in production before deploying. Vercel supplies it as `Authorization: Bearer <secret>`. Scheduled cycles and recording GET requests require that bearer token; `x-vercel-cron` alone is never trusted. Unrecorded `cycle=preview_digest` GET requests remain public and rate limited. Manual POST requests are same-origin and rate limited.

## Durable audit

Apply `supabase/migrations/20261027223857_weekly_refresh_audit.sql` and configure `NEXT_PUBLIC_SUPABASE_URL` and server-only `SUPABASE_SECRET_KEY`. Only the server role can read or insert audit rows; browser roles have no grants or RLS policies. No account or inventory data is stored. Each recorded sync captures its ZIP, cycle, attempt/completion times, status, source counts, and USDA availability.

`auditStorage=cloud` confirms a successful durable write. `local` means only SQLite is configured; on serverless deployments this may be temporary or in memory. `unavailable` means a configured cloud write failed or no database saved the audit; structured `weekly_refresh` runtime logs provide diagnostic evidence, subject to Vercel retention. Do not interpret a local audit as durable production history.

Flipp requires no key. USDA and Kroger credentials are optional and independently affect those integrations; absent or failing integrations keep keyless estimates available. The cron secret authenticates the scheduler and does not buy or unlock grocery data.

## Verification and rollout

1. Run typecheck, lint, unit, smoke, regression and production build checks.
2. Verify an unrecorded preview and a manual sync in the PR deployment. Check the current cycle, per-item estimate labels, exact offer counts and explicit audit storage mode.
3. Merge only after CI, Vercel Preview and completed Codex review. Follow the repository release checklist before merging develop into main.
4. On production, verify cron bearer authentication, run one recorded refresh, and confirm a new audit row and current offer dates. Check the next scheduled execution; historical logs may be outside the hosting plan's retention.

Production investigation on October 27, 2026 confirmed both cron definitions are enabled. Production environment metadata contained no USDA or Kroger credentials. The public Flipp feed returned offers with real timestamp validity windows. The available recent log window contained no cron requests; this does not establish whether last week's jobs ran.

Database access verification confirmed RLS enabled, no anonymous SELECT, no authenticated INSERT, and server-role INSERT enabled. The advisor's “RLS enabled, no policy” informational result is intentional for this server-only table ([explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)). Existing auth trigger function grants and leaked-password protection advisories were outside this price-refresh change.
