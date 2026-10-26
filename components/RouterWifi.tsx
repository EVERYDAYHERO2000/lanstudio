'use client';
import type {WifiProfile} from './WifiNetworks';
import {X} from 'lucide-react';
import {PropertyList} from './PropertyList';
import {availableWifiProfiles} from '../lib/wifi-catalog.mjs';
type WifiNode={id:string;name:string;type:string;ports:string[];wifiMode?:'router'|'repeater';wifiMasterId?:string;wifiAssignments?:Record<string,string>};
export function RouterWifi({node,graph,usedPorts,patch,onAssign,onRemove}:{node:WifiNode;graph:{nodes:WifiNode[];wifiProfiles?:WifiProfile[]};usedPorts:string[];patch:(value:any)=>void;onAssign:(id:string,port?:string)=>void;onRemove:(port:string)=>void}){
 const entries=Object.entries(node.wifiAssignments??{}) as [string,string][],profiles=availableWifiProfiles(graph,node) as WifiProfile[],selected=new Set(entries.map(([,id])=>id)),available=profiles.filter(p=>!selected.has(p.id));
 const masters=graph.nodes.filter(n=>n.type==='router'&&n.id!==node.id&&n.wifiMode!=='repeater');
 return <><label className="field">Роль Wi-Fi<select aria-label="Роль Wi-Fi роутера" value={node.wifiMode??'router'} onChange={e=>patch({wifiMode:e.target.value,wifiMasterId:undefined})}><option value="router">Главный роутер</option><option value="repeater">Ретранслятор</option></select></label>{node.wifiMode==='repeater'&&<label className="field">Главный роутер<select aria-label="Главный роутер ретранслятора" value={node.wifiMasterId??''} onChange={e=>patch({wifiMasterId:e.target.value||undefined})}><option value="">Выберите роутер</option>{masters.map(n=><option key={n.id} value={n.id}>{n.name}</option>)}</select></label>}
 <PropertyList title="WI-FI СЕТИ" count={entries.length} addLabel="Выбрать Wi-Fi-сеть" disabled={!available.length} note={node.wifiMode==='repeater'?'Доступны только сети выбранного главного роутера. Можно ретранслировать часть сетей.':'Создавайте и редактируйте сети во вкладке Wi-Fi.'} onAdd={()=>{if(available[0])onAssign(available[0].id);}}>
 {entries.map(([port,id])=>{const dependent=graph.nodes.some(n=>n.wifiMode==='repeater'&&n.wifiMasterId===node.id&&Object.values(n.wifiAssignments??{}).includes(id));const blocked=usedPorts.includes(port)||dependent;return <div className="wifi-row" key={port}><span className={usedPorts.includes(port)?'used':''}/><select className="wifi-profile-select" aria-label={`Wi-Fi-сеть ${port}`} value={id} onChange={e=>onAssign(e.target.value,port)}>{profiles.filter(p=>p.id===id||!selected.has(p.id)).map(p=><option key={p.id} value={p.id}>{p.ssid}</option>)}</select><button title={dependent?'Сеть выбрана ретранслятором':usedPorts.includes(port)?'Сначала отключите связи Wi-Fi-сети':'Убрать Wi-Fi-сеть с роутера'} disabled={blocked} onClick={()=>onRemove(port)}><X size={12}/></button></div>;})}
 </PropertyList></>;
}
