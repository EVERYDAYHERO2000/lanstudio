import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRouterMode} from '../lib/router-mode.mjs';
test('legacy mesh converts without losing ports or metadata',()=>{
 const old={id:'mesh1',type:'mesh',ports:['eth1','wlan0'],description:'test'};
 const node=normalizeRouterMode(old);
 assert.deepEqual(node,{...old,type:'router',meshEnabled:true});
 assert.equal(old.type,'mesh');
 assert.equal(normalizeRouterMode({type:'router',meshEnabled:false}).meshEnabled,false);
 assert.equal(normalizeRouterMode({type:'router'}).meshEnabled,false);
});
