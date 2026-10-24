import { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Chip, Field, Glass, Header, IconBadge, PressScale, Screen, SectionTitle, Txt } from '@/components/ui';
import { useApp } from '@/context/app-context';

export default function Study(){
 const {tr,palette,row,tasks,addTask,toggleTask,deleteTask}=useApp();
 const [text,setText]=useState('');
 const [minutes,setMinutes]=useState(25);
 const [remaining,setRemaining]=useState(25*60);
 const [end,setEnd]=useState<number|null>(null);
 const [finished,setFinished]=useState(false);
 useEffect(()=>{
   if(end===null)return;
   const tick=()=>{const left=Math.max(0,Math.ceil((end-Date.now())/1000));setRemaining(left);if(left===0){setEnd(null);setFinished(true);}};
   tick();const timer=setInterval(tick,1000);
   const sub=AppState.addEventListener('change',s=>{if(s==='active')tick();});
   return()=>{clearInterval(timer);sub.remove();};
 },[end]);
 const reset=(m=minutes)=>{setMinutes(m);setRemaining(m*60);setEnd(null);setFinished(false);};
 return <Screen padBottom={false}>
   <Button small variant="glass" title={tr('رجوع','Back')} onPress={()=>router.canGoBack()?router.back():router.replace('/(tabs)')}/>
   <Header title={tr('مساحة المذاكرة','Study space')} subtitle={tr('مهمة واحدة. تركيز كامل.','One task. Full attention.')}/>
   <Glass padding={24}><View style={{gap:18,alignItems:'center'}}>
     <Txt variant="caption">{finished?tr('جلسة خلصت — خد نفس','Session complete — take a breath'):tr('مؤقت التركيز','FOCUS TIMER')}</Txt>
     <Txt variant="h1" style={{fontSize:60,lineHeight:80,fontVariant:['tabular-nums']}}>{String(Math.floor(remaining/60)).padStart(2,'0')}:{String(remaining%60).padStart(2,'0')}</Txt>
     <View style={{flexDirection:row,gap:8}}>{[25,50,5].map(m=><Chip key={m} active={minutes===m} label={m===5?tr('راحة ٥ د','5m break'):`${m} ${tr('د','min')}`} onPress={()=>reset(m)}/>)}</View>
     <View style={{flexDirection:row,gap:12}}>
       <Button icon={end?'pause':'play'} title={end?tr('إيقاف مؤقت','Pause'):tr('ابدأ','Start')} onPress={()=>{if(end){setRemaining(Math.max(0,Math.ceil((end-Date.now())/1000)));setEnd(null);}else{const seconds=remaining||minutes*60;setFinished(false);setEnd(Date.now()+seconds*1000);}}}/>
       <Button variant="glass" title={tr('إعادة','Reset')} onPress={()=>reset()}/>
     </View>
     <Txt variant="caption" center>{tr('لا يحتاج نت. يُصحّح الوقت عند الرجوع من الخلفية. يُعاد ضبطه عند إغلاق الصفحة؛ لا يرسل تنبيهات بالخلفية.','Works offline and catches up after backgrounding. Resets when leaving this page; no background notifications.')}</Txt>
   </View></Glass>
   <SectionTitle title={tr('خطوات صغيرة، نتيجة كبيرة','Small steps, real progress')}/>
   <Field placeholder={tr('مهمة جديدة…','New task…')} value={text} onChangeText={setText} maxLength={180} onSubmitEditing={()=>{addTask(text);setText('');}}/>
   <Button title={tr('إضافة مهمة','Add task')} disabled={!text.trim()} icon="add" onPress={()=>{addTask(text);setText('');}}/>
   {tasks.map(t=><Glass key={t.id}><View style={{flexDirection:row,alignItems:'center',gap:12}}>
     <PressScale style={{flex:1}} onPress={()=>toggleTask(t.id)} label={tr('تغيير حالة المهمة','Toggle task')}><View style={{flexDirection:row,gap:10,alignItems:'center'}}><IconBadge icon={t.done?'checkmark-circle':'ellipse-outline'} color={t.done?palette.primary:palette.sub} size={28}/><Txt style={{flex:1,textDecorationLine:t.done?'line-through':'none'}} color={t.done?palette.sub:palette.text}>{t.title}</Txt></View></PressScale>
     <Button small variant="danger" title={tr('حذف','Delete')} onPress={()=>deleteTask(t.id)}/>
   </View></Glass>)}
 </Screen>;
}