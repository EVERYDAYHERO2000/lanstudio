/** Add one SSID and its connector without changing existing ports or links. @param {any} node @param {string} [ssid] @param {string} [networkId] */
export function addWifiNetwork(node,ssid,networkId){let i=1;while(node.ports.includes('wifi'+i))i++;const port='wifi'+i;return {...node,ports:[...node.ports,port],portTypes:{...node.portTypes,[port]:'wifi'},wifiNetworks:{...node.wifiNetworks,[port]:ssid?.trim()||'Wi-Fi '+i},...(networkId?{wifiNetworkIds:{...node.wifiNetworkIds,[port]:networkId}}:{})};}
/** @param {any} node @param {string} port @param {string} networkId */
export function bindWifiNetwork(node,port,networkId){const assignments={...node.wifiNetworkIds};if(networkId)assignments[port]=networkId;else delete assignments[port];return {...node,wifiNetworkIds:assignments};}
