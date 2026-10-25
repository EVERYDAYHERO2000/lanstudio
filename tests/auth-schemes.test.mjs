import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openStore} from '../db/store.mjs';
test('admin login, session expiry handling, logout and password rotation',()=>{
 const s=openStore(':memory:');try{
 assert.equal(s.authenticated('bad'),false);
 assert.equal(s.login('admin','wrong').status,401);
 const first=s.login('admin','admin').token,second=s.login('admin','admin').token;
 assert.ok(s.authenticated(first));s.logout(second);assert.equal(s.authenticated(second),false);
 assert.equal(s.changePassword('wrong','new-password-123'),null);
 const fresh=s.changePassword('admin','new-password-123');assert.ok(s.authenticated(fresh));assert.equal(s.authenticated(first),false);
 assert.equal(s.login('admin','admin').status,401);assert.ok(s.login('admin','new-password-123').token);
 }finally{s.close();}
});
test('failed logins are rate limited',()=>{const s=openStore(':memory:');try{for(let i=0;i<5;i++)assert.equal(s.login('admin','bad').status,401);assert.equal(s.login('admin','admin').status,429);}finally{s.close();}});
test('multiple schemes isolate saves, preserve legacy main, and cannot resurrect deleted maps',()=>{
 const s=openStore(':memory:');try{
 const graph={schemaVersion:1,name:'Legacy',nodes:[],links:[]};s.save(graph);
 const a=s.create('Office','First floor').id,b=s.create('Home','Second map').id;
 assert.equal(s.list().length,3);assert.equal(s.read('main').name,'Legacy');assert.equal(s.read(a).description,'First floor');
 const opened=s.read(a);s.save({...opened,name:'Renamed'},a);assert.equal(s.read(b).name,'Home');
 assert.throws(()=>s.save(opened,a),{code:'CONFLICT'});
 assert.ok(s.remove(a));assert.equal(s.read(a),null);assert.throws(()=>s.save(opened,a),{code:'NOT_FOUND'});
 s.remove('main');assert.throws(()=>s.save(graph),{code:'NOT_FOUND'});
 }finally{s.close();}
});
