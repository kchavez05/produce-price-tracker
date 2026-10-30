# Virtual Pantry (v1.6.0)

Virtual Pantry requires installed pantry migrations and `PANTRYBOT_PANTRY_ENABLED=true`. Unmigrated installations retain the disabled default; hosted activation follows the [release checklist](../releases/v1.6.0.md). Earlier freezer documentation describes the flag-off compatibility path.

Open **Virtual Pantry** to search the catalog, add a name as Yes, or add a private custom ingredient. Optional shortcuts never preselect inventory. Use the availability control to mark No while retaining details; delete is a separate action. Quantity, unit, storage location, and use-by date are optional context. Zero quantity and past dates do not change availability.

Recipes show **Already have**, **Make sure you have**, **Need to buy**, and distinct required coverage; optional ingredients count separately. Quantity never produces a partial shopping shortfall. Custom names need an explicit catalog link before affecting recipes. Rice varieties, canned/dried beans, and flour types retain distinct identities.

**Estimated additional grocery cost** assumes marked ingredients are on hand. Staples use fixed USD estimates per recipe-use unit, separate from observed store offers and package checkout totals. Unknown identities or unsupported units remain unpriced, and totals are labeled as known subtotals. Saved recipe documents stay intact while their displayed availability and costs refresh. Planning, saving, cooking, and purchase suggestions do not write inventory.

Guests save privately on this browser/device. Sign in for cross-device persistence, then explicitly review and confirm guest import. Account entries win duplicate collisions. Failed saves remain pending; Retry preserves edits. Concurrent changes require choosing the current remote entry or your pending edit. Signing out hides the account cache and never transfers its queue to another account.

Legacy inventory migration preserves source purchase records and manual selections. Ambiguous groups remain custom until reviewed. Older clients cannot replace migrated inventory; unsupported writes return upgrade-required. Account export includes entries and archived legacy records; browser downloads also include verifiably owned pending/recovery data. Account deletion clears these records.

Before enabling the flag, apply `20261029171953_virtual_pantry_persistence.sql`, `20261029211728_pantry_staple_catalog.sql`, and `20261030173404_reviewed_cooking_catalog.sql`. Run the required checks and verify account persistence in fresh sessions and on two clients. The v1.6.0 release records the maintainer-authorized production verification exception. Do not enable the flag against an unmigrated database. Dynamic staple pricing belongs to v1.6.2 with barcodes; speech entry belongs to v1.6.1.

The reviewed catalog contains 72 identities. Broad lentils search shows dried/canned forms with optional red variety. Fresh onions cover the reviewed cooking-onion recipe requirement; onion powder is separate. Each identity has a market-link audit disposition. Refresh and rollback procedures are in the [catalog integration guide](../usda-catalog-integration.md).
