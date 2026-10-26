'use client';
import WifiRadio,{type RadioSettings} from './WifiRadio';
import {X} from 'lucide-react';
import {PropertyList} from './PropertyList';
import {addWifiNetwork,bindWifiNetwork} from '../lib/wifi-network.mjs';
import type {NetworkRecord} from './NetworkOptions';
import {withoutPort} from '../lib/port-edits.mjs';
type WifiNode={ports:string[];portTypes?:Record<string,string>;portRoles?:Record<string,string>;portSides?:Record<string,string>;wifiNetworkIds?:Record<string,string>;wifiRadio?:Record<string,RadioSettings>;wifiNetworks?:Record<string,string>};
export function RouterWifi({node,usedPorts,patch,networks}:{networks:NetworkRecord[];node:WifiNode;usedPorts:string[];patch:(value:any)=>void}){
 const entries=Object.entries(node.wifiNetworks??{});
 return <PropertyList title="WI-FI СЕТИ" count={entries.length} addLabel="Добавить Wi-Fi-сеть" onAdd={()=>patch(addWifiNetwork(node))}>
 {entries.map(([port,name])=><div className="wifi-row" key={port}><span className={usedPorts.includes(port)?'used':''}/><input aria-label={`SSID ${port}`} maxLength={100} value={name} onChange={e=>patch({wifiNetworks:{...node.wifiNetworks,[port]:e.target.value}})}/><select className="wifi-ip-network" aria-label={`IP-сеть Wi-Fi ${port}`} value={node.wifiNetworkIds?.[port]??''} onChange={e=>patch(bindWifiNetwork(node,port,e.target.value))}><option value="">Без IP-сети</option>{networks.map(n=><option key={n.id} value={n.id}>{n.name?n.name+' · ':''}{n.cidr}</option>)}</select><button title={usedPorts.includes(port)?'Сначала отключите связи Wi-Fi-сети':'Удалить Wi-Fi-сеть'} disabled={usedPorts.includes(port)} onClick={()=>patch(withoutPort(node,port))}><X size={12}/></button><WifiRadio label={name||port} value={node.wifiRadio?.[port]} onChange={value=>patch({wifiRadio:{...node.wifiRadio,[port]:value}})}/></div>)}
 </PropertyList>;
}
