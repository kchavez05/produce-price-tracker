# Freezer retirement documentation audit

November 12, 2026; #700 Stage 2. Branch preparation awaits production release. Current user/setup/API guides describe Pantry as the only inventory path, deprecated Freezer responses, rejected old sync fields and retained migration/export/delete. `.env.example` removes the Pantry rollout flag; barcode/camera controls remain independent. Terms describe Pantry availability; privacy explains original legacy data retention.

The plan's original mention count was historical. A fresh case-insensitive Markdown scan found the files below; this table records their disposition. OpenAPI source and both JSON exports are synchronized. API console filters include Virtual Pantry and Retired Inventory. Remaining code mentions describe cold-storage locations, freezer-friendly recipes, purchase suggestions, historical saved metadata ignored by current evaluation, or retained migration/recovery/export/storage. Earlier releases, research and accepted decisions remain intact.

Do not delete the production environment variable before releasing the retirement code: the current production version needs it. Once the new main deployment is Ready and production acceptance passes, remove the unused variable as release cleanup. Stage 2 has no flag-off rollback; preserve queues and original storage and forward-fix failures. Storage deletion requires separate Stage 3 approval and a fresh readiness/backup assessment.

| File | Disposition |
| --- | --- |
| [CHANGELOG.md](../../CHANGELOG.md) | Retained historical release, accepted specification, audit, security boundary, or approved dependency record; not an active Freezer usage instruction. |
| [README.md](../../README.md) | Updated current guide; historical release links or recovery/storage references retained. |
| [ROADMAP.md](../../ROADMAP.md) | Retained historical release, accepted specification, audit, security boundary, or approved dependency record; not an active Freezer usage instruction. |
| [SECURITY.md](../../SECURITY.md) | Retained historical release, accepted specification, audit, security boundary, or approved dependency record; not an active Freezer usage instruction. |
| [docs/data-explorer.md](../../docs/data-explorer.md) | Retained historical release, accepted specification, audit, security boundary, or approved dependency record; not an active Freezer usage instruction. |
| [docs/releases/v1.0.0.md](../../docs/releases/v1.0.0.md) | Retained historical release, accepted specification, audit, security boundary, or approved dependency record; not an active Freezer usage instruction. |
| [docs/releases/v1.2.0.md](../../docs/releases/v1.2.0.md) | Retained historical release, accepted specification, audit, security boundary, or approved dependency record; not an active Freezer usage instruction. |
| [docs/releases/v1.3.0.md](../../docs/releases/v1.3.0.md) | Retained historical release, accepted specification, audit, security boundary, or approved dependency record; not an active Freezer usage instruction. |
| [docs/releases/v1.3.1.md](../../docs/releases/v1.3.1.md) | Retained historical release, accepted specification, audit, security boundary, or approved dependency record; not an active Freezer usage instruction. |
| [docs/releases/v1.4.0.md](../../docs/releases/v1.4.0.md) | Retained historical release, accepted specification, audit, security boundary, or approved dependency record; not an active Freezer usage instruction. |
| [docs/releases/v1.4.1.md](../../docs/releases/v1.4.1.md) | Retained historical release, accepted specification, audit, security boundary, or approved dependency record; not an active Freezer usage instruction. |
| [docs/releases/v1.5.1.md](../../docs/releases/v1.5.1.md) | Retained historical release, accepted specification, audit, security boundary, or approved dependency record; not an active Freezer usage instruction. |
| [docs/releases/v1.6.0.md](../../docs/releases/v1.6.0.md) | Retained historical release, accepted specification, audit, security boundary, or approved dependency record; not an active Freezer usage instruction. |
| [docs/research/v2.0-flows-and-navigation.md](../../docs/research/v2.0-flows-and-navigation.md) | Retained historical release, accepted specification, audit, security boundary, or approved dependency record; not an active Freezer usage instruction. |
| [docs/research/v2.0-ui-audit.md](../../docs/research/v2.0-ui-audit.md) | Retained historical release, accepted specification, audit, security boundary, or approved dependency record; not an active Freezer usage instruction. |
| [docs/security-sync-remediation.md](../../docs/security-sync-remediation.md) | Retained historical release, accepted specification, audit, security boundary, or approved dependency record; not an active Freezer usage instruction. |
| [docs/specs/data-explorer-and-score-transparency.md](../../docs/specs/data-explorer-and-score-transparency.md) | Retained historical release, accepted specification, audit, security boundary, or approved dependency record; not an active Freezer usage instruction. |
| [docs/specs/v1.6.0-implementation-plan.md](../../docs/specs/v1.6.0-implementation-plan.md) | Retained historical release, accepted specification, audit, security boundary, or approved dependency record; not an active Freezer usage instruction. |
| [docs/specs/v1.6.0-virtual-pantry.md](../../docs/specs/v1.6.0-virtual-pantry.md) | Retained historical release, accepted specification, audit, security boundary, or approved dependency record; not an active Freezer usage instruction. |
| [docs/specs/v2.0-freezer-retirement.md](../../docs/specs/v2.0-freezer-retirement.md) | Retained historical release, accepted specification, audit, security boundary, or approved dependency record; not an active Freezer usage instruction. |
| [docs/specs/v2.0-m3-dashboard-decomposition.md](../../docs/specs/v2.0-m3-dashboard-decomposition.md) | Retained historical release, accepted specification, audit, security boundary, or approved dependency record; not an active Freezer usage instruction. |
| [docs/specs/v2.0-m4-screen-redesign.md](../../docs/specs/v2.0-m4-screen-redesign.md) | Retained historical release, accepted specification, audit, security boundary, or approved dependency record; not an active Freezer usage instruction. |
| [docs/specs/v2.0-m5-polish-and-release.md](../../docs/specs/v2.0-m5-polish-and-release.md) | Retained historical release, accepted specification, audit, security boundary, or approved dependency record; not an active Freezer usage instruction. |
| [docs/wiki/Architecture-and-Data-Pipeline.md](../../docs/wiki/Architecture-and-Data-Pipeline.md) | Updated current guide; historical release links or recovery/storage references retained. |
| [docs/wiki/Home.md](../../docs/wiki/Home.md) | Updated current guide; historical release links or recovery/storage references retained. |
| [docs/wiki/Long-Term-Mobile-and-Expansion-Roadmap.md](../../docs/wiki/Long-Term-Mobile-and-Expansion-Roadmap.md) | Updated current guide; historical release links or recovery/storage references retained. |
| [docs/wiki/OpenAPI-and-Swagger-Documentation.md](../../docs/wiki/OpenAPI-and-Swagger-Documentation.md) | Updated current guide; historical release links or recovery/storage references retained. |
| [docs/wiki/Scoring-and-Meal-Prep-Engine.md](../../docs/wiki/Scoring-and-Meal-Prep-Engine.md) | Updated current guide; historical release links or recovery/storage references retained. |
| [docs/wiki/Virtual-Pantry.md](../../docs/wiki/Virtual-Pantry.md) | Updated current guide; historical release links or recovery/storage references retained. |
