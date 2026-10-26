import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renameGraphPort,withoutPort} from '../lib/port-edits.mjs';
test('renaming a connected VPN port preserves both link endpoints and metadata',()=>{
 const node={id:'r',ports:['vpn1','eth1'],portTypes:{vpn1:'vpn'},vpnPorts:{vpn1:{protocol:'WireGuard',role:'client'}},portSides:{vpn1:'left'},portRoles:{vpn1:'lan'}};
 const g={nodes:[node,{id:'other',ports:['vpn1']}],links:[{source:'r',sourcePort:'vpn1',target:'other',targetPort:'vpn1'},{source:'other',sourcePort:'vpn1',target:'r',targetPort:'vpn1'}]};
 const result=renameGraphPort(g,'r','vpn1','wg');
 assert.equal(result.links[0].sourcePort,'wg');assert.equal(result.links[0].targetPort,'vpn1');assert.equal(result.links[1].targetPort,'wg');assert.equal(result.nodes[0].vpnPorts.wg.protocol,'WireGuard');assert.equal(result.nodes[0].portSides.wg,'left');assert.equal(result.nodes[0].portTypes.wg,'vpn');assert.equal(node.ports[0],'vpn1');
 assert.equal(renameGraphPort(g,'r','vpn1','eth1'),g);
});
test('removing Wi-Fi or VPN points cleans their metadata without affecting other ports',()=>{
 const n={ports:['wifi1','vpn1','eth1'],portTypes:{wifi1:'wifi',vpn1:'vpn'},portRoles:{wifi1:'lan'},portSides:{wifi1:'right'},wifiNetworks:{wifi1:'Home'},vpnPorts:{vpn1:{role:'client',protocol:'WireGuard'}}};
 const result=withoutPort(n,'wifi1');assert.deepEqual(result.ports,['vpn1','eth1']);assert.deepEqual(result.wifiNetworks,{});assert.deepEqual(result.portRoles,{});assert.deepEqual(result.portSides,{});assert.equal(result.vpnPorts.vpn1.protocol,'WireGuard');assert.equal(n.wifiNetworks.wifi1,'Home');assert.deepEqual(withoutPort(result,'vpn1').vpnPorts,{});
});
