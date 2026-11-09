# Data Explorer

The public `/data` page is linked from the shared footer. No account or provider key is required. Its five views cover price history, score explanations, ingredient definitions, raw data, and source coverage. URL filters are shareable; browser navigation preserves them.

## Data and calculations

USDA lines use accepted source versions and their report-period end dates. Current reports provide national advertised retail benchmarks, not wholesale prices or Mountain-region averages. Compatible normalized source rows are weighted by store count. Local weekly series choose each offer's latest retrieved revision, then the lowest compatible observed offer per store/week. Missing weeks are gaps. Statistics describe the selected observed window, not seasonality or a prediction.

Summary cards normally describe the best visible local store price each week. When only USDA series are visible, the cards instead summarize those period benchmarks and explicitly label the USDA basis. The local weekly-pattern grid remains empty when local observations are unavailable.

Score explanations call the same value-score calculation as the dashboard, with the most recent archived offer cycle in the last six weeks and currently usable stored benchmarks. The result may differ from unarchived dashboard offers and is not a historically recorded score. The trace includes policy version, input offer, benchmark provenance, component rounding, weighted contributions, final rounding, cycle badge, action tag, and freezer rules. Source/date filters used for exploration do not silently alter the scoring policy.

Weights remain 55% affordability, 35% discount depth, and 10% market signal. The verified-history path's neutral market signal is 60/100, contributing six points. It is not measured wholesale momentum. A large regular-price discount alone no longer earns a six-week-low badge: the low must also be observed with six local weeks of coverage and at least 32% off regular price. A ≥42% discount above the low is described as a deep discount.

Cooking onions include yellow and white varieties for cooked recipe roles; sweet, red, and green onions are excluded from matching. The ingredient no longer implies a mandatory 3 lb bag. Other combined groups publish editorial recipe-role rationales and limitations. These groups are distinct from USDA commodity classifications, and source varieties remain inspectable.

Sources & Coverage includes a plain-language explanation of canonical ingredients: a hand-maintained meal-prep catalog rather than a universal food taxonomy or statistically selected grocery basket. It explains the recipe-role/product-form basis, live category counts, package normalization, exclusions with onion and chicken examples, and untracked grocery categories. A link preserves the selected ingredient and applicable filters when opening the detailed catalog. Missing matches or benchmarks do not establish product unavailability; static fallback estimates have no documented original empirical source.

## Raw data and exports

The score view remains useful without a retained local offer: it shows the available comparison benchmark (or labeled static catalog fallback), scoring weights, and a hypothetical per-unit price calculator. The optional regular-price comparison is user supplied; leaving it blank asserts no regular-price discount. Calculations use the shared score policy with a neutral market signal and never save observations or imply verified cycle badges.

Local history backfill still requires dated source advertisements with market and package details. The current Flipp and Kroger connectors do not implement historical queries. A direct Flipp onion search for ZIP 80542 on October 29 returned no items; no historical local rows were imported. USDA history cannot substitute for local store observations.

The Package / source detail column distinguishes package sizes at a glance and shows original USDA prices alongside the table's per-unit prices. Meat rows include available package sizes, grades, and fresh/frozen conditions; store offers show their advertised price and conditions. Calculated rows explain their aggregation method. Missing source details are labeled explicitly.

The Raw data view is always accessible independently of charts. It offers normalized USDA observations, original USDA market rows, archived store offers, and calculated weekly results. Expand a row to inspect source fields, conversions, mapping versions, report metadata, or offer retrieval receipts. Calculated rows also include the current-policy score trace when the selected range contains the complete six-week scoring window. Historical or narrower ranges do not imply replayed scores. The score view exposes those same full inputs and outputs as JSON.

Original USDA rows select one report version and include all its commodities and unmapped rows for that source period/publication, rather than hiding rows outside the selected ingredient. Full stored report JSON is lazy-loaded and downloadable as a **sanitized public projection**. It preserves audited market fields and unmapped rows, omits unknown fields and envelope internals, and is not the byte-original API response. Store data is the offer projection PantryBot retained, not a claim to have kept the upstream response.

CSV exports include all filtered pages in stable order, with a 10,000-row cap and no silent truncation. Spreadsheet formula-like text is neutralized. The interface also downloads JSON metadata; the API provides it as URL-encoded JSON in `X-Export-Metadata`. Metadata records filters, mode, units, snapshot, and revision policy.

History/row/export ranges are limited to twelve weeks (83 days between inclusive endpoints), table pages to 100 rows, archive snapshot payloads to 3.5 MB, and selected report payloads to the archive's existing 4,000,000-byte cap. On October 28, 2026, a read-only measurement found 60 stored report versions, 1,030 normalized rows, and a largest report of 1,843,803 bytes. Reports are immutable; their public projection is generated from the preserved payload, not re-fetched.

Snapshots have an as-of cutoff and content fingerprint. Reusing a snapshot yields consistent rows or an explicit 409 asking the visitor to reload. This also detects cross-worker differences instead of silently skipping/duplicating rows. Snapshot URLs expire after 24 hours. At most the latest 100 retrieval receipts per archived offer are included, with the full receipt count and a disclosure if more exist.

## Deployment and verification

Apply `supabase/migrations/20261028214814_data_explorer.sql` through the reviewed deployment workflow before enabling cloud explorer reads. It adds one bounded, read-only `SECURITY INVOKER` function, `read_data_explorer`; only `service_role` can execute it. Existing browser-role table grants and RLS remain unchanged. No personal data or ingestion operations enter the projection.

The server uses `SUPABASE_SECRET_KEY` only through the existing market client. Configured database failures yield an unavailable state, never synthetic replacement. An explicit `mode=demo` or missing cloud configuration uses deterministic local offer scenarios with prominent synthetic labels; no USDA reports are fabricated. Quarantined legacy snapshots are not exposed. Viewing/filtering/exporting never fetches USDA, Flipp, or Kroger and never writes market history.

Public routes are documented in OpenAPI: `/api/data/history`, `/api/data/rows`, `/api/data/report`, `/api/data/catalog`, `/api/data/score`, and `/api/data/export`. Read limits use the application's process-local IP limiter (60/minute for reads, 10/minute for report/download operations); they are abuse mitigation, not a globally distributed quota. Archive cache entries expire after sixty seconds and the cache holds at most 24 snapshots.

Verify the footer entry, every direct view link, chart-to-row drill-through, report JSON, CSV and metadata downloads, pagination, current score trace, and a narrow viewport. Test no-key demo, configured outage, empty store coverage, invalid filters, changed snapshots, revisions, browser-role denial, and source-field redaction. The normal repository CI/preview/Copilot review gates still apply.

## Source publication review

The public projection is limited to numerical USDA market observations and their commodity/report dimensions, with attribution to **U.S. Department of Agriculture** and a direct source link. It does not redistribute third-party imagery, logos, or publications. USDA's [digital rights policy](https://usda.azureedge.us/about-usda/policies-and-links) generally permits distribution of public-domain information and identifies exceptions for protected materials. The [official MyMarketNews API](https://mymarketnews.ams.usda.gov/mymarketnews-api) provides access to raw Market News data. The October 28 source-key audit also preserves raw feature activity, store-ad counts, prior-week/year metrics, price ranges, and documented case variants of source field names. These raw fields do not automatically become scoring or momentum inputs. New source fields or content types require another publication audit before expanding the public allowlist.

Baseline advisor inspection found pre-existing warnings on auth trigger functions and password protection. This migration introduces no security-definer functions or browser grants. Server-only market tables intentionally retain RLS with no browser policies. Do not weaken those protections to make the explorer public.
