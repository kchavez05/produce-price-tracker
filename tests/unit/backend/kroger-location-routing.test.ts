import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/locations/route';
import { fetchKrogerLiveOffers } from '@/lib/connectors/usda-and-kroger';

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('Kroger location routing against the November 9 production location audit', () => {
  it('returns the verified IDs for each public address', async () => {
    const data = await (await GET(new NextRequest('http://localhost/api/locations'))).json();
    const idsByAddress = Object.fromEntries(data.locations.map((location: { address: string; locationId: string }) => [location.address, location.locationId]));
    expect(idsByAddress).toEqual({
      '6110 Firestone Blvd': '62000105',
      '1611 Pace St': '62000102',
      '2255 N Main St': '62000042',
      '995 S Hover St': '62000080',
    });
  });

  it('defaults keyless operation to Firestone instead of the Thornton location', async () => {
    vi.stubEnv('KROGER_CLIENT_ID', '');
    vi.stubEnv('KROGER_CLIENT_SECRET', '');
    vi.stubEnv('KROGER_LOCATION_ID', '');
    expect(await fetchKrogerLiveOffers()).toMatchObject({ krogerLive: false, selectedLocationId: '62000105', offers: [] });
  });

  it.each([undefined, '62000080'])('queries the actual selected location (%s)', async (requestedLocation) => {
    vi.stubEnv('KROGER_CLIENT_ID', 'test-client');
    vi.stubEnv('KROGER_CLIENT_SECRET', 'test-secret');
    vi.stubEnv('KROGER_LOCATION_ID', '');
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'test-token' })))
      .mockImplementation(async () => new Response(JSON.stringify({ data: [] })));
    vi.stubGlobal('fetch', fetchMock);
    const result = await fetchKrogerLiveOffers(requestedLocation);
    const expected = requestedLocation ?? '62000105';
    expect(result.selectedLocationId).toBe(expected);
    const productRequests = fetchMock.mock.calls.slice(1);
    expect(productRequests).toHaveLength(5);
    for (const [url] of productRequests) expect(new URL(String(url)).searchParams.get('filter.locationId')).toBe(expected);
  });
});
