import {normalizeWifiGraph} from '../lib/wifi-catalog.mjs';
import { normalizeNode } from '../lib/node-settings.mjs';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {randomBytes,randomUUID,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
const digest=value=>createHash('sha256').update(value).digest('hex');
export function openStore(filename = process.env.DATABASE_PATH || './data/lan-studio.sqlite') {
 if(filename!==':memory:')mkdirSync(dirname(resolve(/* turbopackIgnore: true */ filename)),{recursive:true});
 const db=new DatabaseSync(filename);db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
 db.exec(`CREATE TABLE IF NOT EXISTS topologies(id TEXT PRIMARY KEY,data TEXT NOT NULL,revision INTEGER NOT NULL,updated_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS account(id INTEGER PRIMARY KEY CHECK(id=1),salt TEXT NOT NULL,password_hash TEXT NOT NULL,failures INTEGER NOT NULL DEFAULT 0,blocked_until INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS deleted_topologies(id TEXT PRIMARY KEY);
 CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,expires_at INTEGER NOT NULL);`);
 if(!db.prepare('SELECT id FROM account WHERE id=1').get()){const salt=randomBytes(16).toString('hex');db.prepare('INSERT OR IGNORE INTO account(id,salt,password_hash) VALUES(1,?,?)').run(salt,scryptSync('admin',salt,64).toString('hex'));}
 function passwordMatches(password){const a=db.prepare('SELECT * FROM account WHERE id=1').get();return timingSafeEqual(scryptSync(password,a.salt,64),Buffer.from(a.password_hash,'hex'));}
 function session(){const token=randomBytes(32).toString('hex');db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());db.prepare('INSERT INTO sessions VALUES(?,?)').run(digest(token),Date.now()+7*86400000);return token;}
 return {
  read(id='main'){const row=db.prepare('SELECT data,revision FROM topologies WHERE id=?').get(id);if(!row)return null;const data=JSON.parse(row.data);return normalizeWifiGraph({...data,description:data.description??'',nodes:data.nodes.map(normalizeNode),revision:Number(row.revision)});},
  list(){return db.prepare('SELECT id,data,updated_at FROM topologies ORDER BY updated_at DESC,id').all().map(r=>{const d=JSON.parse(r.data);return {id:r.id,name:d.name,description:d.description??'',nodes:d.nodes.length,links:d.links.length,updatedAt:r.updated_at};});},
  create(name,description=''){const id=randomUUID();db.prepare('INSERT INTO topologies VALUES(?,?,1,?)').run(id,JSON.stringify({schemaVersion:1,name,description,nodes:[],links:[]}),new Date().toISOString());return {id};},
  remove(id){db.exec('BEGIN IMMEDIATE');try{const removed=Number(db.prepare('DELETE FROM topologies WHERE id=?').run(id).changes)>0;if(removed)db.prepare('INSERT OR IGNORE INTO deleted_topologies VALUES(?)').run(id);db.exec('COMMIT');return removed;}catch(e){db.exec('ROLLBACK');throw e;}},
  save(data,id='main'){
   db.exec('BEGIN IMMEDIATE');try{const row=db.prepare('SELECT revision FROM topologies WHERE id=?').get(id);
    if(!row&&(id!=='main'||db.prepare('SELECT 1 FROM deleted_topologies WHERE id=?').get(id))){const error=new Error('Схема удалена');error.code='NOT_FOUND';throw error;}
    if(row&&data.revision!==Number(row.revision)){const error=new Error('Схема изменена в другой вкладке. Перезагрузите страницу.');error.code='CONFLICT';throw error;}
    const revision=Number(row?.revision||0)+1;db.prepare('INSERT INTO topologies VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,revision=excluded.revision,updated_at=excluded.updated_at').run(id,JSON.stringify(normalizeWifiGraph({...data,nodes:data.nodes.map(normalizeNode)})),revision,new Date().toISOString());db.exec('COMMIT');return {revision};
   }catch(e){db.exec('ROLLBACK');throw e;}
  },
  login(username,password){const a=db.prepare('SELECT * FROM account WHERE id=1').get();if(Number(a.blocked_until)>Date.now())return {error:'Слишком много попыток. Подождите 5 минут.',status:429};if(username!=='admin'||!passwordMatches(password)){const failures=Number(a.failures)+1;db.prepare('UPDATE account SET failures=?,blocked_until=? WHERE id=1').run(failures>=5?0:failures,failures>=5?Date.now()+300000:0);return {error:'Неверный логин или пароль',status:401};}db.prepare('UPDATE account SET failures=0,blocked_until=0 WHERE id=1').run();return {token:session()};},
  authenticated(token){return typeof token==='string'&&token.length===64&&!!db.prepare('SELECT 1 FROM sessions WHERE token_hash=? AND expires_at>?').get(digest(token),Date.now());},
  logout(token){if(token)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(digest(token));},
  changePassword(currentPassword,newPassword){if(!passwordMatches(currentPassword))return null;const salt=randomBytes(16).toString('hex');db.exec('BEGIN IMMEDIATE');try{db.prepare('UPDATE account SET salt=?,password_hash=?,failures=0,blocked_until=0 WHERE id=1').run(salt,scryptSync(newPassword,salt,64).toString('hex'));db.exec('DELETE FROM sessions');const token=session();db.exec('COMMIT');return token;}catch(e){db.exec('ROLLBACK');throw e;}},
  close(){db.close();}
 };
}
