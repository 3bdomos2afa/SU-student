import { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Chip, Field, Glass, Header, IconBadge, PressScale, ProgressBar, Screen, SectionTitle, Txt } from '@/components/ui';
import { useApp, type Task } from '@/context/app-context';
import { localDate, validDate, validTime } from '@/lib/academic';
export default function Study(){
 const a=useApp();const {tr,palette,row,tasks,addTask,toggleTask,deleteTask,updateTask,lang}=a;
 const [text,setText]=useState(''),[date,setDate]=useState(localDate()),[time,setTime]=useState('18:00'),[duration,setDuration]=useState('45'),[course,setCourse]=useState(''),[notes,setNotes]=useState(''),[editing,setEditing]=useState('');
 const [error,setError]=useState(''),[filter,setFilter]=useState<'day'|'all'|'done'>('day'),[offset,setOffset]=useState(0);
 const day=new Date();day.setDate(day.getDate()+offset);const selected=localDate(day);
 const [minutes,setMinutes]=useState(25),[remaining,setRemaining]=useState(25*60),[end,setEnd]=useState<number|null>(null),[finished,setFinished]=useState(false);
 useEffect(()=>{
  if(end===null)return;
  const tick=()=>{const left=Math.max(0,Math.ceil((end-Date.now())/1000));setRemaining(left);if(left===0){setEnd(null);setFinished(true);}};
  tick();const timer=setInterval(tick,1000);const sub=AppState.addEventListener('change',s=>{if(s==='active')tick();});
  return()=>{clearInterval(timer);sub.remove();};
 },[end]);
 const reset=(m=minutes)=>{setMinutes(m);setRemaining(m*60);setEnd(null);setFinished(false);};
 function save(){
  if(!text.trim()||!validDate(date)||!validTime(time)||!Number.isInteger(Number(duration))||Number(duration)<1||Number(duration)>480){
   setError(tr('راجع العنوان والتاريخ YYYY-MM-DD والوقت HH:MM والمدة 1–480 دقيقة.','Check title, date YYYY-MM-DD, time HH:MM and duration 1–480 min.'));return;
  }
  const next={title:text.trim(),date,time,duration:Number(duration),course,notes};
  if(editing)updateTask(editing,next);else addTask(text,next);
  setText('');setNotes('');setEditing('');setError('');
 }
 function edit(t:Task){setEditing(t.id);setText(t.title);setDate(t.date||selected);setTime(t.time||'18:00');setDuration(String(t.duration||45));setCourse(t.course||'');setNotes(t.notes||'');}
 const list=tasks.filter(t=>filter==='all'||filter==='done'?filter==='all'||t.done:(!t.date||t.date===selected)).sort((a,b)=>(`${a.date??''} ${a.time??''}`).localeCompare(`${b.date??''} ${b.time??''}`));
 const complete=list.filter(t=>t.done).length;
 const totalMinutes=list.reduce((n,t)=>n+(t.duration??0),0),doneMinutes=list.filter(t=>t.done).reduce((n,t)=>n+(t.duration??0),0);
 return <Screen padBottom={false}>
  <Button small variant="glass" title={tr('رجوع','Back')} onPress={()=>router.canGoBack()?router.back():router.replace('/(tabs)')}/>
  <Header title={tr('اصنع إيقاعك','Find your rhythm')} subtitle={tr('خطط. ركز. علّم على اللي خلص.','Plan it. Focus. Mark it done.')}/>
  <Glass><View style={{gap:14}}>
   <View style={{flexDirection:row,justifyContent:'space-between'}}><Txt variant="h2">{complete} / {list.length}</Txt><Txt variant="label">{doneMinutes} / {totalMinutes} {tr('دقيقة مخططة','planned min')}</Txt></View>
   <ProgressBar value={list.length?complete/list.length:0}/>
   <Txt variant="caption">{tr('الدقائق مجموع مدد المهام؛ ليست قياسًا تلقائيًا لوقت المذاكرة.','Minutes sum task durations; not automatic time tracking.')}</Txt>
   <View style={{flexDirection:row,gap:6}}><Chip active={filter==='day'} label={tr('يومي','Daily')} onPress={()=>setFilter('day')}/><Chip active={filter==='all'} label={tr('الكل','All')} onPress={()=>setFilter('all')}/><Chip active={filter==='done'} label={tr('تم','Done')} onPress={()=>setFilter('done')}/></View>
   {filter==='day'?<View style={{flexDirection:row,justifyContent:'space-between',alignItems:'center'}}><Button small variant="glass" title="−" onPress={()=>setOffset(n=>n-1)}/><Txt variant="label">{day.toLocaleDateString(lang==='ar'?'ar-EG':'en-GB',{weekday:'short',day:'numeric',month:'short'})}</Txt><Button small variant="glass" title="+" onPress={()=>setOffset(n=>n+1)}/></View>:null}
  </View></Glass>
  {!list.length?<Glass><Txt variant="sub">{tr('مفيش مهام هنا. ضيف جلسة من النموذج تحت.','No tasks here. Add a session below.')}</Txt></Glass>:list.map(t=><Glass key={t.id}><View style={{gap:12}}>
   <PressScale onPress={()=>toggleTask(t.id)} label={tr('تغيير حالة المهمة','Toggle task')}><View style={{flexDirection:row,gap:12,alignItems:'center'}}><IconBadge icon={t.done?'checkmark-circle':'ellipse-outline'} color={t.done?palette.success:palette.primary} size={32}/><View style={{flex:1}}><Txt variant="h3" style={{textDecorationLine:t.done?'line-through':'none'}}>{t.title}</Txt><Txt variant="caption">{[t.date,t.time,t.duration?`${t.duration} ${tr('دقيقة','min')}`:'',t.course].filter(Boolean).join(' · ')}</Txt></View></View></PressScale>
   {t.notes?<Txt variant="sub">{t.notes}</Txt>:null}
   <View style={{flexDirection:row,gap:8,flexWrap:'wrap'}}>
    <Button small variant="glass" title={tr('تعديل','Edit')} onPress={()=>edit(t)}/>
    <Button small variant="glass" title={tr('للنهارده','Move to today')} onPress={()=>updateTask(t.id,{date:localDate()})}/>
    <Button small variant="danger" title={tr('حذف','Delete')} onPress={()=>deleteTask(t.id)}/>
   </View>
  </View></Glass>)}
  <SectionTitle title={editing?tr('تعديل الجلسة','Edit session'):tr('خطط لجلسة جديدة','Plan a study session')}/>
  <Glass><View style={{gap:12}}>
   <Field placeholder={tr('هتذاكر إيه؟','What will you study?')} value={text} onChangeText={setText} maxLength={180}/>
   <Txt variant="caption">{tr('التاريخ YYYY-MM-DD','Date YYYY-MM-DD')}</Txt><Field value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" maxLength={10}/>
   <View style={{flexDirection:row,gap:12}}><View style={{flex:1}}><Txt variant="caption">{tr('الساعة HH:MM','Time HH:MM')}</Txt><Field value={time} onChangeText={setTime} placeholder="HH:MM" maxLength={5}/></View><View style={{flex:1}}><Txt variant="caption">{tr('المدة بالدقائق','Duration in minutes')}</Txt><Field value={duration} onChangeText={setDuration} keyboardType="number-pad" maxLength={3}/></View></View>
   <Field placeholder={tr('كود المادة (اختياري)','Course code (optional)')} value={course} onChangeText={setCourse} maxLength={40}/>
   <Field placeholder={tr('ملاحظات وخطوات','Notes & steps')} value={notes} onChangeText={setNotes} multiline maxLength={1000}/>
   {error?<Txt color={palette.danger}>{error}</Txt>:null}
   <Button title={editing?tr('حفظ التعديل','Save changes'):tr('إضافة جلسة','Add session')} icon="add" onPress={save}/>
   {editing?<Button variant="glass" title={tr('إلغاء التعديل','Cancel edit')} onPress={()=>{setEditing('');setText('');setNotes('');}}/>:null}
  </View></Glass>
  <SectionTitle title={tr('وقت تركيزك','Your focus time')}/>
  <Glass padding={24}><View style={{gap:18,alignItems:'center'}}>
   <Txt variant="caption">{finished?tr('الجلسة خلصت','Session complete'):tr('مؤقت التركيز','FOCUS TIMER')}</Txt>
   <Txt variant="h1" style={{fontSize:56,lineHeight:72,fontVariant:['tabular-nums']}}>{String(Math.floor(remaining/60)).padStart(2,'0')}:{String(remaining%60).padStart(2,'0')}</Txt>
   <View style={{flexDirection:row,gap:8}}>{[25,50,5].map(m=><Chip key={m} active={minutes===m} label={`${m} ${tr('د','min')}`} onPress={()=>reset(m)}/>)}</View>
   <View style={{flexDirection:row,gap:12}}><Button icon={end?'pause':'play'} title={end?tr('إيقاف مؤقت','Pause'):tr('ابدأ','Start')} onPress={()=>{if(end){setRemaining(Math.max(0,Math.ceil((end-Date.now())/1000)));setEnd(null);}else{setFinished(false);setEnd(Date.now()+(remaining||minutes*60)*1000);}}}/><Button variant="glass" title={tr('إعادة','Reset')} onPress={()=>reset()}/></View>
   <Txt variant="caption" center>{tr('يُعاد عند مغادرة الصفحة. لا يرسل إشعارات في الخلفية. مهامك محفوظة على الجهاز.','Resets when leaving this screen. No background notifications. Tasks are saved on-device.')}</Txt>
  </View></Glass>
 </Screen>;
}