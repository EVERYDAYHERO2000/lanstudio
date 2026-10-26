import {test} from 'node:test';
import assert from 'node:assert/strict';
import {placeCounts,validatePlaces} from '../lib/places.mjs';
import {openStore} from '../db/store.mjs';
test('place counts follow all assigned nodes and change when a node moves or is removed',()=>{
 const nodes=[{type:'router',placeId:'house'},{type:'device',placeId:'house'},{type:'switch',placeId:'garage'},{type:'container'}];
 assert.equal(placeCounts(nodes).house,2);assert.equal(placeCounts(nodes).garage,1);
 const moved=nodes.map((n,i)=>i===0?{...n,placeId:'garage'}:n);assert.equal(placeCounts(moved).house,1);assert.equal(placeCounts(moved).garage,2);assert.equal(placeCounts(moved.slice(1)).garage,1);
});
test('places validate references, persist and keep assignments through renaming',()=>{
 const graph={schemaVersion:1,name:'Test',places:[{id:'garage',name:'Гараж'}],nodes:[{id:'r',type:'router',ports:[],placeId:'garage'}],links:[]};const store=openStore(':memory:');
 try{validatePlaces({nodes:[]});validatePlaces(graph);store.save(graph);const first=store.read();assert.equal(first.nodes[0].placeId,'garage');first.places[0].name='Мастерская';store.save(first);assert.equal(store.read().places[0].name,'Мастерская');assert.equal(store.read().nodes[0].placeId,'garage');
 for(const patch of [{places:[]},{places:[...graph.places,...graph.places]},{places:[{id:'garage',name:' '}]},{nodes:[{placeId:'missing'}]},{places:{}},{nodes:[{placeId:2}]}])assert.throws(()=>validatePlaces({...graph,...patch}));
 }finally{store.close();}
});
