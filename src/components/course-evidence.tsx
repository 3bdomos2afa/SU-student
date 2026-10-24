import { useState } from 'react';
import { View } from 'react-native';
import { useApp } from '@/context/app-context';
import { courseEvidence, rowsDeep, text } from '@/lib/academic';
import { Button, Chip, Glass, SectionTitle, Txt } from './ui';
import { SlotCard } from './academic-cards';
export function CourseEvidence({code}:{code:string}){
 const a=useApp();const {tr,row,palette,cache}=a;const evidence=courseEvidence(cache,code);
 const marks=rowsDeep(cache[`GRADES:${code}`]?.data).filter(r=>r.StudentDegree!==undefined||r.TemplateDetails!==undefined);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const note=a.courseNotes[code]??{};
 async function load(){setBusy(true);setError('');try{const r=await a.fetchService(`GRADES:${code}`,true);setError(r.error??'');}finally{setBusy(false);}}
 return <>
  <Glass><View style={{gap:12}}>
   <Txt variant="h3">{tr('من حساب الجامعة','From your university account')}</Txt>
   <View style={{flexDirection:row,flexWrap:'wrap',gap:8}}>
    {evidence.passed?<Chip active color="#1CA780" label={tr('نجاح مسجّل','Recorded pass')}/>:null}
    {evidence.registered?<Chip active color="#C79016" label={tr('مسجّل حاليًا','Currently registered')}/>:null}
    <Chip color={palette.danger} label={evidence.failures===null?tr('عدد الرسوب غير مؤكد','Failures not confirmed'):tr(`${evidence.failures} رسوب في السجل المحمّل`,`${evidence.failures} failures in loaded records`)}/>
   </View>
   {!evidence.history.length?<Txt variant="sub">{tr('لا توجد محاولات محمّلة لهذه المادة. ده لا يعني إنك ما درستهاش.','No loaded attempts for this course. This does not mean you never took it.')}</Txt>:evidence.history.map((r,i)=><View key={i} style={{flexDirection:row,justifyContent:'space-between',gap:12}}><Txt variant="sub" style={{flex:1}}>{text(r.SemesterNameEN)||text(r.Name)||tr('محاولة من السجل','Transcript attempt')}</Txt><Txt variant="label">{text(r.GradeName)||'—'}</Txt></View>)}
  </View></Glass>
  <SectionTitle title={tr('مواعيد المادة','Course timetable')}/>
  {evidence.slots.length?evidence.slots.map((slot,i)=><View key={i} style={{gap:6}}><Txt variant="caption">{slot.dayLabel}</Txt><SlotCard slot={slot}/></View>):<Glass><Txt variant="sub">{tr('مواعيد المادة غير منشورة أو لم تتم مزامنتها.','Course times are unpublished or not yet synced.')}</Txt></Glass>}
  <SectionTitle title={tr('الميد والكورس ورك والفاينل','Midterm, coursework & final')}/>
  <Glass><View style={{gap:12}}>
   <Button variant="glass" title={tr('تحميل تفاصيل الدرجات','Load assessment marks')} loading={busy} disabled={!a.session} onPress={()=>{void load();}}/>
   {error?<Txt color={palette.warn}>{error}</Txt>:null}
   {marks.map((m,i)=><View key={i} style={{flexDirection:row,justifyContent:'space-between',gap:10}}><Txt style={{flex:1}}>{text(m.TemplateDetails)||text(m.Groups)||tr('بند درجات','Assessment')}</Txt><Txt variant="label">{text(m.StudentDegree)||'—'} / {text(m.MaxDegree)||'—'}</Txt></View>)}
   {!marks.length?<Txt variant="sub">{tr('لا توجد درجات تفصيلية محمّلة. التقدير النهائي يظهر فوق من السجل؛ لا نحوله لدرجة امتحان.','No assessment marks loaded. Transcript grades appear above; they are not converted into exam marks.')}</Txt>:null}
   <Txt variant="caption">{tr('كل بند باسم الجامعة؛ أي درجة غير منشورة تظل —.','Assessment names come from the university; unpublished values remain —.')}</Txt>
  </View></Glass>
  <Glass><View style={{gap:12}}>
   <Txt variant="h3">{tr('ملاحظاتك اليدوية للخريطة','Your manual map notes')}</Txt>
   <Txt variant="caption">{tr('تُحفظ على جهازك ولا تغيّر سجل الجامعة.','Saved on your device; never changes university records.')}</Txt>
   <Button small variant="glass" title={note.registered?tr('إلغاء التسجيل اليدوي','Remove manual registration'):tr('علّم مسجّل يدويًا','Mark registered manually')} onPress={()=>a.setCourseNote(code,{registered:!note.registered})}/>
   <View style={{flexDirection:row,alignItems:'center',gap:12}}><Txt style={{flex:1}}>{tr('عدد رسوب يدوي','Manual failure count')}: {note.failures??'—'}</Txt><Button small variant="glass" title="−" onPress={()=>a.setCourseNote(code,{failures:Math.max(0,(note.failures??0)-1)})}/><Button small variant="glass" title="+" onPress={()=>a.setCourseNote(code,{failures:Math.min(99,(note.failures??0)+1)})}/></View>
  </View></Glass>
 </>;
}