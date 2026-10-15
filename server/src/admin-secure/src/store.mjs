import {readFile} from 'node:fs/promises';
// Every operation goes through a dedicated connection queue. Do not pass the
// main app's shared sqlite3 connection: unrelated writes could join a transaction.
export function createStore(driver){let tail=Promise.resolve();const queue=fn=>{const task=tail.then(fn);tail=task.catch(()=>{});return task};return {
 read:fn=>queue(()=>fn(driver)),
 write:fn=>queue(async()=>{await driver.exec('BEGIN IMMEDIATE');try{const result=await fn(driver);await driver.exec('COMMIT');return result}catch(e){await driver.exec('ROLLBACK');throw e}}),
 migrate:()=>queue(async()=>{await driver.exec(await readFile(new URL('../migrations/001_admin.sql',import.meta.url),'utf8'))}),
 close:()=>queue(()=>driver.close?.()),
};}
export async function openNodeSqlite(path){const {DatabaseSync}=await import('node:sqlite');const db=new DatabaseSync(path);db.exec('PRAGMA busy_timeout=5000;');return createStore({all:async(sql,p=[])=>db.prepare(sql).all(...p),get:async(sql,p=[])=>db.prepare(sql).get(...p),run:async(sql,p=[])=>db.prepare(sql).run(...p),exec:async sql=>db.exec(sql),close:()=>db.close()});}
export function fromSqlite3Connection(db){db.configure('busyTimeout',5000);return createStore({all:(s,p=[])=>new Promise((r,j)=>db.all(s,p,(e,v)=>e?j(e):r(v))),get:(s,p=[])=>new Promise((r,j)=>db.get(s,p,(e,v)=>e?j(e):r(v))),run:(s,p=[])=>new Promise((r,j)=>db.run(s,p,function(e){e?j(e):r({changes:this.changes,lastInsertRowid:this.lastID})})),exec:s=>new Promise((r,j)=>db.exec(s,e=>e?j(e):r())),close:()=>new Promise((r,j)=>db.close(e=>e?j(e):r()))});}
