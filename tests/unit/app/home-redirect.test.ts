import { beforeEach, describe, expect, it, vi } from 'vitest';

// "/" opens the last-used module (v2.0 M3 Phase B.3c, owner decision 10): the home page reads the module cookie and redirects,
// Shop on a first visit or a cookie it does not recognise. The cookie carries the module name only.
const jar = vi.hoisted(() => ({ value: undefined as string | undefined }));
const redirect = vi.hoisted(() => vi.fn());
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (name: string) => (name === 'pantrybot_last_module' && jar.value !== undefined ? { name, value: jar.value } : undefined) }),
}));
vi.mock('next/navigation', () => ({ redirect }));
import HomePage, { dynamic } from '@/app/page';

beforeEach(() => { jar.value = undefined; redirect.mockReset(); });

describe('home page redirect', () => {
  it('is dynamic, because it reads a cookie', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('opens Shop on a first visit', async () => {
    await HomePage();
    expect(redirect).toHaveBeenCalledWith('/shop');
  });

  for (const [value, path] of [['shop', '/shop'], ['plan', '/plan'], ['pantry', '/pantry']] as const) {
    it(`opens ${value} when it was the last-used module`, async () => {
      jar.value = value;
      await HomePage();
      expect(redirect).toHaveBeenCalledWith(path);
    });
  }

  it('opens Shop for a cookie it does not recognise', async () => {
    jar.value = '/etc/passwd';
    await HomePage();
    expect(redirect).toHaveBeenCalledWith('/shop');
  });
});
