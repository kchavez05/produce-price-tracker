"""Offline barcode feasibility audit. Outputs are review artifacts, never runtime data."""
import argparse
import collections
import csv
import datetime
import hashlib
import json
import re
import sqlite3
import time
from pathlib import Path

VERSION = 'barcode-feasibility-v1'
FIELDS = {
    'food.csv': {'fdc_id', 'data_type', 'description', 'publication_date'},
    'branded_food.csv': {'fdc_id', 'gtin_upc', 'brand_owner', 'brand_name', 'market_country',
                         'package_weight', 'modified_date', 'available_date', 'discontinued_date'},
}


def digest(path):
    result = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            result.update(chunk)
    return result.hexdigest()


def code_status(code):
    # Raw source strings are not trimmed, cast to numbers, or repaired.
    if not re.fullmatch(r'[0-9]+', code or ''):
        return 'missing' if not code else 'non_digits', None
    if len(code) not in (8, 12, 13, 14):
        return 'unsupported_length', None
    total = sum(int(digit) * (3 if i % 2 == 0 else 1) for i, digit in enumerate(reversed(code[:-1])))
    if (10 - total % 10) % 10 != int(code[-1]):
        return 'bad_check_digit', None
    if len(code) == 8:
        return 'deferred_8_digit', None
    # Validated GS1 zero-fill equivalence only, never GTIN-14 packaging indicators.
    key = '0' * (14 - len(code)) + code
    if key[0] != '0':
        return 'packaging_or_variable_measure', None
    # GS1 prefixes use the EAN-13 namespace: UPC-A 2/4/5 -> EAN 02/04/05.
    # UPC-A 02/04/05 instead -> EAN 002/004/005 (ordinary company prefixes).
    ean = key[1:]
    if ean.startswith(('02', '04', '05', '2', '98', '99', '977', '978', '979', '00000')):
        return 'restricted_reserved_or_nonfood', None
    return 'candidate', key


def valid_date(text, cutoff):
    try:
        value = datetime.date.fromisoformat(text)
        return value.isoformat() == text and value <= cutoff
    except ValueError:
        return False


def rows(path, required):
    with path.open(encoding='utf-8-sig', newline='') as stream:
        reader = csv.DictReader(stream, strict=True)
        if not reader.fieldnames or not required <= set(reader.fieldnames) or len(reader.fieldnames) != len(set(reader.fieldnames)):
            raise ValueError(f'{path.name}: missing or duplicate headers')
        for row in reader:
            if None in row or any(value is None for value in row.values()):
                raise ValueError(f'{path.name}: malformed CSV row')
            if not re.fullmatch(r'[1-9][0-9]*', row['fdc_id']):
                raise ValueError(f'{path.name}: invalid FDC ID')
            yield row


def batched_insert(db, sql, source):
    batch = []
    for row in source:
        batch.append(row)
        if len(batch) == 5000:
            db.executemany(sql, batch)
            batch.clear()
    db.executemany(sql, batch)
    db.commit()


def audit(source, output, cutoff, expected=None, sample_file=None):
    source, output = source.resolve(), output.resolve()
    if output == source or source in output.parents or output in source.parents:
        raise ValueError('Input and output must be separate, non-nested directories')
    if output.exists():
        raise ValueError('Output exists; use a new directory')
    manifest = {name: {'bytes': (source / name).stat().st_size, 'sha256': digest(source / name)} for name in FIELDS}
    if expected is not None and manifest != expected:
        raise ValueError('Source manifest differs from the recorded snapshot')
    output.mkdir(parents=True)
    started = time.monotonic()
    db = sqlite3.connect(output / 'audit.sqlite')
    db.execute('PRAGMA journal_mode=OFF')
    db.execute('PRAGMA synchronous=OFF')
    db.execute('CREATE TABLE food(fdc_id TEXT PRIMARY KEY, description TEXT, published TEXT)')
    db.execute('''CREATE TABLE branded(fdc_id TEXT PRIMARY KEY, raw_code TEXT, key TEXT, status TEXT,
        market TEXT, us INTEGER, owner TEXT, brand TEXT, package TEXT, modified TEXT, available TEXT,
        discontinued TEXT, dates_valid INTEGER)''')
    parents = collections.Counter()

    def foods():
        for row in rows(source / 'food.csv', FIELDS['food.csv']):
            parents[row['data_type']] += 1
            if row['data_type'] == 'branded_food':
                yield row['fdc_id'], row['description'], row['publication_date']
    batched_insert(db, 'INSERT INTO food VALUES(?,?,?)', foods())
    statuses, lengths, markets = collections.Counter(), collections.Counter(), collections.Counter()
    samples = []
    # Retain source evidence for the already-audited representative products, not fuzzy mappings.
    selection = json.loads(sample_file.read_text()) if sample_file else {'fdc_ids': []}
    selected = set(selection['fdc_ids'])

    def branded():
        for row in rows(source / 'branded_food.csv', FIELDS['branded_food.csv']):
            code = row['gtin_upc']
            status, key = code_status(code)
            statuses[status] += 1
            lengths[str(len(code))] += 1
            market = row['market_country']
            markets[market] += 1
            dates_valid = all(not row[field] or valid_date(row[field], cutoff)
                              for field in ['modified_date', 'available_date', 'discontinued_date'])
            if row['fdc_id'] in selected:
                samples.append(row)
            yield (row['fdc_id'], code, key, status, market, int(market.strip().casefold() in ('us', 'united states')),
                   row['brand_owner'], row['brand_name'], row['package_weight'], row['modified_date'],
                   row['available_date'], row['discontinued_date'], int(dates_valid))
    batched_insert(db, 'INSERT INTO branded VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)', branded())
    db.execute('CREATE INDEX barcode_key ON branded(key,us)')
    missing = db.execute('SELECT count(*) FROM branded b LEFT JOIN food f USING(fdc_id) WHERE f.fdc_id IS NULL').fetchone()[0]
    parent_only = db.execute('SELECT count(*) FROM food f LEFT JOIN branded b USING(fdc_id) WHERE b.fdc_id IS NULL').fetchone()[0]
    db.execute('''CREATE TABLE products AS SELECT b.*, f.description, f.published FROM branded b JOIN food f USING(fdc_id)''')
    db.execute('ALTER TABLE products ADD COLUMN pub_valid INTEGER')
    bad_dates = [r[0] for r in db.execute('SELECT DISTINCT published FROM products') if not valid_date(r[0], cutoff)]
    db.execute('UPDATE products SET pub_valid=1')
    db.executemany('UPDATE products SET pub_valid=0 WHERE published=?', [(date,) for date in bad_dates])
    db.execute('CREATE INDEX products_lookup ON products(key,us,published)')
    # Newest applicable record first; discontinued/latest-invalid must not resurrect an older row.
    db.execute('''CREATE TABLE decisions AS
        SELECT key, max(published) latest, count(*) revisions,
        min(pub_valid * dates_valid) dates_valid
        FROM products WHERE key IS NOT NULL AND us=1 GROUP BY key''')
    db.execute('CREATE UNIQUE INDEX decision_key ON decisions(key)')
    db.execute('''CREATE TABLE heads AS SELECT d.key,d.latest,d.revisions,d.dates_valid,count(*) ties,
        max(p.discontinued!='') discontinued
        FROM decisions d JOIN products p ON p.key=d.key AND p.us=1 AND p.published=d.latest GROUP BY d.key''')
    outcomes = dict(db.execute('''SELECT CASE WHEN dates_valid=0 THEN 'date_hold'
        WHEN ties>1 THEN 'ambiguous_latest' WHEN discontinued=1 THEN 'discontinued_latest'
        ELSE 'single_snapshot_record' END, count(*) FROM heads GROUP BY 1'''))
    multiple = db.execute('SELECT count(*) FROM decisions WHERE revisions>1').fetchone()[0]
    multi_raw = db.execute('''SELECT count(*) FROM (SELECT key FROM products WHERE key IS NOT NULL AND us=1
        GROUP BY key HAVING count(DISTINCT raw_code)>1)''').fetchone()[0]
    # This is a minimized local storage experiment, not a deployable/provider cache.
    db.commit()
    db.close()
    runtime = sqlite3.connect(output / 'lookup-size-probe.sqlite')
    runtime.execute('ATTACH DATABASE ? AS audit', (str(output / 'audit.sqlite'),))
    runtime.execute('''CREATE TABLE products AS SELECT p.key,p.fdc_id,p.raw_code,p.description,p.owner,p.brand,
        p.package,p.market,p.published,p.modified,p.available,p.discontinued
        FROM audit.products p JOIN audit.heads h ON h.key=p.key
        WHERE p.us=1 AND p.published=h.latest''')
    runtime.execute('CREATE TABLE outcomes AS SELECT * FROM audit.heads')
    runtime.execute('CREATE UNIQUE INDEX outcome_key ON outcomes(key)')
    runtime.execute('CREATE INDEX lookup_key ON products(key)')
    runtime.commit()
    keys = [r[0] for r in runtime.execute('SELECT key FROM products ORDER BY key LIMIT 1000')]
    times = []
    for key in keys:
        start = time.perf_counter_ns()
        runtime.execute('SELECT * FROM products WHERE key=?', (key,)).fetchall()
        times.append((time.perf_counter_ns() - start) / 1e6)
    runtime.close()
    db = sqlite3.connect(output / 'audit.sqlite')
    db.row_factory = sqlite3.Row
    enriched = []
    for sample in sorted(samples, key=lambda row: row['fdc_id']):
        parent = db.execute('SELECT description,published FROM food WHERE fdc_id=?', (sample['fdc_id'],)).fetchone()
        if not parent:
            continue
        status, key = code_status(sample['gtin_upc'])
        head = db.execute('SELECT * FROM heads WHERE key=?', (key,)).fetchone() if key else None
        evidence = {**sample, **dict(parent)}
        fingerprint = hashlib.sha256(json.dumps(evidence, sort_keys=True, separators=(',', ':'),
                                                ensure_ascii=False).encode('utf-8')).hexdigest()
        enriched.append({**evidence, 'source_row_fingerprint': fingerprint, 'code_status': status,
                         'lookup_key': key, 'us_revision_group': dict(head) if head else None})
    bounds = dict(zip(['oldest_publication', 'newest_publication'], db.execute('SELECT min(published),max(published) FROM products').fetchone()))
    after = {name: {'bytes': (source / name).stat().st_size, 'sha256': digest(source / name)} for name in FIELDS}
    if after != manifest:
        raise ValueError('Source changed during audit; discard incomplete output')
    times.sort()
    report = {'status': 'proposal_only_not_runtime_or_approved_mapping', 'rules_version': VERSION,
              'snapshot_label': cutoff.isoformat(), 'source_manifest': manifest,
              'food_rows_by_type': dict(parents), 'branded_rows': sum(statuses.values()),
              'barcode_statuses': dict(sorted(statuses.items())), 'raw_code_lengths': dict(sorted(lengths.items())),
              'markets': dict(sorted(markets.items())), 'missing_branded_parents': missing,
              'parent_only_branded': parent_only, 'us_lookup_outcomes': outcomes,
              'us_codes_with_multiple_revisions': multiple, 'us_keys_with_multiple_raw_representations': multi_raw,
              'publication_bounds': bounds, 'invalid_publication_dates': bad_dates,
              'representative_source_rows': len(enriched),
              'representative_selection_sha256': digest(sample_file) if sample_file else None,
              'maximum_latest_date_ties': db.execute('SELECT max(ties) FROM heads').fetchone()[0],
              'storage_probe': {'bytes': (output / 'lookup-size-probe.sqlite').stat().st_size,
                                'rows': sum(r[0] for r in db.execute('SELECT ties FROM heads')),
                                'keys': sum(outcomes.values()),
                                'scope': 'all US latest heads plus outcome markers, including ties and discontinued records; no ingredients, portions, mapping or inventory',
                                'warm_local_lookup_count': len(times),
                                'warm_local_p50_ms': times[len(times)//2] if times else None,
                                'warm_local_p95_ms': times[int(len(times)*.95)] if times else None},
              'elapsed_seconds': round(time.monotonic() - started, 3)}
    db.close()
    (output / 'report.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
    (output / 'examples.json').write_text(json.dumps(enriched, indent=2, ensure_ascii=False) + '\n')
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--snapshot', required=True, help='Explicit retained snapshot label/cutoff, not inferred from folder')
    parser.add_argument('--expected-manifest', type=Path)
    parser.add_argument('--samples', type=Path)
    args = parser.parse_args()
    try:
        if not re.fullmatch(r'[0-9]{4}-[0-9]{2}-[0-9]{2}', args.snapshot):
            raise ValueError('Snapshot must use YYYY-MM-DD')
        cutoff = datetime.date.fromisoformat(args.snapshot)
        expected = json.loads(args.expected_manifest.read_text())['source_manifest'] if args.expected_manifest else None
        print(json.dumps(audit(args.input, args.output, cutoff, expected, args.samples), indent=2))
    except (ValueError, OSError, sqlite3.Error, csv.Error) as error:
        parser.exit(1, f'Barcode audit failed: {error}\n')
