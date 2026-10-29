import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
import { ALL_STORE_CHAINS } from '@/data/store-registry';
import { sourceDay } from '@/lib/usda/adapter';
export const DATASETS = [
  'normalized',
  'offers',
  'original',
  'calculated',
] as const;
export type Dataset = (typeof DATASETS)[number];
export class ExplorerError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}
export function parseExplorerQuery(params: URLSearchParams, now = new Date()) {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Denver',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const end = params.get('end') || day;
  const defaultStart = new Date(`${end}T12:00:00Z`);
  defaultStart.setUTCDate(defaultStart.getUTCDate() - 41);
  let start =
    params.get('start') ||
    (Number.isFinite(defaultStart.getTime())
      ? defaultStart.toISOString().slice(0, 10)
      : '');
  try {
    start = sourceDay(start);
    sourceDay(end);
  } catch {
    throw new ExplorerError('Choose valid start and end dates.');
  }
  const span = (Date.parse(end) - Date.parse(start)) / 86400000;
  if (span < 0 || span > 83 || end > day)
    throw new ExplorerError(
      'Choose a date range of at most twelve weeks, ending today or earlier.'
    );
  const ingredient = params.get('ingredient') || 'yellow-white-onions';
  if (!CANONICAL_INGREDIENTS.some((i) => i.id === ingredient))
    throw new ExplorerError('Unknown ingredient.');
  const zip = params.get('zip') || '80542';
  if (!/^\d{5}$/.test(zip))
    throw new ExplorerError('Enter a five-digit ZIP code.');
  const stores = (params.get('stores') || '').split(',').filter(Boolean);
  if (stores.some((s) => !ALL_STORE_CHAINS.some((store) => store === s)))
    throw new ExplorerError('Unknown store.');
  const dataset = params.get('dataset') || 'normalized';
  if (!DATASETS.some((d) => d === dataset))
    throw new ExplorerError('Unknown dataset.');
  const status = params.get('status') || 'accepted';
  if (
    !['accepted', 'all', 'quarantined', 'superseded', 'unmapped'].includes(
      status
    )
  )
    throw new ExplorerError('Unknown revision status.');
  const source = params.get('source') || '';
  if (!['', 'USDA', 'FLIPP_LIVE', 'KROGER_API'].includes(source))
    throw new ExplorerError('Unknown source.');
  const region = params.get('region') || '';
  if (!['', 'NATIONAL', 'MOUNTAIN'].includes(region))
    throw new ExplorerError('Unknown region.');
  const version = params.get('version') || '';
  if (
    version &&
    !/^(demo-[\w-]+|[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12})$/i.test(
      version
    )
  )
    throw new ExplorerError('Invalid report version.');
  const sort = params.get('sort') || 'date';
  if (!['date', 'price', 'source', 'variety', 'store', 'status'].includes(sort))
    throw new ExplorerError('Unknown sort field.');
  const direction = params.get('direction') || 'desc';
  if (!['asc', 'desc'].includes(direction))
    throw new ExplorerError('Invalid sort direction.');
  const pageText = params.get('page') || '0';
  const page = Number(pageText);
  if (!/^\d+$/.test(pageText) || !Number.isSafeInteger(page) || page > 10000)
    throw new ExplorerError('Invalid page.');
  const search = params.get('search') || '';
  const variety = params.get('variety') || '';
  if (search.length > 100 || variety.length > 100)
    throw new ExplorerError('Search text is too long.');
  const asof = params.get('asof') || now.toISOString();
  if (
    !Number.isFinite(Date.parse(asof)) ||
    Date.parse(asof) > now.getTime() ||
    now.getTime() - Date.parse(asof) > 86400000
  )
    throw new ExplorerError('This snapshot has expired. Reload the data.');
  const mode = params.get('mode') || 'verified';
  if (!['verified', 'demo'].includes(mode))
    throw new ExplorerError('Unknown data mode.');
  return {
    ingredient,
    zip,
    start,
    end,
    stores,
    dataset: dataset as Dataset,
    status,
    source,
    region,
    version,
    sort,
    direction,
    page,
    search,
    variety,
    asof,
    mode,
    snapshot: params.get('snapshot') || '',
    row: params.get('row') || '',
  };
}
export type ExplorerQuery = ReturnType<typeof parseExplorerQuery>;
