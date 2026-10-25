'use client';
import {useEffect,useState} from 'react';
import {Network} from 'lucide-react';
export default function AuthGate({children}:{children:React.ReactNode}){
 const [authenticated,setAuthenticated]=useState(false),[loading,setLoading]=useState(true),[username,setUsername]=useState('admin'),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{fetch('/api/auth/me').then(r=>setAuthenticated(r.ok)).catch(()=>setError('Сервер недоступен')).finally(()=>setLoading(false));},[]);
 if(loading)return <div className="auth-screen">Загрузка…</div>;
 if(authenticated)return children;
 return <div className="auth-screen"><form className="auth-card" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});const d=await r.json() as any;if(!r.ok)throw Error(d.error);setPassword('');setAuthenticated(true);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}><Network size={30}/><h1>LAN Studio</h1><p>Войдите в рабочее пространство</p><label className="field">Логин<input autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} required/></label><label className="field">Пароль<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error&&<p className="form-error" role="alert">{error}</p>}<button className="primary" disabled={busy}>{busy?'Вход…':'Войти'}</button></form></div>;
}
