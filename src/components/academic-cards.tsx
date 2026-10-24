import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '@/context/app-context';
import { academic, courseRows, number, text, localDate, type Slot } from '@/lib/academic';
import { Button, Chip, Glass, IconBadge, PressScale, ProgressBar, SectionTitle, Txt } from './ui';
export const slotColor=(type:Slot['type'])=>type==='lecture'?'#3478F6':type==='section'?'#26A5C5':'#9671D1';
export function SlotCard({slot}:{slot:Slot}){
 const {tr,row,palette}=useApp();
 const color=slotColor(slot.type);
 return <PressScale onPress={()=>router.push(`/course/${encodeURIComponent(slot.code)}`)} label={`${slot.code} ${slot.start}`}>
  <View style={{borderRadius:20,borderWidth:1,borderColor:color+'40',padding:14,gap:8,backgroundColor:color+'09'}}>
   <View style={{flexDirection:row,justifyContent:'space-between',gap:10}}>
    <Chip color={color} active label={slot.kind||tr('نوع غير محدد','Unspecified type')}/>
    <Txt variant="label" color={color}>{slot.start||'—'} — {slot.end||'—'}</Txt>
   </View>
   <Txt variant="h3">{slot.title||slot.code}</Txt>
   <View style={{flexDirection:row,gap:10,alignItems:'center'}}>
    <IconBadge icon="location-outline" color={color} size={28}/>
    <Txt variant="sub" style={{flex:1}}>{slot.room||tr('القاعة غير منشورة','Room not published')}{slot.building?` · ${slot.building}`:''}</Txt>
    <Txt variant="caption" color={palette.sub}>{slot.code}</Txt>
   </View>
   {slot.teachers?<Txt variant="caption">{slot.teachers}</Txt>:null}
  </View>
 </PressScale>;
}
export function DaySchedule({full=false}:{full?:boolean}){
 const {cache,tr,lang,row}=useApp();const [offset,setOffset]=useState(0);
 const day=new Date();day.setDate(day.getDate()+offset);
 const slots=academic(cache).slots;
 const list=full?slots:slots.filter(s=>s.day===day.getDay());
 const unknown=slots.filter(s=>s.day===null).length;
 return <Glass><View style={{gap:14}}>
  <View style={{flexDirection:row,justifyContent:'space-between',alignItems:'center'}}>
   <Txt variant="h3">{full?tr('كل الأسبوع','Weekly timetable'):day.toLocaleDateString(lang==='ar'?'ar-EG':'en-GB',{weekday:'long',day:'numeric',month:'short'})}</Txt>
   {!full?<View style={{flexDirection:row,gap:6}}>
    <Button small variant="glass" title="−" onPress={()=>setOffset(n=>n-1)}/>
    <Button small variant="glass" title="+" onPress={()=>setOffset(n=>n+1)}/>
   </View>:null}
  </View>
  <View style={{flexDirection:row,flexWrap:'wrap',gap:8}}><Chip color="#3478F6" label={tr('محاضرة','Lecture')}/><Chip color="#26A5C5" label={tr('سيكشن / عملي','Section / lab')}/>{!full?<Chip active={offset===0} label={tr('اليوم','Today')} onPress={()=>setOffset(0)}/>:null}</View>
  {!cache.SEC_TIMETABLE?<Txt variant="sub">{tr('حدّث حساب الجامعة لعرض المواعيد. لن نعرض جدولًا وهميًا.','Sync university data to see times. No sample timetable is shown.')}</Txt>:!list.length?<Txt variant="sub">{tr('لا توجد مواعيد لهذا اليوم في البيانات المحمّلة.','No sessions for this day in the loaded records.')}</Txt>:list.map((s,i)=><View key={`${s.code}-${i}`} style={{gap:5}}>{full?<Txt variant="caption">{s.dayLabel||'—'}</Txt>:null}<SlotCard slot={s}/></View>)}
  {!!unknown&&!full?<Txt variant="caption">{tr(`${unknown} مواعيد بدون اسم يوم معروف؛ افتح الجدول الكامل.`,`${unknown} sessions have an unrecognized weekday; view the full timetable.`)}</Txt>:null}
 </View></Glass>;
}
export function AbsenceCards(){
 const {cache,tr,row,palette}=useApp();const rows=courseRows(cache,'SEC_ATTENDANCE');
 return <View style={{gap:10}}>
  {!rows.length?<Glass><Txt variant="sub">{tr('نسب الغياب غير متاحة في البيانات المحمّلة.','Absence percentages are not available in loaded data.')}</Txt></Glass>:rows.slice(0,6).map((r,i)=>{
   const pct=number(r.AbcensePercentage??r.AbsencePercentage);
   return <PressScale key={i} onPress={()=>router.push(`/course/${encodeURIComponent(text(r.CourseCode))}`)}><Glass padding={16}><View style={{gap:10}}>
    <View style={{flexDirection:row,justifyContent:'space-between',gap:12}}><Txt variant="label" style={{flex:1}}>{text(r.CourseNameEN)||text(r.CourseCode)}</Txt><Txt color={palette.danger}>{pct===null?'—':`${pct}%`}</Txt></View>
    <ProgressBar value={(pct??0)/100} color={palette.danger}/>
    <Txt variant="caption">{tr('نسبة الغياب المعلنة؛ ليست حد الحرمان.','Reported absence rate; not an exclusion threshold.')}</Txt>
   </View></Glass></PressScale>;
  })}
 </View>;
}
export function TodayTasks(){
 const {tasks,toggleTask,tr,row,palette}=useApp();
 const today=localDate();const items=tasks.filter(t=>!t.done&&(!t.date||t.date===today)).slice(0,4);
 return <Glass><View style={{gap:12}}>
  {!items.length?<Txt variant="sub">{tr('يومك جاهز. ضيف أول جلسة مذاكرة.','A clear day. Plan your first study session.')}</Txt>:items.map(t=><PressScale key={t.id} onPress={()=>toggleTask(t.id)} label={tr('إنهاء المهمة','Complete task')}>
   <View style={{flexDirection:row,alignItems:'center',gap:12}}><IconBadge icon="ellipse-outline" color={palette.primary} size={28}/>
    <View style={{flex:1}}><Txt variant="label">{t.title}</Txt><Txt variant="caption">{t.time??''}{t.duration?` · ${t.duration} ${tr('دقيقة','min')}`:''}{t.course?` · ${t.course}`:''}</Txt></View>
   </View>
  </PressScale>)}
 </View></Glass>;
}