import { describe, it, expect, vi } from 'vitest';
import { GET, POST, PATCH, DELETE } from '@/app/api/freezer/route';

// Retirement responses must never parse credentials, create guest sessions, or write inventory.
describe('regression: retired Freezer API', () => {
  it.each([GET, POST, PATCH, DELETE])('returns a cache-disabled upgrade path without reading the request', async (handler) => {
    const request = new Request('http://localhost:3000/api/freezer');
    const read = vi.spyOn(request, 'json').mockRejectedValue(new Error('must not parse retired writes'));
    const response = handler(request);
    expect(response.status).toBe(410);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toMatchObject({ code: 'freezer_retired', replacement: '/api/pantry' });
    expect(read).not.toHaveBeenCalled();
    expect(response.headers.get('set-cookie')).toBeNull();
  });
});
