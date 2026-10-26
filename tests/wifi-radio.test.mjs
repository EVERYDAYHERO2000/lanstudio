import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validWifiRadio} from '../lib/wifi-radio.mjs';
import {validateOptions} from '../lib/topology-options.mjs';
import {renameGraphPort,withoutPort} from '../lib/port-edits.mjs';
import {openStore} from '../db/store.mjs';
const node={id:'r',type:'router',ports:['wifi1'],portTypes:{wifi1:'wifi'},wifiNetworks:{wifi1:'Home'},wifiRadio:{wifi1:{bands:['2.4','5','6'],generations:['wifi4','wifi6','wifi6e','wifi7']}}};
test('multiple Wi-Fi bands and generations persist and follow port edits',()=>{
 const graph={schemaVersion:1,name:'Test',nodes:[node],links:[]};validateOptions(graph);const store=openStore(':memory:');
 try{store.save(graph);const saved=store.read();assert.deepEqual(saved.nodes[0].wifiRadio,node.wifiRadio);const renamed=renameGraphPort(saved,'r','wifi1','wlan');assert.deepEqual(renamed.nodes[0].wifiRadio.wlan,node.wifiRadio.wifi1);assert.deepEqual(withoutPort(renamed.nodes[0],'wlan').wifiRadio,{});}finally{store.close();}
});
test('legacy and unspecified radio settings work, unsupported values and duplicates fail',()=>{
 assert.equal(validWifiRadio({ports:[]}),true);assert.equal(validWifiRadio({...node,wifiRadio:{wifi1:{bands:[],generations:[]}}}),true);
 for(const wifiRadio of [{wifi1:{bands:['60'],generations:['wifi7']}},{wifi1:{bands:['5','5'],generations:[]}},{wifi1:{bands:['5'],generations:['wifi9']}},{missing:{bands:['5'],generations:[]}},{wifi1:{bands:'5',generations:[]}},[]])assert.equal(validWifiRadio({...node,wifiRadio}),false);
});
