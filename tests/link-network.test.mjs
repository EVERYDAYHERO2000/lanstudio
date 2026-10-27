import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inferLinkNetwork,validateLinkNetworks} from '../lib/link-network.mjs';
import {openStore} from '../db/store.mjs';
const networks=[{id:'home',name:'Home',cidr:'192.168.1.0/24'},{id:'guest',name:'Guest',cidr:'192.168.2.0/24'}];
const link={id:'new',source:'r',sourcePort:'lan',target:'d',targetPort:'eth1',kind:'ethernet'};
const router={id:'r',type:'router',ports:['wan','lan','wifi1'],portRoles:{wan:'wan',lan:'lan'},portTypes:{wifi1:'wifi'},wifiAssignments:{wifi1:'ssid'},dhcp:{enabled:true,networkIds:['home']}};
test('Wi-Fi uses the selected profile network in either drag direction and does not guess unbound SSIDs',()=>{
 const g={networks,nodes:[router,{id:'d',type:'device'}],wifiProfiles:[{id:'ssid',ssid:'Home',networkId:'guest'}]};const wireless={...link,sourcePort:'wifi1'};
 assert.equal(inferLinkNetwork(g,wireless),'guest');assert.equal(inferLinkNetwork(g,{...wireless,source:'d',sourcePort:'eth1',target:'r',targetPort:'wifi1'}),'guest');
 assert.equal(inferLinkNetwork({...g,wifiProfiles:[{id:'ssid',ssid:'Home'}]},wireless),undefined);
});
test('wired LAN prefill uses DHCP, excludes WAN, and resolves multiple DHCP networks using endpoint IP',()=>{
 const g={networks,nodes:[router,{id:'d',type:'device',ip:''}]};assert.equal(inferLinkNetwork(g,link),'home');assert.equal(inferLinkNetwork(g,{...link,sourcePort:'wan'}),undefined);
 const multi={...g,nodes:[{...router,dhcp:{enabled:true,networkIds:['home','guest']}},{id:'d',ip:'192.168.2.10'}]};assert.equal(inferLinkNetwork(multi,link),'guest');assert.equal(inferLinkNetwork({...multi,nodes:[multi.nodes[0],{id:'d'}]},link),undefined);
});
test('IP prefill prefers the most specific subnet and refuses conflicting endpoint networks',()=>{
 const g={networks:[...networks,{id:'large',name:'All',cidr:'192.168.0.0/16'}],nodes:[{id:'r',type:'device',ip:'192.168.1.3'},{id:'d'}]};assert.equal(inferLinkNetwork(g,link),'home');assert.equal(inferLinkNetwork({...g,nodes:[g.nodes[0],{id:'d',ip:'192.168.2.5'}]},link),undefined);
});
test('switch inherits a single known adjacent network and leaves trunks ambiguous',()=>{
 const g={networks,nodes:[{id:'r',type:'switch'},{id:'d'}],links:[{id:'old',source:'r',target:'upstream',networkId:'home'}]};assert.equal(inferLinkNetwork(g,link),'home');assert.equal(inferLinkNetwork({...g,links:[...g.links,{id:'other',target:'r',networkId:'guest'}]},link),undefined);
});
test('manual selection persists independently of inference and invalid references are rejected',()=>{
 const graph={schemaVersion:1,name:'Test',networks,nodes:[router,{id:'d',type:'device'}],links:[{...link,networkId:'guest'}]};const store=openStore(':memory:');try{validateLinkNetworks(graph);store.save(graph);const saved=store.read();assert.equal(saved.links[0].networkId,'guest');assert.equal(inferLinkNetwork(saved,saved.links[0]),'home');validateLinkNetworks(saved);assert.throws(()=>validateLinkNetworks({...graph,networks:[]}));assert.throws(()=>validateLinkNetworks({...graph,links:[{...link,networkId:42}]}));validateLinkNetworks({nodes:[],links:[link]});}finally{store.close();}
});
