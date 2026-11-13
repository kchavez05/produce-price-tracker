import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ resolve: vi.fn(), generate: vi.fn(), dashboard: vi.fn() }));
vi.mock('@/lib/supabase/session', () => ({ resolveCurrentUserProfile: mocks.resolve, loadInventoryState: async () => ({ freezerItems: [], savedRecipes: [] }) }));
vi.mock('@/lib/scoring-and-matcher', () => ({ buildDashboardPayload: mocks.dashboard }));
vi.mock('@google/genai', () => ({ GoogleGenAI: class { models = { generateContent: mocks.generate }; }, Type: {} }));
import { POST } from '@/app/api/ai-meal-plan/route';
function request(ip: string, body: unknown = {}, origin = 'http://localhost') {
  return new NextRequest('http://localhost/api/ai-meal-plan', { method: 'POST',
    headers: { host: 'localhost', origin, 'x-forwarded-for': ip, 'content-type': 'application/json' }, body: JSON.stringify(body) });
}
describe('AI generation access and quota', () => {
  beforeEach(() => {
    vi.stubEnv('GEMINI_API_KEY', 'server-test-key');
    vi.clearAllMocks(); mocks.resolve.mockResolvedValue({ profile: null });
    mocks.dashboard.mockResolvedValue({ commodities: [], recommendedTrio: [] });
    mocks.generate.mockResolvedValue({ text: '[]' });
  });
  afterEach(() => vi.unstubAllEnvs());
  it('rejects anonymous and local demo accounts before calling Gemini', async () => {
    expect((await POST(request('ai-anonymous'))).status).toBe(401);
    mocks.resolve.mockResolvedValue({ profile: { id: 'local', isCloudBacked: false } });
    expect((await POST(request('ai-local'))).status).toBe(401);
    expect(mocks.generate).not.toHaveBeenCalled();
  });
  it('preserves keyless fallback and user-supplied keys', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    expect((await POST(request('ai-keyless'))).status).toBe(200);
    expect(mocks.generate).not.toHaveBeenCalled();
    expect((await POST(request('ai-own-key', { geminiApiKey: 'user-key' }))).status).toBe(200);
    expect(mocks.generate).toHaveBeenCalledTimes(1);
  });
  it('rejects cross-origin requests', async () => {
    expect((await POST(request('ai-cross', {}, 'https://other.example'))).status).toBe(403);
    expect(mocks.generate).not.toHaveBeenCalled();
  });
  it('limits verified accounts even across changing IP addresses', async () => {
    mocks.resolve.mockResolvedValue({ profile: { id: 'cloud-quota', isCloudBacked: true } });
    for (let i = 0; i < 10; i++) expect((await POST(request(`ai-${i}`))).status).toBe(200);
    const blocked = await POST(request('ai-eleventh'));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBeTruthy();
    expect(mocks.generate).toHaveBeenCalledTimes(10);
  });
});
