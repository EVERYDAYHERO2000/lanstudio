import {requireAuth} from '../../../../lib/auth';
export const dynamic='force-dynamic';
export async function GET(req:Request){return requireAuth(req)??Response.json({username:'admin'},{headers:{'Cache-Control':'no-store'}});}
