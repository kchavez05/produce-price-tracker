import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchLiveFlippOffers } from '@/lib/connectors/flipp';

// The visual snapshot server renders from the curated weekly baseline only, so a market refresh cannot move a baseline
// (#796). PANTRYBOT_LIVE_OFFERS=off is that switch; unset, live offers are still fetched.
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('fetchLiveFlippOffers switch', () => {
  it('makes no network request and returns no offers when PANTRYBOT_LIVE_OFFERS is off', async () => {
    vi.stubEnv('PANTRYBOT_LIVE_OFFERS', 'off');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    await expect(fetchLiveFlippOffers('80542')).resolves.toEqual({ offers: [], liveSuccess: false });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('still requests live offers by default', async () => {
    vi.stubEnv('PANTRYBOT_LIVE_OFFERS', '');
    const fetchSpy = vi.fn(async (..._args: unknown[]) => new Response(JSON.stringify({ items: [] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);
    await fetchLiveFlippOffers('80542');
    expect(fetchSpy).toHaveBeenCalled();
    expect(String(fetchSpy.mock.calls[0][0])).toContain('backflipp.wishabi.com');
  });

  it('only the exact value off disables it', async () => {
    vi.stubEnv('PANTRYBOT_LIVE_OFFERS', 'on');
    const fetchSpy = vi.fn(async (..._args: unknown[]) => new Response(JSON.stringify({ items: [] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);
    await fetchLiveFlippOffers('80542');
    expect(fetchSpy).toHaveBeenCalled();
  });
});
