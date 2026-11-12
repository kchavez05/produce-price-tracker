const explorerParameters = [
  { name: 'ingredient', in: 'query', schema: { type: 'string', default: 'yellow-white-onions' } },
  { name: 'zip', in: 'query', schema: { type: 'string', pattern: '^[0-9]{5}$', default: '80542' } },
  { name: 'start', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Inclusive start; at most 83 days before end.' },
  { name: 'end', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Inclusive end, no later than today in America/Denver.' },
  { name: 'stores', in: 'query', schema: { type: 'string' }, description: 'Comma-separated supported store IDs.' },
  { name: 'source', in: 'query', schema: { type: 'string', enum: ['', 'USDA', 'FLIPP_LIVE', 'KROGER_API'] } },
  { name: 'region', in: 'query', schema: { type: 'string', enum: ['', 'NATIONAL', 'MOUNTAIN'] } },
  { name: 'mode', in: 'query', schema: { type: 'string', enum: ['verified', 'demo'], default: 'verified' } },
  { name: 'asof', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Snapshot cutoff returned by history; expires after 24 hours.' },
  { name: 'snapshot', in: 'query', schema: { type: 'string' }, description: 'History fingerprint. Changed data returns 409 rather than inconsistent paging.' },
] as const;
const explorerRowParameters = [
  ...explorerParameters,
  { name: 'dataset', in: 'query', schema: { type: 'string', enum: ['normalized', 'original', 'offers', 'calculated'], default: 'normalized' } },
  { name: 'status', in: 'query', schema: { type: 'string', enum: ['accepted', 'all', 'superseded', 'quarantined', 'unmapped'], default: 'accepted' } },
  { name: 'version', in: 'query', schema: { type: 'string', format: 'uuid' } },
  { name: 'search', in: 'query', schema: { type: 'string', maxLength: 100 } },
  { name: 'variety', in: 'query', schema: { type: 'string', maxLength: 100 } },
  { name: 'row', in: 'query', schema: { type: 'string' }, description: 'Exact contributing record ID.' },
  { name: 'sort', in: 'query', schema: { type: 'string', enum: ['date', 'price', 'source', 'variety', 'store', 'status'], default: 'date' } },
  { name: 'direction', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
  { name: 'page', in: 'query', schema: { type: 'integer', minimum: 0 }, description: 'Zero-based page; 100 rows per page. Exports include every matching page.' },
] as const;
const explorerErrors = {
  '400': { description: 'Invalid filters or expired snapshot.' },
  '409': { description: 'Snapshot changed; reload history.' },
  '413': { description: 'Export exceeds 10,000 rows or report exceeds the 4 MB source cap.' },
  '429': { description: 'Rate limited; Retry-After is provided.' },
  '503': { description: 'Configured archive is unavailable; no synthetic substitution.' },
} as const;

/**
 * PantryBot OpenAPI 3.1.0 Specification
 * High-density weekend meal-prep optimization, multi-vendor supermarket circular deals,
 * wholesale club bulk price normalization, Virtual Pantry availability,
 * and cross-device cloud synchronization REST API.
 */

export const PANTRYBOT_OPENAPI_SPEC = {
  openapi: '3.1.0',
  info: {
    title: 'PantryBot API',
    version: '1.6.2',
    description:
      'PantryBot REST API documentation and interactive testing console. PantryBot ingests live weekly circulars across 6 supermarket ecosystems (Kroger/King Soopers, Safeway/Albertsons, ALDI, Walmart, Target, Sprouts), benchmarks deals against Costco and Sam\'s Club wholesale bulk baselines and USDA MARS market trends, recommends high-density 3-dish batch meal-prep trios, optimizes multi-store basket splits, manages Virtual Pantry availability, and provides cross-device cloud synchronization with PostgreSQL RLS.',
    termsOfService: '/terms',
    contact: {
      name: 'PantryBot Developer Team',
      url: 'https://pantrybot.dev',
      email: 'support@pantrybot.dev',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: '/',
      description: 'Current Environment / Origin (Local dev or preview deployment)',
    },
    {
      url: 'https://pantrybot.dev',
      description: 'Production Environment (pantrybot.dev)',
    },
  ],
  tags: [
    { name: 'Virtual Pantry', description: 'Private boolean inventory with revision-checked writes. Requires PANTRYBOT_PANTRY_ENABLED=true and installed additive pantry migrations.' },
    { name: 'Data Explorer', description: 'Public read-only market history, raw rows, source reports, grouping rationale, and score transparency.' },
    {
      name: 'Dashboard & Deals',
      description:
        'Live circular deals, commodity value leaderboards, store price matrices, and 3-dish batch meal recommendations',
    },
    {
      name: 'Locations & Stores',
      description:
        'Supported supermarket ecosystems, local banner names, and store metadata by ZIP code',
    },
    {
      name: 'Legacy Inventory',
      description:
        'Legacy purchase/quantity records retained for compatibility and migration. Migrated owners must use Virtual Pantry; unsupported legacy writes return 426.',
    },
    {
      name: 'Saved Recipes',
      description:
        'User-saved batch recipe blueprints and custom Gemini AI meal-prep library',
    },
    {
      name: 'AI Meal Planner',
      description:
        'Gemini 2.5 Flash batch-prep trio generator with zero-key offline resilience fallback',
    },
    {
      name: 'Cloud Sync',
      description:
        'Bidirectional user profile, preference, freezer, and recipe state synchronization',
    },
    {
      name: 'Account & GDPR',
      description:
        'Local and SSO session authentication, JSON data export archive, and GDPR/CCPA account deletion',
    },
    {
      name: 'Automation & Cron',
      description:
        'Weekly circular refresh cron job, Friday Weekend Meal Prep Digest, and Smart Push payloads',
    },
  ],
  paths: {
    '/api/pantry/barcode-lookup': {
      post: {
        tags: ['Virtual Pantry'], operationId: 'lookupPantryBarcode', summary: 'Look up a packaged product in the approved USDA snapshot',
        description: 'Default-off, bounded non-AI lookup for guests and accounts. Returns public product evidence and a separate reviewed suggestion; never changes inventory or infers package quantities/prices. Public activation requires a verified artifact and shared rate enforcement. Offline is a client transport state.',
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', additionalProperties: false, required: ['barcode'], properties: {
            barcode: { type: 'string', minLength: 1, maxLength: 64, description: 'Original ASCII barcode text, including leading zeros. Outer ASCII spaces allowed for manual entry. Total request body at most 256 bytes.' },
            format: { type: 'string', enum: ['MANUAL', 'UPC_A', 'EAN_13'], default: 'MANUAL' },
          },
        } } } },
        responses: {
          '200': { description: 'Found, ambiguous or an explicit snapshot miss/hold; no pantry mutation.', content: { 'application/json': { schema: { $ref: '#/components/schemas/BarcodeLookupResult' } } } },
          '400': { description: 'Invalid or unsupported barcode/request.' }, '403': { description: 'Cross-origin request rejected.' },
          '413': { description: 'Request exceeds 256 bytes.' }, '429': { description: 'Throttled; honor Retry-After.' },
          '503': { description: 'Disabled, missing/unverified artifact or service failure. Manual entry remains available.' },
        },
      },
    },
    '/api/pantry': {
      get: {
        tags: ['Virtual Pantry'], operationId: 'getPrivatePantry', summary: 'Read the current private pantry and legacy migration source',
        description: 'Feature gated. Uses the verified account session or mints a private guest cookie. Never migrates automatically. GET includes catalogVersion and installed acceptedCatalogIds; clients must verify an ID is accepted before creating a new reference. Preserve unfamiliar IDs on reads, edits, queues, and exports; they do not confer recipe coverage. All responses are private/no-store. Tombstones are included for conflict detection. Before migration, legacySource is a preview; after migration it is the preserved source archive.',
        responses: {
          '200': { description: 'Owner-scoped inventory snapshot.', content: { 'application/json': { schema: { $ref: '#/components/schemas/PantrySnapshot' } } } },
          '401': { description: 'No private session could be established.' },
          '429': { description: 'Rate limited; Retry-After is provided.' },
          '503': { description: 'Feature disabled or storage unavailable; no cached cloud success.' },
        },
      },
      post: {
        tags: ['Virtual Pantry'], operationId: 'writePrivatePantry', summary: 'Explicitly migrate legacy inventory or apply one pantry mutation',
        description: 'Feature gated, same-origin only, maximum request size 8192 characters. The owner field fences replay after an account switch; it is never authentication. Migration archives and converts only this session’s existing legacy data, atomically and once. It does not import guest data into an account. Mutations require migration first. Idempotency IDs acknowledge identical retries; a changed payload must use a new ID. Stale revisions or identity collisions return 409 with the current value/tombstone. Keep the edit pending and request an explicit user choice before retrying with a fresh ID and revision. Deleted identities stay reserved. No quantity arithmetic or automatic recipe/purchase deductions.',
        requestBody: { required: true, content: { 'application/json': { schema: { oneOf: [
          { type: 'object', required: ['owner', 'action'], properties: { owner: { type: 'string', pattern: '^(account|guest):.+' }, action: { const: 'migrate' } } },
          { type: 'object', required: ['owner', 'action', 'mutation'], properties: { owner: { type: 'string', pattern: '^(account|guest):.+' }, action: { const: 'mutate' }, mutation: { $ref: '#/components/schemas/PantryMutation' } } },
        ] } } } },
        responses: {
          '200': { description: 'Migration snapshot or acknowledged entry mutation.', content: { 'application/json': { schema: { oneOf: [{ $ref: '#/components/schemas/PantrySnapshot' }, { $ref: '#/components/schemas/PantryApplied' }] } } } },
          '400': { description: 'Invalid request, entry, revision, or calendar date.' },
          '401': { description: 'Private session unavailable.' },
          '403': { description: 'Forbidden cross-origin mutation.' },
          '409': { description: 'Revision/identity conflict (PantryConflict), owner_changed, migration_required, legacy_changed, or mutation_id_reused. Errors carry code/error; retain pending edits.', content: { 'application/json': { schema: { oneOf: [{ $ref: '#/components/schemas/PantryConflict' }, { $ref: '#/components/schemas/ErrorResponse' }] } } } },
          '413': { description: 'Request exceeds 8192 characters.' },
          '429': { description: 'Rate limited; Retry-After is provided.' },
          '503': { description: 'Feature disabled or storage unavailable; retry without losing pending changes.' },
        },
      },
    },
    '/api/data/history': { get: { tags: ['Data Explorer'], operationId: 'getDataHistory', summary: 'Read stored all-store and USDA price series',
      description: 'Read only; no upstream requests or archive writes. Returns mode, asof, snapshot, coverage, reports, and points with contributing IDs. National USDA retail benchmarks are distinct from local advertisements.',
      parameters: explorerParameters, responses: { '200': { description: 'History, coverage, and provenance.' }, ...explorerErrors } } },
    '/api/data/rows': { get: { tags: ['Data Explorer'], operationId: 'getDataRows', summary: 'Inspect source, normalized, archived-offer, or calculated rows',
      description: 'Original dataset selects one report and shows every retained market row in its period, including unmapped commodities. Other datasets select an ingredient. Original prices retain source units. Unknown source fields are omitted from the public projection.',
      parameters: explorerRowParameters, responses: { '200': { description: 'Rows, total, page, pageSize, mode, asof, snapshot, selectedVersion, and dataset note.' }, ...explorerErrors } } },
    '/api/data/export': { get: { tags: ['Data Explorer'], operationId: 'exportDataRows', summary: 'Download all filtered rows as CSV',
      description: 'Same filters and ordering as rows, across all pages. Maximum 10,000 rows; never silently truncates. X-Export-Metadata contains URL-encoded JSON with filters, snapshot, units, mode, attribution, and revision policy. Text formulas are neutralized.',
      parameters: explorerRowParameters, responses: { '200': { description: 'CSV attachment and encoded metadata header.', content: { 'text/csv': { schema: { type: 'string' } } } }, ...explorerErrors } } },
    '/api/data/report': { get: { tags: ['Data Explorer'], operationId: 'getStoredDataReport', summary: 'Inspect a preserved USDA report version',
      description: 'Sanitized public JSON projection of audited source market fields, including unmapped rows. Not the byte-original API response. Reads one immutable stored version; never calls USDA. Attribution: U.S. Department of Agriculture.',
      parameters: [{ name: 'version', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } }, { name: 'download', in: 'query', schema: { type: 'string', enum: ['0', '1'] } }],
      responses: { '200': { description: 'Stored report metadata and sanitized source envelope.' }, '404': { description: 'Report unavailable.' }, ...explorerErrors } } },
    '/api/data/catalog': { get: { tags: ['Data Explorer'], operationId: 'getDataCatalog', summary: 'Read ingredient definitions, grouping rationale, mappings, and conversions',
      responses: { '200': { description: 'Public catalog with editorial and USDA mapping versions.' }, '429': explorerErrors['429'] } } },
    '/api/data/score': { get: { tags: ['Data Explorer'], operationId: 'explainStoredScore', summary: 'Explain the latest retained offer score',
      description: 'Uses shared dashboard scoring code over the latest archived offer cycle in the last six weeks, current usable stored benchmarks, and today’s policy. Dates and source filters do not change score policy. May differ from unarchived dashboard offers; not a historically recorded score.',
      parameters: explorerParameters, responses: { '200': { description: 'Score trace (or null), policy inputs, context, mode, and evaluation time.' }, ...explorerErrors } } },
    '/api/dashboard': {
      get: {
        tags: ['Dashboard & Deals'],
        summary: 'Get commodity deals and 3-dish meal-prep recommendations',
        description:
          'Computes real-time workhorse value rankings, 3-dish meal-prep trios, store comparisons, and 6-week cycle signals for the specified ZIP code and household preferences.',
        operationId: 'getDashboard',
        parameters: [
          {
            name: 'zip',
            in: 'query',
            required: false,
            description: '5-digit US postal ZIP code',
            schema: {
              type: 'string',
              default: '80542',
              pattern: '^[0-9]{5}$',
              example: '80542',
            },
          },
          {
            name: 'store',
            in: 'query',
            required: false,
            description: 'Single store filter or ALL',
            schema: {
              type: 'string',
              enum: ['ALL', 'KING_SOOPERS', 'SAFEWAY', 'ALDI', 'WALMART', 'TARGET', 'SPROUTS'],
              default: 'ALL',
            },
          },
          {
            name: 'stores',
            in: 'query',
            required: false,
            description: 'Comma-separated list of active store chains to include in basket optimization',
            schema: {
              type: 'string',
              example: 'KING_SOOPERS,SAFEWAY,ALDI',
            },
          },
          {
            name: 'pinned',
            in: 'query',
            required: false,
            description: 'Comma-separated list of canonical ingredient IDs pinned by user',
            schema: {
              type: 'string',
              example: 'ground-beef-80-20,russet-potatoes',
            },
          },
          {
            name: 'onHand',
            in: 'query',
            required: false,
            description: 'Comma-separated list of canonical ingredient IDs on hand in pantry/freezer ($0.00 marginal cost)',
            schema: {
              type: 'string',
              example: 'yellow-onions,carrots',
            },
          },
          {
            name: 'servings',
            in: 'query',
            required: false,
            description: 'Target servings per batch dish (4, 6, or 8)',
            schema: {
              type: 'integer',
              enum: [4, 6, 8],
              default: 6,
            },
          },
          {
            name: 'macroGoal',
            in: 'query',
            required: false,
            description: 'Target nutritional macro profile',
            schema: {
              $ref: '#/components/schemas/MacroGoal',
              default: 'ANY',
            },
          },
          {
            name: 'dietary',
            in: 'query',
            required: false,
            description: 'Comma-separated dietary constraints',
            schema: {
              type: 'string',
              example: 'GLUTEN_FREE,DAIRY_FREE',
            },
          },
          {
            name: 'vessel',
            in: 'query',
            required: false,
            description: 'Preferred cookware/appliance vessel archetype',
            schema: {
              $ref: '#/components/schemas/CookingVesselArchetype',
              default: 'ANY',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Successfully computed live dashboard and meal-prep payload',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DashboardPayload',
                },
              },
            },
          },
          '500': {
            description: 'Internal server error calculating dashboard data',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/locations': {
      get: {
        tags: ['Locations & Stores'],
        summary: 'Retrieve supported supermarket chains and localized banners',
        description:
          'Resolves supported retail chains (Kroger, Safeway, ALDI, Walmart, Target, Sprouts), localized banner names, and store features for any US ZIP code.',
        operationId: 'getLocations',
        parameters: [
          {
            name: 'zipCode',
            in: 'query',
            required: false,
            description: '5-digit US ZIP code',
            schema: {
              type: 'string',
              default: '80542',
              example: '80542',
            },
          },
          {
            name: 'zip',
            in: 'query',
            required: false,
            description: 'Alternative alias for zipCode',
            schema: {
              type: 'string',
              example: '80542',
            },
          },
        ],
        responses: {
          '200': {
            description: 'List of supported supermarket banners and physical location metadata',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    zipCode: { type: 'string', example: '80542' },
                    chain: { type: 'string', example: 'KING_SOOPERS' },
                    locations: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/KingSoopersLocation' },
                    },
                    availableStores: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AvailableStoreInfo' },
                    },
                  },
                  required: ['zipCode', 'chain', 'locations', 'availableStores'],
                },
              },
            },
          },
        },
      },
    },
    '/api/freezer': {
      get: {
        tags: ['Legacy Inventory'],
        summary: 'Get virtual freezer inventory',
        description:
          'Retrieves banked freezer items for the active user session or private guest session.',
        operationId: 'getFreezerItems',
        responses: {
          '200': {
            description: 'Current virtual freezer inventory list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/FreezerItem' },
                    },
                  },
                  required: ['items'],
                },
              },
            },
          },
          '500': {
            description: 'Failed to read virtual freezer inventory',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Legacy Inventory'],
        summary: 'Bank or add an item to the virtual freezer',
        description:
          'Legacy contract. Saves or merges a purchase record for owners who have not migrated. Migrated owners receive 426 pantry_upgrade_required and must use /api/pantry; legacy quantities cannot overwrite boolean availability.',
        operationId: 'upsertFreezerItem',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  item: { $ref: '#/components/schemas/FreezerItem' },
                },
                required: ['item'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Freezer item saved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    saved: { $ref: '#/components/schemas/FreezerItem' },
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/FreezerItem' },
                    },
                  },
                  required: ['saved', 'items'],
                },
              },
            },
          },
          '400': {
            description: 'Missing required item payload or invalid JSON',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '426': { description: 'pantry_upgrade_required: this owner migrated; reload and use /api/pantry.' },
          '403': {
            description: 'Forbidden cross-origin request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '429': {
            description: 'Rate limit exceeded for freezer mutations',
            headers: {
              'Retry-After': {
                schema: { type: 'string' },
                description: 'Seconds to wait before retrying',
              },
            },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Failed to save virtual freezer item',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Legacy Inventory'],
        summary: 'Update freezer item quantity',
        description:
          'Modifies remaining quantity in lbs or dozens, recalculating cost basis and estimated savings.',
        operationId: 'updateFreezerItemQuantity',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'frz-ground-beef-80-20-1729350000' },
                  quantityLbOrDoz: { type: 'number', example: 1.5 },
                },
                required: ['id', 'quantityLbOrDoz'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Item quantity updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    updated: {
                      anyOf: [
                        { $ref: '#/components/schemas/FreezerItem' },
                        { type: 'null' },
                      ],
                    },
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/FreezerItem' },
                    },
                  },
                  required: ['items'],
                },
              },
            },
          },
          '400': {
            description: 'Missing id or invalid quantity',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '426': { description: 'pantry_upgrade_required: quantity writes cannot overwrite migrated pantry availability.' },
          '403': {
            description: 'Forbidden cross-origin request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '429': {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Failed to update virtual freezer item',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Legacy Inventory'],
        summary: 'Remove item from virtual freezer',
        description: 'Deletes a virtual freezer item by ID.',
        operationId: 'deleteFreezerItem',
        parameters: [
          {
            name: 'id',
            in: 'query',
            required: true,
            description: 'Virtual freezer item ID to delete',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Item removed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/FreezerItem' },
                    },
                  },
                  required: ['ok', 'items'],
                },
              },
            },
          },
          '400': {
            description: 'Missing freezer item id parameter',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '426': { description: 'pantry_upgrade_required: delete the entry through /api/pantry with its latest revision.' },
          '403': {
            description: 'Forbidden cross-origin request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '429': {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Failed to delete virtual freezer item',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/saved-recipes': {
      get: {
        tags: ['Saved Recipes'],
        summary: 'Get saved meal-prep recipes',
        description: 'Retrieves saved custom recipes and bookmarked blueprints for the current account or private guest session.',
        operationId: 'getSavedRecipes',
        responses: {
          '200': {
            description: 'List of saved recipes',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    recipes: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/RecommendedDish' },
                    },
                  },
                  required: ['recipes'],
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Saved Recipes'],
        summary: 'Save a recipe to blueprint library',
        description: 'Bookmarks a recipe in private session storage, with Supabase persistence for cloud accounts. Guest writes issue an opaque session cookie.',
        operationId: 'saveRecipe',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  dish: { $ref: '#/components/schemas/RecommendedDish' },
                },
                required: ['dish'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Recipe saved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    saved: { type: 'boolean', example: true },
                    recipes: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/RecommendedDish' },
                    },
                  },
                  required: ['saved', 'recipes'],
                },
              },
            },
          },
          '400': {
            description: 'Missing dish payload or dish ID',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Failed to save recipe',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Saved Recipes'],
        summary: 'Remove saved recipe',
        description: 'Deletes a bookmarked recipe from the current session library. Requires same-origin access and is rate limited.',
        operationId: 'deleteSavedRecipe',
        parameters: [
          {
            name: 'id',
            in: 'query',
            required: true,
            description: 'Recipe ID to delete',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Recipe deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    deleted: { type: 'boolean', example: true },
                    recipes: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/RecommendedDish' },
                    },
                  },
                  required: ['deleted', 'recipes'],
                },
              },
            },
          },
        },
      },
    },
    '/api/ai-meal-plan': {
      post: {
        tags: ['AI Meal Planner'],
        summary: 'Generate custom 3-dish meal prep plan with Gemini AI',
        description:
          'Calls Google GenAI (`gemini-2.5-flash`) with live store sale items, household dietary constraints, cookware, and macro goals. Server-funded generation requires verified Supabase sign-in. Requests are limited to 10 per minute per IP and, for server-funded calls, per account (per process). Under Zero-Key Offline Resilience, deterministically falls back to algorithmic scoring if no Gemini API key is provided.',
        operationId: 'generateAiMealPlan',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  zipCode: { type: 'string', default: '80542', example: '80542' },
                  cityLabel: { type: 'string', default: 'Local Area', example: 'Mead, CO' },
                  targetServings: { type: 'number', enum: [4, 6, 8], default: 6 },
                  macroGoal: { $ref: '#/components/schemas/MacroGoal', default: 'ANY' },
                  dietaryConstraints: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/DietaryConstraint' },
                    example: ['GLUTEN_FREE'],
                  },
                  applianceFilter: {
                    $ref: '#/components/schemas/CookingVesselArchetype',
                    default: 'ANY',
                  },
                  customPreference: {
                    type: 'string',
                    example: 'Rich hearty chili and braised pork with great reheatable flavor.',
                  },
                  storeFilter: {
                    type: 'string',
                    enum: ['ALL', 'KING_SOOPERS', 'SAFEWAY', 'ALDI', 'WALMART', 'TARGET', 'SPROUTS'],
                    default: 'ALL',
                  },
                  geminiApiKey: {
                    type: 'string',
                    description: 'Optional client-provided Google AI Studio API key; use of the server key requires verified cloud authentication.',
                  },
                  pinnedIngredientIds: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['ground-beef-80-20'],
                  },
                  onHandIngredientIds: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['yellow-onions', 'carrots'],
                  },
                },
              },
            },
          },
        },
        responses: {
          '401': { description: 'Verified cloud sign-in required for server-funded generation' },
          '403': { description: 'Forbidden cross-origin request' },
          '429': { description: 'Rate limit exceeded; see Retry-After header' },
          '200': {
            description: 'Custom 3-dish meal-prep recommendations (either AI-generated or deterministic algorithmic fallback)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    usedAi: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'No Gemini API key detected...' },
                    dishes: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/RecommendedDish' },
                    },
                  },
                  required: ['usedAi', 'dishes'],
                },
              },
            },
          },
          '500': {
            description: 'Gemini API call or parsing error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    usedAi: { type: 'boolean', example: false },
                    error: { type: 'string' },
                  },
                  required: ['usedAi', 'error'],
                },
              },
            },
          },
        },
      },
    },
    '/api/sync': {
      get: {
        tags: ['Cloud Sync'],
        summary: 'Load synchronized user profile and state',
        description:
          'Loads cloud-synchronized preferences, virtual freezer inventory, and saved recipes for the current user profile or local guest session.',
        operationId: 'getUserSyncState',
        responses: {
          '200': {
            description: 'Current synchronization payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserSyncPayload' },
              },
            },
          },
          '429': {
            description: 'Rate limit exceeded for sync requests',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Failed to load user sync state',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Cloud Sync'],
        summary: 'Persist user sync updates',
        description:
          'Persists updated preferences, freezer inventory, or saved recipes to PostgreSQL with Row-Level Security (or local guest SQLite store).',
        operationId: 'persistUserSyncState',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId: { type: 'string', description: 'Expected account ID; mismatches return 409 without persisting the update' },
                  preferences: {
                    type: 'object',
                    description: 'Partial user preferences to update',
                  },
                  freezerItems: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/FreezerItem' },
                  },
                  savedRecipes: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/RecommendedDish' },
                  },
                  mergeMode: {
                    type: 'boolean',
                    description: 'Whether to merge guest local items into account',
                    default: false,
                  },
                },
              },
            },
          },
        },
        responses: {
          '409': { description: 'Queued update belongs to a different account' },
          '426': { description: 'pantry_upgrade_required: migrated owners must update inventory through /api/pantry; unrelated preferences and saved recipes remain supported.' },
          '200': {
            description: 'Updated sync state returned',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserSyncPayload' },
              },
            },
          },
          '400': {
            description: 'Invalid JSON payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '401': {
            description: 'Authentication required to sync cloud preferences',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '403': {
            description: 'Forbidden cross-origin mutation request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '429': {
            description: 'Rate limit exceeded for cloud sync updates',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Failed to sync user preferences',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/account': {
      get: {
        tags: ['Account & GDPR'],
        summary: 'Export user data archive (GDPR / CCPA)',
        description:
          'Exports complete machine-readable JSON archive containing all user profile data, shopping preferences, virtual freezer inventory, and saved recipes under GDPR right to access.',
        operationId: 'exportAccountData',
        responses: {
          '200': {
            description: 'Complete user data archive JSON',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserDataExportArchive' },
              },
            },
          },
          '401': {
            description: 'Must be signed in to export account data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '429': {
            description: 'Too many data export requests',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Failed to export grocery account data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Account & GDPR'],
        summary: 'Perform local session sign-in or sign-out',
        description:
          'Manages authentication actions: local guest demo sign-in (SIGN_IN_LOCAL) or session termination (SIGN_OUT).',
        operationId: 'handleAccountAuthAction',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  action: {
                    type: 'string',
                    enum: ['SIGN_IN_LOCAL', 'SIGN_OUT'],
                    example: 'SIGN_IN_LOCAL',
                  },
                  provider: {
                    type: 'string',
                    enum: ['google', 'apple'],
                    default: 'google',
                  },
                  email: {
                    type: 'string',
                    example: 'shopper@pantrybot.dev',
                  },
                  displayName: {
                    type: 'string',
                    example: 'Meal Prepper',
                  },
                },
                required: ['action'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Auth action completed successfully',
            content: {
              'application/json': {
                schema: {
                  anyOf: [
                    { $ref: '#/components/schemas/UserSyncPayload' },
                    {
                      type: 'object',
                      properties: {
                        authenticated: { type: 'boolean', example: false },
                        ok: { type: 'boolean', example: true },
                      },
                      required: ['authenticated', 'ok'],
                    },
                  ],
                },
              },
            },
          },
          '400': {
            description: 'Unsupported account action or invalid JSON payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '403': {
            description: 'Forbidden cross-origin request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '429': {
            description: 'Too many authentication requests',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Account operation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Account & GDPR'],
        summary: 'Purge user account and data (Right to be Forgotten)',
        description:
          'Irrevocably deletes user account, preferences, virtual freezer inventory, and saved recipes from cloud PostgreSQL and local SQLite stores under GDPR right to erasure.',
        operationId: 'purgeAccount',
        responses: {
          '200': {
            description: 'User account and all associated grocery data purged successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    deleted: { type: 'boolean', example: true },
                    purgedUserId: { type: 'string', example: 'usr-google-demo-80542' },
                    purgedAtIso: { type: 'string', example: '2026-10-19T18:00:00.000Z' },
                  },
                  required: ['deleted', 'purgedUserId', 'purgedAtIso'],
                },
              },
            },
          },
          '401': {
            description: 'Not signed in',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '403': {
            description: 'Forbidden cross-origin deletion request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '429': {
            description: 'Rate limit exceeded for account deletion',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Failed to delete user account and data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/cron/usda-ingest': {
      get: {
        tags: ['Automation & Cron'], summary: 'Run the authenticated Wednesday USDA batch',
        description: 'Requires CRON_SECRET bearer authorization. Disabled until USDA_INGEST_ENABLED=true and validated report definitions are registered. No parameters accepted. Recovery and backfill are CLI-only. Dashboard and digest requests never call USDA.',
        security: [{ VercelCronBearer: [] }],
        responses: { '200': { description: 'Succeeded, unchanged, disabled, or duplicate batch; inspect status' }, '400': { description: 'Parameters not supported' }, '401': { description: 'Invalid scheduler credentials' }, '503': { description: 'Partial, failed, or unavailable ingestion' } },
      },
    },
    '/api/health/market': {
      get: { tags: ['Automation & Cron'], summary: 'Sanitized weekly market ingestion health',
        description: 'Reports whether a scheduled or recovery run succeeded for the current planning cycle. No upstream calls, raw reports, or personal data. Rate limited.',
        responses: { '200': { description: 'Healthy' }, '429': { description: 'Rate limited' }, '503': { description: 'Missing, failed, partial, or unavailable run' } },
      },
    },
    '/api/cron/weekly-sync': {
      get: {
        tags: ['Automation & Cron'],
        summary: 'Execute or preview weekly circular synchronization',
        description:
          'Fetches current prices. Preview GET is public and unrecorded; scheduled cycles and record=true require Authorization: Bearer CRON_SECRET. x-vercel-cron is not authentication. Records exact live offer counts in the local audit and optionally Supabase.',
        operationId: 'getWeeklySync',
        parameters: [
          {
            name: 'cycle',
            in: 'query',
            required: false,
            description: 'Ad cycle label or identifier',
            schema: { type: 'string', default: 'preview_digest', example: 'wed_oct_14' },
          },
          {
            name: 'zip',
            in: 'query',
            required: false,
            description: 'Target ZIP code for circular ingestion',
            schema: { type: 'string', default: '80542', example: '80542' },
          },
          {
            name: 'record',
            in: 'query',
            required: false,
            description: 'Whether to record the run (requires cron bearer authentication)',
            schema: { type: 'string', enum: ['true', 'false'], default: 'false' },
          },
        ],
        responses: {
          '401': { description: 'Missing or incorrect cron bearer secret' },
          '429': { description: 'Preview request rate limit exceeded' },
          '200': {
            description: 'Weekly circular sync execution result, Friday digest, and Smart Push notifications',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WeeklySyncCronResult' },
              },
            },
          },
          '500': {
            description: 'Failed to execute weekly circular sync',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Automation & Cron'],
        summary: 'Manually trigger weekly sync execution',
        description:
          'Same-origin, rate-limited manual refresh using the same ingestion path as scheduled refresh. Reports live versus estimates-only results and audit storage availability.',
        operationId: 'postWeeklySync',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  cycle: { type: 'string', default: 'manual_sync', example: 'oct_week_3' },
                  zipCode: { type: 'string', default: '80542', example: '80542' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Manual weekly sync execution completed successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WeeklySyncCronResult' },
              },
            },
          },
          '500': {
            description: 'Failed to trigger manual weekly sync',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      LocalSessionCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'pantrybot_session_v14',
        description: 'Opaque, expiring, revocable local account session token. Private guests use pantrybot_guest_v14.',
      },
      VercelCronBearer: {
        type: 'http',
        scheme: 'bearer',
        description: 'CRON_SECRET required for recording GET requests; preview GET is public.',
      },
    },
    schemas: {
      PantryEntryInput: {
        type: 'object', required: ['displayName', 'available'],
        properties: {
          ingredientId: { type: 'string', description: 'Optional explicit catalog identity. Omit for a private custom ingredient.' },
          displayName: { type: 'string', minLength: 1, maxLength: 120 },
          available: { type: 'boolean', description: 'Explicit presence, independent of optional quantity and date.' },
          location: { type: 'string', enum: ['PANTRY', 'FRIDGE', 'FREEZER'] },
          quantity: { type: 'number', minimum: 0, description: 'Finite optional context; zero never changes availability.' },
          unit: { type: 'string', maxLength: 40 },
          useByDate: { type: 'string', format: 'date', description: 'Valid calendar date YYYY-MM-DD, with no timezone conversion.' },
        },
      },
      PantryEntry: {
        allOf: [{ $ref: '#/components/schemas/PantryEntryInput' }, {
          type: 'object', required: ['id', 'revision', 'updatedAtIso'], properties: {
            id: { type: 'string', maxLength: 1024 }, revision: { type: 'integer', minimum: 1, maximum: 9007199254740991 },
            updatedAtIso: { type: 'string', format: 'date-time' }, deletedAtIso: { type: 'string', format: 'date-time' },
          },
        }],
      },
      PantryMutation: {
        type: 'object', required: ['mutationId', 'entryId', 'expectedRevision', 'operation'], properties: {
          mutationId: { type: 'string', minLength: 1, maxLength: 128 }, entryId: { type: 'string', minLength: 1, maxLength: 1024 },
          expectedRevision: { type: 'integer', minimum: 0, maximum: 9007199254740990, description: 'Zero creates a new entry; existing entries including tombstones require their latest revision.' },
          operation: { type: 'string', enum: ['put', 'delete'] }, entry: { $ref: '#/components/schemas/PantryEntryInput' },
        },
        oneOf: [{ properties: { operation: { const: 'put' } }, required: ['entry'] }, { properties: { operation: { const: 'delete' } } }],
      },
      PantrySnapshot: {
        type: 'object', required: ['owner', 'entries', 'legacySource', 'needsCatalogMatch'], properties: {
          owner: { type: 'string', pattern: '^(account|guest):.+' },
          entries: { type: 'array', items: { $ref: '#/components/schemas/PantryEntry' } },
          catalogVersion: { type: 'string', description: 'Application cooking catalog version; acceptedCatalogIds separately reflects database readiness.' },
          acceptedCatalogIds: { type: 'array', items: { type: 'string' }, description: 'Installed server identities, checked before saving new references. Absent on older responses; reconnect to verify readiness.' },
          legacyMigrationVersion: { type: 'integer', const: 1, description: 'Absent until migration completes.' },
          needsCatalogMatch: { type: 'array', items: { type: 'string' } },
          legacySource: { type: 'object', required: ['owner', 'freezerItems', 'onHandIngredientIds'], properties: {
            owner: { type: 'string' }, freezerItems: { type: 'array', items: { $ref: '#/components/schemas/FreezerItem' } },
            onHandIngredientIds: { type: 'array', items: { type: 'string' } },
          } },
        },
      },
      PantryApplied: {
        type: 'object', required: ['owner', 'status', 'mutationId', 'entry'], properties: {
          owner: { type: 'string' }, status: { const: 'applied' }, mutationId: { type: 'string' }, entry: { $ref: '#/components/schemas/PantryEntry' },
        },
      },
      PantryConflict: {
        type: 'object', required: ['owner', 'status', 'mutationId', 'reason', 'current'], properties: {
          owner: { type: 'string' }, status: { const: 'conflict' }, mutationId: { type: 'string' }, reason: { type: 'string', enum: ['revision', 'identity'] },
          current: { oneOf: [{ $ref: '#/components/schemas/PantryEntry' }, { type: 'null' }] },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            example: 'Failed to load commodity & meal prep data',
          },
        },
        required: ['error'],
      },
      StoreChain: {
        type: 'string',
        enum: ['KING_SOOPERS', 'SAFEWAY', 'ALDI', 'WALMART', 'TARGET', 'SPROUTS'],
        description: 'Supported supermarket chain or ecosystem',
      },
      DealType: {
        type: 'string',
        enum: ['SHELF_OR_MEMBER', 'DIGITAL_COUPON', 'MULTI_BUY', 'EVERYDAY_LOW'],
        description: 'Redemption mechanism required to unlock the deal',
      },
      MacroGoal: {
        type: 'string',
        enum: ['ANY', 'HIGH_PROTEIN', 'LOW_CARB_KETO', 'CALORIE_CONSCIOUS', 'BALANCED_FAMILY'],
        description: 'Nutritional goal archetype for meal-prep batch scoring',
      },
      DietaryConstraint: {
        type: 'string',
        enum: ['GLUTEN_FREE', 'DAIRY_FREE', 'NUT_FREE', 'VEGETARIAN_PESCATARIAN'],
        description: 'Dietary restriction tag',
      },
      CookingVesselArchetype: {
        type: 'string',
        enum: [
          'ANY',
          'SLOW_COOKER_INSTANT_POT',
          'DUTCH_OVEN_BRAISE',
          'CASSEROLE_SHEET_PAN',
          'BIG_BATCH_SKILLET',
        ],
        description: 'Cookware or appliance vessel category',
      },
      DishStyle: {
        type: 'string',
        enum: ['STEW_BRAISE', 'CHILI_SOUP', 'CASSEROLE_BAKE', 'CURRY_SKILLET'],
      },
      NutritionMacros: {
        type: 'object',
        properties: {
          calories: { type: 'number', example: 450 },
          proteinGrams: { type: 'number', example: 42 },
          carbsGrams: { type: 'number', example: 28 },
          fatGrams: { type: 'number', example: 14 },
        },
        required: ['calories', 'proteinGrams', 'carbsGrams', 'fatGrams'],
      },
      FreezerItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'frz-ground-beef-80-20-1729350000' },
          canonicalIngredientId: { type: 'string', example: 'ground-beef-80-20' },
          ingredientName: { type: 'string', example: 'Ground Beef (80/20)' },
          category: { type: 'string', enum: ['PROTEIN', 'PRODUCE', 'DAIRY_EGGS'] },
          quantityLbOrDoz: { type: 'number', example: 3.5 },
          unit: { type: 'string', enum: ['lb', 'doz'], example: 'lb' },
          purchasePricePerUnit: { type: 'number', example: 3.49 },
          regularPricePerUnit: { type: 'number', example: 5.49 },
          totalCostBasis: { type: 'number', example: 12.22 },
          estimatedSavings: { type: 'number', example: 7.0 },
          store: { $ref: '#/components/schemas/StoreChain' },
          storeBanner: { type: 'string', example: 'King Soopers' },
          purchasedAtIso: { type: 'string', example: '2026-10-19T12:00:00.000Z' },
          notes: { type: 'string', example: 'Split into two 1.75 lb freezer bags' },
        },
        required: [
          'id',
          'canonicalIngredientId',
          'ingredientName',
          'category',
          'quantityLbOrDoz',
          'unit',
          'purchasePricePerUnit',
          'regularPricePerUnit',
          'totalCostBasis',
          'estimatedSavings',
          'store',
          'storeBanner',
          'purchasedAtIso',
        ],
      },
      MatchedSlotIngredient: {
        type: 'object',
        properties: {
          slotLabel: { type: 'string', example: 'Primary Protein' },
          ingredientId: { type: 'string', example: 'ground-beef-80-20' },
          ingredientName: { type: 'string', example: 'Ground Beef (80/20)' },
          quantityUsed: { type: 'number', example: 2.0 },
          unit: { type: 'string', enum: ['lb', 'doz'], example: 'lb' },
          store: { $ref: '#/components/schemas/StoreChain' },
          rawDealText: { type: 'string', example: '$3.49/lb with digital coupon' },
          dealType: { $ref: '#/components/schemas/DealType' },
          dealConditions: { type: 'string', example: 'Limit 5 lbs' },
          unitCost: { type: 'number', example: 3.49 },
          slotCost: { type: 'number', example: 6.98 },
          regularSlotCost: { type: 'number', example: 10.98 },
          isUserPinned: { type: 'boolean', example: false },
          isOnHand: { type: 'boolean', example: false },
          fromVirtualFreezer: { type: 'boolean', example: false },
        },
        required: [
          'slotLabel',
          'ingredientId',
          'ingredientName',
          'quantityUsed',
          'unit',
          'store',
          'rawDealText',
          'dealType',
          'unitCost',
          'slotCost',
          'regularSlotCost',
          'isUserPinned',
        ],
      },
      BarcodeProduct: {
        type: 'object', properties: {
          source: { type: 'string', enum: ['USDA_FDC_BRANDED'] }, fdcId: { type: 'string' }, originalBarcode: { type: 'string' }, description: { type: 'string' },
          brandName: { type: ['string', 'null'] }, brandOwner: { type: ['string', 'null'] }, packageLabel: { type: ['string', 'null'] },
          marketCountry: { type: 'string' }, publicationDate: { type: 'string', format: 'date' }, modifiedDate: { type: ['string', 'null'] }, availableDate: { type: ['string', 'null'] },
          snapshotDate: { type: 'string', format: 'date' }, sourceUrl: { type: 'string', format: 'uri' },
        }, required: ['source', 'fdcId', 'originalBarcode', 'description', 'brandName', 'brandOwner', 'packageLabel', 'marketCountry', 'publicationDate', 'modifiedDate', 'availableDate', 'snapshotDate', 'sourceUrl'],
      },
      ValidatedBarcode: { type: 'object', properties: {
        original: { type: 'string' }, digits: { type: 'string' }, key: { type: 'string', minLength: 14, maxLength: 14 }, format: { type: 'string', enum: ['MANUAL', 'UPC_A', 'EAN_13'] },
      }, required: ['original', 'digits', 'key', 'format'] },
      BarcodeLookupResult: {
        oneOf: [
          { type: 'object', properties: { status: { type: 'string', enum: ['FOUND'] }, barcode: { $ref: '#/components/schemas/ValidatedBarcode' }, product: { $ref: '#/components/schemas/BarcodeProduct' },
            suggestion: { type: ['object', 'null'], properties: { ingredientId: { type: 'string' }, ruleId: { type: 'string' } }, required: ['ingredientId', 'ruleId'] } }, required: ['status', 'barcode', 'product', 'suggestion'] },
          { type: 'object', properties: { status: { type: 'string', enum: ['AMBIGUOUS_PRODUCT'] }, barcode: { $ref: '#/components/schemas/ValidatedBarcode' }, products: { type: 'array', maxItems: 5, items: { $ref: '#/components/schemas/BarcodeProduct' } }, matchCount: { type: 'integer', minimum: 2 } }, required: ['status', 'barcode', 'products', 'matchCount'] },
          { type: 'object', properties: { status: { type: 'string', enum: ['INVALID', 'UNSUPPORTED', 'NOT_FOUND', 'DISCONTINUED', 'SOURCE_DATE_HOLD', 'DISABLED', 'SERVICE_UNAVAILABLE', 'THROTTLED'] }, message: { type: 'string' } }, required: ['status', 'message'] },
        ], discriminator: { propertyName: 'status' },
      },
      PantryRequirement: {
        type: 'object', properties: {
          ingredientId: { type: 'string', description: 'Exact pantry identity or a reviewed recipe-use requirement ID. Recipe-use IDs represent alternatives within a specific recipe slot and cannot be stored as pantry inventory.' }, displayName: { type: 'string' },
          quantity: { type: 'number', minimum: 0 }, unit: { type: 'string' }, optional: { type: 'boolean' },
          quantityBasisVersion: { type: 'string', description: 'Reviewed use basis, including canned-net-contents-v1 for labeled unopened can contents. Missing saved basis never implies net contents.' },
        }, required: ['ingredientId', 'quantity', 'unit'],
      },
      PantryPriceDetail: {
        allOf: [{ $ref: '#/components/schemas/PantryRequirement' }, {
          type: 'object', properties: {
            requirementKey: { type: 'string' }, allocatedCents: { type: ['integer', 'null'], minimum: 0, description: 'Authoritative integer recipe allocation.' },
            priceBasis: { type: 'string', enum: ['OBSERVED', 'STATIC_ESTIMATE', 'UNPRICED', 'ON_HAND', 'OPTIONAL'] },
            estimatedCost: { type: ['number', 'null'], description: 'Allocated USD recipe cents; null means unpriced.' },
            observation: { type: 'object', properties: {
              source: { type: 'string', enum: ['KROGER_PRODUCTION'] }, quoteId: { type: 'string' },
              productId: { type: 'string' }, itemId: { type: 'string' }, locationId: { type: 'string' },
              observedAtIso: { type: 'string', format: 'date-time' }, effectiveAtIso: { type: 'string', format: 'date-time' }, expiresAtIso: { type: 'string', format: 'date-time' },
              packagePrice: { type: 'number' }, packageAmount: { type: 'string' }, packageUnit: { type: 'string' },
              sourceSizeLabel: { type: 'string' }, ruleVersion: { type: 'string' }, stockUnconfirmed: { type: 'boolean' },
            }, required: ['source', 'quoteId', 'productId', 'itemId', 'locationId', 'observedAtIso', 'packagePrice', 'packageAmount', 'packageUnit', 'sourceSizeLabel', 'ruleVersion', 'stockUnconfirmed'] },
          }, required: ['requirementKey', 'allocatedCents', 'priceBasis', 'estimatedCost'],
        }],
      },
      PantryPricing: {
        type: 'object', description: 'Derived current recipe-use pricing. Discarded before saving recipes; live provider activation remains disabled.',
        properties: {
          rows: { type: 'array', items: { $ref: '#/components/schemas/PantryPriceDetail' } }, total: { type: 'number' },
          includesStaticEstimates: { type: 'boolean' }, incompleteEstimate: { type: 'boolean' },
          evaluatedAtIso: { type: 'string', format: 'date-time' }, marketId: { type: 'string' }, selectedLocationIds: { type: 'array', items: { type: 'string' } },
        }, required: ['rows', 'total', 'includesStaticEstimates', 'incompleteEstimate', 'evaluatedAtIso', 'marketId', 'selectedLocationIds'],
      },
      RecommendedDish: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'dish-sunday-beef-stew' },
          title: { type: 'string', example: 'Sunday Slow Cooker Beef Stew' },
          subtitle: { type: 'string', example: 'Tender chuck & potatoes in rich broth' },
          style: { $ref: '#/components/schemas/DishStyle' },
          appliance: { type: 'string', example: 'Slow Cooker' },
          vesselArchetype: { $ref: '#/components/schemas/CookingVesselArchetype' },
          servings: { type: 'number', example: 6 },
          prepTimeMinutes: { type: 'number', example: 20 },
          cookTimeMinutes: { type: 'number', example: 360 },
          freezerFriendly: { type: 'boolean', example: true },
          flavorProfile: { type: 'string', example: 'Savory, herb-infused, rich' },
          macrosPerServing: { $ref: '#/components/schemas/NutritionMacros' },
          dietaryTags: {
            type: 'array',
            items: { $ref: '#/components/schemas/DietaryConstraint' },
          },
          macroBadges: {
            type: 'array',
            items: { type: 'string' },
            example: ['💪 High-Protein (42g)'],
          },
          adaptationNote: { type: 'string' },
          matchedIngredients: {
            type: 'array',
            items: { $ref: '#/components/schemas/MatchedSlotIngredient' },
          },
          pantryStaples: {
            type: 'array',
            items: { type: 'string' },
            example: ['Beef broth', 'Olive oil', 'Salt & pepper'],
          },
          pantryRequirements: { type: 'array', items: { $ref: '#/components/schemas/PantryRequirement' }, description: 'Explicit batch-use staple requirements in staged pantry mode; legacy free text remains unpriced.' },
          pantryPricing: { $ref: '#/components/schemas/PantryPricing' },
          pantryCoverage: { type: 'object', properties: {
            requiredCount: { type: 'integer' }, availableRequiredCount: { type: 'integer' },
            optionalCount: { type: 'integer' }, availableOptionalCount: { type: 'integer' },
          } },
          additionalCostEstimateComplete: { type: 'boolean', description: 'False means totals are known subtotals plus unpriced ingredients.' },
          missingPriceIngredientIds: { type: 'array', items: { type: 'string' } },
          estimatedPantryCost: { type: 'number', example: 2.5, description: 'USD recipe-use estimate for uncovered required staples; allocated row basis is reported in pantryPricing. Live provider activation remains disabled.' },
          totalBatchCost: { type: 'number', example: 14.85 },
          regularBatchCost: { type: 'number', example: 23.4 },
          totalBatchSavings: { type: 'number', example: 8.55 },
          costPerServing: { type: 'number', example: 2.48 },
          dishMatchScore: { type: 'number', example: 95 },
          steps: {
            type: 'array',
            items: { type: 'string' },
          },
          reheatTip: { type: 'string', example: 'Reheat on stovetop with 2 tbsp water.' },
          aiGenerated: { type: 'boolean', example: false },
          savedInLibrary: { type: 'boolean', example: false },
          poweredByFreezerCount: { type: 'number', example: 1 },
        },
        required: [
          'id',
          'title',
          'subtitle',
          'style',
          'appliance',
          'servings',
          'prepTimeMinutes',
          'cookTimeMinutes',
          'freezerFriendly',
          'flavorProfile',
          'macrosPerServing',
          'matchedIngredients',
          'pantryStaples',
          'estimatedPantryCost',
          'totalBatchCost',
          'regularBatchCost',
          'totalBatchSavings',
          'costPerServing',
          'dishMatchScore',
          'steps',
          'reheatTip',
        ],
      },
      StoreOffer: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'ks-beef-8020-001' },
          canonicalIngredientId: { type: 'string', example: 'ground-beef-80-20' },
          store: { $ref: '#/components/schemas/StoreChain' },
          storeLocationLabel: { type: 'string', example: 'King Soopers (Firestone)' },
          rawTitle: { type: 'string', example: 'Fresh Ground Beef 80/20' },
          rawPriceText: { type: 'string', example: '$3.49/lb' },
          salePrice: { type: 'number', example: 3.49 },
          saleUnit: { type: 'string', example: 'lb' },
          normalizedPricePerUnit: { type: 'number', example: 3.49 },
          regularPricePerUnit: { type: 'number', example: 5.49 },
          dealType: { $ref: '#/components/schemas/DealType' },
          dealConditions: { type: 'string', example: 'With Card & Digital Coupon' },
          validFrom: { type: 'string', example: '2026-10-14' },
          validTo: { type: 'string', example: '2026-10-20' },
          imageUrl: { type: 'string' },
          source: {
            type: 'string',
            enum: ['FLIPP_LIVE', 'KROGER_API', 'CURATED_FALLBACK'],
          },
        },
        required: [
          'id',
          'canonicalIngredientId',
          'store',
          'storeLocationLabel',
          'rawTitle',
          'rawPriceText',
          'salePrice',
          'saleUnit',
          'normalizedPricePerUnit',
          'regularPricePerUnit',
          'dealType',
          'validFrom',
          'validTo',
          'source',
        ],
      },
      ScoredCommodity: {
        type: 'object',
        properties: {
          ingredient: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'ground-beef-80-20' },
              name: { type: 'string', example: 'Ground Beef (80/20)' },
              category: { type: 'string', example: 'PROTEIN' },
              standardUnit: { type: 'string', example: 'lb' },
            },
            required: ['id', 'name', 'category', 'standardUnit'],
          },
          bestOffer: { $ref: '#/components/schemas/StoreOffer' },
          recipeOffers: { type: 'array', items: { $ref: '#/components/schemas/StoreOffer' }, description: 'Uncollapsed offers for reviewed recipe-specific price admission; market-board identities and prices remain grouped.' },
          recipeStorePool: { type: 'array', items: { $ref: '#/components/schemas/StoreChain' }, description: 'Selected stores eligible for recipe-card and ranking prices. Admission must not expand this pool.' },
          valueScore: { type: 'number', example: 92 },
          affordabilityScore: { type: 'number', example: 85 },
          discountDepthScore: { type: 'number', example: 98 },
          wholesaleBonusScore: { type: 'number', example: 90 },
          discountVsBaselinePct: { type: 'number', example: 0.36 },
          discountVsRegularPct: { type: 'number', example: 0.36 },
          isSplurgeAlert: { type: 'boolean', example: false },
          actionTag: {
            type: 'string',
            enum: ['STOCK_UP_ANCHOR', 'GREAT_STAPLE', 'SPLURGE_DEAL', 'WAIT_NEXT_WEEK', 'BUY_BEFORE_SPIKE'],
          },
          sixWeekLocalAvg: { type: 'number', example: 4.89 },
          sixWeekLow: { type: 'number', example: 3.49 },
        },
        required: [
          'ingredient',
          'bestOffer',
          'valueScore',
          'discountVsBaselinePct',
          'isSplurgeAlert',
          'actionTag',
          'sixWeekLocalAvg',
          'sixWeekLow',
        ],
      },
      AvailableStoreInfo: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/StoreChain' },
          name: { type: 'string', example: 'King Soopers' },
          bannerName: { type: 'string', example: 'King Soopers' },
          brandColor: { type: 'string', example: '#004c97' },
          accentBg: { type: 'string', example: '#e6f0fa' },
          badgeTextColor: { type: 'string', example: '#002855' },
          hasDigitalCoupons: { type: 'boolean', example: true },
          couponAppLabel: { type: 'string', example: 'King Soopers App' },
          isEverydayLowPrice: { type: 'boolean', example: false },
          hasActiveOffers: { type: 'boolean', example: true },
        },
        required: [
          'id',
          'name',
          'bannerName',
          'brandColor',
          'accentBg',
          'badgeTextColor',
          'hasDigitalCoupons',
          'isEverydayLowPrice',
        ],
      },
      KingSoopersLocation: {
        type: 'object',
        properties: {
          locationId: { type: 'string', example: '62000105' },
          name: { type: 'string', example: 'King Soopers Firestone' },
          address: { type: 'string', example: '6110 Firestone Blvd' },
          city: { type: 'string', example: 'Firestone' },
          distanceMiles: { type: 'number', example: 4.2 },
        },
        required: ['locationId', 'name', 'address', 'city', 'distanceMiles'],
      },
      DashboardPayload: {
        type: 'object',
        properties: {
          zipCode: { type: 'string', example: '80542' },
          cityLabel: { type: 'string', example: 'Mead, CO' },
          adCycleLabel: { type: 'string', example: 'Oct 14 - Oct 20, 2026' },
          lastUpdatedIso: { type: 'string', example: '2026-10-19T12:00:00.000Z' },
          usda: { type: 'object', description: 'Stored benchmark status and ingredient-level report period, region, unit, version, fetched and checked times; not upstream request status.', properties: {
            status: { type: 'string', enum: ['current','stale','fallback'] }, reason: { type: 'string' }, provenance: { type: 'object', additionalProperties: true },
          } },
          marketHistory: { type: 'object', properties: { storage: { type: 'string', enum: ['cloud','local','unavailable'] }, archiveStorage: { type: 'string', enum: ['cloud','local','unavailable'] }, provenance: { type: 'string', enum: ['verified_live','synthetic_seed'] } } },
          dataSourcesActive: {
            type: 'object',
            properties: {
              flippLive: { type: 'boolean' },
              usdaLive: { type: 'boolean', description: 'Compatibility field: at least one usable stored USDA benchmark; does not indicate a live upstream call.' },
              krogerLive: { type: 'boolean' },
              geminiConfigured: { type: 'boolean' },
              sqlitePersisted: { type: 'boolean' },
              supabaseConfigured: { type: 'boolean' },
            },
            required: ['flippLive', 'usdaLive', 'krogerLive', 'geminiConfigured', 'sqlitePersisted'],
          },
          sqliteStats: {
            type: 'object',
            properties: {
              dbPath: { type: 'string' },
              totalHistoricalOfferRows: { type: 'number' },
              totalUsdaSnapshotRows: { type: 'number' },
              trackedWeeksCount: { type: 'number' },
            },
            required: ['dbPath', 'totalHistoricalOfferRows', 'totalUsdaSnapshotRows', 'trackedWeeksCount'],
          },
          nearbyKingSoopersLocations: {
            type: 'array',
            items: { $ref: '#/components/schemas/KingSoopersLocation' },
          },
          selectedKingSoopersLocationId: { type: 'string' },
          availableStores: {
            type: 'array',
            items: { $ref: '#/components/schemas/AvailableStoreInfo' },
          },
          commodities: {
            type: 'array',
            items: { $ref: '#/components/schemas/ScoredCommodity' },
          },
          splurgeAlerts: {
            type: 'array',
            items: { $ref: '#/components/schemas/ScoredCommodity' },
          },
          recommendedTrio: {
            type: 'array',
            items: { $ref: '#/components/schemas/RecommendedDish' },
          },
          allRankedDishes: {
            type: 'array',
            items: { $ref: '#/components/schemas/RecommendedDish' },
          },
          marketRadar: {
            type: 'object',
            properties: {
              buyBeforeSpike: {
                type: 'array',
                items: { $ref: '#/components/schemas/ScoredCommodity' },
              },
              stockUpCycleLows: {
                type: 'array',
                items: { $ref: '#/components/schemas/ScoredCommodity' },
              },
              cyclePeakWaitList: {
                type: 'array',
                items: { $ref: '#/components/schemas/ScoredCommodity' },
              },
              holdOffDropping: {
                type: 'array',
                items: { type: 'object' },
              },
            },
            required: ['buyBeforeSpike', 'holdOffDropping'],
          },
        },
        required: [
          'zipCode',
          'cityLabel',
          'adCycleLabel',
          'lastUpdatedIso',
          'dataSourcesActive',
          'sqliteStats',
          'commodities',
          'splurgeAlerts',
          'recommendedTrio',
          'allRankedDishes',
          'marketRadar',
        ],
      },
      UserProfile: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'usr-google-demo-80542' },
          email: { type: 'string', example: 'shopper@pantrybot.dev' },
          displayName: { type: 'string', example: 'Google Meal Prepper' },
          avatarUrl: { type: 'string' },
          provider: { type: 'string', enum: ['google', 'apple'] },
          createdAtIso: { type: 'string', example: '2026-10-19T12:00:00.000Z' },
          updatedAtIso: { type: 'string', example: '2026-10-19T12:00:00.000Z' },
          isCloudBacked: { type: 'boolean', example: false },
        },
        required: ['id', 'email', 'displayName', 'provider', 'createdAtIso', 'updatedAtIso', 'isCloudBacked'],
      },
      UserPreferences: {
        type: 'object',
        properties: {
          userId: { type: 'string', example: 'usr-google-demo-80542' },
          defaultZip: { type: 'string', example: '80542' },
          favoriteStoreIds: {
            type: 'array',
            items: { $ref: '#/components/schemas/StoreChain' },
          },
          macroGoal: { $ref: '#/components/schemas/MacroGoal' },
          dietaryConstraints: {
            type: 'array',
            items: { $ref: '#/components/schemas/DietaryConstraint' },
          },
          vesselArchetype: { $ref: '#/components/schemas/CookingVesselArchetype' },
          targetServings: { type: 'number', enum: [4, 6, 8] },
          pinnedIngredientIds: {
            type: 'array',
            items: { type: 'string' },
          },
          onHandIngredientIds: {
            type: 'array',
            items: { type: 'string' },
          },
          updatedAtIso: { type: 'string' },
        },
        required: [
          'userId',
          'defaultZip',
          'favoriteStoreIds',
          'macroGoal',
          'dietaryConstraints',
          'vesselArchetype',
          'targetServings',
          'pinnedIngredientIds',
          'onHandIngredientIds',
          'updatedAtIso',
        ],
      },
      UserSyncPayload: {
        type: 'object',
        properties: {
          authenticated: { type: 'boolean', example: true },
          storageMode: {
            type: 'string',
            enum: ['SUPABASE_RLS', 'SQLITE_LOCAL_FALLBACK'],
            example: 'SQLITE_LOCAL_FALLBACK',
          },
          supabaseConfigured: { type: 'boolean', example: false },
          profile: {
            anyOf: [
              { $ref: '#/components/schemas/UserProfile' },
              { type: 'null' },
            ],
          },
          preferences: {
            anyOf: [
              { $ref: '#/components/schemas/UserPreferences' },
              { type: 'null' },
            ],
          },
          freezerItems: {
            type: 'array',
            items: { $ref: '#/components/schemas/FreezerItem' },
          },
          savedRecipes: {
            type: 'array',
            items: { $ref: '#/components/schemas/RecommendedDish' },
          },
          syncedAtIso: { type: 'string', example: '2026-10-19T12:00:00.000Z' },
        },
        required: [
          'authenticated',
          'storageMode',
          'supabaseConfigured',
          'profile',
          'preferences',
          'freezerItems',
          'savedRecipes',
          'syncedAtIso',
        ],
      },
      UserDataExportArchive: {
        type: 'object',
        properties: {
          schemaVersion: { type: 'string', example: '1.3.0' },
          exportedAtIso: { type: 'string', example: '2026-10-19T12:00:00.000Z' },
          application: { type: 'string', example: 'PantryBot (pantrybot.dev)' },
          piiPolicy: { type: 'string' },
          profile: { $ref: '#/components/schemas/UserProfile' },
          preferences: { $ref: '#/components/schemas/UserPreferences' },
          virtualFreezerInventory: {
            type: 'array',
            items: { $ref: '#/components/schemas/FreezerItem' },
          },
          savedMealPrepRecipes: {
            type: 'array',
            items: { $ref: '#/components/schemas/RecommendedDish' },
          },
          virtualPantry: { $ref: '#/components/schemas/PantrySnapshot', description: 'Additive private pantry data and original legacy archive, included after migration.' },
        },
        required: [
          'schemaVersion',
          'exportedAtIso',
          'application',
          'piiPolicy',
          'profile',
          'preferences',
          'virtualFreezerInventory',
          'savedMealPrepRecipes',
        ],
      },
      WeeklySyncCronResult: {
        type: 'object',
        properties: {
          refreshStatus: { type: 'string', enum: ['live', 'estimates_only'] },
          auditStorage: { type: 'string', enum: ['cloud', 'local', 'unavailable', 'preview'] },
          ok: { type: 'boolean', example: true },
          cycle: { type: 'string', example: 'wed_oct_14' },
          executedAtIso: { type: 'string', example: '2026-10-19T12:00:00.000Z' },
          syncedOffersCount: { type: 'number', example: 58 },
          dataSources: {
            type: 'object',
            properties: {
              flippLive: { type: 'boolean' },
              krogerLive: { type: 'boolean' },
              usdaLive: { type: 'boolean', description: 'Compatibility field: at least one usable stored USDA benchmark; does not indicate a live upstream call.' },
            },
            required: ['flippLive', 'krogerLive', 'usdaLive'],
          },
          smartPushNotifications: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                triggerType: { type: 'string' },
                scheduledWindowLabel: { type: 'string' },
                title: { type: 'string' },
                subtitle: { type: 'string' },
                body: { type: 'string' },
                deepLinkPath: { type: 'string' },
                badgeText: { type: 'string' },
                priority: { type: 'string', enum: ['high', 'normal'] },
              },
              required: ['id', 'triggerType', 'title', 'body', 'deepLinkPath'],
            },
          },
          fridayWeekendDigest: {
            type: 'object',
            properties: {
              generatedAtIso: { type: 'string' },
              adCycleLabel: { type: 'string' },
              zipCode: { type: 'string' },
              markdownDigest: { type: 'string' },
            },
            required: ['generatedAtIso', 'adCycleLabel', 'zipCode', 'markdownDigest'],
          },
        },
        required: [
          'ok',
          'cycle',
          'executedAtIso',
          'syncedOffersCount',
          'dataSources',
          'smartPushNotifications',
          'fridayWeekendDigest',
        ],
      },
    },
  },
} as const;
