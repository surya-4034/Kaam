const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE_URL = isLocalhost 
  ? 'http://localhost:5050' 
  : (import.meta.env.VITE_API_URL || 'https://kaam-api-xic2.onrender.com').replace(/\/$/, '');
const TOKEN_KEY='kaam_admin_access_token';const CSRF_KEY='kaam_admin_csrf_token';
export const session={get token(){return localStorage.getItem(TOKEN_KEY)||''},get csrf(){return localStorage.getItem(CSRF_KEY)||''},save(data){localStorage.setItem(TOKEN_KEY,data.token);localStorage.setItem(CSRF_KEY,data.csrfToken)},clear(){localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(CSRF_KEY)}};
export async function api(path,{method='GET',body,signal}={}){const headers={'Accept':'application/json'};if(body!==undefined){headers['Content-Type']='application/json';}if(session.token)headers.Authorization=`Bearer ${session.token}`;if(method!=='GET'&&method!=='HEAD'&&session.csrf)headers['X-CSRF-Token']=session.csrf;const res=await fetch(`${API_BASE_URL}${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal});if(res.status===204)return null;const type=res.headers.get('content-type')||'';const data=type.includes('json')?await res.json():await res.text();if(!res.ok){const err=new Error(data?.error||'Request failed');err.status=res.status;err.requestId=data?.requestId;throw err}return data}
export const login=(adminId,password)=>api('/api/admin/auth/login',{method:'POST',body:{adminId,password}}).then(data=>{session.save(data);return data});
export const logout=()=>api('/api/admin/auth/logout',{method:'POST'}).finally(()=>session.clear());
export const resource=(kind,params={})=>api(`/api/admin/resources/${kind}?${new URLSearchParams(params)}`);
export const exportResource=kind=>{const a=document.createElement('a');a.href=`${API_BASE_URL}/api/admin/resources/${kind}/export`;a.download='';a.click()};
