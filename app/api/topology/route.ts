import {normalizeWifiGraph} from '../../../lib/wifi-catalog.mjs';
import {validateOptions} from '../../../lib/topology-options.mjs';
import {requireAuth} from '../../../lib/auth';
import {validPortTypes,validPortSides} from '../../../lib/ports.mjs';
import {validDeviceType} from '../../../lib/device-types.mjs';
import { normalizeNode } from '../../../lib/node-settings.mjs';
import { getStore } from '../../../db';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(req:Request) {
  const denied=requireAuth(req);if(denied)return denied;
  try { return Response.json(getStore().read(getStore().currentId()), {headers:{'Cache-Control':'no-store'}}); }
  catch (error) { console.error('Database read failed', error); return Response.json({error:'База данных недоступна'},{status:500}); }
}
export async function PUT(req: Request) {
  const denied=requireAuth(req);if(denied)return denied;
  let data;
  try {
    const body = await req.text();
    if (Buffer.byteLength(body) > 5_000_000) return Response.json({error:'Схема больше 5 МБ'},{status:413});
    data = JSON.parse(body);
    if (data?.schemaVersion !== 1 || typeof data.name !== 'string' || !Array.isArray(data.nodes) || !Array.isArray(data.links)) throw Error();
    if(data.description!==undefined&&(typeof data.description!=='string'||data.description.length>10000))throw Error();
    if(!data.name.trim()||data.name.length>200)throw Error();
    const ids = new Set();
    data.nodes=data.nodes.map((n:any)=>n?normalizeNode(n):n);data=normalizeWifiGraph(data);
    for (const n of data.nodes) {
      if (!n || typeof n.id !== 'string' || ids.has(n.id) || !Number.isFinite(n.x) || !Number.isFinite(n.y) || !Array.isArray(n.ports) || n.ports.some((p:unknown)=>typeof p!=='string'||!p) || new Set(n.ports).size!==n.ports.length || ['name','model','ip','mac','description'].some(k=>typeof n[k]!=='string') || !['provider','router','switch','modem','device','container'].includes(n.type)) throw Error();
      if(!validPortSides(n)) throw Error();
      if(!validPortTypes(n)) throw Error();
      if(!validDeviceType(n.deviceType)) throw Error();
      if(n.meshEnabled!==undefined&&typeof n.meshEnabled!=='boolean') throw Error();
      if(n.portRoles&&(typeof n.portRoles!=='object'||Array.isArray(n.portRoles)||Object.entries(n.portRoles).some(([port,role])=>!n.ports.includes(port)||!['lan','wan'].includes(String(role))))) throw Error();
      ids.add(n.id);
    }
    const links = new Set();
    for (const l of data.links) {
      const a=data.nodes.find((n:{id:string})=>n.id===l.source), b=data.nodes.find((n:{id:string})=>n.id===l.target);
      if (!l.id || links.has(l.id) || !a || !b || a===b || !a.ports.includes(l.sourcePort) || !b.ports.includes(l.targetPort) || !['ethernet','wireless','usb','virtual','vpn'].includes(l.kind)) throw Error();
      if(l.comment!==undefined&&typeof l.comment!=='string') throw Error();
      links.add(l.id);
    }
    validateOptions(data,{requireWifiNetwork:true});
  } catch { return Response.json({error:'Некорректная схема'},{status:400}); }
  try { return Response.json(getStore().save(data,getStore().currentId())); }
  catch (error) {
    if ((error as {code?:string}).code==='NOT_FOUND')return Response.json({error:'Схема удалена'},{status:404});
    if ((error as {code?:string}).code==='CONFLICT') return Response.json({error:(error as Error).message},{status:409});
    console.error('Database write failed',error); return Response.json({error:'Не удалось сохранить схему'},{status:500});
  }
}
