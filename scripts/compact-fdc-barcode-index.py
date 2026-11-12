"""Losslessly repack the independently pinned public barcode index offline."""
import argparse
from contextlib import closing
import hashlib
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_PIN = ROOT / 'deployment/barcode-artifact-v1.json'
REPACK_PIN = ROOT / 'deployment/barcode-artifact.json'
FIELDS = ('description', 'owner', 'brand', 'package', 'market', 'published', 'modified', 'available', 'discontinued')
TABLES = {'products': 'key,fdc_id', 'outcomes': 'key', 'mappings': 'fdc_id', 'barcode_metadata': 'value'}


def digest(filename):
    result = hashlib.sha256()
    with filename.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            result.update(chunk)
    return result.hexdigest()


def verify_source(source, pin):
    if any((source / ('index.sqlite' + suffix)).exists() or (source / ('index.sqlite' + suffix)).is_symlink()
           for suffix in ('-wal', '-shm', '-journal')):
        raise ValueError('Source SQLite sidecars are not permitted')
    for name in ('index.sqlite', 'manifest.json'):
        filename = source / name
        if filename.is_symlink() or not filename.is_file():
            raise ValueError('Source must contain regular, non-symlink artifact files')
    if (source / 'index.sqlite').stat().st_size != pin['artifactBytes'] or (source / 'manifest.json').stat().st_size > 8192:
        raise ValueError('Source size differs from the original reviewed pin')
    if digest(source / 'index.sqlite') != pin['artifactSha256'] or digest(source / 'manifest.json') != pin['manifestSha256']:
        raise ValueError('Source digest differs from the original reviewed pin')


def logical_receipt(db, table, order):
    result = hashlib.sha256()
    cursor = db.execute(f'SELECT * FROM {table} ORDER BY {order}')
    columns = [column[0] for column in cursor.description]
    count = 0
    for row in cursor:
        if any(not isinstance(value, (str, int, float, type(None))) for value in row):
            raise ValueError(f'Unsupported SQLite value type: {table}')
        # JSON preserves string/integer/null distinctions and escaping without delimiters in data.
        result.update(json.dumps(row, separators=(',', ':'), ensure_ascii=True).encode('ascii') + b'\n')
        count += 1
    return {'columns': columns, 'rows': count, 'sha256': result.hexdigest()}


def compact(source, output, pin=None):
    expected = json.loads(REPACK_PIN.read_text(encoding='utf-8')) if pin is None else None
    pin = pin if pin is not None else json.loads(SOURCE_PIN.read_text(encoding='utf-8'))
    if expected and sqlite3.sqlite_version != expected['compactionSqliteVersion']:
        raise ValueError('SQLite version differs from the reviewed repack pin; use its recorded version or obtain a reviewed pin update')
    source, output = source.resolve(), output.resolve()
    if output == source or source in output.parents or output in source.parents:
        raise ValueError('Input/output must be separate and non-nested')
    if output.exists():
        raise ValueError('Output exists; use a new directory')
    verify_source(source, pin)
    manifest = json.loads((source / 'manifest.json').read_text(encoding='utf-8'))
    output.mkdir()  # Refuse overwrites, including broken symlinks; preserve source and partial failures.
    filename = output / 'index.sqlite'
    with closing(sqlite3.connect(filename.as_uri(), uri=True)) as db:
        db.execute('PRAGMA foreign_keys=ON')
        db.execute('ATTACH DATABASE ? AS original', ((source / 'index.sqlite').as_uri() + '?mode=ro&immutable=1',))
        db.execute('CREATE TABLE labels(id INTEGER PRIMARY KEY,value TEXT NOT NULL)')
        union = ' UNION '.join(f'SELECT "{field}" AS value FROM original.products' for field in FIELDS)
        union += ' UNION SELECT latest AS value FROM original.outcomes'
        db.execute(f'INSERT INTO labels(value) SELECT value FROM ({union}) ORDER BY value COLLATE BINARY')
        db.execute('CREATE UNIQUE INDEX label_value ON labels(value)')
        fields = ','.join(f'"{field}" INTEGER NOT NULL REFERENCES labels(id)' for field in FIELDS)
        db.execute(f'''CREATE TABLE product_records(key TEXT NOT NULL,fdc_id TEXT NOT NULL,
            raw_code TEXT NOT NULL,{fields},PRIMARY KEY(key,fdc_id)) WITHOUT ROWID''')
        joins = ' '.join(f'JOIN labels l{i} ON l{i}.value=p."{field}"' for i, field in enumerate(FIELDS))
        ids = ','.join(f'l{i}.id' for i in range(len(FIELDS)))
        db.execute(f'''INSERT INTO product_records SELECT p.key,p.fdc_id,p.raw_code,{ids}
            FROM original.products p {joins} ORDER BY p.key,p.fdc_id''')
        projection = ','.join(f'l{i}.value AS "{field}"' for i, field in enumerate(FIELDS))
        joins = ' '.join(f'JOIN labels l{i} ON l{i}.id=p."{field}"' for i, field in enumerate(FIELDS))
        db.execute(f'CREATE VIEW products AS SELECT p.key,p.fdc_id,p.raw_code,{projection} FROM product_records p {joins}')
        db.execute('''CREATE TABLE outcome_records(key TEXT PRIMARY KEY,latest INTEGER NOT NULL REFERENCES labels(id),
            revisions INTEGER,dates_valid INTEGER,ties INTEGER,discontinued INTEGER) WITHOUT ROWID''')
        db.execute('''INSERT INTO outcome_records SELECT o.key,l.id,o.revisions,o.dates_valid,o.ties,o.discontinued
            FROM original.outcomes o JOIN labels l ON l.value=o.latest ORDER BY o.key''')
        db.execute('''CREATE VIEW outcomes AS SELECT o.key,l.value AS latest,o.revisions,o.dates_valid,o.ties,o.discontinued
            FROM outcome_records o JOIN labels l ON l.id=o.latest''')
        db.execute('CREATE TABLE barcode_metadata(value TEXT NOT NULL)')
        db.execute('CREATE TABLE mappings(fdc_id TEXT PRIMARY KEY, key TEXT NOT NULL, rule_id TEXT NOT NULL, ingredient_id TEXT NOT NULL, fingerprint TEXT NOT NULL)')
        for table in ('barcode_metadata', 'mappings'):
            db.execute(f'INSERT INTO {table} SELECT * FROM original.{table}')
        db.execute('DROP INDEX label_value')
        db.commit()
        db.execute('VACUUM')
        if db.execute('PRAGMA integrity_check').fetchone()[0] != 'ok' or db.execute('PRAGMA foreign_key_check').fetchall():
            raise ValueError('Compacted index integrity check failed')
        # Compare every logical field and row, including multiplicity and SQLite value types.
        receipt = {}
        original = sqlite3.connect((source / 'index.sqlite').as_uri() + '?mode=ro&immutable=1', uri=True)
        try:
            for table, order in TABLES.items():
                before = logical_receipt(original, table, order)
                after = logical_receipt(db, table, order)
                if before != after:
                    raise ValueError(f'Compaction changed logical rows: {table}')
                receipt[table] = before
        finally:
            original.close()
    verify_source(source, pin)
    manifest.update(artifactBytes=filename.stat().st_size, artifactSha256=digest(filename),
                    storageLayout='interned-labels-v1', sourceArtifactSha256=pin['artifactSha256'],
                    logicalContent=receipt, compactionSqliteVersion=sqlite3.sqlite_version)
    if manifest['artifactBytes'] >= pin['artifactBytes']:
        raise ValueError('Compaction did not reduce the artifact size')
    manifest_text = json.dumps(manifest, indent=2) + '\n'
    if expected and (manifest != {key: value for key, value in expected.items() if key != 'manifestSha256'} or
                     hashlib.sha256(manifest_text.encode('utf-8')).hexdigest() != expected['manifestSha256']):
        raise ValueError('Repack differs from the reviewed output pin; do not package or re-pin without review')
    (output / 'manifest.json').write_text(manifest_text, encoding='utf-8')
    return {**manifest, 'manifestSha256': digest(output / 'manifest.json')}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    try:
        print(json.dumps(compact(args.input, args.output), indent=2))
    except (ValueError, OSError, KeyError, sqlite3.Error) as error:
        parser.exit(1, f'Barcode compaction failed; discard incomplete output: {error}\n')
