import { resolve } from 'node:path';
process.env.DATABASE_PATH = resolve(process.env.DATABASE_PATH || './data/lan-studio.sqlite');
process.env.HOSTNAME = process.env.LISTEN_HOST || '0.0.0.0';
await import('../.next/standalone/server.js');
