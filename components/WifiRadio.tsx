'use client';
import {Settings2} from 'lucide-react';
import {wifiBands,wifiGenerations} from '../lib/wifi-radio.mjs';
export type RadioSettings={bands:string[];generations:string[]};
export default function WifiRadio({value,onChange,label}:{value?:RadioSettings;onChange:(value:RadioSettings)=>void;label:string}){
 const radio=value??{bands:[],generations:[]};
 const summary=[radio.bands.map(b=>b==='2.4'?'2,4':b).join('/')+(radio.bands.length?' ГГц':''),radio.generations.map(g=>g.replace('wifi','Wi-Fi ').toUpperCase().replace('WI-FI','Wi-Fi')).join(', ')].filter(Boolean).join(' · ');
 return <details className="wifi-radio"><summary aria-label={`Диапазоны и поколения ${label}`}><Settings2 size={12}/><span>{summary||'Диапазоны и поколения'}</span></summary><div className="wifi-radio-options">{([['bands','Диапазоны',wifiBands],['generations','Поколения',wifiGenerations]] as const).map(([key,title,options])=><fieldset key={key}><legend>{title}</legend>{options.map(([id,name])=><label key={id}><input type="checkbox" aria-label={`${label}: ${name}`} checked={radio[key].includes(id)} onChange={e=>onChange({...radio,[key]:e.target.checked?[...radio[key],id]:radio[key].filter(v=>v!==id)})}/><span>{name}</span></label>)}</fieldset>)}</div></details>;
}
