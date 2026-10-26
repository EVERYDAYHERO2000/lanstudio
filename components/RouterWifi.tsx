'use client';
import {X} from 'lucide-react';
import {PropertyList} from './PropertyList';
import {withoutPort} from '../lib/port-edits.mjs';
type WifiNode={ports:string[];portTypes?:Record<string,string>;portRoles?:Record<string,string>;portSides?:Record<string,string>;wifiNetworks?:Record<string,string>};
export function RouterWifi({node,usedPorts,patch}:{node:WifiNode;usedPorts:string[];patch:(value:any)=>void}){
 const entries=Object.entries(node.wifiNetworks??{});
 return <PropertyList title="WI-FI СЕТИ" count={entries.length} addLabel="Добавить Wi-Fi-сеть" onAdd={()=>{let i=1;while(node.ports.includes('wifi'+i))i++;const port='wifi'+i;patch({ports:[...node.ports,port],portTypes:{...node.portTypes,[port]:'wifi'},wifiNetworks:{...node.wifiNetworks,[port]:'Wi-Fi '+i}});}}>
 {entries.map(([port,name])=><div className="wifi-row" key={port}><span className={usedPorts.includes(port)?'used':''}/><input aria-label={`SSID ${port}`} maxLength={100} value={name} onChange={e=>patch({wifiNetworks:{...node.wifiNetworks,[port]:e.target.value}})}/><small>SSID</small><button title={usedPorts.includes(port)?'Сначала отключите связи Wi-Fi-сети':'Удалить Wi-Fi-сеть'} disabled={usedPorts.includes(port)} onClick={()=>patch(withoutPort(node,port))}><X size={12}/></button></div>)}
 </PropertyList>;
}
