import {requireAuth} from '../../../lib/auth';
export const dynamic='force-dynamic';
function retired(req:Request){return requireAuth(req)??Response.json({error:'Приложение работает с одной сетью. Используйте историю версий.'},{status:410});}
export const GET=retired;export const POST=retired;export const DELETE=retired;
