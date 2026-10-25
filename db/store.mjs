import { normalizeRouterMode } from '../lib/router-mode.mjs';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
export function openStore(filename = process.env.DATABASE_PATH || './data/lan-studio.sqlite') {
  if (filename !== ':memory:') mkdirSync(dirname(resolve(filename)), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
  db.exec(`CREATE TABLE IF NOT EXISTS topologies (id TEXT PRIMARY KEY, data TEXT NOT NULL, revision INTEGER NOT NULL, updated_at TEXT NOT NULL)`);
  return {
    read() {
      const row = db.prepare('SELECT data, revision FROM topologies WHERE id = ?').get('main');
      if (!row) return null;
      const data=JSON.parse(row.data);
      return { ...data, nodes:data.nodes.map(normalizeRouterMode), revision: Number(row.revision) };
    },
    save(data) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const row = db.prepare('SELECT revision FROM topologies WHERE id = ?').get('main');
        if (row && data.revision !== Number(row.revision)) {
          const error = new Error('Схема изменена в другой вкладке. Перезагрузите страницу.');
          error.code = 'CONFLICT'; throw error;
        }
        const revision = Number(row?.revision || 0) + 1;
        db.prepare(`INSERT INTO topologies(id,data,revision,updated_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data, revision=excluded.revision, updated_at=excluded.updated_at`).run('main', JSON.stringify(data), revision, new Date().toISOString());
        db.exec('COMMIT'); return { revision };
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
    close() { db.close(); }
  };
}
