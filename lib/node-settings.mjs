import {normalizeRouterMode} from './router-mode.mjs';
/** Normalize node settings for import, storage, and editing. @param {any} node */
export function normalizeNode(node){const n=normalizeRouterMode(node);return n.type==='switch'&&n.managed!==true?{...n,ip:'',mac:''}:n;}
