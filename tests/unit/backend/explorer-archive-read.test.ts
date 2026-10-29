import { describe, it, expect, vi, afterEach } from 'vitest';
import { marketClient } from '@/lib/market/client';
import { readArchive, readReport } from '@/lib/explorer/read';
import { parseExplorerQuery } from '@/lib/explorer/query';
import { readFileSync } from 'node:fs';
vi.mock('@/lib/market/client', () => ({ marketClient: vi.fn() }));
afterEach(() => vi.resetAllMocks());
describe('explorer cloud read boundary', () => {
  it('returns an error rather than synthetic data on a configured cloud failure', async () => {
    const retry = vi
      .fn()
      .mockResolvedValue({
        data: null,
        error: { message: 'private database detail' },
      });
    vi.mocked(marketClient).mockReturnValue({
      rpc: vi.fn(() => ({ retry })),
    } as unknown as NonNullable<ReturnType<typeof marketClient>>);
    const q = parseExplorerQuery(
      new URLSearchParams({ ingredient: 'ground-turkey' })
    );
    await expect(readArchive(q)).rejects.toThrow(
      'Stored market data is unavailable'
    );
    expect(retry).toHaveBeenCalledWith(false);
  });
  it('projects source reports without unknown envelope fields, keys, or personal records', async () => {
    const config = JSON.parse(
      readFileSync('config/usda/3324.json', 'utf8')
    ).config;
    const payload = [
      {
        reportSection: 'Report Details',
        api_key: 'private',
        results: [
          {
            commodity: 'Onions, Dry',
            variety: 'WHITE',
            user_id: 'private',
            api_key: 'private',
          },
        ],
      },
    ];
    const maybeSingle = vi
      .fn()
      .mockResolvedValue({
        data: {
          id: 'test',
          slug: '3324',
          period_start: '2026-10-17',
          period_end: '2026-10-23',
          published_at: '2026-10-23T12:00:00',
          fetched_at: '2026-10-28',
          adapter_version: config.adapterVersion,
          validation: 'usable',
          config_snapshot: { ...config, secret: 'private' },
          payload,
        },
        error: null,
      });
    vi.mocked(marketClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) })),
      })),
    } as unknown as NonNullable<ReturnType<typeof marketClient>>);
    const report = await readReport('test');
    expect(JSON.stringify(report)).not.toContain('private');
    expect(report.payload[0].results[0]).toEqual({
      commodity: 'Onions, Dry',
      variety: 'WHITE',
    });
    expect(report.representation).toContain('Sanitized');
  });
});
