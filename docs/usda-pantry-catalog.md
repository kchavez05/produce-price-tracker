# USDA pantry catalog review

The approved [USDA ingestion and cooking-ingredient standards](specs/usda-catalog-ingestion.md) define the required recurring curation, compact search presentation, update, and publication policy. This guide describes the current discovery tool; its output is not a user-facing ingredient list.

`npm run catalog:fdc` generates a reviewable candidate catalog from an extracted USDA FoodData Central CSV snapshot. It does not update the application catalog, pantry inventory, prices, recipe mappings, or any database. No network access or API key is required. The current app continues to use `src/data/pantry-ingredients.ts`.

## Run the importer

Requires the repository's Node dependencies and Python 3.10+ (`python3` on PATH). Set `FDC_IMPORT_PYTHON` to an explicit interpreter path when needed.

```bash
npm run catalog:fdc -- \
  --input /path/to/extracted/FoodData_Central_csv_2026-10-29 \
  --output data/fdc-catalog-review/2026-10-29 \
  --release 2026-10-29
```

Use a new output directory for each run; existing reviews are never overwritten. The input and output directories must be separate and cannot contain one another. The source release date is explicit rather than inferred from a directory name or the current date. Imported files are read-only. SHA-256 fingerprints before and after processing detect source changes during a run. The report also fingerprints the existing PantryBot catalog and records the import rules version.

Generated reviews live under the Git-ignored `data/fdc-catalog-review/` directory. Keep the raw USDA dump outside this repository. The full dump, candidate files, and Python importer are not part of the browser bundle. Commit only the importer, tests, documentation, and compact coverage report.

## Review files

- `candidates.json`: source-backed candidates, all marked `needs_review`; original descriptions, preparation tags, FDC IDs, NDB numbers, categories, publication dates, and footnotes are retained.
- `excluded.json`: original source references and the reason for excluding them from the initial candidate set.
- `report.json`: counts, file fingerprints, parent/subtype reconciliation, representative query coverage, and up to ten search suggestions for each existing ingredient. `suggestionCount` records the full count.
- `report.md`: compact human-readable results and the activation checklist. The checked-in [October 2026 report](research/usda-fdc-2026-10-29.md) is a snapshot of these results.

The importer reads `food.csv`, `food_category.csv`, `foundation_food.csv`, and `sr_legacy_food.csv`. It streams the large parent file and retains only relevant Foundation/SR records. Branded and survey counts come from the parent file; their product details, nutrients, and portion files are not imported.

## Identity and selection rules

1. Join subtype records to `food.csv` by `fdc_id`. Missing parents, mismatched data types, malformed headers/rows, duplicate relevant IDs, invalid source IDs, and invalid relevant publication dates fail the import before creating output.
2. Hold parent-only Foundation/SR records in the reconciliation report. Exact descriptions of other records provide investigation hints; they do not establish replacement or equivalence. The October snapshot has 498 Foundation-tagged parent records but 424 subtype records.
3. Group source references sharing an NDB number into a candidate for review. NDB identifies a food in a particular form across Foundation/SR; FDC identifies a source record and can change when the record is updated. These candidate IDs are separate from PantryBot ingredient IDs. Missing NDB numbers use an FDC-based candidate ID. Source-description disagreements and multiple same-type references receive review notes. [USDA identifier documentation](https://fdc.nal.usda.gov/help/)
4. Exclude baby foods, sweets, fast foods, meals/entrees/side dishes, snacks, restaurant foods, and quality-control materials by their USDA category IDs. Also exclude descriptions containing the word “soup” unless they contain broth, bouillon, or consomme. Preserve broth as a pantry candidate. These are conservative initial triage rules; excluded records remain reviewable and remaining candidates are not guaranteed suitable.
5. Preserve source descriptions as proposed labels. Do not silently rewrite qualifiers or invent varieties. Preparation tags report explicit text only; “raw” does not automatically become “dry.” Friendly names and aliases require review.
6. Search suggestions compare whole normalized word sets from existing names/aliases with candidate descriptions. A small explicit singular-word list and removal of a few preparation words help discovery. This can suggest different preparations and must never establish identity, availability, dietary compatibility, or substitutions. Every suggestion requires manual approval; no source record is automatically linked to an existing ingredient.

Foundation foods receive display preference within a grouped candidate; source record ordering is deterministic, not a declaration that a particular record is the current authoritative version. Review all source references when selecting a nutrition reference later. Do not infer allergen-free status or missing nutrient values from names.

## Activation is a separate change

Start by reviewing Foundation-backed candidates, then use SR Legacy to fill gaps such as spices, sauces, and additional preparations. Resolve names and varieties, preserve existing ingredient IDs, and explicitly approve links to recipe requirements. A broad “lentils” entry must not silently establish availability of every lentil variety.

Approved additions need a separate catalog PR with the matching database catalog migration and identity/coverage tests. Fixed recipe-use cost estimates remain a separate PantryBot assumption; this import supplies no grocery prices. Unknown prices must remain explicit.

For v1.6.2, use branded records as a separate product lookup source: retain barcode strings and leading zeros, distinguish product revisions, and ask users to confirm a generic pantry match. Do not infer ownership of every ingredient listed in a mixed product. API search/details can later refresh cached data and fill barcode misses; keep those calls server-side and separate from the existing USDA MARS market-price pipeline. [USDA API guide](https://fdc.nal.usda.gov/api-guide/)

Source: [USDA FoodData Central downloads](https://fdc.nal.usda.gov/download-datasets/), public domain under [CC0 as documented by USDA](https://fdc.nal.usda.gov/api-guide/#licensing).
