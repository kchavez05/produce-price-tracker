# Initial cooking catalog curation review

Status: Proposed for product review. No decisions below are approved or active. This is the first small batch under the [approved ingestion standards](../specs/usda-catalog-ingestion.md), not approval of the 6,463-record discovery pool.

The [versioned ledger](../../catalog/curation-ledger.json) contains the exact payloads, source-row fingerprints, rationales, and pending statuses. The [operator guide](../../catalog/README.md) explains review recording and replay. Existing app inventory, recipe matching, source data, prices, and all 69 existing ingredient IDs remain unchanged.

## Three proposed new choices

| New ID | User-facing name | Evidence and review boundary |
| --- | --- | --- |
| `lentils-dried` | Dried lentils | Foundation `2644283`, “Lentils, dry.” General dried form; no specific variety implied. |
| `lentils-canned` | Canned lentils | Curated source-gap proposal. No generic canned-lentil record was found in the Foundation/SR subset. No USDA reference is claimed. |
| `onions-fresh` | Onions | SR Legacy `170000`, “Onions, raw.” General fresh onion identity; no specific variety or grouped-market-offer mapping implied. |

All three new choices remain unpriced. Fixed estimates need explicit review when a recipe actually uses them; USDA identity data does not supply grocery prices. No source-to-market-price or recipe identity link is introduced for these new IDs.

## Proposed changes to existing choices

| Existing ID | Proposed presentation | What is preserved |
| --- | --- | --- |
| `red-lentils-dried` | Optional red variety under Dried lentils; still directly searchable as “red lentils” | Existing ID, label, $0.80/cup fixed estimate. Proposed identity evidence: SR `174284`, “Lentils, pink or red, raw.” Review the raw-source versus dried-culinary interpretation before approving this mapping. |
| `basmati-rice-dry` | Record rice family/dry form and basmati variety; retain its named primary choice | Existing ID, label, aliases, fixed estimate; no USDA link added. |
| `jasmine-rice-dry` | Record rice family/dry form and jasmine variety; retain its named primary choice | Existing ID, label, aliases, fixed estimate; no USDA link added. |
| `brown-rice-dry` | Record rice family/dry form and brown variety; retain its named primary choice | Existing ID, label, aliases, fixed estimate; no USDA link added. |
| `rice-flour` | Show for flour-qualified queries, keeping it out of a broad “rice” result list | Existing ID, label, aliases, fixed estimate; no USDA link added. |

Only the existing red-lentil choice becomes an optional variety in this batch. Green, brown, black, and other specific lentil varieties require later curation; unspecified dried lentils remains available for accurate broad entry.

## Proposed compatibility rule

Approve only `red-lentils-dried` → `lentils-dried`. This is a one-way, same-form rule. General dried lentils cannot establish red lentils; canned lentils cannot establish dried lentils. An explicit No for the required identity overrides derived coverage. Quantity zero and past dates do not change explicit availability. Multiple satisfying variants do not create multiple counts of a requirement.

The engine implements and tests this contract separately; live recipe matching remains exact-ID until the reviewed catalog and compatibility integration pass their migration/client gates.

## Proposed source exception

Keep all 74 parent-only Foundation records out of active source mappings while investigating. Sixty-eight share a description with subtype-backed records and six do not; these are investigation hints, not confirmed replacements.

The proposed exception is scoped to source release **2026-10-29**, owned by the **Catalog maintainer** role, with review due **2027-04-30**. It needs actual maintainer approval and an accountable owner before satisfying the publication gate. A new source release or missed deadline invalidates it automatically. It cannot authorize a published identity link to quarantined evidence.

## Verified preview behavior

The full-data curation run produces a 72-identity unapproved preview and preserves the exact 69-identity approved baseline. All 12 preview fixtures pass:

- `lentils`: Dried lentils and Canned lentils only.
- `red lentils`: the existing Dried red lentils choice.
- `rice`: the existing basmati, jasmine, and brown rice choices; no rice flour.
- `flour`: existing all-purpose wheat, whole wheat, and rice flour choices.
- `black beans`: existing canned and dried black beans.
- `garlic`, `onions`, `broth`, `cumin`, `paprika`, `tahini`, and `garbanzo`: their relevant cooking choices.

The approved artifact correctly fails the proposed lentil/rice/onion search expectations until approval is recorded. Quarantine approval is also outstanding. The command exits 2 and reports `publishable: false`, `published: false`; passing preview fixtures alone cannot activate this data.

## After product approval

Record the actual reviewer, approval date, and reviewed payload hash in new approvals, then rerun the command. The next implementation step is the additive server catalog migration, older-client/queue compatibility, and live grouped-search/recipe integration. These changes require their own local tests, CI/Preview, completed Codex review, isolated staging, and rollback verification. Product approval of this batch does not bypass those gates or enable Production.

Source: [USDA FoodData Central downloads](https://fdc.nal.usda.gov/download-datasets/), snapshot 2026-10-29. Source-specific fingerprints are preserved in the ledger; curated gaps are identified explicitly.
