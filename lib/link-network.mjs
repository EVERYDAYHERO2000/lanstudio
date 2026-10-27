import {getPortRole} from './ports.mjs';
/** @param {string} value */
function ipv4(value){if(typeof value!=='string'||!/^\d{1,3}(\.\d{1,3}){3}$/.test(value))return null;const parts=value.split('.').map(Number);return parts.some(n=>n>255)?null:parts.reduce((v,n)=>(v*256+n)>>>0,0);}
/** @param {any} graph @param {any} link @returns {string|undefined} */
export function inferLinkNetwork(graph,link){
 const networks=graph.networks??[],valid=new Set(networks.map(n=>n.id));
 const ends=[[link.source,link.sourcePort],[link.target,link.targetPort]].map(([id,port])=>({node:graph.nodes.find(n=>n.id===id),port})).filter(e=>e.node);
 const unique=values=>{const ids=[...new Set(values.filter(id=>valid.has(id)))];return ids.length===1?ids[0]:undefined;};
 const wifi=ends.filter(e=>e.node.portTypes?.[e.port]==='wifi');
 if(wifi.length){const values=wifi.map(e=>(graph.wifiProfiles??[]).find(p=>p.id===e.node.wifiAssignments?.[e.port])?.networkId??e.node.wifiNetworkIds?.[e.port]);return values.every(Boolean)?unique(values):undefined;}
 const wired=e=>!['vpn','usb','modem'].includes(e.node.portTypes?.[e.port]??'')&&(e.node.type!=='router'||getPortRole(e.node,e.port)==='lan');
 const eligible=ends.filter(wired);
 const dhcp=eligible.flatMap(e=>e.node.type==='router'&&e.node.dhcp?.enabled?e.node.dhcp.networkIds:[]).filter(id=>valid.has(id));
 const ipNetworks=eligible.flatMap(e=>{const ip=ipv4(e.node.ip);if(ip===null)return [];const matches=networks.filter(n=>{const [address,prefix]=n.cidr.split('/'),net=ipv4(address),bits=Number(prefix);if(net===null||!Number.isInteger(bits)||bits<0||bits>32)return false;const mask=bits===0?0:(0xffffffff<<(32-bits))>>>0;return ((ip&mask)>>>0)===net;}).sort((a,b)=>Number(b.cidr.split('/')[1])-Number(a.cidr.split('/')[1]));return matches[0]?[matches[0].id]:[];});
 if(dhcp.length){const candidates=unique(dhcp);if(candidates)return candidates;return unique(ipNetworks.filter(id=>dhcp.includes(id)));}
 if(ipNetworks.length)return unique(ipNetworks);
 const neighbors=eligible.filter(e=>e.node.type==='switch').flatMap(e=>(graph.links??[]).filter(l=>l.id!==link.id&&(l.source===e.node.id||l.target===e.node.id)).map(l=>l.networkId));
 return unique(neighbors);
}
/** @param {any} graph */
export function validateLinkNetworks(graph){const ids=new Set((graph.networks??[]).map(n=>n.id));for(const l of graph.links??[])if(l.networkId!==undefined&&(typeof l.networkId!=='string'||!ids.has(l.networkId)))throw Error('Выберите существующую IP-сеть связи');return graph;}
