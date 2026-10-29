# v1.5.1 — Data Explorer & Score Transparency

Status: Approved October 28, 2026; implemented for v1.5.1. See [implementation and operating notes](../data-explorer.md).

Implementation decisions: retain yellow/white cooking onions and exclude sweet/red/green onions; remove the bag-only label. Require an observed six-week low as well as the discount threshold for the low badge; label discount-only cases separately. Preserve 55/35/10 weights. Publish an audited USDA market-field projection with attribution and the archive’s existing 4 MB report cap (largest stored report measured: 1,843,803 bytes).

## Product intent

Give any visitor a satisfying way to explore PantryBot's pricing data and answer: “Why is this a good buy?” A public **Explore the data** footer link opens `/data`, where charts, tables, source records, ingredient definitions, and exact calculations connect to one another.

The explorer should be enjoyable for someone who wants to study commodity price history against in-store advertised pricing. It must also make the limits of those comparisons obvious. Raw data is a first-class destination, not an incidental export or a developer-only screen.

This release builds on [v1.5.0 market history](usda-weekly-ingestion-and-market-history.md) and its [operating rules](../usda-market-data.md). It does not introduce new ingestion schedules or require visitors to supply keys.

## Scope and boundaries

Deliver five public views: **Price history**, **Explain this score**, **Ingredient catalog**, **Raw data**, and **Sources & coverage**. Use one shared ingredient selector and preserve applicable ZIP, store, date, and source filters when moving between views. Each view has a shareable URL with validated query parameters. Default to a six-week history window; offer twelve weeks where stored USDA history exists. Available local history may be shorter and must remain visibly incomplete.

No account is required. Market data is public; personal inventory, recipes, profile information, refresh ownership, and authentication records never enter the explorer or its exports. ZIP selects a market area rather than identifying a user.

Out of scope: predictive models, statistical correlation claims, proven seasonality, new sources, longer retention, user uploads, ingestion controls, arbitrary database queries, or a redesign of score weights. Do not bump the package version or mark the milestone shipped as part of this specification change.

## Page and navigation

- Add **Explore the data** to the shared footer, including the main dashboard's footer.
- Open with a useful default ingredient and concise source/coverage summary, then show the selected view. Offer search by ingredient name and included variety.
- Give charts a **View underlying rows** action. It opens Raw data with the ingredient, series, period, geography, and source selection carried over. Point selection narrows to that observation and its contributing rows.
- Support browser back/forward, keyboard navigation, direct links, mobile layouts, loading states, empty states, and recoverable errors.
- Use plain-language labels; keep technical IDs and JSON one expansion away. Every graph has a table alternative, visible units, and a legend that does not rely only on color.

## 1. Price history

### Chart and observations

Show USDA retail benchmarks and selected store series in a common normalized unit, usually dollars per pound or dollars per dozen. Never combine incompatible units on one price axis. Users can toggle sources and stores and select the available date range. Support every store represented in the archive, not only King Soopers and Safeway.

USDA points use their actual source-period end date. Local weekly points use the application's America/Denver ad-cycle boundaries. Tooltips show source period or offer validity, retrieval time, store/location when present, variety/package, normalized price, verification status, and revision identity. Visually distinguish a currently selected offer from archived weekly observations.

USDA currently supplies **national advertised retail benchmarks** from five reports. Store offers are observed advertisements, not a complete survey of shelf prices or proof of availability. Do not label these USDA series wholesale or Mountain-region data unless the particular record actually supports that label. A gap between the series is a comparison, not evidence of a causal relationship.

### Aggregation and weekly patterns

For each ingredient/store/week, default to the archive's latest retrieved revision of each offer, then the lowest compatible observed offer price. Disclose this rule and offer drill-through to all contributing offers and receipts. Across selected stores, “best observed” is the minimum of those store points; it is not an average market price. Date/store filters recompute exploratory summaries and coverage, but do not silently change the dashboard scoring policy.

Provide a weekly price heatmap and summary table: observed weeks, lowest/highest observed price, mean, and median. Describe the window and selected stores beside every statistic. Exclude missing values from arithmetic and show the observation count. Empty summaries are unavailable, not zero.

Do not interpolate gaps, substitute USDA values for local observations, or carry prices forward into unobserved weeks. Repeated retrievals do not create additional independent observations. “Weekly price patterns” describes observed history; six weeks alone does not establish a recurring cycle or seasonality.

## 2. Explain this score

Show the selected current offer and a reproducible calculation trace generated by the same scoring functions used by the dashboard. Avoid a second implementation of the formulas in the UI. Include the scoring-policy version, evaluation time, market/store context, selected source versions, and full-precision inputs with display rounding identified.

The current formula is:

`valueScore = round(0.55 × affordability + 0.35 × discountDepth + 0.10 × marketSignal)`

| Component | Current behavior to expose |
| --- | --- |
| Affordability | Category-specific piecewise price curve: protein 100 at/below $1.25 and 12 at/above $8; produce 100 at/below $0.60 and 15 at/above $3.80; dairy/eggs 100 at/below $1.60 and 20 at/above $5. Intermediate values use the existing linear curve and rounding, in the ingredient's standard unit. |
| Discount depth | Baseline discount = `round(100 × (baseline − offer) / baseline)`; regular-price discount uses the same formula with the offer's regular price. Effective discount is the greater of baseline discount and 90% of regular-price discount. Component score is 10 for effective discount ≤ 0, 100 for ≥ 50, otherwise `round(10 + effectiveDiscount / 50 × 90)`. |
| Market signal | The existing function is named `calculateWholesaleBonus`. In the verified-history path momentum is neutralized to STABLE, yielding 60/100 and a fixed six weighted points. This is not a measured wholesale trend. Local demo scenarios may differ and must be labeled. |

Display each component's input, component score, weight, weighted contribution, and final rounding. Explain baseline selection: compatible stored USDA benchmark when usable; otherwise a labeled static baseline. Source-period age, not recent retrieval, controls freshness. Current policy is cadence plus grace for “current,” usable through fourteen days for “stale,” then fallback. Historical exploration can still show older observations.

Explain offer selection, including selected stores, live-offer preference over curated fallbacks, package normalization, regular-price provenance, and any coupon, membership, or quantity conditions available in the offer. If an input is estimated or unknown, state that; do not imply an advertised regular price is independently verified.

Keep the **value score**, **action tag**, **cycle badge**, and **freezer recommendation** distinct. Provide the applicable decision rules and input evidence for displayed labels. At minimum, show verified local week count, six-week low comparison, regular-price discount, fallback status, and the rule that triggered the cycle badge.

An optional **Try a price** control may reuse the scoring function for a labeled hypothetical calculation. It must not write offers, history, or account state. This control is secondary to the required actual-score trace.

Historical rows do not imply a historically recorded score. Recomputations, if later supported, must identify today's policy and as-of inputs; replaying historical recommendations is outside this release.

## 3. Ingredient catalog and grouping rationale

Separate PantryBot's category/subcategory, its recipe substitution groups, and USDA's commodity/variety/cut dimensions. PantryBot groups must never appear to be USDA classifications.

For every canonical ingredient, publish:

- Name, ID, category, subcategory, and normalized unit.
- Included varieties/cuts/forms and explicit exclusions.
- Human-authored grouping rationale and relevant recipe use; mark undocumented rationale as awaiting review rather than generating an explanation as fact.
- Store matching keywords and exclusions, plus known limitations.
- USDA report mappings and source dimensions, normalization/conversion rules, aggregation method and weights, and mapping version.
- Static fallback baseline and its status as an estimate, with its documented origin or “origin not documented.”

Retain source variety/cut/package dimensions in the raw view even when several map to one canonical ingredient. Show individual contributing USDA rows alongside the combined benchmark and its weighted arithmetic. Mapping changes create a new version; historical records retain their original mapping identity.

### Onion example and decision

Current ingredient `yellow-white-onions` is named “Yellow or White Cooking Onions (3 lb Bag).” USDA WHITE and YELLOW dry-onion rows map to it, while store keywords also accept sweet onions. This discrepancy must be visible during development and settled before shipping.

Proposed rationale for review: yellow and white onions share a cooking role in supported meal-prep recipes. This is a product grouping decision, not proof that varieties have identical prices or are interchangeable in every dish. Preserve variety distinctions in the source rows. Decide whether sweet onions remain included with an explicit benchmark limitation or are removed from the matcher. Also clarify that a 3 lb bag is a package description rather than a universal requirement if matching supports other packages.

Review other combined groups using the same template. Do not invent reasons from ingredient names or silently change matching as part of adding explanatory text.

## 4. Raw data — required first-class view

Raw data has its own visible tab and direct URL. It is accessible without selecting a chart point or signing in.

### Datasets and tables

| Dataset | Required contents |
| --- | --- |
| Original USDA records | Preserved source rows and fields, including unmapped rows in the selected report; report identity, period, version, retrieval metadata, and acceptance status. |
| Normalized USDA observations | Ingredient mapping, source dimensions, original price/unit/package, conversion inputs, normalized value/unit, weight, mapping version, and original-row link. |
| Archived store offers | Preserved archived offer fields, store/location, market ZIP, offer dates, source ID, original package/price fields where retained, normalized price, coupon conditions, revision ID and retrieval receipts. |
| Calculated results | Benchmark contributions, weekly summaries, and current score components with policy/context metadata. Clearly identified as derived results. |

Store offer payloads are the records retained by PantryBot, not necessarily original upstream API responses. Do not claim to have upstream fields or source text that were never archived. Show absent fields as unavailable.

Support dataset-appropriate search, sorting, pagination, and filters for ingredient, source, variety, store, geography/ZIP, period, verification status, and report version. Explain when a filter is unavailable for a dataset. Long/wide tables scroll within a labeled region on mobile. Expand a row to inspect all retained public fields and trace its derivation.

Default USDA views use accepted versions. Permit inspecting earlier revisions and quarantined versions through an explicit status filter; label them **not used in current scoring** where applicable. Synthetic and legacy-unverified observations are excluded from verified series and accessible only in an explicitly labeled dataset mode. Do not expose private legacy SQLite snapshots.

### Preserved reports and exports

- Provide an expandable, lazy-loaded JSON viewer and JSON download for a selected stored USDA report version. Include report metadata and clarify whether the payload is the original stored representation or a sanitized public projection.
- Offer CSV export of filtered table rows, across all matching pages within the documented limit, and disclose dataset, filters, units, time fields, and revision policy in accompanying export metadata.
- Include original source fields alongside normalized fields or in a linked original-row view; never label normalized data “raw.”
- Export one selected report version at a time for report JSON. Do not call USDA or another provider to satisfy a download.
- Escape CSV correctly and neutralize spreadsheet formula injection in text fields. Treat source strings and JSON as untrusted text; never render them as HTML.

## 5. Sources & coverage

Show report names/slugs, source links, region, normalized units, source periods, fetched/checked times, usable coverage, mapping version, and current/stale/fallback status. Distinguish publication time, source period, retrieval time, ad-cycle week, and scoring evaluation time. Preserve USDA publication clock strings without inventing a timezone offset.

Provide a concise glossary for advertised retail benchmark, observed offer, normalized unit, baseline, regular price, canonical ingredient, weighted mean, verified observation, and synthetic demonstration data. Explain that missing observations mean unknown, not free, unchanged, or unavailable at every store.

Freshness governs current scoring eligibility; historical age does not make a genuine historical observation synthetic. Global history coverage and the selected ZIP/store coverage must be separately stated.

## Read architecture and operational constraints

Implement server-only, read-only explorer queries over the v1.5.0 archive. The existing dashboard history loader aggregates and bounds reads to six weeks, so it cannot alone supply report rows, arbitrary store series, revision inspection, or twelve-week USDA exploration. Add purpose-built bounded read projections; reuse existing normalization, revision selection, and score logic.

Suggested public read contracts, to finalize during implementation:

- `GET /api/data/history`: ingredient, ZIP, stores, dataset/source filters, and date range; returns series, summary arithmetic, coverage, and provenance.
- `GET /api/data/rows`: allowlisted dataset, filters, sort, and cursor; returns table rows and stable next cursor.
- `GET /api/data/reports/[versionId]`: public metadata and stored report JSON, with optional attachment response.
- `GET /api/data/catalog`: ingredient definitions, rationale, mappings, and policy metadata.
- `GET /api/data/score`: current scoring context and trace, reusing the dashboard scorer without causing upstream requests or writes.
- `GET /api/data/export`: filtered CSV projection using the same query semantics as the table.

Endpoint names may change; the contracts and boundaries are required. Extend OpenAPI and regenerate published specs when implementing public routes.

Initial limits: at most twelve weeks per history/row/export query, 100 table rows per page, and 10,000 CSV rows per export. Reject an over-limit export with a clear instruction to narrow filters; never silently truncate. One selected archived report is exempt from row-count limits for JSON inspection/download, but must have a documented byte cap based on measured stored report sizes before release. Require deterministic ordering with stable tie-break IDs and a snapshot/version token for paginated/exported results so new revisions cannot duplicate or omit rows during traversal.

Validate IDs, dates, ZIPs, stores, sort fields, and dataset enums. Apply public rate limits and bounded caching keyed by public filters and archive versions. Handle invalid requests, exhausted limits, missing reports, and unavailable storage explicitly. No caller-supplied SQL, arbitrary URLs, service credentials, raw operational logs, or personal tables may be exposed.

Keep existing database browser-role restrictions. Any necessary read functions remain server-only and return allowlisted market fields. Public report payloads require a field audit; sanitize secrets, request headers, account identifiers, internal operational details, or personal data if present. Market source fields should otherwise remain inspectable, including unmapped USDA rows. Audit redistribution requirements and linked source attribution before enabling downloadable full reports; do not claim unrestricted reuse without checking the applicable source terms.

Explorer page views, filters, score explanations, and exports make zero upstream USDA/Flipp/Kroger requests, trigger no ingestion, and write no archive records. Current score explanations use retained inputs; if the exact dashboard offer is not archived/available, show the last stored context and identify the difference rather than claiming an exact match.

## Offline, errors, and accessibility

Without cloud credentials, the page remains usable with deterministic, clearly labeled demonstration data, catalog explanations, and score traces. Keep demonstration mode isolated from verified production series and exports. A configured cloud failure produces an unavailable state with retry and any explicitly dated cached data; it must not silently replace real history with synthetic values.

Show partial coverage and per-source errors without discarding other successfully loaded datasets. A missing report or score input produces an explicit reason. Chart and JSON loading must not block the ingredient catalog.

Use semantic table headers, labeled filters, keyboard-operable tabs and point alternatives, visible focus, sufficient contrast, and reduced-motion support. Provide readable chart summaries and downloadable table alternatives. Test narrow screens and large tables without whole-page horizontal overflow.

## Decisions required before implementation is complete

1. **Onion membership:** approve a documented rationale and settle sweet-onion matching and the bag-size label. Audit other combined ingredient groups for equivalent discrepancies.
2. **Cycle badge meaning:** current code can award “6-week low” from a ≥42% regular-price discount even when the price is not the observed low. Choose either a truthful deep-discount label for that branch or a revised low requirement, with explicit tests and release notes. Do not merely document a misleading label.
3. **Scoring policy:** preserve 55/35/10 for this release by default, expose the neutral six-point contribution, and describe it without measured-wholesale claims. Any change to weights or demo behavior requires an explicit spec amendment.
4. **Public report contract:** confirm allowed source redistribution, sanitization, and the measured per-report byte cap. Keep any unresolved download restriction explicit in the implementation review.

## Implementation slices

1. Catalog rationale and score trace contracts; resolve policy decisions and record version identifiers.
2. Bounded archive reads for rows, report versions, all-store series, coverage, and exports; validate privacy and revision behavior.
3. Public `/data` shell, footer entry, URL filters, accessible tables, raw JSON, and downloads.
4. Price chart, weekly heatmap, score breakdown, mapping drill-through, and contextual underlying-row navigation.
5. End-to-end verification, OpenAPI/docs updates, and the normal 1.5.1 release checklist. Create release notes and bump versions only when cutting the release.

## Acceptance and verification

- Any visitor can enter from the footer, load each view directly, share filters, and navigate back/forward without an account.
- A selected chart point opens the exact source/contributing rows; normalized observations can be traced to original retained fields, mapping, and report version.
- Raw data remains independently accessible and exposes original, normalized, archived-offer, and derived datasets with truthful labels.
- Tests verify normalized package conversions and benchmark weighted means against retained source fixtures, including rejected/incompatible rows and missing/invalid weights.
- The current score trace reproduces dashboard arithmetic and intermediate rounding for identical inputs. Verify category endpoints, negative discounts, missing baselines, zero/nonfinite denominators, stale/fallback inputs, and neutral momentum. No NaN/Infinity reaches the UI or exports.
- Cycle explanations match the final approved rule and distinguish deep discounts from observed lows. Fewer than six verified local weeks cannot establish a verified six-week low; repeated checks and USDA-only points cannot satisfy local coverage.
- All represented stores work; source periods remain distinct from retrieval/ad weeks. Null gaps survive chart/table/export round trips; no synthetic data enters verified summaries.
- Onion and other grouped ingredient pages show reviewed membership, exclusions, rationale, and source mapping limitations.
- CSV filters/order match the table across page boundaries; formula-like strings remain inert. JSON matches the audited stored public representation of the selected version. Revisions remain inspectable and snapshot pagination stays stable under concurrent ingestion.
- Public read/export routes deny access to personal data and non-allowlisted fields, enforce limits, and make no upstream provider calls or mutations. Test unauthorized database browser-role access remains denied.
- Keyless demonstration, cloud outage, partial sources, empty history, mobile layout, keyboard operation, and table alternatives work as specified.
- Before pushing: run typecheck, lint, unit tests, smoke tests, and production build. Run regression tests for the release PR to main. Require CI, Vercel preview, completed Codex review, and resolved actionable review feedback under the repository workflow.

## Implementation references

- `src/lib/scoring-and-matcher.ts`: score, action, and cycle rules.
- `src/data/canonical-ingredients.ts`: ingredient groups, keywords, and static baselines.
- `config/usda/*.json`: versioned report definitions and mappings.
- `src/lib/usda/read.ts`: benchmark selection, aggregation, and freshness.
- `src/lib/market/history.ts`: archive semantics and existing six-week summaries.
- `src/lib/market/history-summary.ts`: verified local coverage count.
