'use client';
import {useState} from 'react';
import {Search,Network,Wifi} from 'lucide-react';
type WifiNode={id:string;name:string;type:string;wifiNetworks?:Record<string,string>};
type Link={source:string;target:string;sourcePort:string;targetPort:string};
export default function WifiNetworks({nodes,links,onSelect,onShow}:{nodes:WifiNode[];links:Link[];onSelect:(id:string)=>void;onShow:(id:string)=>void}){
 const [query,setQuery]=useState('');
 const rows=nodes.filter(n=>n.type==='router').flatMap(n=>Object.entries(n.wifiNetworks??{}).map(([port,ssid])=>({node:n,port,ssid,count:links.filter(l=>l.source===n.id&&l.sourcePort===port||l.target===n.id&&l.targetPort===port).length})));
 const filtered=rows.filter(r=>(r.ssid+' '+r.node.name).toLowerCase().includes(query.toLowerCase()));
 return <div className="devices-view"><div className="devices-toolbar"><label className="search"><Search size={15}/><input aria-label="Поиск Wi-Fi-сетей" placeholder="SSID или роутер…" value={query} onChange={e=>setQuery(e.target.value)}/></label><span>{rows.length} сетей</span></div><div className="devices-table-scroll"><table className="devices-table"><thead><tr><th>SSID</th><th>Роутер</th><th>Точка</th><th>Связи</th><th/></tr></thead><tbody>{filtered.map(r=><tr key={r.node.id+':'+r.port} onClick={()=>onSelect(r.node.id)}><td><button className="wifi-table-name" onClick={()=>onSelect(r.node.id)}><Wifi size={14}/>{r.ssid||'Без SSID'}</button></td><td>{r.node.name}</td><td className="mono">{r.port}</td><td>{r.count}</td><td><button title="Показать роутер на схеме" onClick={e=>{e.stopPropagation();onShow(r.node.id);}}><Network size={15}/></button></td></tr>)}</tbody></table>{!filtered.length&&<div className="devices-empty">{rows.length?'Сети не найдены':'Добавьте Wi-Fi-сети в свойствах роутеров.'}</div>}</div><div className="devices-footer">Нажмите на сеть для редактирования в свойствах роутера.</div></div>;
}
