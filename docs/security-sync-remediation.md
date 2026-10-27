# Security and sync remediation

## Plan and implementation

1. Replace caller-controlled identity cookies with random, expiring, revocable credentials. Store only token hashes in SQLite; create random local account IDs rather than deriving identity from email.
2. Scope recipes, freezer inventory, and dashboard inputs to the authenticated account or a private guest session. Never read legacy shared inventory for a request. Preserve zero-key local operation.
3. Require verified Supabase authentication to use the server Gemini key. Keep user-supplied keys and deterministic keyless plans available. Apply per-IP and account limits before generation.
4. Persist each browser sync mutation before sending it. Retain it through failed HTTP responses and network errors, retry after reconnect/reload, and delete only after acknowledgment. Bind queued updates to their original account. Convert additive guest merges to absolute snapshots before sending so retries do not double stock.
5. Write and delete cloud recipes using the composite `(user_id, id)` key. Check Supabase error results and require a fresh cloud read before route mutations. Update SQLite profiles in place to preserve child records and sessions.
6. Add regression tests, run all three test tiers, typecheck, lint, and production build; open a PR to develop and address CI/Codex feedback.

## Compatibility and deployment

- `pantrybot_session_v13` is no longer accepted. Local/demo users must sign in again. A supplied email is profile metadata, never proof of identity or an account lookup key.
- Private guest sessions use `pantrybot_guest_v14`; local accounts use `pantrybot_session_v14`. Tokens expire after 30 days and sign-out revokes the active local token.
- Legacy global recipe/freezer tables remain on disk but are no longer served. They cannot safely be assigned to a user because they contain no ownership information. Browser guest freezer data remains available for an explicit merge.
- The old unscoped `pantrybot_sync_queue_v13` is not automatically replayed because its owner cannot be verified. New queues are stored separately for each account and retained through failures.
- Account sync uses the browser Web Locks API (HTTPS or localhost) to serialize replay across tabs and protect queue storage updates. Unsupported browser contexts do not replay the queue unsafely.
- SQLite session persistence depends on durable storage. On a serverless instance that falls back to memory, local/guest sessions last only as long as that database. Use Supabase OAuth for durable cross-device accounts.
- AI rate limits use the existing in-process limiter. They bound each running instance; they are not a global billing cap across a horizontally scaled deployment. A shared quota service is needed if a deployment requires one global limit.
- Supabase query behavior is covered with a deterministic mock; these tests do not replace a staging check against the deployed Supabase project.

## Verification

Regression coverage includes forged/expired/revoked credentials, duplicate email isolation, guest and account ownership, cross-account queued requests, preservation of cached data on profile refresh, cloud recipe round trips/deletes/errors, and AI authentication/quota boundaries. Unit coverage includes offline queue replay, request failures, concurrent edits, account switching, and retry-safe guest merges.

Local validation passed: typecheck, ESLint, 66 unit tests, 11 smoke tests, 29 regression tests, and production build. The critical-severity dependency audit passed, with existing moderate/high Next.js/PostCSS advisories remaining outside this remediation.

Review follow-up: corrupted browser queues are validated and backed up under account-scoped recovery keys before repair; valid pending entries are retained. Guest freezer caches are parsed defensively, and merging stock to zero or below removes the depleted item. Regression tests cover malformed JSON, invalid shapes, partial corruption, failed backup storage, and depletion.

Codex review follow-up: replay is serialized across browser tabs, with separate short storage locks that allow edits during network requests. Sync acknowledgments no longer rehydrate the dashboard over current local selections. Deleting authenticated freezer stock also removes its on-hand preference and refreshes meal prices. Tests cover concurrent tabs, lock release after failures, selections made during sync, and both explicit deletion and consuming the last half-unit.
