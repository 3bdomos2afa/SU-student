import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '@/context/app-context';
import { academic, courseRows } from '@/lib/academic';
import { reminderPlan, type PlannedReminder } from '@/lib/reminder-plan';
import { reconcileReminders, listenReminderNavigation } from '@/lib/notifications';
import { syncFocusLive } from '@/lib/focus-live';
import { computeStreak, eveningReminder } from '@/lib/streak';
export function ReminderController(){
 const a=useApp();const [revision,setRevision]=useState(0);
 const owner=a.session?.studentId??'local';
 const currentOwner=useRef(owner);currentOwner.current=owner;
 const pending=useRef<{owner:string;notice:PlannedReminder}|null>(null);
 useEffect(()=>{const sub=AppState.addEventListener('change',s=>{if(s==='active')setRevision(n=>n+1);});return()=>sub.remove();},[]);
 const fingerprint=JSON.stringify([a.tasks,a.focus,a.reminders,a.streak,a.cache.SEC_TIMETABLE?.at,a.cache.SEC_WARNINGS?.at,a.lang,owner]);
 useEffect(()=>{
  if(!a.ready)return;
  const plan=reminderPlan(a.tasks,academic(a.cache).slots,a.focus,a.reminders,a.isAr);
  if(a.reminders.enabled){const st=computeStreak(a.streak,a.focus);const ev=eveningReminder(a.streak,st.met,st.current,a.isAr);
   if(ev&&ev.at>Date.now()+1000)plan.push({id:'su13-'+ev.id,at:ev.at,title:ev.title,body:ev.body,route:ev.route,fingerprint:JSON.stringify([ev.at,ev.title,ev.body])});}
  const warning=a.cache.SEC_WARNINGS;
  const absenceEnabled=a.reminders.enabled&&a.reminders.absence;
  if(pending.current?.owner!==owner||!absenceEnabled)pending.current=null;
  // Hold a just-scheduled notice across edits/reconciliation until it is due.
  if(a.settings.alerts===false&&absenceEnabled&&warning&&a.absenceNotifiedAt!==warning.at&&courseRows(a.cache,'SEC_WARNINGS').length>0
     &&pending.current?.notice.fingerprint!==warning.at){
   pending.current={owner,notice:{id:'su13-absence',at:Date.now()+5000,
    title:a.tr('راجع تنبيهات الغياب','Review absence notices'),
    body:a.tr('فيه تحديث جديد من الجامعة. افتح التطبيق وشوف التفاصيل.','A university update arrived. Open the app to review.'),
    route:'/service/SEC_WARNINGS',fingerprint:warning.at}};
  }
  const notice=pending.current?.notice;
  if(notice&&notice.at>Date.now()+1000)plan.push(notice);
  const timer=setTimeout(()=>{void reconcileReminders(plan).then(applied=>{
   if(!applied||currentOwner.current!==owner)return;
   a.setReminderError(false);
   if(warning&&plan.some(p=>p.id==='su13-absence'))a.markAbsenceNotified(warning.at);
  }).catch(()=>{if(currentOwner.current===owner)a.setReminderError(true);});},100);
  return()=>clearTimeout(timer);
 },[fingerprint,a.ready,revision]);
 useEffect(()=>{
  if(!a.ready)return;
  let alive=true;let clean=()=>{};
  void listenReminderNavigation(route=>{if(alive)router.push(route as never);}).then(fn=>{if(alive)clean=fn;else fn();}).catch(()=>{});
  return()=>{alive=false;clean();};
 },[a.ready]);
 // Ongoing countdown notification while the focus timer runs.
 useEffect(()=>{if(!a.ready)return;void syncFocusLive(a.focus,a.isAr,a.reminders.details===true).catch(()=>{});},[a.ready,a.focus.endAt,a.focus.title,a.isAr,a.reminders.details,revision]);
 return null;
}