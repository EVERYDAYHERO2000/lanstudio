import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeNode} from '../lib/node-settings.mjs';
import {openStore} from '../db/store.mjs';
import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
test('unmanaged switches clear addresses while managed switches and other devices retain them',()=>{
 const node={type:'switch',ip:'192.0.2.5',mac:'02:00:00:00:00:05',ports:['ether1']};
 for(const managed of [undefined,false]){const result=normalizeNode({...node,managed});assert.equal(result.ip,'');assert.equal(result.mac,'');assert.deepEqual(result.ports,node.ports);}
 assert.equal(normalizeNode({...node,managed:true}).ip,node.ip);assert.equal(normalizeNode({...node,type:'device'}).mac,node.mac);assert.equal(node.ip,'192.0.2.5');
});
test('SQLite stores no management addresses for unmanaged switches and normalizes old records on read',()=>{
 const dir=mkdtempSync(join(tmpdir(),'lan-switch-')),path=join(dir,'test.sqlite');let store=openStore(path),raw=new DatabaseSync(path);
 try{const graph={schemaVersion:1,name:'Test',nodes:[{id:'s',type:'switch',managed:false,ip:'192.0.2.5',mac:'02:00:00:00:00:05',ports:[]}],links:[]};store.save(graph);const stored=JSON.parse(raw.prepare('SELECT data FROM topologies WHERE id=?').get('main').data);assert.equal(stored.nodes[0].ip,'');assert.equal(stored.nodes[0].mac,'');raw.prepare('UPDATE topologies SET data=? WHERE id=?').run(JSON.stringify(graph),'main');assert.equal(store.read().nodes[0].ip,'');assert.equal(store.read().nodes[0].mac,'');}finally{raw.close();store.close();rmSync(dir,{recursive:true,force:true});}
});
