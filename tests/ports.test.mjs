import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getPortRole,portPosition,nodeHeight} from '../lib/ports.mjs';
test('router roles override order and stack each side independently',()=>{
 const n={type:'router',ports:['a','b','c'],portRoles:{a:'lan',b:'wan',c:'wan'}};
 assert.deepEqual(portPosition(n,'a'),{x:220,y:58,left:false});
 assert.deepEqual(portPosition(n,'b'),{x:0,y:58,left:true});
 assert.deepEqual(portPosition(n,'c'),{x:0,y:81,left:true});
 const restored=JSON.parse(JSON.stringify(n));assert.equal(getPortRole(restored,'b'),'wan');
});
test('legacy routers retain first WAN and other LAN; many ports expand node',()=>{
 const n={type:'router',ports:Array.from({length:10},(_,i)=>'ether'+i)};
 assert.equal(getPortRole(n,'ether0'),'wan');assert.equal(getPortRole(n,'ether1'),'lan');
 assert.ok(nodeHeight(n)>portPosition(n,'ether9').y);
});
test('USB and modem inputs stay left regardless of role; modem has provider input and outputs',()=>{
 const router={type:'router',ports:['ether1','ether2','usb1','modem1'],portRoles:{ether1:'wan',ether2:'lan',usb1:'lan',modem1:'lan'},portTypes:{usb1:'usb',modem1:'modem'}};
 assert.equal(portPosition(router,'usb1').left,true);
 assert.equal(portPosition(router,'modem1').left,true);
 assert.equal(portPosition(router,'ether2').left,false);
 const modem={type:'modem',ports:['line1','USB','ether1'],portRoles:{line1:'wan',USB:'lan',ether1:'lan'}};
 assert.equal(portPosition(modem,'line1').left,true);
 assert.equal(portPosition(modem,'USB').left,false);
});
test('LAN side can change; WAN always left; independent stacking follows sides',()=>{
 const n={type:'router',ports:['wan','lan1','lan2'],portRoles:{wan:'wan',lan1:'lan',lan2:'lan'},portSides:{wan:'right',lan1:'left',lan2:'right'}};
 assert.deepEqual(portPosition(n,'wan'),{x:0,y:58,left:true});
 assert.deepEqual(portPosition(n,'lan1'),{x:0,y:81,left:true});
 assert.deepEqual(portPosition(n,'lan2'),{x:220,y:58,left:false});
 n.portSides.lan1='right';assert.deepEqual(portPosition(n,'lan1'),{x:220,y:58,left:false});
});
