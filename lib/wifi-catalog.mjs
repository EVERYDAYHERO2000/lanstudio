import {validWifiRadio} from './wifi-radio.mjs';
/** @param {any} graph */
export function normalizeWifiGraph(graph){
 let profiles=graph.wifiProfiles,nodes=graph.nodes;
 if(profiles===undefined){
  if(!nodes.some(n=>n?.wifiNetworks&&Object.keys(n.wifiNetworks).length))return graph;
  profiles=[];const signatures=new Map();
  nodes=nodes.map(n=>{if(!n?.wifiNetworks)return n;const assignments={};for(const [port,ssid] of Object.entries(n.wifiNetworks)){const networkId=n.wifiNetworkIds?.[port],radio=n.wifiRadio?.[port];const signature=JSON.stringify([ssid,networkId??null,radio??null]);let id=signatures.get(signature);if(!id||Object.values(assignments).includes(id)){id='wifi:'+n.id+':'+port;while(profiles.some(p=>p.id===id))id+=':';profiles.push({id,ssid,...(networkId?{networkId}:{}),...(radio?{radio}:{})});signatures.set(signature,id);}assignments[port]=id;}return {...n,wifiAssignments:assignments};});
 }
 if(!Array.isArray(profiles))return graph;
 const byId=new Map(profiles.filter(p=>p).map(p=>[p.id,p]));
 nodes=nodes.map(n=>{if(!n?.wifiAssignments)return n;const wifiNetworks={},wifiNetworkIds={},wifiRadio={};for(const [port,id] of Object.entries(n.wifiAssignments)){const p=byId.get(id);if(!p)continue;wifiNetworks[port]=p.ssid;if(p.networkId)wifiNetworkIds[port]=p.networkId;if(p.radio)wifiRadio[port]=p.radio;}return {...n,wifiNetworks,wifiNetworkIds,wifiRadio};});
 return {...graph,nodes,wifiProfiles:profiles};
}
/** @param {any} graph */
export function validateWifiDependencies(graph){
 const profiles=graph.wifiProfiles??[],ids=new Set(Array.isArray(profiles)?profiles.map(p=>p.id):[]);
 for(const n of graph.nodes){
  if(n.wifiMode!==undefined&&!['router','repeater'].includes(n.wifiMode))throw Error('Некорректная роль Wi-Fi');
  const assignments=n.wifiAssignments??{};
  if(!assignments||typeof assignments!=='object'||Array.isArray(assignments))throw Error('Некорректный список назначений Wi-Fi');
  if(new Set(Object.values(assignments)).size!==Object.keys(assignments).length)throw Error('Wi-Fi-сеть уже выбрана на этом роутере');
  for(const [port,id] of Object.entries(assignments))if(n.type!=='router'||!n.ports?.includes(port)||n.portTypes?.[port]!=='wifi'||!ids.has(id))throw Error('Выберите существующую Wi-Fi-сеть');
  if(n.wifiMasterId!==undefined&&(n.wifiMode!=='repeater'||typeof n.wifiMasterId!=='string'))throw Error('Главный роутер задаётся только для ретранслятора');
  if(n.wifiMode==='repeater'){
   if(n.type!=='router')throw Error('Ретранслятор должен быть роутером');
   const master=graph.nodes.find(m=>m.id===n.wifiMasterId);
   if(n.wifiMasterId&&(!master||master.id===n.id||master.type!=='router'||master.wifiMode==='repeater'))throw Error('Выберите главный роутер; цепочки ретрансляторов не допускаются');
   const allowed=new Set(Object.values(master?.wifiAssignments??{}));
   if(Object.values(assignments).some(id=>!allowed.has(id)))throw Error('Ретранслятор может выбирать только сети своего главного роутера. Сначала уберите недоступные назначения');
  }
  if(graph.wifiProfiles!==undefined)for(const port of n.ports??[])if(n.portTypes?.[port]==='wifi'&&!assignments[port])throw Error('Выберите Wi-Fi-сеть для точки роутера');
 }
 return graph;
}
/** @param {any} graph */
export function validateWifiCatalog(graph){
 if(graph.wifiProfiles===undefined){validateWifiDependencies(graph);return graph;}
 if(!Array.isArray(graph.wifiProfiles))throw Error('Некорректный каталог Wi-Fi');
 const ids=new Set(),networkIds=new Set((graph.networks??[]).map(n=>n.id));
 for(const p of graph.wifiProfiles){if(!p||typeof p.id!=='string'||!p.id||ids.has(p.id)||typeof p.ssid!=='string'||!p.ssid.trim()||p.ssid.length>100)throw Error('Проверьте SSID и ID Wi-Fi-сетей');ids.add(p.id);if(p.networkId!==undefined&&(typeof p.networkId!=='string'||!networkIds.has(p.networkId)))throw Error('Выбрана несуществующая IP-сеть Wi-Fi');if(p.radio!==undefined&&!validWifiRadio({ports:['wifi'],portTypes:{wifi:'wifi'},wifiRadio:{wifi:p.radio}}))throw Error('Проверьте диапазоны и поколения Wi-Fi');}
 return validateWifiDependencies(graph);
}
/** @param {any} graph @param {any} node */
export function availableWifiProfiles(graph,node){if(node.wifiMode!=='repeater')return graph.wifiProfiles??[];const master=graph.nodes.find(n=>n.id===node.wifiMasterId&&n.type==='router'&&n.wifiMode!=='repeater');const ids=new Set(Object.values(master?.wifiAssignments??{}));return (graph.wifiProfiles??[]).filter(p=>ids.has(p.id));}
/** @param {any} graph @param {string} nodeId @param {string} profileId @param {string} [port] */
export function assignWifiProfile(graph,nodeId,profileId,port){const next={...graph,nodes:graph.nodes.map(n=>{if(n.id!==nodeId)return n;if(!port){let i=1;while(n.ports.includes('wifi'+i))i++;port='wifi'+i;}return {...n,ports:n.ports.includes(port)?n.ports:[...n.ports,port],portTypes:{...n.portTypes,[port]:'wifi'},wifiAssignments:{...n.wifiAssignments,[port]:profileId}};})};return validateWifiDependencies(normalizeWifiGraph(next));}
