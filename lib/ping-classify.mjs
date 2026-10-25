/** @param {{code?:string|number|null,killed?:boolean}|null} error @param {string} output */
export function classifyPing(error,output=''){
 if(!error)return 'up';
 if(['ENOENT','EACCES','EPERM'].includes(String(error.code))||/operation not permitted|permission denied/i.test(output))return 'error';
 return typeof error.code==='number'||error.killed?'down':'error';
}
