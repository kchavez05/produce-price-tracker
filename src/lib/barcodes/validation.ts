import type { BarcodeFormat, ValidatedBarcode } from '@/types/barcode';

export type BarcodeValidation = { ok: true; barcode: ValidatedBarcode } |
  { ok: false; status: 'INVALID' | 'UNSUPPORTED'; message: string };
const invalid = (message: string): BarcodeValidation => ({ ok: false, status: 'INVALID', message });
const unsupported = (message: string): BarcodeValidation => ({ ok: false, status: 'UNSUPPORTED', message });

/** GS1 consumer scope from approved BQ-01. Original strings and significant zeros survive. */
export function validateBarcode(value: unknown, format: unknown = 'MANUAL'): BarcodeValidation {
  if (typeof value !== 'string' || value.length === 0 || value.length > 64 || !/^[\x20-\x7e]+$/.test(value)) {
    return invalid('Enter the barcode as ASCII digits, including its leading zeros.');
  }
  if (typeof format !== 'string' || !['MANUAL', 'UPC_A', 'EAN_13'].includes(format)) return unsupported('Use a UPC-A or EAN-13 barcode, or choose an ingredient manually.');
  const digits = format === 'MANUAL' ? value.replace(/^ +| +$/g, '') : value;
  if (!/^[0-9]+$/.test(digits)) return invalid('Use digits only, without internal spaces, hyphens or URLs.');
  if (![8, 12, 13, 14].includes(digits.length)) return unsupported('Use a 12- or 13-digit consumer barcode, or its validated zero-filled 14-digit representation.');
  let sum = 0;
  for (let index = digits.length - 2, weight = 3; index >= 0; index--, weight = weight === 3 ? 1 : 3) sum += Number(digits[index]) * weight;
  if ((10 - sum % 10) % 10 !== Number(digits.at(-1))) return invalid('The barcode check digit does not match. Check the printed digits.');
  if (digits.length === 8) return unsupported('Eight-digit barcodes and UPC-E are not supported yet. Choose an ingredient manually.');
  if ((format === 'UPC_A' && digits.length !== 12) || (format === 'EAN_13' && digits.length !== 13)) return unsupported('The decoded format and barcode length do not agree.');
  const key = '0'.repeat(14 - digits.length) + digits;
  if (key[0] !== '0') return unsupported('Packaging-level and variable-measure codes are not supported.');
  // Prefixes use the EAN-13 namespace, not the first two original UPC-A characters.
  const ean = key.slice(1);
  if (/^(02|04|05|2|98|99|977|978|979|00000)/.test(ean)) return unsupported('This restricted, reserved or nonfood barcode needs manual ingredient entry.');
  return { ok: true, barcode: { original: value, digits, key, format: format as BarcodeFormat } };
}
