/** @param {{placeId?:string}[]} nodes @returns {Record<string,number>} */
export function placeCounts(nodes){const counts=Object.create(null);for(const n of nodes)if(n.placeId)counts[n.placeId]=(counts[n.placeId]??0)+1;return counts;}
/** @param {any} graph */
export function validatePlaces(graph){const places=graph.places??[];if(!Array.isArray(places))throw Error('Некорректный список мест');const ids=new Set();for(const p of places){if(!p||typeof p.id!=='string'||!p.id||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>200)throw Error('Проверьте названия и ID мест');ids.add(p.id);}for(const n of graph.nodes)if(n.placeId!==undefined&&(typeof n.placeId!=='string'||!ids.has(n.placeId)))throw Error('Выбрано несуществующее место устройства');return graph;}
