# API keys and local setup

PantryBot supports manual pantry entry, local guest operation and deterministic recipes without API keys. [`.env.example`](../../.env.example) lists the variables read by the current application and operator scripts, with blank credentials and safe feature defaults. The [market-data runbook](../usda-market-data.md) describes authenticated USDA ingestion; [Virtual Pantry](Virtual-Pantry.md) describes inventory migrations.

## Local development

Use Node 24, install dependencies with `npm install`, then run `npm run dev`. Open http://localhost:3000. Run `npm run typecheck` and `npm run build` to verify the setup.

For a fresh environment file, copy the template once:

```sh
cp .env.example .env.local
```

If `.env.local` already exists, **merge missing entries from the template instead of replacing the file**. Keep credentials in ignored local files or the appropriate deployment environment. Never commit values or paste them into chat, issues or PRs. Only public configuration belongs under `NEXT_PUBLIC_`; Next.js embeds those values in browser bundles at build time.

## Application configuration

| Variables | Purpose / default |
| --- | --- |
| `GEMINI_API_KEY` | Server-funded Gemini recipe generation/remix; absent key preserves deterministic recipes. Verify the provider account's rates and terms; API use is not assumed free. |
| `USDA_MARS_API_KEY`, `USDA_INGEST_ENABLED` | Authenticated weekly ingestion and market operator commands. Ingestion defaults off; enable only after its migrations and validation. |
| `KROGER_CLIENT_ID`, `KROGER_CLIENT_SECRET`, `KROGER_LOCATION_ID` | Existing Kroger market-discovery connector. Default location: `01400100`. These do not provide new live pantry-staple pricing. |
| `NEXT_PUBLIC_DEFAULT_ZIP` | Default ZIP: `80542`. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase URL and client key for cloud auth/sync. These are the exact names the app reads; missing config retains local operation. Install the required migrations before cloud use. |
| `SUPABASE_SECRET_KEY` | Server-only privileged key for market history, ingestion and refresh audits. Never expose it under `NEXT_PUBLIC_`. |
| `CRON_SECRET` | Bearer secret for scheduled GET requests. Configure it in the production deployment. |
| `NEXT_PUBLIC_PANTRYBOT_CATALOG_VERSION` | Optional rollback to a version retained in `src/data/cooking-catalog.json`. Blank uses the bundled current version. |
| `PANTRYBOT_BARCODE_LOOKUP_ENABLED`, `PANTRYBOT_BARCODE_CAMERA_ENABLED`, `PANTRYBOT_BARCODE_SHARED_LIMIT_VERIFIED` | Barcode rollout/enforcement flags; all default to `false`. Follow the barcode qualification gates before activation. |
| `PANTRYBOT_BARCODE_INDEX_DIR` | Optional operator-built barcode index directory. Blank defaults to `data/fdc-barcode-index`; never put this artifact under `public/`. |
| `PANTRYBOT_SQLITE_PATH` | Optional local SQLite path. Blank defaults to `data/mead-price-history.sqlite`; `:memory:` is ephemeral. |
| `FDC_IMPORT_PYTHON` | Python executable for the offline USDA CSV importer. Blank defaults to `python3` (Python 3.10+). The importer does not automatically load local env files. |

The runtime's Gemini model and access rules are unchanged by the template update. `GOOGLE_API_KEY`, OpenAI, Anthropic and Deepgram credentials below are used only by the isolated comparison runner.

## Comparison credentials for spike #731

Normal app use does not need these extra accounts. The approved full comparison uses:

| Variable | Runner use |
| --- | --- |
| `GEMINI_API_KEY` | Google recipe and speech candidates. |
| `GOOGLE_API_KEY` | Google fallback **only when `GEMINI_API_KEY` is blank**; the application does not read this alias. Supply one Google key, not two. |
| `OPENAI_API_KEY` | OpenAI recipe, transcription and extraction candidates. |
| `ANTHROPIC_API_KEY` | Claude recipe candidate. |
| `ANTHROPIC_WORKSPACE_ID` | Required for an Anthropic API key not scoped to a workspace; otherwise optional. |
| `DEEPGRAM_API_KEY` | Specialist transcription candidate. |

These are direct provider API credentials. Vercel OIDC, AI Gateway credentials and consumer subscriptions do not substitute for them in this runner. Do not add the spike-only keys to Vercel just to run a local comparison.

You may merge these entries into `.env.local`. To keep spike credentials separate from Vercel pulls, create an ignored `.env.spike.local` containing only the relevant entries. Standalone Node scripts do not inherit Next.js env-file loading. Load both files explicitly, with the spike file last:

```sh
node --env-file-if-exists=.env.local --env-file-if-exists=.env.spike.local \
  --import tsx scripts/ai-spike-731/run.mts \
  --write-preflight /tmp/ai-spike-731-preflight.json \
  --write-qualification-template /tmp/ai-spike-731-qualification.json
```

This command is offline and reports credential presence without values. Later env files override earlier files; existing shell variables take precedence over both. Do not copy all the blank template entries into the overlay, which could mask configured values from `.env.local`.

For paid execution, use the same two env-file options with the approved runner command in [execution instructions](../research/ai-provider-spike-731/EXECUTION.md). Credentials alone do not satisfy account, billing/privacy, listening or review qualification. The approved total API cap is $10; no paid calls are part of this setup chore.

For another standalone script, explicitly load the file it needs; for example:

```sh
node --env-file-if-exists=.env.local --import tsx scripts/import-fdc-catalog.ts --help
```

## Why a Vercel pull contains more variables

The template describes the app/operator contract, so exact name-for-name parity with a generated deployment export would be misleading. The names-only audit for this chore found these additional groups in `.env.local`:

| Extra names | Why they are outside the template |
| --- | --- |
| `VERCEL`, `VERCEL_ENV`, `VERCEL_TARGET_ENV`, `VERCEL_URL`, `VERCEL_GIT_*` | Platform environment and deployment/Git metadata. Let Vercel generate these; PantryBot does not require manual local values. |
| `VERCEL_OIDC_TOKEN` | Vercel-generated token, refreshed by the CLI; the direct-provider comparison runner does not consume it. |
| `NX_DAEMON`, `TURBO_CACHE`, `TURBO_DOWNLOAD_LOCAL_ENABLED`, `TURBO_REMOTE_ONLY`, `TURBO_RUN_SUMMARY` | Tool/build settings found in the export, not variables read by PantryBot source or operator scripts. |
| `POSTGRES_DATABASE`, `POSTGRES_HOST`, `POSTGRES_PASSWORD`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_USER` | Integration connection fields. Current app/scripts use Supabase APIs and local SQLite; they do not read these Postgres connection variables. |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Integration aliases not read by the current app. Configure the exact `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` names above; merely setting another alias has no effect. |
| `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` | Integration/legacy credentials not consumed by this app. The server reads `SUPABASE_SECRET_KEY`; never copy a privileged key into a public client variable. |

`NODE_ENV` is also read by the application, but Next.js/the test runner sets it; it is not a required template entry. This audit does not prove that exported integration variables are unused by external tools, so it does not remove them from Vercel or your local file.

The current [Vercel CLI docs](https://vercel.com/docs/cli/env#how-vercel-env-pull-merges-into-an-existing-file) say `env pull` keeps local-only entries, updates pulled names and refreshes managed tokens. Older CLI versions can behave differently. Review the installed version's behavior before pulling into a file containing custom values. This PR does not perform an env pull or change deployment secrets.

References: [Vercel system variables](https://vercel.com/docs/environment-variables/system-environment-variables), [Next.js environment loading](https://nextjs.org/docs/app/guides/environment-variables), [Supabase key types](https://supabase.com/docs/guides/getting-started/api-keys). Supabase publishable and privileged keys have different permissions; generated variable names do not change which names PantryBot's configuration reads.
