'use client';
import {X} from 'lucide-react';
import {PropertyList} from './PropertyList';
import {withoutPort} from '../lib/port-edits.mjs';
import {vpnProtocols} from '../lib/topology-options.mjs';
export type NetworkRecord={id:string;name:string;cidr:string;description?:string};
export function RouterOptions({node,networks,patch,addVpn,renamePort,usedPorts}:{node:any;networks:NetworkRecord[];patch:(v:any)=>void;addVpn:(protocol:string,role:'client'|'server')=>void;renamePort:(port:string,name:string)=>void;usedPorts:string[]}){
 const selected:string[]=node.dhcp?.networkIds??[], available=networks.filter(n=>!selected.includes(n.id)),vpnPorts:string[]=node.ports.filter((p:string)=>node.portTypes?.[p]==='vpn');
 return <div className="router-options"><div className="section-label">МАРШРУТИЗАЦИЯ</div><label className="toggle-row"><div>NAT<small>Трансляция сетевых адресов</small></div><input type="checkbox" checked={node.natEnabled??false} onChange={e=>patch({natEnabled:e.target.checked})}/></label><label className="toggle-row"><div>DHCP-сервер</div><input type="checkbox" checked={node.dhcp?.enabled??false} onChange={e=>patch({dhcp:{enabled:e.target.checked,networkIds:selected}})}/></label>
 {node.dhcp?.enabled&&<PropertyList title="DHCP СЕТИ" count={selected.length} addLabel="Добавить DHCP-сеть" disabled={!available.length} note={!networks.length?'Сначала добавьте сеть во вкладке «Сети».':undefined} onAdd={()=>{if(available[0])patch({dhcp:{...node.dhcp,networkIds:[...selected,available[0].id]}});}}>
 {selected.map(id=><div className="dhcp-row" key={id}><span className="used"/><select aria-label={`Сеть DHCP ${id}`} value={id} onChange={e=>patch({dhcp:{...node.dhcp,networkIds:selected.map(v=>v===id?e.target.value:v)}})}>{networks.filter(n=>n.id===id||!selected.includes(n.id)).map(n=><option key={n.id} value={n.id}>{n.name?n.name+' · ':''}{n.cidr}</option>)}</select><button title="Удалить DHCP-сеть" onClick={()=>patch({dhcp:{...node.dhcp,networkIds:selected.filter(v=>v!==id)}})}><X size={12}/></button></div>)}
 </PropertyList>}
 <PropertyList title="VPN ПРОТОКОЛЫ" count={vpnPorts.length} addLabel="Добавить VPN-точку" onAdd={()=>addVpn('WireGuard','client')}>
 {vpnPorts.map((p,i)=><div className="vpn-row" key={i}><span className={usedPorts.includes(p)?'used':''}/><input aria-label={`Имя VPN-точки ${p}`} value={p} onChange={e=>renamePort(p,e.target.value)}/><select className="vpn-protocol" aria-label={`Протокол VPN ${p}`} value={node.vpnPorts?.[p]?.protocol} onChange={e=>patch({vpnPorts:{...node.vpnPorts,[p]:{...node.vpnPorts[p],protocol:e.target.value}}})}>{vpnProtocols.map(v=><option key={v}>{v}</option>)}</select><select className="vpn-role" aria-label={`Роль VPN ${p}`} value={node.vpnPorts?.[p]?.role} onChange={e=>patch({vpnPorts:{...node.vpnPorts,[p]:{...node.vpnPorts[p],role:e.target.value}}})}><option value="client">Клиент</option><option value="server">Сервер</option></select><button title={usedPorts.includes(p)?'Сначала отключите связи VPN-точки':'Удалить VPN-точку'} disabled={usedPorts.includes(p)} onClick={()=>patch(withoutPort(node,p))}><X size={12}/></button></div>)}
 </PropertyList></div>;
}
