import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';

it('retains SQLite accepted IDs through restart and replays queued future edits idempotently after rollback', () => {
  const folder = mkdtempSync(join(tmpdir(), 'pantry-sqlite-catalog-'));
  const database = join(folder, 'isolated.sqlite');
  const prelude = `
    const assert = require('node:assert/strict');
    const store = require(${JSON.stringify(resolve('src/lib/db/sqlite.ts'))});
    const {DatabaseSync} = require('node:sqlite');
    const owner = 'account:fixture';
  `;
  function run(code: string) {
    const result = spawnSync(process.execPath, ['--import', 'tsx', '-e', prelude + code], {
      encoding: 'utf8', env: { ...process.env, PANTRYBOT_SQLITE_PATH: database },
    });
    expect(result.status, result.stderr).toBe(0);
  }
  try {
    run(`
      store.upsertUserProfileToSqlite({id:'fixture',email:'fixture@example.test',displayName:'Fixture',provider:'google',createdAtIso:'2026-10-30',updatedAtIso:'2026-10-30',isCloudBacked:false});
      store.migratePantryInSqlite(owner);
      const db = new DatabaseSync(process.env.PANTRYBOT_SQLITE_PATH);
      db.prepare('INSERT INTO pantry_catalog(id) VALUES(?)').run('future-item'); db.close();
      const queued = {mutationId:'future-queued',entryId:'future',expectedRevision:0,operation:'put',entry:{ingredientId:'future-item',displayName:'Future item',available:true}};
      assert.equal(store.mutatePantryInSqlite(owner,queued).entry.revision,1);
      store.mutatePantryInSqlite(owner,{...queued,mutationId:'later-edit',expectedRevision:1,entry:{ingredientId:'olive-oil',displayName:'Olive oil',available:false}});
      // Lost acknowledgments still replay even after a later identity edit.
      assert.equal(store.mutatePantryInSqlite(owner,queued).entry.revision,1);
      assert.equal(store.readPantryFromSqlite(owner).entries[0].ingredientId,'olive-oil');
      assert.throws(()=>store.mutatePantryInSqlite(owner,{...queued,mutationId:'arbitrary',entryId:'arbitrary',entry:{ingredientId:'not-accepted',displayName:'Unknown',available:true}}),/accepted catalog/);
    `);
    run(`
      assert(store.readAcceptedPantryCatalogFromSqlite().includes('future-item'));
      assert.equal(store.readPantryFromSqlite(owner).entries[0].revision,2);
      const result=store.mutatePantryInSqlite(owner,{mutationId:'future-after-restart',entryId:'new-future',expectedRevision:0,operation:'put',entry:{ingredientId:'future-item',displayName:'Future item',available:true}});
      assert.equal(result.status,'applied');
    `);
  } finally { rmSync(folder, { recursive: true, force: true }); }
}, 15000);
