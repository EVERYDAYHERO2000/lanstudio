/** @param {{id:string,portTypes?:Record<string,string>}} node @param {string} port @param {{source:string,target:string,sourcePort:string,targetPort:string,kind:string}[]} links */
export function portConnectionKind(node,port,links){
 const kinds=new Set(links.filter(l=>l.source===node.id&&l.sourcePort===port||l.target===node.id&&l.targetPort===port).map(l=>l.kind==='usb'?'ethernet':l.kind));
 if(kinds.size===1)return [...kinds][0];
 const type=node.portTypes?.[port];
 return type==='wifi'?'wireless':type==='vpn'?'vpn':type==='virtual'?'virtual':'ethernet';
}
