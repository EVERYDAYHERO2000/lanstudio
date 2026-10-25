import {getStore} from '../../../../db';
import {requireAuth,token,sessionCookie} from '../../../../lib/auth';
export async function POST(req:Request){const denied=requireAuth(req);if(denied)return denied;getStore().logout(token(req));return Response.json({ok:true},{headers:{'Set-Cookie':sessionCookie(req,'')}});}
