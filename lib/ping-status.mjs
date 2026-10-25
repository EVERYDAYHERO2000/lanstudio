/** @param {{id:string,ip:string}} node @param {Record<string,{ip:string,status:string}>} results */
export function pingState(node,results){const r=results[node.id];return r&&r.ip===node.ip?r.status:'unchecked';}
export const pingLabels={unchecked:'Не проверялось',checking:'Проверка…',up:'Отвечает',down:'Не отвечает',skipped:'Нет IP-адреса',error:'Ошибка проверки'};
