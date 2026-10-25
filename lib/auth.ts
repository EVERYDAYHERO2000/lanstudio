import {getStore} from '../db';
export function token(req:Request){return req.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith('lan_session='))?.slice(12)??'';}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');if(req.headers.get('sec-fetch-site')==='cross-site')return false;if(!origin)return true;try{return new URL(origin).host===req.headers.get('host');}catch{return false;}}
export function requireAuth(req:Request){if(!['GET','HEAD'].includes(req.method)&&!sameOrigin(req))return Response.json({error:'Запрос с другого сайта запрещён'},{status:403});if(!getStore().authenticated(token(req)))return Response.json({error:'Требуется вход'},{status:401});return null;}
export function sessionCookie(req:Request,value:string){const secure=new URL(req.url).protocol==='https:'||req.headers.get('x-forwarded-proto')==='https';return `lan_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${value?604800:0}${secure?'; Secure':''}`;}
