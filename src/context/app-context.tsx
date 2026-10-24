import { emptyStudy, normalizeStudy, type Study, type GpaBase, type Task } from '@/lib/study-state';
export type { GpaBase, Task } from '@/lib/study-state';
import NetInfo from '@react-native-community/netinfo';
import * as LocalAuthentication from 'expo-local-authentication';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palettes, type Scheme } from '@/lib/theme';
import { setHapticsEnabled } from '@/lib/haptics';
import { endpoints, requestPortal, PortalError, type Session } from '@/lib/portal';
import { loadPrivate, savePrivate, removePrivate } from '@/lib/vault';
import { getJSON, setJSON, deleteSecure, KEYS } from '@/lib/storage';
import type { Lang } from '@/lib/i18n';

export type { Session };
export type ThemePref = 'system'|'light'|'dark';
type Settings = { lang: Lang; theme: ThemePref; biometric: boolean; haptics: boolean };
export type CacheEntry = { data: unknown; at: string };
type FetchResult = { entry?: CacheEntry; error?: string; fromCache: boolean; expired?: boolean };
const defaults: Settings = { lang:'ar', theme:'system', biometric:false, haptics:false };
const SESSION = 'su:v2:session';
function useModel() {
  const system = useColorScheme();
  const [ready,setReady] = useState(false);
  const [settings,setSettings] = useState<Settings>(defaults);
  const [session,setSession] = useState<Session|null>(null);
  const [locked,setLocked] = useState(false);
  const [online,setOnline] = useState(true);
  const [banner,setBanner] = useState<'offline'|'back'|null>(null);
  const [cache,setCache] = useState<Record<string,CacheEntry>>({});
  const [study,setStudy] = useState<Study>(emptyStudy);
  const [refreshing,setRefreshing] = useState(false);
  const [storageError,setStorageError] = useState(false);
  const [authExpired,setAuthExpired] = useState(false);
  const epoch = useRef(0);
  const cacheRef = useRef(cache); cacheRef.current=cache;
  const sessRef = useRef(session); sessRef.current=session;
  const syncBusy = useRef(false);
  const offline = useRef(false);
  const connectionInitialized = useRef(false);
  const lockedRef = useRef(locked); lockedRef.current=locked;
  const authBusy = useRef(false);
  const [syncErrors,setSyncErrors] = useState(0);
  const persistence = useRef(Promise.resolve());
  const enqueue = (job:()=>Promise<void>) => {
    persistence.current = persistence.current.then(job).catch(()=>setStorageError(true));
    return persistence.current;
  };
  const lang = settings.lang;
  const isAr = lang === 'ar';
  const tr = useCallback((ar:string,en:string)=>lang==='ar'?ar:en,[lang]);
  const scheme: Scheme = settings.theme==='system' ? (system==='dark'?'dark':'light') : settings.theme;
  const updateSettings = useCallback((patch:Partial<Settings>)=>{
    setSettings(s=>{const next={...s,...patch}; void setJSON('su:v2:settings',next);setHapticsEnabled(next.haptics);return next;});
  },[]);
  useEffect(()=>{
    let alive=true;
    (async()=>{
      try {
        const saved=(await getJSON<Settings>('su:v2:settings',defaults))||defaults;
        const s={...defaults,...saved,lang:saved.lang==='en'?'en' as const:'ar' as const,
          theme:['system','light','dark'].includes(saved.theme)?saved.theme:'system' as const};
        const raw=await loadPrivate<Session|null>(SESSION,null);
        const sess=raw && typeof raw.token==='string' && typeof raw.studentId==='string' ? raw:null;
        const ca=sess?await loadPrivate<Record<string,CacheEntry>>(`su:v2:cache:${sess.studentId}`,{}):{};
        const st=await loadPrivate<Study>(`su:v2:study:${sess?.studentId??'local'}`,emptyStudy());
        // Remove legacy unscoped n8n credentials/cache. Don't import demo data as official results.
        await deleteSecure(KEYS.session);
        await AsyncStorage.multiRemove([KEYS.cache,KEYS.lastSync,KEYS.settings,KEYS.completed,KEYS.draft,KEYS.grades,KEYS.gpaBase]);
        if (!alive) return;
        setSettings(s);setHapticsEnabled(s.haptics);setSession(sess);setLocked(!!sess&&s.biometric);
        setCache(ca&&typeof ca==='object'?ca:{});
        setStudy(normalizeStudy(st));
      } catch { if(alive)setStorageError(true); }
      finally { if(alive)setReady(true); }
    })();
    return()=>{alive=false;};
  },[]);
  useEffect(()=>NetInfo.addEventListener(s=>{
    const on=Platform.OS==='web' ? (typeof navigator==='undefined'||navigator.onLine) : s.isConnected!==false&&s.isInternetReachable!==false;
    setOnline(on);
    if(!connectionInitialized.current){connectionInitialized.current=true;if(!on)setBanner('offline');return;}
    if(!on){offline.current=true;setBanner('offline');}
    else if(offline.current)setBanner('back');
  }),[]);
  useEffect(()=>{
    const sub=AppState.addEventListener('change',s=>{if(s!=='active'&&settings.biometric&&sessRef.current)setLocked(true);});
    return()=>sub.remove();
  },[settings.biometric]);
  useEffect(()=>{
    if(!ready)return;
    const key=`su:v2:study:${session?.studentId??'local'}`;
    void enqueue(()=>savePrivate(key,study));
  },[ready,study,session?.studentId]);
  const signIn = useCallback(async(s:Session)=>{
    const generation=++epoch.current;setAuthExpired(false);setSyncErrors(0);cacheRef.current={};setCache({});setRefreshing(false);syncBusy.current=false;
    // Load the new account before committing it, so data never crosses accounts.
    await persistence.current;
    const newStudy=await loadPrivate<Study>(`su:v2:study:${s.studentId}`,emptyStudy());
    const ca=await loadPrivate<Record<string,CacheEntry>>(`su:v2:cache:${s.studentId}`,{});
    if(generation!==epoch.current)return;
    await savePrivate(SESSION,s);
    if(generation!==epoch.current){await removePrivate(SESSION);return;}
    sessRef.current=s;setSession(s);setStudy(normalizeStudy(newStudy));cacheRef.current=ca;setCache(ca);setLocked(false);
  },[]);
  const signOut=useCallback(async()=>{
    const old=sessRef.current;
    epoch.current++;syncBusy.current=false;setRefreshing(false);setSyncErrors(0);cacheRef.current={};sessRef.current=null;setSession(null);setCache({});setStudy(emptyStudy());setLocked(false);setAuthExpired(false);
    await persistence.current;
    await removePrivate(SESSION);
    if(old) {
      await removePrivate(`su:v2:cache:${old.studentId}`);
      await removePrivate(`su:v2:study:${old.studentId}`);
    }
  },[]);
  const unlock=useCallback(async()=>{
    if(authBusy.current)return;
    authBusy.current=true;
    const generation=epoch.current;
    try {
      const r=await LocalAuthentication.authenticateAsync({promptMessage:tr('فتح SU Student','Unlock SU Student'),disableDeviceFallback:false});
      if(r.success&&generation===epoch.current)setLocked(false);
    } catch { /* Fail closed. Sign-out is the recovery path. */ }
    finally {authBusy.current=false;}
  },[tr]);
  const setBiometric=useCallback(async(on:boolean)=>{
    if(!on){updateSettings({biometric:false});setLocked(false);return null;}
    try {
      if(!await LocalAuthentication.hasHardwareAsync()||!await LocalAuthentication.isEnrolledAsync())
        return tr('فعّل بصمة أو رمز قفل للجهاز الأول','Set up biometrics on this device first');
      const r=await LocalAuthentication.authenticateAsync({promptMessage:tr('تأكيد الهوية','Verify identity')});
      if(!r.success)return tr('تم الإلغاء','Cancelled');
      updateSettings({biometric:true});return null;
    } catch {return tr('تعذر تشغيل البصمة','Biometrics unavailable');}
  },[tr,updateSettings]);
  const fetchService=useCallback(async(action:string,force=false):Promise<FetchResult>=>{
    if(lockedRef.current)return {fromCache:false,error:tr('افتح قفل التطبيق أولًا','Unlock the app first')};
    const cached=cacheRef.current[action];
    if(cached&&!force)return {entry:cached,fromCache:true};
    if(!online)return {entry:cached,fromCache:!!cached,error:tr('أوفلاين — آخر نسخة محفوظة','Offline — last saved copy')};
    const s=sessRef.current;
    if(!s)return {fromCache:false,error:tr('سجّل الدخول لعرض بيانات الجامعة','Sign in for university data')};
    const generation=epoch.current;
    try {
      const data=await requestPortal(action,s);
      if(generation!==epoch.current)return {fromCache:false};
      const entry={data,at:new Date().toISOString()};
      const next={...cacheRef.current,[action]:entry};cacheRef.current=next;setCache(next);
      await enqueue(()=>generation===epoch.current?savePrivate(`su:v2:cache:${s.studentId}`,next):Promise.resolve());
      return {entry,fromCache:false};
    } catch(e) {
      if(generation!==epoch.current)return {fromCache:false};
      if(e instanceof PortalError&&e.code==='expired')setAuthExpired(true);
      return {entry:cached,fromCache:!!cached,expired:e instanceof PortalError&&e.code==='expired',error:e instanceof PortalError&&e.code==='expired'
        ? tr('الجلسة انتهت — سجّل الدخول من جديد','Session expired — sign in again')
        : e instanceof PortalError&&e.code==='unsupported'
        ? tr('الخدمة دي متاحة في بوابة الجامعة؛ لسه مش مربوطة هنا','Use the university portal for this service; not yet integrated')
        : tr('تعذر التحديث. البيانات القديمة لم تتغير. جرّب لاحقًا.','Could not refresh. Existing data is unchanged. Try again later.')};
    }
  },[online,tr]);
  const refreshAll=useCallback(async()=>{
    if(syncBusy.current||!online||!sessRef.current||lockedRef.current)return false;
    syncBusy.current=true;setRefreshing(true);
    const generation=epoch.current;
    let failures=0;
    try {
      for(const action of Object.keys(endpoints)){
        if(generation!==epoch.current||lockedRef.current)break;
        const r=await fetchService(action,true);if(r.error)failures++;if(r.expired)break;
      }
      if(generation===epoch.current)setSyncErrors(failures);
      if(generation===epoch.current&&failures===0){setBanner(null);offline.current=false;}
      return failures===0;
    } finally {if(generation===epoch.current){syncBusy.current=false;setRefreshing(false);}}
  },[fetchService,online]);
  // Read-only initial sync once after a new official login (not on every rerender).
  useEffect(()=>{if(ready&&session&&!locked&&!Object.keys(cacheRef.current).length)void refreshAll();},[ready,session?.signedInAt,locked]);
  const times=Object.values(cache).map(x=>x?.at).filter(Boolean).sort();
  return {
    ready,settings,updateSettings,session,signIn,signOut,locked,unlock,setBiometric,
    lang,isAr,tr,row:(isAr?'row-reverse':'row') as 'row'|'row-reverse',align:(isAr?'right':'left') as 'right'|'left',
    scheme,palette:palettes[scheme],online,banner,dismissBanner:()=>{setBanner(null);offline.current=false;},
    cache,fetchService,refreshAll,refreshing,syncErrors,lastSync:times.at(-1)??null,authExpired,storageError,
    clearCache:async()=>{epoch.current++;syncBusy.current=false;setRefreshing(false);setCache({});cacheRef.current={};const s=sessRef.current;if(s)await enqueue(()=>removePrivate(`su:v2:cache:${s.studentId}`));},
    completed:new Set(study.completed),
    toggleCompleted:(code:string)=>setStudy(s=>({...s,completed:s.completed.includes(code)?s.completed.filter(c=>c!==code):[...s.completed,code],draft:s.draft.filter(c=>c!==code)})),
    draft:study.draft,
    toggleDraft:(code:string)=>setStudy(s=>({...s,draft:s.draft.includes(code)?s.draft.filter(c=>c!==code):[...s.draft,code]})),
    setDraft:(draft:string[])=>setStudy(s=>({...s,draft})),
    grades:study.grades,setGrade:(code:string,grade:string)=>setStudy(s=>({...s,grades:{...s.grades,[code]:grade}})),
    gpaBase:study.gpaBase,setGpaBase:(gpaBase:GpaBase)=>setStudy(s=>({...s,gpaBase})),
    tasks:study.tasks,
    addTask:(title:string)=>{if(title.trim())setStudy(s=>({...s,tasks:[...s.tasks.slice(-499),{id:`${Date.now()}-${Math.random().toString(36).slice(2)}`,title:title.trim().slice(0,180),done:false}]}));},
    toggleTask:(id:string)=>setStudy(s=>({...s,tasks:s.tasks.map(t=>t.id===id?{...t,done:!t.done}:t)})),
    deleteTask:(id:string)=>setStudy(s=>({...s,tasks:s.tasks.filter(t=>t.id!==id)})),
  };
}
const Ctx=createContext<ReturnType<typeof useModel>|null>(null);
export function AppProvider({children}:{children:ReactNode}){const value=useModel();return <Ctx.Provider value={value}>{children}</Ctx.Provider>;}
export function useApp(){const v=useContext(Ctx);if(!v)throw new Error('Missing AppProvider');return v;}