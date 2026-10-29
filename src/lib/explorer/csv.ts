import type { DataRow } from './types';
function cell(value: unknown) {
  let text =
    typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
  if (typeof value !== 'number' && /^[\s\u0000-\u001f]*[=+@-]/.test(text))
    text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
export function rowsCsv(rows: DataRow[]) {
  const keys = [
    'id',
    'date',
    'source',
    'ingredient',
    'variety',
    'store',
    'region',
    'price',
    'unit',
    'version',
    'status',
    'details',
  ] as const;
  return (
    '\uFEFF' +
    [
      keys.map(cell).join(','),
      ...rows.map((row) => keys.map((k) => cell(row[k])).join(',')),
    ].join('\r\n') +
    '\r\n'
  );
}
