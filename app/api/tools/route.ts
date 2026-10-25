import {requireAuth} from '../../../lib/auth';
import {execFile} from 'node:child_process';
import {isIP,createConnection} from 'node:net';
import {reverse} from 'node:dns/promises';
export const runtime='nodejs';
export const dynamic='force-dynamic';
let running=0;
export async function POST(req:Request){
 const denied=requireAuth(req);if(denied)return denied;
 let input;
 try{input=await req.json() as {action:string;ip:string;port?:number};}catch{return Response.json({error:'Некорректный запрос'},{status:400});}
 if(!input||typeof input.ip!=='string'||!isIP(input.ip)||!['ping','dns','tcp'].includes(input.action))return Response.json({error:'Укажите корректный IPv4 или IPv6 устройства'},{status:400});
 if(input.action==='tcp'&&(!Number.isInteger(input.port)||input.port!<1||input.port!>65535))return Response.json({error:'Порт должен быть от 1 до 65535'},{status:400});
 if(running>=4)return Response.json({error:'Уже выполняются проверки. Повторите позже.'},{status:429});
 running++;const started=Date.now();
 try{
  let output:string,ok=true;
  if(input.action==='ping'){
   const args=process.platform==='win32'?['-n','3','-w','1000',input.ip]:['-n','-c','3',...(process.platform==='darwin'?['-W','1000']:['-W','1']),input.ip];
   const executable=process.platform==='darwin'&&isIP(input.ip)===6?'ping6':'ping';
   const result=await new Promise<{ok:boolean;output:string}>((resolve)=>execFile(executable,args,{timeout:7000,maxBuffer:65536,env:{...process.env,LC_ALL:'C'}},(error,stdout,stderr)=>resolve({ok:!error,output:((error as NodeJS.ErrnoException)?.code==='ENOENT'?'Утилита ping не установлена на сервере. Linux: установите iputils-ping.':stdout+'\n'+stderr+(error&&!stdout&&!stderr?'Проверка завершилась ошибкой или по таймауту.':'' )).trim()})));
   output=result.output;ok=result.ok;
  }else if(input.action==='dns'){
   let timer:ReturnType<typeof setTimeout>|undefined;
   try{const names=await Promise.race([reverse(input.ip),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('DNS: превышено время ожидания')),4000);})]);output=names.length?names.join('\n'):'PTR-запись не найдена';ok=names.length>0;}finally{clearTimeout(timer);}
  }else{
   const result=await new Promise<{ok:boolean;output:string}>(resolve=>{const socket=createConnection({host:input.ip,port:input.port!,timeout:3000});let done=false;const finish=(ok:boolean,output:string)=>{if(done)return;done=true;socket.destroy();resolve({ok,output});};socket.once('connect',()=>finish(true,`TCP ${input.ip}:${input.port} — соединение установлено`));socket.once('timeout',()=>finish(false,'TCP: время ожидания истекло (3 с)'));socket.once('error',e=>finish(false,`TCP: ${(e as NodeJS.ErrnoException).code??e.message}`));});
   output=result.output;ok=result.ok;
  }
  return Response.json({ok,output,durationMs:Date.now()-started});
 }catch(e){return Response.json({ok:false,output:(e as Error).message,durationMs:Date.now()-started});}finally{running--;}
}
