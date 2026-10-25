import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore } from '../db/store.mjs';
test('persists topology after reopening and rejects stale writers',()=>{
  const dir=mkdtempSync(join(tmpdir(),'lan-studio-'));
  const path=join(dir,'network.sqlite');
  const graph={schemaVersion:1,name:'Test',nodes:[{id:'router'}],links:[]};
  let store=openStore(path);
  try {
    assert.equal(store.read(),null);
    assert.deepEqual(store.save(graph),{revision:1});
    store.close();store=openStore(path);
    assert.deepEqual(store.read(),{...graph,description:'',revision:1});
    assert.throws(()=>store.save(graph),{code:'CONFLICT'});
    assert.deepEqual(store.save({...graph,revision:1,name:'Updated'}),{revision:2});
    assert.equal(store.read().name,'Updated');
  } finally {store.close();rmSync(dir,{recursive:true,force:true});}
});
