"""Build the approved, public-product-only barcode artifact offline. Never updates inventory."""
import argparse
import datetime
import hashlib
import importlib.util
import json
import shutil
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / 'catalog/proposals/2026-11-09-barcode-qualification'
DIGEST = 'f4888a5802f555b2919ed6b2ea6b5b9041876aa918153520c1d0a95299decb00'


def load(path):
    return json.loads(path.read_text(encoding='utf-8'))


def build(source, output):
    spec = importlib.util.spec_from_file_location('barcode_audit', ROOT / 'scripts/audit-fdc-barcodes.py')
    audit = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(audit)
    decision, envelope = load(PACKET / 'decision-record.json'), load(PACKET / 'review-envelope.json')
    if decision['status'] != 'approved_for_implementation' or decision['packetSha256'] != DIGEST or envelope['packetSha256'] != DIGEST or set(decision['approvedDecisions']) != {'BQ-01','BQ-02','BQ-03','BQ-04'}:
        raise ValueError('The exact barcode packet must be approved before building')
    for filename, expected in envelope['files'].items():
        if audit.digest(ROOT / filename) != expected:
            raise ValueError(f'Approved packet changed: {filename}')
    output = output.resolve()
    if output.exists():
        raise ValueError('Output exists; use a new directory')
    if output == source.resolve() or source.resolve() in output.parents or output in source.resolve().parents:
        raise ValueError('Input/output must be separate and non-nested')
    expected = load(PACKET / 'source-audit.json')['source_manifest']
    # The audit creates its own new output directory; source input remains read-only.
    report = audit.audit(source, output / 'audit', datetime.date(2026, 10, 29), expected, PACKET / 'sample-ids.json')
    records = {row['fdc_id']: row for row in load(output / 'audit/examples.json')}
    rules = [row for row in load(PACKET / 'mapping-proposals.json')['rules'] if row['status'] == 'proposed_not_active']
    catalog = {row['id'] for row in load(ROOT / 'src/data/cooking-catalog.json')['ingredients'] if row.get('lifecycle') != 'retired'}
    for rule in rules:
        row = records.get(rule['fdc_id'])
        if not row or rule['source_row_fingerprint'] != row['source_row_fingerprint'] or rule['original_barcode'] != row['gtin_upc'] or rule['lookup_key'] != row['lookup_key'] or rule['publication_date'] != row['published'] or rule['source_manifest'] != expected or rule['source_snapshot'] != '2026-10-29' or rule['source'] != 'USDA_FDC_BRANDED' or rule['market'] != 'US' or rule['ingredient_id'] not in catalog:
            raise ValueError('An exact approved product binding failed')
        head = row['us_revision_group']
        if row['market_country'].strip().casefold() not in ['us','united states'] or head['latest'] != row['published'] or head['ties'] != 1 or head['discontinued'] or not head['dates_valid']:
            raise ValueError('An approved product is not the unambiguous applicable snapshot head')
    artifact = output / 'index.sqlite'
    shutil.copyfile(output / 'audit/lookup-size-probe.sqlite', artifact)
    metadata = {'schemaVersion': 1, 'snapshotDate': '2026-10-29', 'packetSha256': DIGEST,
                'mappingSha256': audit.digest(PACKET / 'mapping-proposals.json'), 'sourceManifest': expected}
    db = sqlite3.connect(artifact)
    db.execute('CREATE TABLE barcode_metadata(value TEXT NOT NULL)')
    db.execute('INSERT INTO barcode_metadata VALUES(?)', (json.dumps(metadata, separators=(',',':')),))
    db.execute('CREATE TABLE mappings(fdc_id TEXT PRIMARY KEY, key TEXT NOT NULL, rule_id TEXT NOT NULL, ingredient_id TEXT NOT NULL, fingerprint TEXT NOT NULL)')
    db.executemany('INSERT INTO mappings VALUES(?,?,?,?,?)', [(r['fdc_id'],r['lookup_key'],r['rule_id'],r['ingredient_id'],r['source_row_fingerprint']) for r in rules])
    db.commit()
    assert db.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
    db.close()
    manifest = {**metadata, 'artifactSha256': audit.digest(artifact), 'artifactBytes': artifact.stat().st_size,
                'builtAtIso': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'mappingCount': len(rules),
                'productRows': report['storage_probe']['rows'], 'lookupKeys': report['storage_probe']['keys']}
    (output / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    # The full audit/history stays in this operator directory, never in the deployable index.
    return manifest


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    try:
        print(json.dumps(build(args.input, args.output), indent=2))
    except (ValueError, OSError, KeyError, sqlite3.Error) as error:
        parser.exit(1, f'Barcode build failed; discard incomplete output: {error}\n')
