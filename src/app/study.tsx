import { FocusCard } from '@/components/focus-card';
import { ReminderSettings } from '@/components/reminder-settings';
import { curriculumCourses } from '@/data/curriculum';
import { freshFocus, startFocus } from '@/lib/focus';
import { requestReminders } from '@/lib/notifications';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Chip, Field, Glass, Header, IconBadge, PressScale, ProgressBar, Screen, SectionTitle, Txt } from '@/components/ui';
import { useApp, type Task } from '@/context/app-context';
import { localDate, validDate, validTime } from '@/lib/academic';

const TIMES=['08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'];
const DURATIONS=[25,45,60,90,120];
const REMINDS=[5,10,15,30,0,-1];
const startOf=(t:Task)=>t.date&&t.time?new Date(`${t.date}T${t.time}:00`).getTime():NaN;

export default function Study(){
 const a=useApp();const {tr,palette,row,tasks,addTask,toggleTask,deleteTask,updateTask,lang,reminders,setReminders}=a;
 const [text,setText]=useState(''),[date,setDate]=useState(localDate()),[time,setTime]=useState('18:00'),[duration,setDuration]=useState('45'),[course,setCourse]=useState(''),[notes,setNotes]=useState(''),[editing,setEditing]=useState('');
 const [courseSearch,setCourseSearch]=useState(''),[remind,setRemind]=useState(5);
 const [error,setError]=useState(''),[filter,setFilter]=useState<'day'|'all'|'done'>('day'),[offset,setOffset]=useState(0);
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(t);},[]);
 const locale=lang==='ar'?'ar-EG':'en-GB';
 const day=new Date();day.setDate(day.getDate()+offset);const selected=localDate(day);
 const weekShift=Math.floor(offset/7);
 const week=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()+weekShift*7+i);return {offset:weekShift*7+i,key:localDate(d),d};});
 const todayKey=localDate();
 const openOn=(k:string)=>tasks.filter(t=>t.date===k&&!t.done).length;
 const span=(ms:number)=>{const m=Math.max(1,Math.round(ms/60000));if(m<60)return tr(`${m} دقيقة`,`${m} min`);const h=Math.floor(m/60),r=m%60;if(h<24)return r?tr(`${h} ساعة و${r} دقيقة`,`${h}h ${r}m`):tr(`${h} ساعة`,`${h}h`);const d=Math.round(h/24);return tr(`${d} يوم`,`${d} days`);};
 const remindLabel=(n:number)=>n<0?tr('من غير تذكير','No reminder'):n===0?tr('وقت البدء','At start'):tr(`قبلها ${n} د`,`${n} min before`);
 const courseTitle=(code?:string)=>code?curriculumCourses.find(c=>c.code===code)?.title??code:'';
 const upcoming=tasks.filter(t=>!t.done&&Number.isFinite(startOf(t))&&startOf(t)+(t.duration||25)*60000>now).sort((x,y)=>startOf(x)-startOf(y))[0];
 function clearForm(){setText('');setNotes('');setEditing('');setError('');setCourse('');setCourseSearch('');setRemind(5);}
 function save(){
  if(!text.trim()||!validDate(date)||!validTime(time)||!Number.isInteger(Number(duration))||Number(duration)<1||Number(duration)>480){
   setError(tr('راجع العنوان والتاريخ YYYY-MM-DD والوقت HH:MM والمدة من 1 لـ 480 دقيقة.','Check title, date YYYY-MM-DD, time HH:MM and duration 1–480 min.'));return;
  }
  const details={title:text.trim(),date,time,duration:Number(duration),course:courseSearch.trim()?(course||courseSearch.trim()):'',notes,remind};
  if(editing)updateTask(editing,details);else addTask(text,details);
  clearForm();
 }
 function edit(t:Task){setEditing(t.id);setText(t.title);setDate(t.date||selected);setTime(t.time||'18:00');setDuration(String(t.duration||45));setCourse(t.course||'');setCourseSearch(curriculumCourses.find(c=>c.code===t.course)?.title??t.course??'');setNotes(t.notes||'');setRemind(typeof t.remind==='number'?t.remind:5);}
 async function enableReminders(){if(await requestReminders())setReminders({enabled:true});else setError(tr('اسمح بالإشعارات من إعدادات الموبايل الأول.','Allow notifications in device settings first.'));}
 const list=tasks.filter(t=>filter==='all'||filter==='done'?filter==='all'||t.done:(!t.date||t.date===selected)).sort((a,b)=>(`${a.date??''} ${a.time??''}`).localeCompare(`${b.date??''} ${b.time??''}`));
 const conflicts=tasks.filter(t=>!t.done&&t.id!==editing&&t.date===date&&t.time&&validTime(time)&&validTime(t.time)).filter(t=>{const start=Number(time.slice(0,2))*60+Number(time.slice(3));const other=Number(t.time!.slice(0,2))*60+Number(t.time!.slice(3));return start<other+(t.duration||25)&&other<start+Number(duration);});
 const complete=list.filter(t=>t.done).length;
 const totalMinutes=list.reduce((n,t)=>n+(t.duration??0),0),doneMinutes=list.filter(t=>t.done).reduce((n,t)=>n+(t.duration??0),0);
 return <Screen padBottom={false}>
  <Button small variant="glass" title={tr('رجوع','Back')} onPress={()=>router.canGoBack()?router.back():router.replace('/(tabs)')}/>
  <Header title={tr('ظبّط روتينك','Find your rhythm')} subtitle={tr('خطط. ركز. علّم على اللي خلص.','Plan it. Focus. Mark it done.')}/>

  {upcoming?<Glass><View style={{gap:12}}>
   <View style={{flexDirection:row,alignItems:'center',gap:12}}>
    <IconBadge icon="alarm-outline" color={palette.primary} size={46}/>
    <View style={{flex:1,gap:2}}>
     <Txt variant="label" color={palette.primary}>{startOf(upcoming)<=now?tr('شغّالة دلوقتي','Happening now'):tr(`المهمة الجاية بعد ${span(startOf(upcoming)-now)}`,`Next task in ${span(startOf(upcoming)-now)}`)}</Txt>
     <Txt variant="h3" numberOfLines={2}>{upcoming.title}</Txt>
     <Txt variant="caption">{[new Date(startOf(upcoming)).toLocaleDateString(locale,{weekday:'long',day:'numeric',month:'short'}),upcoming.time,upcoming.duration?`${upcoming.duration} ${tr('دقيقة','min')}`:''].filter(Boolean).join(' · ')}</Txt>
    </View>
   </View>
   <Button small icon="play" title={tr('ابدأ التركيز عليها','Start focusing')} onPress={()=>a.setFocus(startFocus(freshFocus(upcoming.duration||25,upcoming.title)))}/>
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
     <Button small title={tr('ركّز عليها','Focus on this')} icon="play" onPress={()=>{a.setFocus(startFocus(freshFocus(t.duration||25,t.title)));}}/>
     <Button small variant="glass" title={tr('عدّل','Edit')} onPress={()=>edit(t)}/>
     <Button small variant="glass" title={tr('للنهارده','Move to today')} onPress={()=>updateTask(t.id,{date:localDate()})}/>
     <Button small variant="danger" title={tr('امسح','Delete')} onPress={()=>deleteTask(t.id)}/>
    </View>
   </View></Glass>;})}

  <SectionTitle title={editing?tr('عدّل الجلسة','Edit session'):tr('خطّط لجلسة جديدة','Plan a study session')}/>
  <Glass><View style={{gap:12}}>
   <Field placeholder={tr('هتذاكر إيه؟','What will you study?')} value={text} onChangeText={setText} maxLength={180}/>
   <Txt variant="caption">{tr('اليوم','Day')}</Txt>
   <View style={{flexDirection:row,gap:8,flexWrap:'wrap'}}>{[0,1,2].map(i=>{const d=new Date();d.setDate(d.getDate()+i);const k=localDate(d);return <Chip key={i} active={date===k} label={i===0?tr('النهارده','Today'):i===1?tr('بكرة','Tomorrow'):tr('بعد بكرة','In two days')} onPress={()=>setDate(k)}/>;})}</View>
   <Field value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" maxLength={10}/>
   <Txt variant="caption">{tr('الساعة','Time')}</Txt>
   <View style={{flexDirection:row,gap:6,flexWrap:'wrap'}}>{TIMES.map(v=><Chip key={v} label={v} active={time===v} onPress={()=>setTime(v)}/>)}</View>
   <Field value={time} onChangeText={setTime} placeholder="HH:MM" maxLength={5}/>
   <Txt variant="caption">{tr('المدة','Duration')}</Txt>
   <View style={{flexDirection:row,gap:6,flexWrap:'wrap'}}>{DURATIONS.map(v=><Chip key={v} label={`${v} ${tr('د','min')}`} active={duration===String(v)} onPress={()=>setDuration(String(v))}/>)}</View>
   <Field value={duration} onChangeText={setDuration} keyboardType="number-pad" maxLength={3} placeholder={tr('بالدقايق','Minutes')}/>
   <Txt variant="caption">{tr('التذكير (بصوت)','Reminder (with sound)')}</Txt>
   <View style={{flexDirection:row,gap:6,flexWrap:'wrap'}}>{REMINDS.map(v=><Chip key={v} label={remindLabel(v)} active={remind===v} onPress={()=>setRemind(v)}/>)}</View>
   <Field placeholder={tr('دوّر باسم المادة (اختياري)','Search course name (optional)')} value={courseSearch} onChangeText={v=>{setCourseSearch(v);setCourse('');}} maxLength={100}/>
   {!!courseSearch&&!course&&curriculumCourses.filter(c=>`${c.title} ${c.code}`.toLowerCase().includes(courseSearch.toLowerCase())).slice(0,5).map(c=><Button key={c.code} small variant="glass" title={c.title} onPress={()=>{setCourse(c.code);setCourseSearch(c.title);}}/>)}
   <Field placeholder={tr('ملاحظات وخطوات','Notes & steps')} value={notes} onChangeText={setNotes} multiline maxLength={1000}/>
   {conflicts.length>0&&<Txt color={palette.warn}>{tr('الميعاد ده متعارض مع: ','Overlaps with: ')}{conflicts.map(t=>t.title).slice(0,3).join(' · ')}</Txt>}
   {error?<Txt color={palette.danger}>{error}</Txt>:null}
   <Button title={editing?tr('احفظ التعديل','Save changes'):tr('ضيف جلسة','Add session')} icon="add" onPress={save}/>
   {editing?<Button variant="glass" title={tr('الغي التعديل','Cancel edit')} onPress={clearForm}/>:null}
  </View></Glass>
  <SectionTitle title={tr('وقت تركيزك','Your focus time')}/>
  <FocusCard/>
  <Txt variant="caption">{tr('وإنت شغّال، هيفضل إشعار ثابت بالعدّ التنازلي لحد ما الجلسة تخلص.','While it runs, an ongoing notification shows the countdown until the session ends.')}</Txt>
  <ReminderSettings/>
 </Screen>;
}