import { describe, it, expect } from 'vitest';
import { PANTRYBOT_OPENAPI_SPEC } from '@/lib/openapi/spec';

describe('unit: OpenAPI 3.1.0 Specification', () => {
  it('has valid OpenAPI 3.1.0 root metadata and servers', () => {
    expect(PANTRYBOT_OPENAPI_SPEC.openapi).toBe('3.1.0');
    expect(PANTRYBOT_OPENAPI_SPEC.info.title).toBe('PantryBot API');
    expect(PANTRYBOT_OPENAPI_SPEC.info.version).toBe('1.4.0');
    expect(PANTRYBOT_OPENAPI_SPEC.info.contact.email).toBe('support@pantrybot.dev');
    expect(Array.isArray(PANTRYBOT_OPENAPI_SPEC.servers)).toBe(true);
    expect(PANTRYBOT_OPENAPI_SPEC.servers.length).toBeGreaterThanOrEqual(1);
  });

  it('contains tags for all 8 functional API domains', () => {
    const tags = PANTRYBOT_OPENAPI_SPEC.tags.map((t) => t.name);
    expect(tags).toContain('Dashboard & Deals');
    expect(tags).toContain('Locations & Stores');
    expect(tags).toContain('Virtual Freezer');
    expect(tags).toContain('Saved Recipes');
    expect(tags).toContain('AI Meal Planner');
    expect(tags).toContain('Cloud Sync');
    expect(tags).toContain('Account & GDPR');
    expect(tags).toContain('Automation & Cron');
  });

  it('documents all 8 core API route endpoints with expected HTTP methods', () => {
    const paths = PANTRYBOT_OPENAPI_SPEC.paths;

    // 1. Dashboard
    expect(paths['/api/dashboard']).toBeDefined();
    expect(paths['/api/dashboard'].get).toBeDefined();
    expect(paths['/api/dashboard'].get.operationId).toBe('getDashboard');

    // 2. Locations
    expect(paths['/api/locations']).toBeDefined();
    expect(paths['/api/locations'].get).toBeDefined();

    // 3. Freezer (CRUD)
    expect(paths['/api/freezer']).toBeDefined();
    expect(paths['/api/freezer'].get).toBeDefined();
    expect(paths['/api/freezer'].post).toBeDefined();
    expect(paths['/api/freezer'].patch).toBeDefined();
    expect(paths['/api/freezer'].delete).toBeDefined();

    // 4. Saved Recipes
    expect(paths['/api/saved-recipes']).toBeDefined();
    expect(paths['/api/saved-recipes'].get).toBeDefined();
    expect(paths['/api/saved-recipes'].post).toBeDefined();
    expect(paths['/api/saved-recipes'].delete).toBeDefined();

    // 5. AI Meal Plan
    expect(paths['/api/ai-meal-plan']).toBeDefined();
    expect(paths['/api/ai-meal-plan'].post).toBeDefined();
    expect(paths['/api/ai-meal-plan'].post.operationId).toBe('generateAiMealPlan');

    // 6. Cloud Sync
    expect(paths['/api/sync']).toBeDefined();
    expect(paths['/api/sync'].get).toBeDefined();
    expect(paths['/api/sync'].post).toBeDefined();

    // 7. Account & GDPR
    expect(paths['/api/account']).toBeDefined();
    expect(paths['/api/account'].get).toBeDefined();
    expect(paths['/api/account'].post).toBeDefined();
    expect(paths['/api/account'].delete).toBeDefined();

    // 8. Cron Weekly Sync
    expect(paths['/api/cron/weekly-sync']).toBeDefined();
    expect(paths['/api/cron/weekly-sync'].get).toBeDefined();
    expect(paths['/api/cron/weekly-sync'].post).toBeDefined();
  });

  it('defines comprehensive component schemas matching domain types', () => {
    const schemas = PANTRYBOT_OPENAPI_SPEC.components.schemas;
    expect(schemas.ErrorResponse).toBeDefined();
    expect(schemas.StoreChain).toBeDefined();
    expect(schemas.MacroGoal).toBeDefined();
    expect(schemas.DietaryConstraint).toBeDefined();
    expect(schemas.CookingVesselArchetype).toBeDefined();
    expect(schemas.FreezerItem).toBeDefined();
    expect(schemas.RecommendedDish).toBeDefined();
    expect(schemas.StoreOffer).toBeDefined();
    expect(schemas.ScoredCommodity).toBeDefined();
    expect(schemas.DashboardPayload).toBeDefined();
    expect(schemas.UserProfile).toBeDefined();
    expect(schemas.UserPreferences).toBeDefined();
    expect(schemas.UserSyncPayload).toBeDefined();
    expect(schemas.UserDataExportArchive).toBeDefined();
    expect(schemas.WeeklySyncCronResult).toBeDefined();
  });

  it('defines security schemes for local session cookies and cron bearer authentication', () => {
    const security = PANTRYBOT_OPENAPI_SPEC.components.securitySchemes;
    expect(security.LocalSessionCookie).toBeDefined();
    expect(security.LocalSessionCookie.type).toBe('apiKey');
    expect(security.LocalSessionCookie.in).toBe('cookie');
    expect(security.VercelCronBearer).toBeDefined();
    expect(security.VercelCronBearer.type).toBe('http');
    expect(security.VercelCronBearer.scheme).toBe('bearer');
  });

  it('ensures all operations specify at least a 200 response and valid summaries', () => {
    for (const [pathStr, pathItem] of Object.entries(PANTRYBOT_OPENAPI_SPEC.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        expect(operation.summary, `${method.toUpperCase()} ${pathStr} missing summary`).toBeTruthy();
        expect(operation.responses['200'], `${method.toUpperCase()} ${pathStr} missing 200 response`).toBeDefined();
        expect(operation.tags.length, `${method.toUpperCase()} ${pathStr} missing tags`).toBeGreaterThan(0);
      }
    }
  });

  it('ensures docs/openapi.json and public/openapi.json exist and match spec', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const docsPath = path.resolve(process.cwd(), 'docs/openapi.json');
    const publicPath = path.resolve(process.cwd(), 'public/openapi.json');

    expect(fs.existsSync(docsPath)).toBe(true);
    expect(fs.existsSync(publicPath)).toBe(true);

    const docsJson = JSON.parse(fs.readFileSync(docsPath, 'utf-8'));
    const publicJson = JSON.parse(fs.readFileSync(publicPath, 'utf-8'));

    expect(docsJson.openapi).toBe('3.1.0');
    expect(publicJson.openapi).toBe('3.1.0');
    expect(docsJson.info.title).toBe('PantryBot API');
    expect(publicJson.info.title).toBe('PantryBot API');
    expect(Object.keys(docsJson.paths).length).toBe(8);
  });
});

