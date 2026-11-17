import { afterEach, describe, expect, it, vi } from 'vitest';
import { designGuideEnabled } from '@/design/guide-access';
import DesignPage from '@/app/design/page';

afterEach(() => vi.unstubAllEnvs());

describe('designGuideEnabled', () => {
  it('is always on in development and test', () => {
    expect(designGuideEnabled({ NODE_ENV: 'development' })).toBe(true);
    expect(designGuideEnabled({ NODE_ENV: 'test' })).toBe(true);
  });

  it('is off in a production build without the flag', () => {
    expect(designGuideEnabled({ NODE_ENV: 'production' })).toBe(false);
    expect(designGuideEnabled({ NODE_ENV: 'production', E2E_DESIGN_GUIDE: '0' })).toBe(false);
    expect(designGuideEnabled({ NODE_ENV: 'production', E2E_DESIGN_GUIDE: 'true' })).toBe(false);
  });

  it('is on in a production build only with E2E_DESIGN_GUIDE=1', () => {
    expect(designGuideEnabled({ NODE_ENV: 'production', E2E_DESIGN_GUIDE: '1' })).toBe(true);
  });

  it('is refused on Vercel production even with the flag', () => {
    expect(designGuideEnabled({ NODE_ENV: 'production', VERCEL_ENV: 'production', E2E_DESIGN_GUIDE: '1' })).toBe(false);
    expect(designGuideEnabled({ NODE_ENV: 'production', VERCEL_ENV: 'production' })).toBe(false);
  });

  it('does not block Vercel preview builds that set the flag', () => {
    expect(designGuideEnabled({ NODE_ENV: 'production', VERCEL_ENV: 'preview', E2E_DESIGN_GUIDE: '1' })).toBe(true);
  });
});

describe('the /design page', () => {
  it('returns a 404 in a production build without the flag', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('E2E_DESIGN_GUIDE', '');
    vi.stubEnv('VERCEL_ENV', '');
    await expect(DesignPage()).rejects.toMatchObject({ digest: expect.stringContaining('404') });
  });

  it('returns a 404 on Vercel production even when the flag is set', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('E2E_DESIGN_GUIDE', '1');
    vi.stubEnv('VERCEL_ENV', 'production');
    await expect(DesignPage()).rejects.toMatchObject({ digest: expect.stringContaining('404') });
  });
});
