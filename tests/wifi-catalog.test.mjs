import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeWifiGraph,validateWifiCatalog,validateWifiDependencies,assignWifiProfile,availableWifiProfiles} from '../lib/wifi-catalog.mjs';
import {withoutPort} from '../lib/port-edits.mjs';
import {openStore} from '../db/store.mjs';
const profiles=[{id:'home',ssid:'Home'},{id:'guest',ssid:'Guest'},{id:'private',ssid:'Private'}];
const router=id=>({id,name:id,type:'router',ports:['eth1'],portTypes:{eth1:'ethernet'}});
function topology(){let g={schemaVersion:1,name:'Test',wifiProfiles:profiles,nodes:[router('main'),router('other'),{...router('repeater'),wifiMode:'repeater',wifiMasterId:'main'}],links:[]};g=assignWifiProfile(g,'main','home');g=assignWifiProfile(g,'main','guest');return g;}
test('catalog exists independently of routers; repeaters select only a subset of their main router networks',()=>{
 validateWifiCatalog({wifiProfiles:profiles,nodes:[]});let g=topology();assert.deepEqual(availableWifiProfiles(g,g.nodes[2]).map(p=>p.id),['home','guest']);g=assignWifiProfile(g,'repeater','guest');assert.equal(Object.keys(g.nodes[2].wifiAssignments).length,1);assert.equal(g.nodes[2].wifiNetworks.wifi1,'Guest');validateWifiCatalog(g);assert.throws(()=>assignWifiProfile(g,'repeater','private'));const both=assignWifiProfile(g,'repeater','home');assert.throws(()=>assignWifiProfile(both,'repeater','home'));
});
test('dependencies reject missing and circular masters, lost master assignments and removed catalog networks',()=>{
 const g=assignWifiProfile(topology(),'repeater','home');
 for(const master of ['missing','repeater'])assert.throws(()=>validateWifiDependencies({...g,nodes:g.nodes.map(n=>n.id==='repeater'?{...n,wifiMasterId:master}:n)}));
 assert.throws(()=>validateWifiDependencies({...g,nodes:g.nodes.filter(n=>n.id!=='main')}));
 assert.throws(()=>validateWifiDependencies({...g,nodes:g.nodes.map(n=>n.id==='main'?withoutPort(n,'wifi1'):n)}));
 assert.throws(()=>validateWifiDependencies({...g,nodes:g.nodes.map(n=>n.id==='main'?{...n,wifiMode:'repeater',wifiMasterId:'repeater'}:n)}));
 assert.throws(()=>validateWifiCatalog({...g,wifiProfiles:profiles.filter(p=>p.id!=='home')}));
});
test('catalog edits reach all assigned routers and persist in SQLite',()=>{
 let g=assignWifiProfile(topology(),'repeater','home');g=normalizeWifiGraph({...g,wifiProfiles:profiles.map(p=>p.id==='home'?{...p,ssid:'Renamed'}:p)});assert.equal(g.nodes[0].wifiNetworks.wifi1,'Renamed');assert.equal(g.nodes[2].wifiNetworks.wifi1,'Renamed');const store=openStore(':memory:');try{store.save(g);const saved=store.read();validateWifiCatalog(saved);assert.equal(saved.nodes[2].wifiMasterId,'main');assert.equal(saved.nodes[2].wifiNetworks.wifi1,'Renamed');}finally{store.close();}
});
test('legacy migration keeps connectors, links and duplicate SSIDs without losing radio parameters',()=>{
 const graph={nodes:[{...router('r'),ports:['wifi1','wifi2'],portTypes:{wifi1:'wifi',wifi2:'wifi'},wifiNetworks:{wifi1:'Home',wifi2:'Home'},wifiRadio:{wifi1:{bands:['5'],generations:['wifi6']},wifi2:{bands:['5'],generations:['wifi6']}}}],links:[{source:'r',sourcePort:'wifi2',target:'d',targetPort:'eth1'}]};const migrated=normalizeWifiGraph(graph);assert.deepEqual(migrated.nodes[0].ports,graph.nodes[0].ports);assert.deepEqual(migrated.links,graph.links);assert.deepEqual(migrated.nodes[0].wifiNetworks,graph.nodes[0].wifiNetworks);assert.deepEqual(migrated.nodes[0].wifiRadio,graph.nodes[0].wifiRadio);assert.equal(migrated.wifiProfiles.length,2);validateWifiCatalog(migrated);
});
