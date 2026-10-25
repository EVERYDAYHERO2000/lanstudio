import {getStore} from '../../../../db';
import {sameOrigin,sessionCookie} from '../../../../lib/auth';
export const runtime='nodejs';
export async function POST(req:Request){if(!sameOrigin(req))return Response.json({error:'Запрос запрещён'},{status:403});try{const {username,password}=await req.json() as any;if(typeof username!=='string'||typeof password!=='string'||password.length>256)return Response.json({error:'Некорректные данные'},{status:400});const r=getStore().login(username,password);if(r.error)return Response.json({error:r.error},{status:r.status});return Response.json({ok:true},{headers:{'Set-Cookie':sessionCookie(req,r.token!)}});}catch{return Response.json({error:'Не удалось войти'},{status:400});}}
