import { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { useApp } from '@/context/app-context';
import { focusLeft, freshFocus, pauseFocus, startFocus } from '@/lib/focus';
import { Button, Chip, Glass, ProgressBar, Txt } from './ui';
export function FocusCard({compact=false}:{compact?:boolean}){
 const a=useApp();const {tr,row,palette,focus}=a;
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{const tick=()=>setNow(Date.now());const t=setInterval(tick,1000);const sub=AppState.addEventListener('change',s=>{if(s==='active')tick();});return()=>{clearInterval(t);sub.remove();};},[]);
 const remaining=focusLeft(focus,now),running=focus.endAt!==null&&remaining>0,finished=remaining===0;
 const time=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;
 return <Glass padding={compact?18:24}><View style={{gap:16}}>
  <View style={{flexDirection:row,alignItems:'center',justifyContent:'space-between'}}>
   <Txt variant="label" color={palette.primary}>{finished?tr('تمت الجلسة','Session finished'):tr('مساحة التركيز','FOCUS SPACE')}</Txt>
   <Txt variant="caption">{running?tr('مستمر بعد الخروج','Keeps time when away'):tr('محفوظ على جهازك','Saved on this device')}</Txt>
  </View>
  {!!focus.title&&<Txt variant="h3">{focus.title}</Txt>}
  <Txt center variant="h1" style={{fontSize:compact?38:60,lineHeight:compact?56:80,fontVariant:['tabular-nums']}}>{time}</Txt>
  <ProgressBar value={1-remaining/focus.duration}/>
  {!compact&&<View style={{flexDirection:row,gap:8,justifyContent:'center'}}>{[25,50,5].map(m=><Chip key={m} active={focus.duration===m*60} label={`${m} ${tr('د','min')}`} onPress={()=>{a.setFocus(freshFocus(m));setNow(Date.now());}}/>)}</View>}
  <View style={{flexDirection:row,gap:10}}>
   <Button style={{flex:1}} icon={running?'pause':'play'} title={running?tr('إيقاف مؤقت','Pause'):tr('ابدأ','Start')} onPress={()=>{a.setFocus(running?pauseFocus(focus):startFocus(focus));setNow(Date.now());}}/>
   <Button variant="glass" title={tr('إعادة','Reset')} onPress={()=>{a.setFocus(freshFocus(focus.duration/60,focus.title));setNow(Date.now());}}/>
  </View>
  {!compact&&<Txt variant="caption">{tr('الوقت محفوظ بموعد نهاية؛ لا يحتاج تشغيل مستمر في الخلفية. فعّل التذكيرات لتنبيه الانتهاء. النظام قد يؤخر الإشعار بسبب الطاقة أو وضع التركيز.','The end time is saved, so no continuous background process is needed. Enable reminders for completion alerts. Battery controls or Focus mode may delay delivery.')}</Txt>}
 </View></Glass>;
}