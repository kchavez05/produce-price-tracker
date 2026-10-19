import { describe, it, expect } from 'vitest';
import { GET as getOpenApiJson, OPTIONS as optionsOpenApiJson } from '@/app/api/openapi.json/route';

describe('smoke: OpenAPI Specification Endpoint (/api/openapi.json)', () => {
  it('GET /api/openapi.json returns 200 with OpenAPI 3.1.0 document and CORS headers', async () => {
    const res = await getOpenApiJson();
    expect(res.status).toBe(200);

    const headers = res.headers;
    expect(headers.get('content-type')).toContain('application/json');
    expect(headers.get('access-control-allow-origin')).toBe('*');

    const data = await res.json();
    expect(data.openapi).toBe('3.1.0');
    expect(data.info.title).toBe('PantryBot API');
    expect(data.info.version).toBe('1.3.1');
    expect(data.paths['/api/dashboard']).toBeDefined();
    expect(data.paths['/api/locations']).toBeDefined();
    expect(data.paths['/api/freezer']).toBeDefined();
    expect(data.paths['/api/saved-recipes']).toBeDefined();
    expect(data.paths['/api/ai-meal-plan']).toBeDefined();
    expect(data.paths['/api/sync']).toBeDefined();
    expect(data.paths['/api/account']).toBeDefined();
    expect(data.paths['/api/cron/weekly-sync']).toBeDefined();
  });

  it('OPTIONS /api/openapi.json returns 204 No Content for CORS preflight', async () => {
    const res = await optionsOpenApiJson();
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('access-control-allow-methods')).toContain('GET');
  });
});
