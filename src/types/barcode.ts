export type BarcodeFormat = 'MANUAL' | 'UPC_A' | 'EAN_13';
export interface ValidatedBarcode {
  original: string;
  digits: string;
  key: string;
  format: BarcodeFormat;
}
export interface BarcodeProduct {
  source: 'USDA_FDC_BRANDED';
  fdcId: string;
  originalBarcode: string;
  description: string;
  brandName: string | null;
  brandOwner: string | null;
  packageLabel: string | null;
  marketCountry: string;
  publicationDate: string;
  modifiedDate: string | null;
  availableDate: string | null;
  snapshotDate: string;
  sourceUrl: string;
}
export interface BarcodeSuggestion {
  ingredientId: string;
  ruleId: string;
}
export type BarcodeFailureStatus = 'INVALID' | 'UNSUPPORTED' | 'NOT_FOUND' | 'DISCONTINUED' | 'SOURCE_DATE_HOLD' |
  'DISABLED' | 'SERVICE_UNAVAILABLE' | 'THROTTLED' | 'OFFLINE';
export type BarcodeLookupResult =
  | { status: 'FOUND'; barcode: ValidatedBarcode; product: BarcodeProduct; suggestion: BarcodeSuggestion | null }
  | { status: 'AMBIGUOUS_PRODUCT'; barcode: ValidatedBarcode; products: BarcodeProduct[]; matchCount: number }
  | { status: BarcodeFailureStatus; message: string };
