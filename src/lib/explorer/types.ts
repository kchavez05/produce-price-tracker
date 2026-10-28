import type { ReportConfig } from '@/lib/usda/adapter';
import type { StoreOffer, ScoredCommodity } from '@/types/domain';
import type { calculateValueScore } from '@/lib/value-score';
export interface ExplorerReport {
  id: string;
  slug: string;
  title: string;
  period_start: string;
  period_end: string;
  published_at: string;
  fetched_at: string;
  adapter_version: string;
  validation: string;
  accepted: boolean;
  active: boolean;
  config: ReportConfig;
}
export interface ExplorerObservation {
  version_id: string;
  row_key: string;
  ingredient_id: string;
  region: 'NATIONAL' | 'MOUNTAIN';
  value: number;
  unit: 'lb' | 'doz';
  feature_pct: number | null;
  original: Record<string, unknown>;
  mapping_version: string;
}
export interface ExplorerOffer {
  id: number;
  zip_code: string;
  source: string;
  source_offer_id: string;
  ingredient_id: string;
  store: string;
  location_label: string;
  source_from: string;
  source_to: string;
  cycle: string;
  unit: 'lb' | 'doz';
  normalized_price: number;
  payload: StoreOffer;
  retrieved_at: string;
  receipt_id: number;
  receipt_count: number;
  receipts: { id: number; retrieved_at: string }[];
}
export interface Archive {
  reports: ExplorerReport[];
  observations: ExplorerObservation[];
  offers: ExplorerOffer[];
}
export interface DataRow {
  id: string;
  date: string;
  source: string;
  ingredient: string;
  variety: string;
  store: string;
  region: string;
  price: number | null;
  unit: string;
  version: string;
  status: string;
  details: Record<string, unknown>;
}
export interface HistoryPoint {
  date: string;
  series: string;
  price: number;
  unit: string;
  ids: string[];
  version?: string;
  details?: Record<string, unknown>;
}
export interface ExplorerData {
  mode: 'verified' | 'demo';
  asof: string;
  snapshot: string;
  reports: ExplorerReport[];
  points: HistoryPoint[];
  coverage: {
    localWeeks: number;
    usdaPeriods: number;
    start: string;
    end: string;
  };
  score: {
    commodity: ScoredCommodity;
    offerIds: string[];
    cycle: string;
    trace: ReturnType<typeof calculateValueScore>;
  } | null;
  warnings: string[];
}
