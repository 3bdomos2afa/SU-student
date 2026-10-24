import { courseByCode } from '@/data/curriculum-helpers';
import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Chip, Glass, Header, PressScale, Screen, Txt } from '@/components/ui';
import { useApp } from '@/context/app-context';
import { courseRows, text, rowsDeep } from '@/lib/academic';
export default function Grades(){
 const a=useApp();const {tr,cache,row,palette}=a;
 const params=useLocalSearchParams<{mode?:string}>();const [final,setFinal]=useState(params.mode==='final');
 const courses=courseRows(cache,final?'SEC_TRANSCRIPT':'SEC_SCHEDULE');
 const [busy,setBusy]=useState('');const [error,setError]=useState('');
 async function load(code:string){setBusy(code);setError('');try{const r=await a.fetchService(`GRADES:${code}`,true);setError(r.error??'');}finally{setBusy('');}}
 return <Screen padBottom={false}>
  <Button small variant="glass" title={tr('رجوع','Back')} onPress={()=>router.canGoBack()?router.back():router.replace('/(tabs)')}/>
  <Header title={tr('مساحة الدرجات','Gradebook')} subtitle={tr('اللي لسه مانزلش بيبان كده — مش صفر','Unpublished marks show —, never zero')}/>
  <View style={{flexDirection:row,gap:8}}><Chip active={!final} label={tr('الميد والكورس ورك','Midterm & coursework')} onPress={()=>setFinal(false)}/><Chip active={final} label={tr('نتايج الفاينل','Final results')} onPress={()=>setFinal(true)}/></View>
  {error?<Txt color={palette.warn}>{error}</Txt>:null}
  {!courses.length?<Glass><Txt>{tr('مفيش درجات أو مواد متحمّلة. حدّث بيانات الجامعة الأول.','No courses or marks loaded. Refresh university data first.')}</Txt><Button title={tr('تحديث','Refresh')} loading={a.refreshing} disabled={!a.session} onPress={a.refreshAll}/></Glass>:null}
  {courses.map((c,i)=>{
   const code=text(c.CourseCode);
   const marks=rowsDeep(cache[`GRADES:${code}`]?.data).filter(r=>r.StudentDegree!==undefined||r.TemplateDetails!==undefined);
   return <Glass key={`${code}-${i}`}><View style={{gap:12}}>
    <PressScale onPress={()=>router.push(`/course/${encodeURIComponent(code)}`)}><Txt variant="h3">{text(c.CourseNameEN)||text(c.CourseName)||courseByCode.get(code)?.title||code}</Txt><Txt variant="caption">{code}</Txt></PressScale>
    {final?<><Txt variant="h2" color={palette.primary}>{text(c.GradeName)||'—'}</Txt><Txt variant="caption">{[c.SemesterNameEN,c.SectionName].map(text).filter(Boolean).join(' · ')}</Txt><Txt variant="caption">{tr('ده تقدير السجل، مش درجة الفاينل بالأرقام.','Transcript grade, not the numeric final-exam mark.')}</Txt></>:<>
     <Button small variant="glass" title={tr('تحميل توزيع الدرجات','Load mark breakdown')} loading={busy===code} disabled={!!busy||!a.session} onPress={()=>{void load(code);}}/>
     {marks.map((m,j)=><View key={j} style={{flexDirection:row,justifyContent:'space-between',gap:12}}><Txt style={{flex:1}}>{text(m.TemplateDetails)||text(m.Groups)||tr('بند درجات','Assessment')}</Txt><Txt variant="label">{text(m.StudentDegree)||'—'} / {text(m.MaxDegree)||'—'}</Txt></View>)}
     {cache[`GRADES:${code}`]&&!marks.length?<Txt variant="caption">{tr('مفيش درجات منشورة في الرد.','No published marks in this response.')}</Txt>:null}
    </>}
   </View></Glass>;
  })}
 </Screen>;
}