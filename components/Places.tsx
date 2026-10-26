'use client';
import {useState} from 'react';
import {Plus,Trash2} from 'lucide-react';
import {graphId} from '../lib/topology-options.mjs';
import {placeCounts} from '../lib/places.mjs';
export type Place={id:string;name:string};
export default function Places({places,nodes,onChange}:{places:Place[];nodes:{placeId?:string}[];onChange:(rows:Place[])=>void}){
 const [name,setName]=useState('');const counts=placeCounts(nodes);
 return <div className="devices-view places-view"><form className="places-form" onSubmit={e=>{e.preventDefault();if(!name.trim())return;onChange([...places,{id:graphId(),name:name.trim()}]);setName('');}}><div className="devices-table-scroll"><table className="devices-table places-table"><thead><tr><th>Место</th><th>Устройств</th><th/></tr></thead><tbody>{places.map(p=><tr key={p.id}><td><input className="place-name" aria-label={`Название места ${p.name}`} value={p.name} maxLength={200} required onChange={e=>onChange(places.map(v=>v.id===p.id?{...v,name:e.target.value}:v))} onBlur={e=>{const value=e.target.value.trim()||'Без названия';if(value!==p.name)onChange(places.map(v=>v.id===p.id?{...v,name:value}:v));}}/></td><td><span className="place-count">{counts[p.id]??0}</span></td><td><button type="button" title={counts[p.id]?'Сначала перенесите устройства в другое место':'Удалить место'} disabled={!!counts[p.id]} onClick={()=>onChange(places.filter(v=>v.id!==p.id))}><Trash2 size={14}/></button></td></tr>)}<tr className="place-create"><td><input className="place-name" aria-label="Новое место" maxLength={200} placeholder="Гараж, мастерская, дом…" value={name} onChange={e=>setName(e.target.value)}/></td><td>—</td><td><button className="primary" type="submit" disabled={!name.trim()}><Plus size={14}/>Добавить</button></td></tr></tbody></table></div></form><div className="devices-footer">{places.length} мест · Выберите место в свойствах узла. Для записи изменений в базу нажмите «Сохранить».</div></div>;
}
