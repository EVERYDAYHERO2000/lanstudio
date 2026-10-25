import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pingState} from '../lib/ping-status.mjs';
import {classifyPing} from '../lib/ping-classify.mjs';
test('a previous answer never applies to an edited IP or another node',()=>{
 const results={a:{ip:'127.0.0.1',status:'up'}};
 assert.equal(pingState({id:'a',ip:'127.0.0.1'},results),'up');
 assert.equal(pingState({id:'a',ip:'192.0.2.1'},results),'unchecked');
 assert.equal(pingState({id:'b',ip:'127.0.0.1'},results),'unchecked');
});
test('ICMP failure differs from missing utility and permission problems',()=>{
 assert.equal(classifyPing(null),'up');assert.equal(classifyPing({code:1}),'down');
 assert.equal(classifyPing({code:2},'Network unreachable'),'down');
 assert.equal(classifyPing({code:'ENOENT'}),'error');
 assert.equal(classifyPing({code:2},'ping: socket: Operation not permitted'),'error');
 assert.equal(classifyPing({killed:true}),'down');
});
