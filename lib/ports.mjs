/** @param {{type:string, ports:string[], portRoles?:Record<string,string>, portTypes?:Record<string,string>, portSides?:Record<string,string>, vpnPorts?:Record<string,{role:string}>}} node @param {string} port */
export function getPortRole(node, port) {
  return node.portRoles?.[port] ?? (node.ports.indexOf(port) === 0 ? 'wan' : 'lan');
}
/** @param {{type:string, ports:string[], portRoles?:Record<string,string>, portTypes?:Record<string,string>, portSides?:Record<string,string>, vpnPorts?:Record<string,{role:string}>}} node @param {string} port */
export function portPosition(node, port) {
  const isLeft = (/** @type {string} */ p) => node.portTypes?.[p] === 'vpn' ? node.vpnPorts?.[p]?.role !== 'server' : node.type === 'switch' ? (node.portSides?.[p] ? node.portSides[p] === 'left' : node.ports.indexOf(p) === 0) : node.type === 'provider' || (node.type === 'device' && node.portTypes?.[p] === 'virtual') ? false : node.type === 'modem' ? getPortRole(node,p) === 'wan' : node.type === 'router' ? ['usb','modem'].includes(node.portTypes?.[p]??'') || getPortRole(node,p) === 'wan' || node.portSides?.[p] === 'left' : node.ports.indexOf(p) === 0;
  const left = isLeft(port);
  const sameSide = node.ports.filter(p => isLeft(p) === left);
  return { x: left ? 0 : 220, y: 58 + sameSide.indexOf(port)*23, left };
}
/** @param {{type:string, ports:string[], portRoles?:Record<string,string>, portTypes?:Record<string,string>, portSides?:Record<string,string>, vpnPorts?:Record<string,{role:string}>}} node */
export function nodeHeight(node) {
  return Math.max(156, ...node.ports.map(p => portPosition(node,p).y+22));
}

/** @param {{ports:string[],portTypes?:Record<string,string>, portSides?:Record<string,string>, vpnPorts?:Record<string,{role:string}>}} node */
export function validPortTypes(node) {
  return node.portTypes===undefined || (!!node.portTypes && typeof node.portTypes==='object' && !Array.isArray(node.portTypes) && Object.entries(node.portTypes).every(([p,t])=>node.ports.includes(p)&&['ethernet','usb','modem','virtual','vpn'].includes(t)));
}

/** @param {{ports:string[],portSides?:Record<string,string>, vpnPorts?:Record<string,{role:string}>}} node */
export function validPortSides(node) {
  return node.portSides===undefined || (!!node.portSides && typeof node.portSides==='object' && !Array.isArray(node.portSides) && Object.entries(node.portSides).every(([p,s])=>node.ports.includes(p)&&['left','right'].includes(s)));
}
