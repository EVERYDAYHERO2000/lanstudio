import {test} from 'node:test';
import assert from 'node:assert/strict';
import {portConnectionKind} from '../lib/link-appearance.mjs';
test('both endpoint connectors follow the link kind, including ordinary device ports',()=>{
 for(const kind of ['ethernet','wireless','virtual','vpn','usb']){
 const links=[{source:'router',sourcePort:'a',target:'device',targetPort:'b',kind}];
 const expected=kind==='usb'?'ethernet':kind;
 assert.equal(portConnectionKind({id:'router'},'a',links),expected);
 assert.equal(portConnectionKind({id:'device'},'b',links),expected);
 }
});
test('free and shared connectors retain their intrinsic type',()=>{
 const node={id:'r',portTypes:{wifi1:'wifi',v:'virtual',vpn:'vpn'}};
 for(const [port,expected] of [['wifi1','wireless'],['v','virtual'],['vpn','vpn'],['eth1','ethernet']])assert.equal(portConnectionKind(node,port,[]),expected);
 const links=['a','b'].map(target=>({source:'r',sourcePort:'wifi1',target,targetPort:'eth1',kind:'wireless'}));
 assert.equal(portConnectionKind(node,'wifi1',links),'wireless');
});
