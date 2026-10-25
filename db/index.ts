import { openStore } from './store.mjs';
const globalDb = globalThis as typeof globalThis & { lanStore?: ReturnType<typeof openStore> };
export function getStore() { return globalDb.lanStore ??= openStore(); }
