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
    {evidence.registered?<Chip active color="#C79016" label={tr('مسجّل دلوقتي','Currently registered')}/>:null}
    <Chip color={palette.danger} label={evidence.failures===null?tr('عدد الرسوب مش مؤكد','Failures not confirmed'):tr(`${evidence.failures} رسوب في السجل المحمّل`,`${evidence.failures} failures in loaded records`)}/>
   </View>
   {!evidence.history.length?<Txt variant="sub">{tr('مفيش محاولات متحمّلة للمادة دي، وده مش معناه إنك ما درستهاش.','No loaded attempts for this course. This does not mean you never took it.')}</Txt>:evidence.history.map((r,i)=><View key={i} style={{flexDirection:row,justifyContent:'space-between',gap:12}}><Txt variant="sub" style={{flex:1}}>{text(r.SemesterNameEN)||text(r.Name)||tr('محاولة من السجل','Transcript attempt')}</Txt><Txt variant="label">{text(r.GradeName)||'—'}</Txt></View>)}
  </View></Glass>
  <SectionTitle title={tr('مواعيد المادة','Course timetable')}/>
  {evidence.slots.length?evidence.slots.map((slot,i)=><View key={i} style={{gap:6}}><Txt variant="caption">{slot.dayLabel}</Txt><SlotCard slot={slot}/></View>):<Glass><Txt variant="sub">{tr('مواعيد المادة لسه مش منشورة أو متزامنتش.','Course times are unpublished or not yet synced.')}</Txt></Glass>}
  <SectionTitle title={tr('الميد والكورس ورك والفاينل','Midterm, coursework & final')}/>
  <Glass><View style={{gap:12}}>
   <Button variant="glass" title={tr('تحميل تفاصيل الدرجات','Load assessment marks')} loading={busy} disabled={!a.session} onPress={()=>{void load();}}/>
   {error?<Txt color={palette.warn}>{error}</Txt>:null}
   {marks.map((m,i)=><View key={i} style={{flexDirection:row,justifyContent:'space-between',gap:10}}><Txt style={{flex:1}}>{text(m.TemplateDetails)||text(m.Groups)||tr('بند درجات','Assessment')}</Txt><Txt variant="label">{text(m.StudentDegree)||'—'} / {text(m.MaxDegree)||'—'}</Txt></View>)}
   {!marks.length?<Txt variant="sub">{tr('مفيش درجات تفصيلية متحمّلة. التقدير النهائي ظاهر فوق من السجل، ومش بنحوّله لدرجة امتحان.','No assessment marks loaded. Transcript grades appear above; they are not converted into exam marks.')}</Txt>:null}
   <Txt variant="caption">{tr('كل بند باسمه في الجامعة، وأي درجة لسه متنشرتش هتفضل —.','Assessment names come from the university; unpublished values remain —.')}</Txt>
  </View></Glass>
  <Glass><View style={{gap:12}}>
   <Txt variant="h3">{tr('ملاحظاتك اللي كتبتها للخريطة','Your manual map notes')}</Txt>
   <Txt variant="caption">{tr('بتتحفظ على جهازك ومش بتغيّر سجل الجامعة.','Saved on your device; never changes university records.')}</Txt>
   <Button small variant="glass" title={note.registered?tr('إلغاء التسجيل اليدوي','Remove manual registration'):tr('علّمها مسجّلة','Mark registered manually')} onPress={()=>a.setCourseNote(code,{registered:!note.registered})}/>
   <View style={{flexDirection:row,alignItems:'center',gap:12}}><Txt style={{flex:1}}>{tr('رسوب متسجّل يدويًا','Manual failure count')}: {note.failures??'—'}</Txt><Button small variant="glass" title="−" onPress={()=>a.setCourseNote(code,{failures:Math.max(0,(note.failures??0)-1)})}/><Button small variant="glass" title="+" onPress={()=>a.setCourseNote(code,{failures:Math.min(99,(note.failures??0)+1)})}/></View>
  </View></Glass>
 </>;
}