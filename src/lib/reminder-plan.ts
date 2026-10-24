import { localDate, validDate, validTime, type Slot } from './academic';
import type { Task } from './study-state';
import type { Focus } from './focus';
export type ReminderPrefs={enabled:boolean;tasks:boolean;classes:boolean;daily:boolean;absence:boolean};
export const defaultReminders:ReminderPrefs={enabled:false,tasks:true,classes:true,daily:true,absence:true};
export type PlannedReminder={id:string;at:number;title:string;body:string;route:'/study'|'/timetable'|'/service/SEC_WARNINGS';fingerprint:string};
export function reminderPlan(tasks:Task[],slots:Slot[],focus:Focus,prefs:ReminderPrefs,ar:boolean,now=Date.now()):PlannedReminder[]{
 if(!prefs.enabled)return [];
 const out:PlannedReminder[]=[];
 const add=(id:string,at:number,title:string,body:string,route:PlannedReminder['route'])=>{
  if(Number.isFinite(at)&&at>now+1000)out.push({id:'su13-'+id,at,title,body,route,fingerprint:JSON.stringify([at,title,body,route])});
 };
 // No student names, course names or grades on the lock screen.
 if(focus.endAt)add('focus',focus.endAt,ar?'انتهى وقت التركيز':'Focus time complete',ar?'افتح التطبيق لمتابعة خطتك.':'Open the app to continue your plan.','/study');
 if(prefs.tasks)for(const t of tasks){
  if(t.done||!t.date||!t.time||!validDate(t.date)||!validTime(t.time))continue;
  const d=new Date(`${t.date}T${t.time}:00`);if(d.getTime()>now+14*86400000)continue;
  add('task-'+t.id,d.getTime(),ar?'موعد جلسة مذاكرة':'Study session due',ar?'جلسة من خطتك تبدأ الآن.':'A planned study session starts now.','/study');
 }
 for(let offset=0;offset<7;offset++){
  const day=new Date(now);day.setDate(day.getDate()+offset);
  const list=slots.filter(s=>s.day===day.getDay());
  if(prefs.daily&&list.length){
   const d=new Date(day);d.setHours(7,0,0,0);
   add('day-'+localDate(d),d.getTime(),ar?'جدول اليوم':'Today’s timetable',ar?'راجع مواعيدك المحفوظة؛ قد تكون تغيرت.':'Check saved sessions; the university may have changed them.','/timetable');
  }
  if(prefs.classes)list.forEach((s,i)=>{
   // Do not guess ambiguous times or numeric weekday mappings.
   const time=s.start.trim().match(/^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
   if(!time)return;
   const d=new Date(day);d.setHours(Number(time[1]),Number(time[2]),0,0);
   add('class-'+localDate(d)+'-'+i,d.getTime()-600000,ar?'موعد جامعي بعد 10 دقائق':'Campus session in 10 minutes',ar?'افتح الجدول للتفاصيل. يعتمد على آخر مزامنة.':'Open the timetable. Based on the last sync.','/timetable');
  });
 }
 // Leave space below iOS pending-notification limit, prioritizing focus completion.
 const focusItem=out.find(x=>x.id==='su13-focus');
 const rest=out.filter(x=>x!==focusItem).sort((a,b)=>a.at-b.at);
 return [...(focusItem?[focusItem]:[]),...rest].slice(0,48);
}