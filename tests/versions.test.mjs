import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openStore} from '../db/store.mjs';
import {validateOptions} from '../lib/topology-options.mjs';
import {validatePlaces} from '../lib/places.mjs';
const graph=name=>({schemaVersion:1,name,nodes:[],links:[]});
test('single workspace migrates all old schemes once and restores with a safety snapshot',()=>{
 const s=openStore(':memory:');try{
 s.save(graph('Primary'));const old=s.create('Other');
 assert.equal(s.currentId(),'main');assert.equal(s.versions().length,2);s.currentId();assert.equal(s.versions().length,2);
 assert.equal(s.read(old.id).name,'Other');
 const v=s.createVersion('Before edit',1);s.save({...s.read(),name:'Changed'});
 assert.throws(()=>s.restoreVersion(v.id,1),{code:'CONFLICT'});assert.equal(s.versions().length,3);
 assert.deepEqual(s.restoreVersion(v.id,2),{revision:3});assert.equal(s.read().name,'Primary');assert.equal(s.versions().length,4);
 const backup=s.versions().find(v=>v.label.startsWith('Перед восстановлением'));
 s.restoreVersion(backup.id,3);assert.equal(s.read().name,'Changed');
 const other=s.versions().find(v=>v.label==='Прежняя схема: Other');s.restoreVersion(other.id,4);assert.equal(s.read().name,'Other');
 assert.throws(()=>s.createVersion('stale',1),{code:'CONFLICT'});
 assert.throws(()=>s.restoreVersion('missing',5),{code:'NOT_FOUND'});assert.equal(s.read().revision,5);
 }finally{s.close();}
});
test('empty installation creates one blank network and initial version',()=>{const s=openStore(':memory:');try{assert.equal(s.currentId(),'main');assert.deepEqual(s.read().nodes,[]);assert.equal(s.versions().length,1);}finally{s.close();}});
test('strict saves require Wi-Fi to belong to an IP network while legacy reads remain valid',()=>{
 const g={...graph('Test'),networks:[{id:'home',name:'Home',cidr:'192.168.1.0/24'}],wifiProfiles:[{id:'wifi',ssid:'Test'}]};
 assert.doesNotThrow(()=>validateOptions(g));assert.throws(()=>validateOptions(g,{requireWifiNetwork:true}),/привязана/);
 g.wifiProfiles[0].networkId='home';assert.doesNotThrow(()=>validateOptions(g,{requireWifiNetwork:true}));
});
test('place coordinates reject invalid values without requiring coordinates on all places',()=>{
 const g={nodes:[],places:[{id:'p',name:'Place',latitude:51.505,longitude:-0.09}]};assert.doesNotThrow(()=>validatePlaces(g));
 for(const latitude of [91,-91,NaN,Infinity,'51'])assert.throws(()=>validatePlaces({...g,places:[{...g.places[0],latitude}]}),/координаты/);
 assert.throws(()=>validatePlaces({...g,places:[{...g.places[0],longitude:181}]}),/координаты/);
 assert.doesNotThrow(()=>validatePlaces({nodes:[],places:[{id:'p',name:'Place'}]}));
});
