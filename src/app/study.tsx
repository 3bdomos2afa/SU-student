import { FocusCard } from '@/components/focus-card';
import { ReminderSettings } from '@/components/reminder-settings';
import { curriculumCourses } from '@/data/curriculum';
import { freshFocus, startFocus } from '@/lib/focus';
import { requestReminders } from '@/lib/notifications';
import { useEffect, useRef, useState } from 'react';
import { Dropdown, Toast } from '@/components/dropdown';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Chip, Field, Glass, Header, IconBadge, PressScale, ProgressBar, Screen, SectionTitle, Txt } from '@/components/ui';
import { useApp, type Task } from '@/context/app-context';
import { localDate, validDate, validTime } from '@/lib/academic';

const HOURS=Array.from({length:24},(_,h)=>h);
const MINUTES=Array.from({length:12},(_,i)=>i*5);
const DURATIONS=[15,25,30,45,60,75,90,120,150,180,240];
const REMINDS=[0,5,10,15,30,45,60,120,-1];
const pad=(n:number)=>String(n).padStart(2,'0');
const startOf=(t:Task)=>t.date&&t.time?new Date(`${t.date}T${t.time}:00`).getTime():NaN;

export default function Study(){
 const a=useApp();const {tr,palette,row,tasks,addTask,toggleTask,deleteTask,updateTask,lang,reminders,setReminders}=a;
 const [text,setText]=useState(''),[date,setDate]=useState(localDate()),[time,setTime]=useState('18:00'),[duration,setDuration]=useState('45'),[course,setCourse]=useState(''),[notes,setNotes]=useState(''),[editing,setEditing]=useState('');
 const [courseSearch,setCourseSearch]=useState(''),[remind,setRemind]=useState(5);
 const [error,setError]=useState(''),[filter,setFilter]=useState<'day'|'all'|'done'>('day'),[offset,setOffset]=useState(0);
 const [now,setNow]=useState(Date.now());
 const [toast,setToast]=useState('');
 const saving=useRef(false);
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(t);},[]);
 const locale=lang==='ar'?'ar-EG':'en-GB';
 const day=new Date();day.setDate(day.getDate()+offset);const selected=localDate(day);
 const weekShift=Math.floor(offset/7);
 const week=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()+weekShift*7+i);return {offset:weekShift*7+i,key:localDate(d),d};});
 const todayKey=localDate();
 const openOn=(k:string)=>tasks.filter(t=>t.date===k&&!t.done).length;
 const span=(ms:number)=>{const m=Math.max(1,Math.round(ms/60000));if(m<60)return tr(`${m} دقيقة`,`${m} min`);const h=Math.floor(m/60),r=m%60;if(h<24)return r?tr(`${h} ساعة و${r} دقيقة`,`${h}h ${r}m`):tr(`${h} ساعة`,`${h}h`);const d=Math.round(h/24);return tr(`${d} يوم`,`${d} days`);};
 const remindLabel=(n:number)=>n<0?tr('من غير تذكير','No reminder'):n===0?tr('وقت ما تبدأ بالظبط','Right at the start'):n>=60?tr(n===60?'قبلها بساعة':`قبلها بساعتين`,n===60?'1 hour before':'2 hours before'):tr(`قبلها بـ ${n} دقيقة`,`${n} min before`);
 const hourLabel=(h:number)=>lang==='ar'?`${h%12||12} ${h<12?'الصبح':h<17?'الضهر':'بالليل'}`:`${h%12||12} ${h<12?'AM':'PM'}`;
 const durLabel=(m:number)=>m<60?tr(`${m} دقيقة`,`${m} min`):m%60?tr(`${Math.floor(m/60)} ساعة و${m%60} دقيقة`,`${Math.floor(m/60)}h ${m%60}m`):tr(m===60?'ساعة':m===120?'ساعتين':`${m/60} ساعات`,`${m/60}h`);
 const hour=Number(time.slice(0,2))||0,minute=Number(time.slice(3,5))||0;
 const dayOptions=Array.from({length:30},(_,i)=>{const d=new Date();d.setDate(d.getDate()+i);const k=localDate(d);return {value:k,label:i===0?tr('النهارده','Today'):i===1?tr('بكرة','Tomorrow'):d.toLocaleDateString(locale,{weekday:'long',day:'numeric',month:'long'}),hint:i<2?d.toLocaleDateString(locale,{weekday:'long',day:'numeric',month:'long'}):undefined};});
 if(validDate(date)&&!dayOptions.some(o=>o.value===date))dayOptions.unshift({value:date,label:new Date(`${date}T12:00:00`).toLocaleDateString(locale,{weekday:'long',day:'numeric',month:'long'}),hint:undefined});
 const durationOptions=(DURATIONS.includes(Number(duration))?DURATIONS:[...DURATIONS,Number(duration)].sort((x,y)=>x-y)).map(v=>({value:v,label:durLabel(v)}));
 const remindOptions=(REMINDS.includes(remind)?REMINDS:[remind,...REMINDS]).map(v=>({value:v,label:remindLabel(v)}));
 const courseTitle=(code?:string)=>code?curriculumCourses.find(c=>c.code===code)?.title??code:'';
 const upcoming=tasks.filter(t=>!t.done&&Number.isFinite(startOf(t))&&startOf(t)+(t.duration||25)*60000>now).sort((x,y)=>startOf(x)-startOf(y))[0];
 function clearForm(){setText('');setNotes('');setEditing('');setError('');setCourse('');setCourseSearch('');setRemind(5);setDuration('45');}
 function save(){
  // One tap = one task: ignore repeated taps while the first save is being applied.
  if(saving.current)return;
  if(!text.trim()){setError(tr('اكتب هتذاكر إيه الأول.','Write what you will study first.'));return;}
  if(!validDate(date)||!validTime(time)||!Number.isInteger(Number(duration))||Number(duration)<1||Number(duration)>480){
   setError(tr('راجع اليوم والساعة والمدة.','Check the day, time and duration.'));return;
  }
  saving.current=true;
  const details={title:text.trim(),date,time,duration:Number(duration),course:courseSearch.trim()?(course||courseSearch.trim()):'',notes,remind};
  const wasEditing=!!editing;
  if(editing)updateTask(editing,details);else addTask(text,details);
  clearForm();
  setOffset(Math.round((new Date(`${date}T12:00:00`).getTime()-new Date(`${localDate()}T12:00:00`).getTime())/86400000));
  setFilter('day');
  setToast(wasEditing?tr('اتحفظ التعديل ✓','Changes saved ✓'):tr('تمت الإضافة ✓','Added ✓'));
  setTimeout(()=>{saving.current=false;},600);
 }
 function edit(t:Task){setEditing(t.id);setText(t.title);setDate(t.date||selected);setTime(t.time||'18:00');setDuration(String(t.duration||45));setCourse(t.course||'');setCourseSearch(curriculumCourses.find(c=>c.code===t.course)?.title??t.course??'');setNotes(t.notes||'');setRemind(typeof t.remind==='number'?t.remind:5);}
 async function enableReminders(){if(await requestReminders())setReminders({enabled:true});else setError(tr('اسمح بالإشعارات من إعدادات الموبايل الأول.','Allow notifications in device settings first.'));}
 const list=tasks.filter(t=>filter==='all'||filter==='done'?filter==='all'||t.done:(!t.date||t.date===selected)).sort((a,b)=>(`${a.date??''} ${a.time??''}`).localeCompare(`${b.date??''} ${b.time??''}`));
 const conflicts=(text.trim()||editing)?tasks.filter(t=>!t.done&&t.id!==editing&&t.date===date&&t.time&&validTime(time)&&validTime(t.time)).filter(t=>{const start=Number(time.slice(0,2))*60+Number(time.slice(3));const other=Number(t.time!.slice(0,2))*60+Number(t.time!.slice(3));return start<other+(t.duration||25)&&other<start+Number(duration);}):[];
 const complete=list.filter(t=>t.done).length;
 const totalMinutes=list.reduce((n,t)=>n+(t.duration??0),0),doneMinutes=list.filter(t=>t.done).reduce((n,t)=>n+(t.duration??0),0);
 return <Screen padBottom={false}>
  <Button small variant="glass" title={tr('رجوع','Back')} onPress={()=>router.canGoBack()?router.back():router.replace('/(tabs)')}/>
  <Header title={tr('جدول المذاكرة','Study planner')} subtitle={tr('خطّط يومك، ركّز، وعلّم على اللي خلص.','Plan your day, focus, tick it off.')}/>
  <Toast message={toast} onHide={()=>setToast('')}/>

  {upcoming?<Glass><View style={{gap:12}}>
   <View style={{flexDirection:row,alignItems:'center',gap:12}}>
    <IconBadge icon="alarm-outline" color={palette.primary} size={46}/>
    <View style={{flex:1,gap:2}}>
     <Txt variant="label" color={palette.primary}>{startOf(upcoming)<=now?tr('شغّالة دلوقتي','Happening now'):tr(`المهمة الجاية بعد ${span(startOf(upcoming)-now)}`,`Next task in ${span(startOf(upcoming)-now)}`)}</Txt>
     <Txt variant="h3" numberOfLines={2}>{upcoming.title}</Txt>
     <Txt variant="caption">{[new Date(startOf(upcoming)).toLocaleDateString(locale,{weekday:'long',day:'numeric',month:'short'}),upcoming.time,upcoming.duration?`${upcoming.duration} ${tr('دقيقة','min')}`:''].filter(Boolean).join(' · ')}</Txt>
    </View>
   </View>
   <Button small icon="play" title={tr('ابدأ التركيز عليها','Start focusing')} onPress={()=>a.setFocus(startFocus(freshFocus(upcoming.duration||25,upcoming.title,upcoming.id)))}/>
  </View></Glass>:null}

  {!reminders.enabled?<Glass><View style={{gap:10}}>
   <Txt variant="h3">{tr('التذكيرات مقفولة','🔔 Reminders are off')}</Txt>
   <Txt variant="caption">{tr('شغّلها عشان يجيلك إشعار بصوت قبل كل مهمة بـ5 دقايق ووقت ما تبدأ.','Turn them on for a sound alert 5 minutes before each task and when it starts.')}</Txt>
   <Button small icon="notifications" title={tr('شغّل التذكيرات','Turn on reminders')} onPress={()=>{void enableReminders();}}/>
  </View></Glass>:null}

  <Glass><View style={{gap:14}}>
   <View style={{flexDirection:row,justifyContent:'space-between'}}><Txt variant="h2">{complete} / {list.length}</Txt><Txt variant="label">{doneMinutes} / {totalMinutes} {tr('دقيقة متخططة','planned min')}</Txt></View>
   <ProgressBar value={list.length?complete/list.length:0}/>
   <View style={{flexDirection:row,gap:6}}><Chip active={filter==='day'} label={tr('يومي','Daily')} onPress={()=>setFilter('day')}/><Chip active={filter==='all'} label={tr('الكل','All')} onPress={()=>setFilter('all')}/><Chip active={filter==='done'} label={tr('تم','Done')} onPress={()=>setFilter('done')}/></View>
   {filter==='day'?<View style={{gap:10}}>
    <View style={{flexDirection:row,justifyContent:'space-between',alignItems:'center'}}>
     <Button small variant="glass" title={a.isAr?'›':'‹'} onPress={()=>setOffset(n=>n-7)}/>
     <Button small variant="glass" title={tr('النهارده','Today')} onPress={()=>setOffset(0)}/>
     <Button small variant="glass" title={a.isAr?'‹':'›'} onPress={()=>setOffset(n=>n+7)}/>
    </View>
    <View style={{flexDirection:row,gap:4}}>{week.map(w=>{const active=w.key===selected,count=openOn(w.key),isToday=w.key===todayKey;
     return <PressScale key={w.key} style={{flex:1}} label={w.key} onPress={()=>setOffset(w.offset)}>
      <View style={{alignItems:'center',paddingVertical:8,borderRadius:14,gap:2,backgroundColor:active?palette.primary:'transparent',borderWidth:isToday&&!active?1:0,borderColor:palette.primary}}>
       <Txt variant="caption" color={active?'#FFFFFF':undefined} numberOfLines={1}>{w.d.toLocaleDateString(locale,{weekday:'short'})}</Txt>
       <Txt variant="label" color={active?'#FFFFFF':undefined}>{String(w.d.getDate())}</Txt>
       <View style={{width:6,height:6,borderRadius:3,backgroundColor:count?(active?'#FFFFFF':palette.primary):'transparent'}}/>
      </View>
     </PressScale>;})}</View>
   </View>:null}
  </View></Glass>

  {!list.length?<Glass><Txt variant="sub">{tr('مفيش مهام هنا لسه. ضيف جلسة من الخانات اللي تحت.','No tasks here. Add a session below.')}</Txt></Glass>:list.map(t=>{
   const s=startOf(t),late=!t.done&&Number.isFinite(s)&&s+(t.duration||25)*60000<now,live=!t.done&&Number.isFinite(s)&&s<=now&&!late;
   return <Glass key={t.id}><View style={{gap:12}}>
    <PressScale onPress={()=>toggleTask(t.id)} label={tr('غيّر حالة المهمة','Toggle task')}><View style={{flexDirection:row,gap:12,alignItems:'center'}}>
     <IconBadge icon={t.done?'checkmark-circle':'ellipse-outline'} color={t.done?palette.success:late?palette.danger:palette.primary} size={34}/>
     <View style={{flex:1,gap:2}}>
      <Txt variant="h3" style={{textDecorationLine:t.done?'line-through':'none'}}>{t.title}</Txt>
      <Txt variant="caption">{[filter!=='day'&&t.date?new Date(`${t.date}T12:00:00`).toLocaleDateString(locale,{weekday:'short',day:'numeric',month:'short'}):'',t.time,t.duration?`${t.duration} ${tr('دقيقة','min')}`:'',courseTitle(t.course)].filter(Boolean).join(' · ')}</Txt>
     </View>
     {late?<Txt variant="caption" color={palette.danger}>{tr('فاتت','Missed')}</Txt>:live?<Txt variant="caption" color={palette.success}>{tr('دلوقتي','Now')}</Txt>:null}
    </View></PressScale>
    {!t.done&&t.time?<Txt variant="caption">{`🔔 ${remindLabel(typeof t.remind==='number'?t.remind:5)}`}</Txt>:null}
    {t.notes?<Txt variant="sub">{t.notes}</Txt>:null}
    <View style={{flexDirection:row,gap:8,flexWrap:'wrap'}}>
     <Button small title={tr('ركّز عليها','Focus on this')} icon="play" onPress={()=>{a.setFocus(startFocus(freshFocus(t.duration||25,t.title,t.id)));}}/>
     <Button small variant="glass" title={tr('عدّل','Edit')} onPress={()=>edit(t)}/>
     <Button small variant="glass" title={tr('للنهارده','Move to today')} onPress={()=>updateTask(t.id,{date:localDate()})}/>
     <Button small variant="danger" title={tr('امسح','Delete')} onPress={()=>deleteTask(t.id)}/>
    </View>
   </View></Glass>;})}

  <SectionTitle title={editing?tr('عدّل الجلسة','Edit session'):tr('خطّط لجلسة جديدة','Plan a study session')}/>
  <Glass><View style={{gap:12}}>
   <Field icon="create-outline" placeholder={tr('هتذاكر إيه؟ مثلًا: مراجعة شابتر 3','What will you study?')} value={text} onChangeText={v=>{setText(v);setError('');}} maxLength={180}/>
   <Dropdown icon="calendar-outline" label={tr('اليوم','Day')} title={tr('اختار اليوم','Pick a day')} value={date} options={dayOptions} onChange={setDate}/>
   <View style={{flexDirection:row,gap:10}}>
    <Dropdown icon="time-outline" label={tr('الساعة','Hour')} title={tr('اختار الساعة','Pick the hour')} value={hour} options={HOURS.map(h=>({value:h,label:hourLabel(h),hint:`${pad(h)}:00`}))} onChange={h=>setTime(`${pad(h)}:${pad(minute)}`)}/>
    <Dropdown label={tr('الدقيقة','Minute')} title={tr('اختار الدقيقة','Pick the minute')} value={MINUTES.includes(minute)?minute:minute} options={(MINUTES.includes(minute)?MINUTES:[...MINUTES,minute].sort((x,y)=>x-y)).map(m=>({value:m,label:pad(m)}))} onChange={m=>setTime(`${pad(hour)}:${pad(m)}`)}/>
   </View>
   <View style={{flexDirection:row,gap:10}}>
    <Dropdown icon="hourglass-outline" label={tr('المدة','Duration')} title={tr('هتذاكر قد إيه؟','How long?')} value={Number(duration)} options={durationOptions} onChange={v=>setDuration(String(v))}/>
    <Dropdown icon="notifications-outline" label={tr('الإشعار','Reminder')} title={tr('الإشعار يجيلك إمتى؟','When should we remind you?')} value={remind} options={remindOptions} onChange={setRemind}/>
   </View>
   <Txt variant="caption">{tr(`الجلسة: ${new Date(`${date}T12:00:00`).toLocaleDateString(locale,{weekday:'long',day:'numeric',month:'long'})} · ${hourLabel(hour).replace(/^\d+/,String(hour%12||12)+':'+pad(minute))} · ${durLabel(Number(duration)||0)}`,`Session: ${date} · ${time} · ${durLabel(Number(duration)||0)}`)}</Txt>
   <Field placeholder={tr('دوّر باسم المادة (اختياري)','Search course name (optional)')} value={courseSearch} onChangeText={v=>{setCourseSearch(v);setCourse('');}} maxLength={100}/>
   {!!courseSearch&&!course&&curriculumCourses.filter(c=>`${c.title} ${c.code}`.toLowerCase().includes(courseSearch.toLowerCase())).slice(0,5).map(c=><Button key={c.code} small variant="glass" title={c.title} onPress={()=>{setCourse(c.code);setCourseSearch(c.title);}}/>)}
   <Field placeholder={tr('ملاحظات وخطوات','Notes & steps')} value={notes} onChangeText={setNotes} multiline maxLength={1000}/>
   {conflicts.length>0&&<Txt color={palette.warn}>{tr('⚠️ الميعاد ده داخل في: ','⚠️ Overlaps with: ')}{conflicts.map(t=>t.title).slice(0,3).join(' · ')}</Txt>}
   {error?<Txt color={palette.danger}>{error}</Txt>:null}
   <Button title={editing?tr('احفظ التعديل','Save changes'):tr('ضيف للجدول','Add to planner')} icon={editing?'checkmark':'add'} onPress={save}/>
   {editing?<Button variant="glass" title={tr('الغي التعديل','Cancel edit')} onPress={clearForm}/>:null}
  </View></Glass>
  <SectionTitle title={tr('وقت تركيزك','Your focus time')}/>
  <FocusCard/>
  <Txt variant="caption">{tr('وإنت شغّال، هيفضل إشعار ثابت بالعدّ التنازلي لحد ما الجلسة تخلص.','While it runs, an ongoing notification shows the countdown until the session ends.')}</Txt>
  <ReminderSettings/>
 </Screen>;
}