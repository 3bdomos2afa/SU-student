import { localDate, validDate, validTime, type Slot } from './academic';
import type { Task } from './study-state';
import type { Focus } from './focus';
export type ReminderPrefs={enabled:boolean;tasks:boolean;classes:boolean;daily:boolean;absence:boolean;details:boolean};
export const defaultReminders:ReminderPrefs={enabled:false,tasks:true,classes:true,daily:true,absence:true,details:false};
/** loud = task/focus alerts on the high-priority channel with the app's chime. */
export type PlannedReminder={id:string;at:number;title:string;body:string;route:'/study'|'/timetable'|'/service/SEC_WARNINGS';fingerprint:string;loud?:boolean};
/** Minutes before a task to remind; -1 = no reminder, 0 = only at start. Default 5. */
export const taskRemind=(t:Task)=>typeof t.remind==='number'?t.remind:5;
export function reminderPlan(tasks:Task[],slots:Slot[],focus:Focus,prefs:ReminderPrefs,ar:boolean,now=Date.now()):PlannedReminder[]{
 if(!prefs.enabled)return [];
 const out:PlannedReminder[]=[];
 const add=(id:string,at:number,title:string,body:string,route:PlannedReminder['route'],loud=false)=>{
  if(Number.isFinite(at)&&at>now+1000)out.push({id:'su13-'+id,at,title,body,route,loud,fingerprint:JSON.stringify([at,title,body,route,loud])});
 };
 // No student names, course names or grades on the lock screen; task titles only when the student opts in.
 if(focus.endAt)add('focus',focus.endAt,ar?'🎉 خلصت جلسة التركيز':'🎉 Focus session complete',ar?'برافو! خد بريك صغير وكمّل خطتك.':'Nice work! Take a short break, then continue your plan.','/study',true);
 if(prefs.tasks)for(const t of tasks){
  if(t.done||!t.date||!t.time||!validDate(t.date)||!validTime(t.time))continue;
  const d=new Date(`${t.date}T${t.time}:00`);if(d.getTime()>now+14*86400000)continue;
  const before=taskRemind(t);if(before<0)continue;
  const name=prefs.details?t.title:'';
  const span=t.duration?(ar?` · ${t.duration} دقيقة`:` · ${t.duration} min`):'';
  if(before>0)add('task-'+t.id+'-pre',d.getTime()-before*60000,
   ar?`⏰ ${name||'جلسة مذاكرة'} بعد ${before} دقايق`:`⏰ ${name||'Study session'} in ${before} min`,
   ar?`تبدأ الساعة ${t.time}${span}. جهّز نفسك.`:`Starts at ${t.time}${span}. Get ready.`,'/study',true);
  add('task-'+t.id,d.getTime(),ar?`▶️ ${name||'جلسة المذاكرة'} بدأت`:`▶️ ${name||'Study session'} starts now`,
   ar?'افتح الأبلكيشن وابدأ التايمر.':'Open the app and start the timer.','/study',true);
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