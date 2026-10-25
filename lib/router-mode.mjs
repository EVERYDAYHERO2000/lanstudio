/** Convert legacy Mesh nodes without changing IDs, links, or port names.
 * @template {{type?:string,meshEnabled?:boolean,ports?:string[],portRoles?:Record<string,string>}} T
 * @param {T} node
 */
export function normalizeRouterMode(node) {
  if (node.type === 'modem' && node.ports && !node.portRoles) {
    let i=1;while(node.ports.includes('line'+i))i++;
    const input='line'+i;
    return {...node,ports:[input,...node.ports],portRoles:{...Object.fromEntries(node.ports.map(p=>[p,'lan'])),[input]:'wan'}};
  }
  if (node.type === 'mesh') return { ...node, type: 'router', meshEnabled: true };
  if (node.type === 'router') return { ...node, meshEnabled: node.meshEnabled ?? false };
  return node;
}
