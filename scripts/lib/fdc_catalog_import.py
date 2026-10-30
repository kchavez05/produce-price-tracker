"""Read-only FDC bulk import into review artifacts, never the active catalog."""
import argparse
import collections
import csv
import datetime
import hashlib
import json
import re
import sys
import unicodedata
import uuid
from pathlib import Path

RULES_VERSION = 1
FILES = {
    'food.csv': {'fdc_id', 'data_type', 'description', 'food_category_id', 'publication_date'},
    'foundation_food.csv': {'fdc_id', 'NDB_number', 'footnote'},
    'sr_legacy_food.csv': {'fdc_id', 'NDB_number'},
    'food_category.csv': {'id', 'description'},
}
TYPES = {'foundation_food', 'sr_legacy_food'}
# Broad triage only. Inclusion never means approved as a pantry identity.
EXCLUDED_CATEGORIES = {'3', '19', '21', '22', '23', '25', '27'}
QUERIES = ['lentils', 'rice', 'flour', 'beans', 'cumin', 'paprika', 'tahini']


def normalized(text):
    return ' '.join(unicodedata.normalize('NFC', text).casefold().split())


def tokens(text):
    # Search suggestions only: no automatic linking, merging, or substitution.
    ignored = {'dry', 'dried', 'fresh', 'canned', 'or', 'and', 'raw'}
    singular = {'lentils': 'lentil', 'beans': 'bean', 'chickpeas': 'chickpea',
                'garbanzos': 'garbanzo', 'seeds': 'seed', 'tomatoes': 'tomato'}
    return {singular.get(word, word) for word in re.findall(r'[^\W_]+', normalized(text)) if word not in ignored}


def preparation(description):
    text = normalized(description)
    return [label for label, pattern in [
        ('dry', r'\b(dry|dried)\b'), ('raw', r'\braw\b'),
        ('canned', r'\bcanned\b'), ('cooked', r'\b(cooked|boiled|roasted|fried)\b'),
        ('frozen', r'\bfrozen\b'), ('sprouted', r'\bsprouted\b'),
        ('drained', r'\bdrained\b'), ('rinsed', r'\brinsed\b'),
    ] if re.search(pattern, text)]


def read_rows(path, required):
    with path.open(newline='', encoding='utf-8-sig') as stream:
        reader = csv.DictReader(stream, strict=True)
        fields = reader.fieldnames or []
        if len(fields) != len(set(fields)) or not required.issubset(fields):
            raise ValueError(f'{path.name}: missing or duplicate columns; required: {sorted(required)}')
        for row in reader:
            if None in row or any(value is None for value in row.values()):
                raise ValueError(f'{path.name}: inconsistent field count near CSV line {reader.line_num}')
            yield row


def keyed_rows(path, required, key):
    result = {}
    for row in read_rows(path, required):
        identity = row[key]
        if not identity.isdigit() or identity in result:
            raise ValueError(f'{path.name}: blank or duplicate {key}: {identity!r}')
        result[identity] = row
    return result


def file_metadata(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return {'file': path.name, 'bytes': path.stat().st_size, 'sha256': digest.hexdigest()}


def build_review(source, release, existing):
    before = [file_metadata(source / name) for name in FILES]
    categories = keyed_rows(source / 'food_category.csv', FILES['food_category.csv'], 'id')
    subtypes = {
        kind: keyed_rows(source / f'{kind}.csv', FILES[f'{kind}.csv'], 'fdc_id')
        for kind in sorted(TYPES)
    }
    wanted = set().union(*(set(rows) for rows in subtypes.values()))
    food = {}
    counts = collections.Counter()
    for row in read_rows(source / 'food.csv', FILES['food.csv']):
        counts[row['data_type']] += 1
        if row['data_type'] in TYPES or row['fdc_id'] in wanted:
            identity = row['fdc_id']
            if not identity.isdigit() or identity in food or not row['description'].strip():
                raise ValueError(f'food.csv: blank/duplicate relevant ID or blank description: {identity!r}')
            try:
                if datetime.date.fromisoformat(row['publication_date']).isoformat() != row['publication_date']:
                    raise ValueError('Noncanonical calendar date')
            except ValueError as error:
                raise ValueError(f'food.csv: invalid publication date for {identity}') from error
            food[identity] = row

    candidates = {}
    excluded = []
    reconciliations = {}
    missing_categories = set()
    for kind, children in subtypes.items():
        parent_only = [row for row in food.values() if row['data_type'] == kind and row['fdc_id'] not in children]
        names = collections.defaultdict(list)
        for identity in children:
            row = food.get(identity)
            if not row or row['data_type'] != kind:
                raise ValueError(f'{kind}.csv: missing parent or mismatched food type for {identity}')
            names[normalized(row['description'])].append(identity)
        reconciliations[kind] = {
            'parentRows': counts[kind], 'subtypeRows': len(children),
            'parentOnly': [{**row, 'sameDescriptionSubtypeIds': sorted(names[normalized(row['description'])])}
                           for row in sorted(parent_only, key=lambda row: row['fdc_id'])],
            'handling': 'Held out of candidates. Same-description IDs are investigation hints, not proven replacements.',
        }
        for identity, child in sorted(children.items()):
            if child['NDB_number'] and not child['NDB_number'].isdigit():
                raise ValueError(f'{kind}.csv: invalid NDB number for {identity}')
            row = food[identity]
            category = categories.get(row['food_category_id'])
            if not category:
                missing_categories.add(row['food_category_id'])
            reference = {
                'dataType': kind, 'fdcId': identity, 'ndbNumber': child['NDB_number'] or None,
                'description': row['description'], 'publicationDate': row['publication_date'],
                'categoryId': row['food_category_id'], 'categoryName': category['description'] if category else None,
                'preparation': preparation(row['description']),
                'footnote': child.get('footnote') or None,
            }
            mixed_soup = re.search(r'\bsoup\b', normalized(row['description'])) and not re.search(r'\b(broth|bouillon|consomme)\b', normalized(row['description']))
            if row['food_category_id'] in EXCLUDED_CATEGORIES or mixed_soup:
                excluded.append({**reference, 'reason': 'prepared_soup' if mixed_soup else 'category_outside_initial_pantry_scope'})
                continue
            # NDB identifies a food in a specific form across Foundation/SR.
            # This groups source references for review; it creates no app identity.
            key = f"usda-ndb:{child['NDB_number']}" if child['NDB_number'] else f'usda-fdc:{identity}'
            candidate = candidates.setdefault(key, {'candidateId': key, 'reviewStatus': 'needs_review', 'sourceRecords': []})
            candidate['sourceRecords'].append(reference)

    result = []
    for candidate in candidates.values():
        candidate['sourceRecords'].sort(key=lambda r: (r['dataType'] != 'foundation_food', r['fdcId']))
        primary = candidate['sourceRecords'][0]
        candidate['suggestedDisplayName'] = primary['description']
        candidate['primaryFdcId'] = primary['fdcId']
        candidate['preparation'] = primary['preparation']
        candidate['reviewNotes'] = ['Review pantry suitability, display name, aliases, preparation, dietary implications, and recipe mapping.']
        if len({normalized(r['description']) for r in candidate['sourceRecords']}) > 1:
            candidate['reviewNotes'].append('Descriptions differ across source records sharing this NDB number; review equivalence.')
        if len({r['dataType'] for r in candidate['sourceRecords']}) != len(candidate['sourceRecords']):
            candidate['reviewNotes'].append('Multiple records of the same data type share an NDB number; review version selection.')
        result.append(candidate)
    result.sort(key=lambda r: r['candidateId'])

    existing_review = []
    for ingredient in sorted(existing, key=lambda r: r['id']):
        searches = [tokens(name) for name in [ingredient['name'], *ingredient.get('aliases', [])]]
        matches = []
        for candidate in result:
            matched = [r for r in candidate['sourceRecords'] if any(query and query <= tokens(r['description']) for query in searches)]
            if matched:
                matches.append({'candidateId': candidate['candidateId'], 'description': candidate['suggestedDisplayName'],
                                'fdcIds': [r['fdcId'] for r in matched]})
        existing_review.append({'ingredientId': ingredient['id'], 'name': ingredient['name'], 'suggestionCount': len(matches),
                                'suggestions': matches[:10], 'status': 'review_suggestions_only' if matches else 'no_search_suggestion'})
    coverage = []
    for query in QUERIES:
        wanted_tokens = tokens(query)
        selected = [c for c in result if any(wanted_tokens <= tokens(r['description']) for r in c['sourceRecords'])]
        coverage.append({'query': query, 'candidateCount': len(selected),
                         'sourceCounts': {kind: sum(1 for c in selected for r in c['sourceRecords'] if r['dataType'] == kind) for kind in sorted(TYPES)},
                         'examples': [{'candidateId': c['candidateId'], 'description': c['suggestedDisplayName']} for c in selected[:15]]})
    after = [file_metadata(source / name) for name in FILES]
    if before != after:
        raise ValueError('Source files changed during import; rerun against a stable extracted snapshot.')
    summary = {
        'formatVersion': 1, 'rulesVersion': RULES_VERSION,
        'source': {'publisher': 'USDA Agricultural Research Service, FoodData Central', 'releaseDate': release,
                   'license': 'CC0-1.0', 'url': 'https://fdc.nal.usda.gov/download-datasets/', 'files': before},
        'existingCatalogSha256': hashlib.sha256(json.dumps(existing, sort_keys=True, ensure_ascii=False).encode('utf-8')).hexdigest(),
        'applicationEffect': 'None. No pantry entries, ingredient IDs, prices, recipe mappings, or databases are changed.',
        'counts': {'foodRowsByType': dict(sorted(counts.items())), 'candidateIdentities': len(result),
                   'candidateSourceRecords': sum(len(c['sourceRecords']) for c in result), 'excludedSourceRecords': len(excluded),
                   'existingIngredients': len(existing_review),
                   'existingWithSuggestions': sum(bool(r['suggestionCount']) for r in existing_review)},
        'categoryExclusions': [{'id': identity, 'name': categories.get(identity, {}).get('description')} for identity in sorted(EXCLUDED_CATEGORIES)],
        'unknownCategoryIds': sorted(missing_categories), 'reconciliation': reconciliations,
        'coverageQueries': coverage, 'existingCatalogReview': existing_review,
        'limitations': [
            'Candidates are not approved pantry ingredients. Search suggestions are not identity mappings.',
            'Broad and specific varieties, dry/canned/cooked forms, and dietary properties require review.',
            'No prices are supplied by this import. Existing fixed pantry estimates remain separate.',
            'Branded foods, nutrition, portions, samples, and acquisitions are not imported.',
        ],
    }
    source_records = []
    for kind, children in sorted(subtypes.items()):
        excluded_ids = {r['fdcId'] for r in excluded if r['dataType'] == kind}
        for identity, row in sorted(food.items()):
            if row['data_type'] != kind:
                continue
            child = children.get(identity, {})
            category = categories.get(row['food_category_id'], {})
            record = {'dataType': kind, 'fdcId': identity, 'ndbNumber': child.get('NDB_number') or None,
                      'description': row['description'], 'publicationDate': row['publication_date'],
                      'categoryId': row['food_category_id'], 'categoryName': category.get('description'),
                      'footnote': child.get('footnote') or None}
            fingerprint = hashlib.sha256(json.dumps(record, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode('utf-8')).hexdigest()
            source_records.append({**record, 'key': f'{kind}:{identity}', 'fingerprint': fingerprint,
                                   'disposition': 'quarantined' if identity not in children else 'excluded' if identity in excluded_ids else 'candidate'})
    summary['sourceRecordsVersion'] = 1
    return summary, result, sorted(excluded, key=lambda r: (r['dataType'], r['fdcId'])), source_records


def markdown_report(summary):
    counts = summary['counts']
    lines = [f"# USDA pantry catalog review — {summary['source']['releaseDate']}", '',
             'Generated by `npm run catalog:fdc`. This is a candidate review, not an active catalog update.', '',
             f"- Candidate identities: **{counts['candidateIdentities']:,}** from {counts['candidateSourceRecords']:,} source records.",
             f"- Excluded source records: **{counts['excludedSourceRecords']:,}** under the initial category rules.",
             f"- Existing ingredients with search suggestions: **{counts['existingWithSuggestions']} of {counts['existingIngredients']}**. These are review leads, not verified coverage.", '',
             '| Source | Parent food rows | Subtype rows | Parent-only rows held for investigation |',
             '| --- | ---: | ---: | ---: |']
    for kind, reconciliation in sorted(summary['reconciliation'].items()):
        lines.append(f"| {kind} | {reconciliation['parentRows']:,} | {reconciliation['subtypeRows']:,} | {len(reconciliation['parentOnly']):,} |")
    foundation = summary['reconciliation']['foundation_food']['parentOnly']
    same_names = sum(bool(row['sameDescriptionSubtypeIds']) for row in foundation)
    lines += ['', f'Of the {len(foundation)} Foundation parent-only records, {same_names} share a description with a subtype-backed record; {len(foundation) - same_names} have no exact-description counterpart. All remain held for investigation.', '', '## Search coverage', '', '| Query | Candidate identities | Foundation references | SR Legacy references |', '| --- | ---: | ---: | ---: |']
    for item in summary['coverageQueries']:
        lines.append(f"| {item['query']} | {item['candidateCount']} | {item['sourceCounts']['foundation_food']} | {item['sourceCounts']['sr_legacy_food']} |")
    lines += ['', '## Lentil candidates', '']
    for item in next(item for item in summary['coverageQueries'] if item['query'] == 'lentils')['examples']:
        lines.append(f"- `{item['candidateId']}`: {item['description']}")
    lines += ['', '## Existing ingredients with no search suggestion', '', ', '.join(r['name'] for r in summary['existingCatalogReview'] if not r['suggestionCount']) or 'None.', '',
              '## Review before activation', '',
              '1. Resolve parent/subtype discrepancies and source-version questions; do not assume same names prove replacement.',
              '2. Approve pantry suitability, friendly names, aliases, varieties, and preparation forms.',
              '3. Explicitly link existing IDs and recipe requirements; never use search similarity as ownership coverage.',
              '4. Add fixed cost estimates only for reviewed recipe-use units, keeping missing prices explicit.',
              '5. Activate reviewed additions through a separate catalog and database-migration PR.', '',
              'Category exclusions and the prepared-soup rule are initial triage, not a guarantee that remaining records are suitable pantry ingredients. Every candidate still needs review.', '',
              'Branded records remain a separate product lookup effort for v1.6.2. Barcode strings and revision history must be preserved. Nutrition and portions are deferred.', '',
              '## Input fingerprints', '', '| File | Bytes | SHA-256 |', '| --- | ---: | --- |']
    for item in summary['source']['files']:
        lines.append(f"| {item['file']} | {item['bytes']:,} | `{item['sha256']}` |")
    lines += ['', f"Existing catalog SHA-256: `{summary['existingCatalogSha256']}`. Rules version: {RULES_VERSION}.", '', 'Source: [USDA FoodData Central downloads](https://fdc.nal.usda.gov/download-datasets/) (CC0-1.0).', '']
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, required=True, help='Extracted FDC CSV directory (read-only)')
    parser.add_argument('--output', type=Path, required=True, help='New review directory, separate from the input')
    parser.add_argument('--release', required=True, help='Source release date in YYYY-MM-DD format')
    args = parser.parse_args()
    audit = {'runId': str(uuid.uuid4()), 'startedAtIso': datetime.datetime.now(datetime.timezone.utc).isoformat(),
             'importer': 'fdc-discovery-v1', 'rulesVersion': RULES_VERSION, 'sourceRelease': args.release, 'published': False}
    try:
        if datetime.date.fromisoformat(args.release).isoformat() != args.release:
            raise ValueError('Release date must use YYYY-MM-DD.')
        source, output = args.input.resolve(), args.output.resolve()
        if source == output or source in output.parents or output in source.parents:
            raise ValueError('Input and output directories must be separate, not nested.')
        if output.exists():
            raise ValueError('Output already exists. Choose a new review directory to preserve previous review work.')
        existing = json.load(sys.stdin)
        if not isinstance(existing, list) or any(not isinstance(r, dict) or not isinstance(r.get('id'), str) or
                not isinstance(r.get('name'), str) or not isinstance(r.get('aliases', []), list) or
                any(not isinstance(a, str) for a in r.get('aliases', [])) for r in existing):
            raise ValueError('Expected an existing ingredient catalog as JSON on stdin.')
        if len({r['id'] for r in existing}) != len(existing):
            raise ValueError('Existing ingredient IDs must be unique.')
        summary, candidates, excluded, source_records = build_review(source, args.release, existing)
        output.mkdir(parents=True, exist_ok=False)
        for name, value in [('candidates.json', {'formatVersion': 1, 'rulesVersion': RULES_VERSION, 'candidates': candidates}),
                            ('report.json', summary), ('excluded.json', excluded),
                            ('source-records.json', {'formatVersion': 1, 'rulesVersion': RULES_VERSION, 'releaseDate': args.release, 'records': source_records})]:
            (output / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        (output / 'report.md').write_text(markdown_report(summary), encoding='utf-8')
        (output / 'audit.json').write_text(json.dumps({**audit, 'outcome': 'discovered', 'sourceManifest': summary['source'], 'counts': summary['counts']}, indent=2) + '\n', encoding='utf-8')
        print(json.dumps({'output': str(output), **summary['counts']}))
        return 0
    except (ValueError, OSError, csv.Error) as error:
        print(json.dumps({**audit, 'outcome': 'validation_failed', 'error': str(error)}), file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
