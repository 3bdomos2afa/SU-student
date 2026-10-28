import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '@/context/app-context';
import { academic } from '@/lib/academic';
import { reminderPlan } from '@/lib/reminder-plan';
import { prepareNotifications, reconcileReminders, listenReminderNavigation } from '@/lib/notifications';
import { syncFocusLive } from '@/lib/focus-live';
import { computeStreak } from '@/lib/streak';
import { isFemale } from '@/lib/notify-text';
export function ReminderController(){
 const a=useApp();const [revision,setRevision]=useState(0);
 const owner=a.session?.studentId??'local';
 const currentOwner=useRef(owner);currentOwner.current=owner;
 useEffect(()=>{const sub=AppState.addEventListener('change',s=>{if(s==='active')setRevision(n=>n+1);});return()=>sub.remove();},[]);
 // Reminders are on by default: ask for the notification permission once the app has started.
 const asked=useRef(false);
 useEffect(()=>{if(!a.ready||asked.current||!a.reminders.enabled)return;asked.current=true;
  void prepareNotifications().then(()=>setRevision(n=>n+1)).catch(()=>{});},[a.ready,a.reminders.enabled]);
 const female=isFemale(a.reminders.gender,a.cache);
 const st=computeStreak(a.streak,a.focus);
 const todayMin=Math.floor(st.today);
 const fingerprint=JSON.stringify([a.tasks,a.focus,a.reminders,a.streak,a.cache.SEC_TIMETABLE?.at,a.lang,owner,female,todayMin]);
 useEffect(()=>{
  if(!a.ready)return;
  const plan=reminderPlan(a.tasks,academic(a.cache).slots,a.focus,a.reminders,a.isAr,Date.now(),{female,todayMin,target:a.streak.target,streakOn:a.streak.remind});
  const timer=setTimeout(()=>{void reconcileReminders(plan).then(applied=>{
   if(applied&&currentOwner.current===owner)a.setReminderError(false);
  }).catch(()=>{if(currentOwner.current===owner)a.setReminderError(true);});},300);
  return()=>clearTimeout(timer);
 },[fingerprint,a.ready,revision]);
 useEffect(()=>{
  if(!a.ready)return;
  let alive=true;let clean=()=>{};
  void listenReminderNavigation(route=>{if(alive)router.push(route as never);}).then(fn=>{if(alive)clean=fn;else fn();}).catch(()=>{});
  return()=>{alive=false;clean();};
 },[a.ready]);
 // Ongoing countdown notification while the focus timer runs.
 useEffect(()=>{if(!a.ready)return;void syncFocusLive(a.focus,a.isAr,true).catch(()=>{});},[a.ready,a.focus.endAt,a.focus.title,a.isAr,revision]);
 return null;
}