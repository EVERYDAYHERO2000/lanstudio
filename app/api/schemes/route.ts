import {getStore} from '../../../db';
import {requireAuth} from '../../../lib/auth';
export const dynamic='force-dynamic';
export async function GET(req:Request){return requireAuth(req)??Response.json(getStore().list(),{headers:{'Cache-Control':'no-store'}});}
export async function POST(req:Request){const denied=requireAuth(req);if(denied)return denied;try{const {name,description=''}=await req.json() as any;if(typeof name!=='string'||!name.trim()||name.length>200||typeof description!=='string'||description.length>10000)throw Error();return Response.json(getStore().create(name.trim(),description),{status:201});}catch{return Response.json({error:'Укажите название (до 200 символов) и описание (до 10000)'},{status:400});}}
export async function DELETE(req:Request){const denied=requireAuth(req);if(denied)return denied;const id=new URL(req.url).searchParams.get('id');if(!id)return Response.json({error:'Укажите схему'},{status:400});return getStore().remove(id)?Response.json({ok:true}):Response.json({error:'Схема не найдена'},{status:404});}
