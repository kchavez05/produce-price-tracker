# Initial cooking catalog curation review

Status: Approved by kchavez05 on October 30, 2026, in response to the exact initial-batch review question in the Codex chat. All ten payload approvals are recorded in the ledger; none is active in the app. This is the first small batch under the [approved ingestion standards](../specs/usda-catalog-ingestion.md), not approval of the 6,463-record discovery pool.

The [versioned ledger](../../catalog/curation-ledger.json) contains the exact payloads, source-row fingerprints, rationales, and approval metadata. The [operator guide](../../catalog/README.md) explains review recording and replay. Existing app inventory, recipe matching, source data, prices, and all 69 existing ingredient IDs remain unchanged.

## Three approved new choices

| New ID | User-facing name | Evidence and review boundary |
| --- | --- | --- |
| `lentils-dried` | Dried lentils | Foundation `2644283`, “Lentils, dry.” General dried form; no specific variety implied. |
| `lentils-canned` | Canned lentils | Curated source-gap proposal. No generic canned-lentil record was found in the Foundation/SR subset. No USDA reference is claimed. |
| `onions-fresh` | Onions | SR Legacy `170000`, “Onions, raw.” General fresh onion identity; no specific variety or grouped-market-offer mapping implied. |

All three new choices remain unpriced. Fixed estimates need explicit review when a recipe actually uses them; USDA identity data does not supply grocery prices. No source-to-market-price or recipe identity link is introduced for these new IDs.

## Approved changes to existing choices

| Existing ID | Approved presentation | What is preserved |
| --- | --- | --- |
| `red-lentils-dried` | Optional red variety under Dried lentils; still directly searchable as “red lentils” | Existing ID, label, $0.80/cup fixed estimate. Proposed identity evidence: SR `174284`, “Lentils, pink or red, raw.” Review the raw-source versus dried-culinary interpretation before approving this mapping. |
| `basmati-rice-dry` | Record rice family/dry form and basmati variety; retain its named primary choice | Existing ID, label, aliases, fixed estimate; no USDA link added. |
| `jasmine-rice-dry` | Record rice family/dry form and jasmine variety; retain its named primary choice | Existing ID, label, aliases, fixed estimate; no USDA link added. |
| `brown-rice-dry` | Record rice family/dry form and brown variety; retain its named primary choice | Existing ID, label, aliases, fixed estimate; no USDA link added. |
| `rice-flour` | Show for flour-qualified queries, keeping it out of a broad “rice” result list | Existing ID, label, aliases, fixed estimate; no USDA link added. |

Only the existing red-lentil choice becomes an optional variety in this batch. Green, brown, black, and other specific lentil varieties require later curation; unspecified dried lentils remains available for accurate broad entry.

## Approved compatibility rule

Approved only `red-lentils-dried` → `lentils-dried`. This is a one-way, same-form rule. General dried lentils cannot establish red lentils; canned lentils cannot establish dried lentils. An explicit No for the required identity overrides derived coverage. Quantity zero and past dates do not change explicit availability. Multiple satisfying variants do not create multiple counts of a requirement.

The engine implements and tests this contract separately; live recipe matching remains exact-ID until the reviewed catalog and compatibility integration pass their migration/client gates.

## Approved source exception

Keep all 74 parent-only Foundation records out of active source mappings while investigating. Sixty-eight share a description with subtype-backed records and six do not; these are investigation hints, not confirmed replacements.

The approved exception is scoped to source release **2026-10-29**, owned by the **Catalog maintainer** role, with review due **2027-04-30**. The maintainer explicitly approved this hold and role ownership as part of the batch; the Catalog maintainer initiating the next refresh is accountable for its review. A new source release or missed deadline invalidates it automatically. It cannot authorize a published identity link to quarantined evidence.

## Verified catalog behavior

The pre-approval full-data run produced a 72-identity unapproved preview and preserved the exact 69-identity baseline. With approval recorded, the compiled artifact now contains 72 approved identities. All 12 search fixtures pass:

- `lentils`: Dried lentils and Canned lentils only.
- `red lentils`: the existing Dried red lentils choice.
- `rice`: the existing basmati, jasmine, and brown rice choices; no rice flour.
- `flour`: existing all-purpose wheat, whole wheat, and rice flour choices.
- `black beans`: existing canned and dried black beans.
- `garlic`, `onions`, `broth`, `cumin`, `paprika`, `tahini`, and `garbanzo`: their relevant cooking choices.

Before approval, the approved artifact correctly failed the new lentil/rice/onion expectations and the command exited 2. After recording the explicit batch approval against unchanged payload hashes, the full-data run exits 0: 72 approved identities, zero pending decisions, and all 12 fixtures passing against both artifacts. It reports `publishable: true`, `published: false`; this is readiness for integration, not activation. The [release manifest](../../catalog/releases/2026-10-30.1/manifest.json) records the result and remaining gates.

## Integration gates

The actual reviewer, approval date, and unchanged reviewed payload hashes are now recorded, and the approved artifact is retained in `catalog/releases/2026-10-30.1/`. The next implementation step is the additive server catalog migration, older-client/queue compatibility, and live grouped-search/recipe integration. These changes require their own local tests, CI/Preview, completed Codex review, isolated staging, and rollback verification. Product approval of this batch does not bypass those gates or enable Production.

Source: [USDA FoodData Central downloads](https://fdc.nal.usda.gov/download-datasets/), snapshot 2026-10-29. Source-specific fingerprints are preserved in the ledger; curated gaps are identified explicitly.
