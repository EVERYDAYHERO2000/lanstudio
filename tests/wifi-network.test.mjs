import {test} from 'node:test';
import assert from 'node:assert/strict';
import {addWifiNetwork,bindWifiNetwork} from '../lib/wifi-network.mjs';
import {renameGraphPort,withoutPort} from '../lib/port-edits.mjs';
import {validateOptions} from '../lib/topology-options.mjs';
import {openStore} from '../db/store.mjs';
const networks=[{id:'home',name:'Home',cidr:'192.168.1.0/24'},{id:'guest',name:'Guest',cidr:'192.168.2.0/24'}];
test('multiple SSIDs have independent points and network bindings',()=>{
 const original={id:'r',type:'router',ports:['ether1'],portRoles:{ether1:'wan'}};
 const first=addWifiNetwork(original,'Home','home'),second=addWifiNetwork(first,'Guest','guest');
 assert.deepEqual(second.ports,['ether1','wifi1','wifi2']);assert.deepEqual(second.wifiNetworks,{wifi1:'Home',wifi2:'Guest'});assert.deepEqual(second.wifiNetworkIds,{wifi1:'home',wifi2:'guest'});assert.deepEqual(original.ports,['ether1']);
 const rebound=bindWifiNetwork(second,'wifi1','guest');assert.equal(rebound.wifiNetworkIds.wifi2,'guest');assert.deepEqual(bindWifiNetwork(rebound,'wifi1','').wifiNetworkIds,{wifi2:'guest'});
 const removed=withoutPort(second,'wifi2');assert.deepEqual(removed.wifiNetworkIds,{wifi1:'home'});assert.deepEqual(removed.wifiNetworks,{wifi1:'Home'});
});
test('bindings survive persistence and renaming without changing device links',()=>{
 const node=addWifiNetwork({id:'r',type:'router',ports:[]},'Home','home');
 const graph={schemaVersion:1,name:'Test',networks,nodes:[node,{id:'d',type:'device',ports:['eth1']}],links:[{id:'l',source:'r',sourcePort:'wifi1',target:'d',targetPort:'eth1',kind:'wireless'}]};const store=openStore(':memory:');
 try{validateOptions(graph);store.save(graph);const restored=store.read();assert.equal(restored.nodes[0].wifiNetworkIds.wifi1,'home');const renamed=renameGraphPort(restored,'r','wifi1','wlan');assert.equal(renamed.nodes[0].wifiNetworkIds.wlan,'home');assert.equal(renamed.links[0].sourcePort,'wlan');validateOptions(renamed);}finally{store.close();}
});
test('legacy SSIDs remain valid and missing network references are rejected',()=>{
 const node=addWifiNetwork({id:'r',type:'router',ports:['ether1']},'Home');const g={nodes:[node],networks};validateOptions(g);
 for(const wifiNetworkIds of [{wifi1:'missing'},{ether1:'home'},{wifi1:2},[]])assert.throws(()=>validateOptions({...g,nodes:[{...node,wifiNetworkIds}]}));
 assert.throws(()=>validateOptions({nodes:[bindWifiNetwork(node,'wifi1','home')],networks:[]}));
});
