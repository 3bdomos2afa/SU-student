import { syncResult } from '@/lib/sync-result';
import { notifyNow } from '@/lib/notifications';
import { diffAlerts, gradeActions } from '@/lib/change-alerts';
import { deliverAlerts } from '@/lib/alert-delivery';
import { setBackgroundSync } from '@/lib/background-sync';
import { freshFocus, type Focus } from '@/lib/focus';
import { defaultReminders, type ReminderPrefs } from '@/lib/reminder-plan';
import { reconcileReminders } from '@/lib/notifications';
import { emptyStudy, normalizeStudy, normalizeTask, type CourseNote, type Study, type GpaBase, type Task } from '@/lib/study-state';
export type { GpaBase, Task } from '@/lib/study-state';
import NetInfo from '@react-native-community/netinfo';
import * as LocalAuthentication from 'expo-local-authentication';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palettes, type Scheme } from '@/lib/theme';
import { setHapticsEnabled } from '@/lib/haptics';
import { endpoints, SYNC_ORDER, requestPortal, PortalError, type Session } from '@/lib/portal';
import { loadPrivate, savePrivate, removePrivate } from '@/lib/vault';
import { getJSON, setJSON, deleteSecure, KEYS } from '@/lib/storage';
import type { Lang } from '@/lib/i18n';

export type { Session };
export type ThemePref = 'system'|'light'|'dark';
type Settings = { lang: Lang; theme: ThemePref; biometric: boolean; haptics: boolean; alerts: boolean };
export type CacheEntry = { data: unknown; at: string };
type FetchResult = { entry?: CacheEntry; error?: string; fromCache: boolean; expired?: boolean };
const defaults: Settings = { lang:'ar', theme:'system', biometric:false, haptics:false, alerts:true };
const SESSION = 'su:v2:session';
function useModel() {
  const system = useColorScheme();
  const [ready,setReady] = useState(false);
  const [settings,setSettings] = useState<Settings>(defaults);
  const [session,setSession] = useState<Session|null>(null);
  const [locked,setLocked] = useState(false);
  const [online,setOnline] = useState(true);
  const [banner,setBanner] = useState<'offline'|'back'|'synced'|null>(null);
  const announceSync = useRef(false);
  const syncedFor = useRef('');
  useEffect(()=>{if(banner!=='synced')return;const t=setTimeout(()=>setBanner(b=>b==='synced'?null:b),5000);return ()=>clearTimeout(t);},[banner]);
  const [cache,setCache] = useState<Record<string,CacheEntry>>({});
  const [study,setStudy] = useState<Study>(emptyStudy);
  const [refreshing,setRefreshing] = useState(false);
  const [reminderError,setReminderError]=useState(false);
  const [storageError,setStorageError] = useState(false);
  const [authExpired,setAuthExpired] = useState(false);
  const settingsRef = useRef(settings); settingsRef.current=settings;
  const lastAuto = useRef(0);
  const wasOnline = useRef(true);
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
          theme:['system','light','dark'].includes(saved.theme)?saved.theme:'system' as const,alerts:saved.alerts!==false};
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
  useEffect(()=>{
    const update=(on:boolean)=>{
      setOnline(on);
      if(!connectionInitialized.current){connectionInitialized.current=true;offline.current=!on;if(!on)setBanner('offline');return;}
      if(!on){offline.current=true;setBanner('offline');}
      else if(offline.current)setBanner('back');
    };
    if(Platform.OS==='web'&&typeof window!=='undefined'){
      const online=()=>update(navigator.onLine);
      online();window.addEventListener('online',online);window.addEventListener('offline',online);
      return()=>{window.removeEventListener('online',online);window.removeEventListener('offline',online);};
    }
    return NetInfo.addEventListener(s=>{
      if(s.isConnected===null)return;
      update(s.isConnected!==false&&s.isInternetReachable!==false);
    });
  },[]);
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
    await reconcileReminders([]).catch(()=>{});
    const generation=++epoch.current;setAuthExpired(false);setSyncErrors(0);cacheRef.current={};setCache({});setRefreshing(false);syncBusy.current=false;
    // Load the new account before committing it, so data never crosses accounts.
    await persistence.current;
    const newStudy=await loadPrivate<Study>(`su:v2:study:${s.studentId}`,emptyStudy());
    const ca=await loadPrivate<Record<string,CacheEntry>>(`su:v2:cache:${s.studentId}`,{});
    if(generation!==epoch.current)return;
    await savePrivate(SESSION,s);
    if(generation!==epoch.current){await removePrivate(SESSION);return;}
    sessRef.current=s;setSession(s);setStudy(normalizeStudy(newStudy));cacheRef.current=ca;setCache(ca);setLocked(false);announceSync.current=true;
  },[]);
  const signOut=useCallback(async()=>{
    const old=sessRef.current;
    epoch.current++;syncBusy.current=false;setRefreshing(false);setSyncErrors(0);cacheRef.current={};sessRef.current=null;setSession(null);setCache({});setStudy(emptyStudy());setLocked(false);setAuthExpired(false);
    await persistence.current;
    await reconcileReminders([]).catch(()=>{});
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
      const r=await LocalAuthentication.authenticateAsync({promptMessage:tr('افتح SU Student','Unlock SU Student'),disableDeviceFallback:false});
      if(r.success&&generation===epoch.current)setLocked(false);
    } catch { /* Fail closed. Sign-out is the recovery path. */ }
    finally {authBusy.current=false;}
  },[tr]);
  const setBiometric=useCallback(async(on:boolean)=>{
    if(!on){updateSettings({biometric:false});setLocked(false);return null;}
    try {
      if(!await LocalAuthentication.hasHardwareAsync()||!await LocalAuthentication.isEnrolledAsync())
        return tr('فعّل البصمة أو قفل الموبايل الأول','Set up biometrics on this device first');
      const r=await LocalAuthentication.authenticateAsync({promptMessage:tr('تأكيد الهوية','Verify identity')});
      if(!r.success)return tr('اتلغى','Cancelled');
      updateSettings({biometric:true});return null;
    } catch {return tr('مقدرناش نشغّل البصمة','Biometrics unavailable');}
  },[tr,updateSettings]);
  const fetchService=useCallback(async(action:string,force=false,persist=true):Promise<FetchResult>=>{
    if(lockedRef.current)return {fromCache:false,error:tr('افتح قفل التطبيق الأول','Unlock the app first')};
    const cached=cacheRef.current[action];
    if(cached&&!force)return {entry:cached,fromCache:true};
    if(!online)return {entry:cached,fromCache:!!cached,error:tr('أوفلاين — آخر نسخة محفوظة','Offline — last saved copy')};
    const s=sessRef.current;
    if(!s)return {fromCache:false,error:tr('سجّل دخول عشان تشوف بيانات الجامعة','Sign in for university data')};
    const generation=epoch.current;
    try {
      const data=await requestPortal(action,s);
      if(generation!==epoch.current)return {fromCache:false};
      const entry={data,at:new Date().toISOString()};
      const next={...cacheRef.current,[action]:entry};cacheRef.current=next;setCache(next);
      if(persist)await enqueue(()=>generation===epoch.current?savePrivate(`su:v2:cache:${s.studentId}`,next):Promise.resolve());
      return {entry,fromCache:false};
    } catch(e) {
      if(generation!==epoch.current)return {fromCache:false};
      if(e instanceof PortalError&&e.code==='expired')setAuthExpired(true);
      return {entry:cached,fromCache:!!cached,expired:e instanceof PortalError&&e.code==='expired',error:e instanceof PortalError&&e.code==='expired'
        ? tr('الجلسة خلصت — سجّل دخولك تاني','Session expired — sign in again')
        : e instanceof PortalError&&e.code==='unsupported'
        ? tr('الخدمة دي موجودة في بوابة الجامعة، بس لسه مش مربوطة هنا','Use the university portal for this service; not yet integrated')
        : tr('التحديث مانفعش، وبياناتك القديمة زي ما هي. جرّب تاني بعدين.','Could not refresh. Existing data is unchanged. Try again later.')};
    }
  },[online,tr]);
  const refreshAll=useCallback(async()=>{
    if(syncBusy.current||!online||!sessRef.current||lockedRef.current)return false;
    syncBusy.current=true;setRefreshing(true);
    const generation=epoch.current;
    lastAuto.current=Date.now();const before=cacheRef.current;
    let failures=0,successes=0,requested=SYNC_ORDER.length;
    try {
      // Parallel pool (4 at a time); most important services first, so the home fills in quickly.
      const queue=[...SYNC_ORDER];let stop=false;
      const worker=async()=>{
        while(queue.length&&!stop){
          if(generation!==epoch.current||lockedRef.current){stop=true;break;}
          const action=queue.shift()!;
          const r=await fetchService(action,true,false);if(r.error){failures++;}else successes++;if(r.expired)stop=true;
        }
      };
      await Promise.all(Array.from({length:4},worker));
      // Then marks for the student's own courses (midterm, coursework, final).
      if(!stop&&generation===epoch.current){const grades=gradeActions(cacheRef.current);requested+=grades.length;queue.push(...grades);await Promise.all(Array.from({length:3},worker));}
      const owner=sessRef.current;
      if(owner&&generation===epoch.current)await enqueue(()=>generation===epoch.current?savePrivate(`su:v2:cache:${owner.studentId}`,cacheRef.current):Promise.resolve());
      if(owner&&generation===epoch.current&&settingsRef.current.alerts!==false){const ar=settingsRef.current.lang!=='en';void deliverAlerts(owner.studentId,diffAlerts(before,cacheRef.current,ar),ar).catch(()=>0);}
      const report=syncResult(requested,successes,failures);
      if(generation===epoch.current)setSyncErrors(report.errors);
      if(generation===epoch.current&&successes>0){
        offline.current=false;setBanner('synced');
        if(announceSync.current){announceSync.current=false;
          void notifyNow(report.complete?tr('خلص التحديث ✅','Update finished ✅'):tr('التحديث لسه ناقص','Update incomplete'),report.errors
            ?tr(`بياناتك اتحدثت. ${report.errors} خدمة مقدرتش تتحدث، محتاجة إعادة محاولة.`,`Your data is updated. ${report.errors} service(s) need another attempt.`)
            :tr('الخدمات المتصلة اتحدثت. راجع وقت التحديث لكل قسم.','Connected services refreshed. Check each section’s update time.'));}
      }
      return report.complete;
    } finally {if(generation===epoch.current){syncBusy.current=false;setRefreshing(false);}}
  },[fetchService,online,tr]);
  // Read-only initial sync once after a new official login (not on every rerender).
  // Sync after every sign-in and on each app launch (cached data shows instantly meanwhile).
  useEffect(()=>{if(ready&&session&&!locked&&online&&syncedFor.current!==session.signedInAt){syncedFor.current=session.signedInAt;void refreshAll();}},[ready,session?.signedInAt,locked,online]);
  const refreshRef=useRef(refreshAll);refreshRef.current=refreshAll;
  // Automatic sync: when the internet comes back, when the app returns to the foreground, and after unlocking.
  const autoSync=useCallback((minGap=120000)=>{if(Date.now()-lastAuto.current<minGap||!sessRef.current||lockedRef.current)return;void refreshRef.current();},[]);
  useEffect(()=>{const back=online&&!wasOnline.current;wasOnline.current=online;if(back&&ready)autoSync(0);},[online,ready,autoSync]);
  useEffect(()=>{const sub=AppState.addEventListener('change',s=>{if(s==='active')setTimeout(()=>autoSync(),600);});return()=>sub.remove();},[autoSync]);
  useEffect(()=>{if(ready&&!locked)autoSync();},[locked,ready,autoSync]);
  useEffect(()=>{if(ready)void setBackgroundSync(!!session&&settings.alerts!==false);},[ready,session?.studentId,settings.alerts]);
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
    courseNotes:study.courseNotes??{},
    setCourseNote:(code:string,note:CourseNote)=>setStudy(s=>({...s,courseNotes:{...s.courseNotes,[code]:{...s.courseNotes?.[code],...note}}})),
    focus:study.focus??freshFocus(),
    setFocus:(focus:Focus)=>{setStudy(s=>({...s,focus}));},
    reminders:study.reminders??defaultReminders,
    setReminders:(patch:Partial<ReminderPrefs>)=>setStudy(s=>({...s,reminders:{...defaultReminders,...s.reminders,...patch}})),
    reminderError,setReminderError,
    absenceNotifiedAt:study.absenceNotifiedAt,
    markAbsenceNotified:(at:string)=>setStudy(s=>({...s,absenceNotifiedAt:at})),
    tasks:study.tasks,
    updateTask:(id:string,patch:Partial<Task>)=>setStudy(s=>({...s,tasks:s.tasks.map(t=>t.id===id?normalizeTask({...t,...patch,id}):t)})),
    addTask:(title:string,details:Partial<Task>={})=>{if(title.trim())setStudy(s=>({...s,tasks:[...s.tasks.slice(-499),normalizeTask({...details,id:`${Date.now()}-${Math.random().toString(36).slice(2)}`,title:title.trim(),done:false})]}));},
    toggleTask:(id:string)=>setStudy(s=>({...s,tasks:s.tasks.map(t=>t.id===id?{...t,done:!t.done}:t)})),
    deleteTask:(id:string)=>setStudy(s=>({...s,tasks:s.tasks.filter(t=>t.id!==id)})),
  };
}
const Ctx=createContext<ReturnType<typeof useModel>|null>(null);
export function AppProvider({children}:{children:ReactNode}){const value=useModel();return <Ctx.Provider value={value}>{children}</Ctx.Provider>;}
export function useApp(){const v=useContext(Ctx);if(!v)throw new Error('Missing AppProvider');return v;}