import {test} from 'node:test';
import assert from 'node:assert/strict';
import {graphId,normalizeCidr,validateOptions} from '../lib/topology-options.mjs';
import {portPosition,validPortTypes} from '../lib/ports.mjs';
import {openStore} from '../db/store.mjs';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('graph IDs work in LAN HTTP browsers without randomUUID',()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'crypto');
 try{Object.defineProperty(globalThis,'crypto',{configurable:true,value:{getRandomValues:original.get.call(globalThis).getRandomValues.bind(original.get.call(globalThis))}});
 const ids=Array.from({length:100},graphId);assert.equal(new Set(ids).size,100);assert.match(ids[0],/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/);
 }finally{Object.defineProperty(globalThis,'crypto',original);}
});
test('CIDR normalizes host bits and validates prefix and octets',()=>{
 assert.equal(normalizeCidr('192.168.1.155/24'),'192.168.1.0/24');
 assert.equal(normalizeCidr('255.255.255.255/0'),'0.0.0.0/0');
 assert.equal(normalizeCidr('10.1.2.3/32'),'10.1.2.3/32');
 for(const s of ['256.1.2.3/24','10.0.0.0/33','10.0.0.1','::/64','-1.0.0.0/8'])assert.throws(()=>normalizeCidr(s));
});
const router={id:'r',type:'router',meshEnabled:false,ports:['wan','vpn1','vpn2'],natEnabled:true,dhcp:{enabled:true,networkIds:['home']},portTypes:{vpn1:'vpn',vpn2:'vpn'},vpnPorts:{vpn1:{protocol:'WireGuard',role:'client'},vpn2:{protocol:'OpenVPN',role:'server'}}};
const graph={schemaVersion:1,name:'Test',networks:[{id:'home',name:'Home',cidr:'192.168.1.0/24'}],nodes:[router],links:[]};
test('VPN roles determine sides independently of WAN and port-side flags',()=>{
 const n={...router,portRoles:{vpn1:'lan',vpn2:'wan'},portSides:{vpn1:'right',vpn2:'left'}};
 assert.equal(portPosition(n,'vpn1').left,true);assert.equal(portPosition(n,'vpn2').left,false);assert.equal(validPortTypes(n),true);
 assert.equal(validPortTypes({ports:['usb1'],portTypes:{usb1:'usb'}}),true);
});
test('network references and VPN metadata reject broken imported schemes',()=>{
 validateOptions(graph);validateOptions({nodes:[]});
 const bad=[{networks:[...graph.networks,{...graph.networks[0],id:'other'}]}, {nodes:[{...router,dhcp:{enabled:true,networkIds:['missing']}}]}, {nodes:[{...router,vpnPorts:{}}]}, {nodes:[{...router,vpnPorts:{vpn1:{protocol:'unknown',role:'client'}}}]}, {nodes:[{...router,natEnabled:'yes'}]}];
 for(const patch of bad)assert.throws(()=>validateOptions({...graph,...patch}));
});
test('networks and router options survive SQLite reopen',()=>{
 const dir=mkdtempSync(join(tmpdir(),'lan-options-'));let store=openStore(join(dir,'test.sqlite'));
 try{store.save(validateOptions(graph));store.close();store=openStore(join(dir,'test.sqlite'));const saved=store.read();assert.deepEqual(saved.networks,graph.networks);assert.deepEqual(saved.nodes,graph.nodes);validateOptions(saved);}finally{store.close();rmSync(dir,{recursive:true,force:true});}
});
