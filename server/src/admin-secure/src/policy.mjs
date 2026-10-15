import {createHash,randomUUID} from 'node:crypto';
export const permissionSets={owner:['read','accounts.write','kyc.write','kyc.documents','finance.write','bookings.write','support.write','reports.export'],operations:['read','accounts.write','bookings.write','support.write','reports.export'],reviewer:['read','kyc.write','kyc.documents','support.write'],finance:['read','finance.write','support.write','reports.export'],viewer:['read']};
export const resources=['bookings','partners','customers','kyc','dues','cases','audit'];
export const uuid=()=>randomUUID();
export function fail(status,message){const e=new Error(message);e.status=status;throw e}
export function text(v,min=0,max=500){if(typeof v!=='string'||v.trim().length<min||v.trim().length>max)fail(400,`Enter text between ${min} and ${max} characters.`);return v.trim()}
export function choice(v,choices){if(!choices.includes(v))fail(400,'Unsupported value.');return v}
export function boolean(v){if(typeof v!=='boolean')fail(400,'A true or false value is required.');return v}
export const hash=v=>createHash('sha256').update(v).digest('hex');
export const version=row=>hash(JSON.stringify(row));
export const mask=v=>v?'•••• '+String(v).slice(-4):'Not provided';
export function csvCell(v){let s=String(v??'');if(/^[\s]*[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'}
export function docURL(v,hosts){try{const u=new URL(v);if(u.protocol!=='https:'||u.username||u.password||!hosts.includes(u.hostname))return null;return u.href}catch{return null}}
export function pageOptions(q){const num=(v,d,max)=>{const n=v===undefined?d:Number(v);if(!Number.isInteger(n)||n<1||n>max)fail(400,'Invalid pagination.');return n};return {page:num(q.page,1,100000),pageSize:num(q.pageSize,12,100),q:typeof q.q==='string'?q.q.trim().slice(0,120):'',status:typeof q.status==='string'?q.status:'',from:typeof q.from==='string'?q.from:'',to:typeof q.to==='string'?q.to:''}}
export async function audit(db,actor,action,type,id,reason,before={},after={}){await db.run('INSERT INTO kaam_admin_audit VALUES (?,?,?,?,?,?,?,?,?,?)',[uuid(),actor.id,actor.full_name,action,type,id,reason,JSON.stringify(before),JSON.stringify(after),new Date().toISOString()]);}
export async function enqueue(db,type,id,patch){const now=new Date().toISOString();const old=await db.get('SELECT patch_json FROM kaam_admin_overrides WHERE entity_type=? AND entity_id=?',[type,id]);const merged={...(old?JSON.parse(old.patch_json):{}),...patch};await db.run('INSERT INTO kaam_admin_overrides VALUES (?,?,?,?) ON CONFLICT(entity_type,entity_id) DO UPDATE SET patch_json=excluded.patch_json,updated_at=excluded.updated_at',[type,id,JSON.stringify(merged),now]);await db.run('INSERT INTO kaam_admin_outbox(id,entity_type,entity_id,created_at) VALUES (?,?,?,?)',[uuid(),type,id,now]);}
