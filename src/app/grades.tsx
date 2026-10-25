import { courseByCode } from '@/data/curriculum-helpers';
import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Chip, Glass, Header, PressScale, ProgressBar, Screen, Txt } from '@/components/ui';
import { GpaChart, gpaColor, type GpaPoint } from '@/components/gpa-chart';
import { useApp } from '@/context/app-context';
import { academic, canonical, courseRows, number, terms, text, transcriptStatus, type Cache, type Row, type Term } from '@/lib/academic';
import { markTotal, marks, type Mark } from '@/lib/marks';
import { recordsOf } from '@/lib/portal';
import { termName } from '@/lib/field-labels';

/** The student's own courses this term, once each (the schedule also nests every section). */
function ownCourses(cache:Cache):Row[]{
 const list=[...recordsOf(cache.SEC_CURRENT?.data),...recordsOf(cache.SEC_SCHEDULE?.data)].filter(r=>r.CourseCode);
 return [...new Map(list.map(r=>[canonical(r.CourseCode),r])).values()];
}
const shortYear=(y:string)=>(y.match(/\d{4}/g)||[]).map(v=>v.slice(2)).join('/');
const fmt=(n:number)=>String(Math.round(n*100)/100);
export default function Grades(){
 const a=useApp();const {tr,cache,row,palette,lang}=a;
 const params=useLocalSearchParams<{mode?:string}>();const [final,setFinal]=useState(params.mode==='final');
 const [busy,setBusy]=useState('');const [error,setError]=useState('');
 const locale=lang==='ar'?'ar-EG':'en-GB';
 const current=ownCourses(cache);
 const all=terms(cache);
 const history=all.slice().reverse();
 const legacy=courseRows(cache,'SEC_TRANSCRIPT');
 const info=academic(cache);
 const termLabel=(t:Term)=>lang==='ar'?(t.ar||termName(t.en,'ar')):t.en;
 const points=all.map(t=>({label:termLabel(t),sub:shortYear(t.year),gpa:number(t.summary?.GPA),cgpa:number(t.summary?.CGPA)})).filter((p):p is GpaPoint=>p.gpa!==null);
 const last=points[points.length-1],before=points[points.length-2];
 const best=points.reduce<GpaPoint|null>((b,p)=>!b||p.gpa>b.gpa?p:b,null);
 const tone=(g:string)=>{const s=transcriptStatus(g);return s==='failed'?palette.danger:s==='passed'?palette.success:palette.sub;};
 const markTone=(m:Mark)=>{if(m.score===null||!m.outOf)return palette.sub;const r=m.score/m.outOf;return r>=0.85?palette.success:r>=0.6?palette.primary:r>=0.5?palette.warn:palette.danger;};
 const kindLabel=(m:Mark)=>m.part==='quiz'?tr('كويز','Quiz'):m.kind==='midterm'?tr('ميد تيرم','Midterm'):m.kind==='final'?tr('فاينل','Final'):tr('أعمال سنة','Coursework');
 const when=(at:string)=>new Date(at).toLocaleString(locale,{weekday:'short',hour:'numeric',minute:'2-digit'});
 const title=(c:Row)=>text(c.CourseNameEN)||text(c.CourseName)||courseByCode.get(text(c.CourseCode))?.title||text(c.CourseCode);
 async function load(code:string){setBusy(code);setError('');try{const r=await a.fetchService(`GRADES:${code}`,true);setError(r.error??'');}finally{setBusy('');}}
 const line=(c:Row,i:number)=>{const g=text(c.GradeName)||'—';const code=text(c.CourseCode);
  return <PressScale key={`${code}-${i}`} label={code} onPress={()=>router.push(`/course/${encodeURIComponent(code)}`)}>
   <View style={{flexDirection:row,alignItems:'center',gap:12,paddingVertical:6}}>
    <View style={{flex:1,gap:2}}><Txt variant="label" numberOfLines={2}>{title(c)}</Txt>
     <Txt variant="caption">{[code,text(c.CreditHours)?`${text(c.CreditHours)} ${tr('ساعات','cr')}`:''].filter(Boolean).join(' · ')}</Txt></View>
    <Txt variant="h3" color={tone(g)}>{g}</Txt>
   </View></PressScale>;};
 const empty=final?!history.length&&!legacy.length:!current.length;
 return <Screen padBottom={false} refreshing={a.refreshing} onRefresh={a.refreshAll}>
  <Button small variant="glass" title={tr('رجوع','Back')} onPress={()=>router.canGoBack()?router.back():router.replace('/(tabs)')}/>
  <Header title={tr('الدرجات','Grades')} subtitle={final?tr('كل ترم بتقديراته ومعدّله','Every term with its grades and GPA'):tr('بتتحدث لوحدها، واللي لسه مانزلش بيبان — مش صفر','Updates automatically; unpublished marks show —, never zero')}/>
  <View style={{flexDirection:row,gap:8}}><Chip active={!final} label={tr('درجات الترم ده','This term')} onPress={()=>setFinal(false)}/><Chip active={final} label={tr('السجل الدراسي','Transcript')} onPress={()=>setFinal(true)}/></View>
  {error?<Txt color={palette.warn}>{error}</Txt>:null}
  {empty?<Glass><Txt>{tr('مفيش بيانات متحمّلة لسه. حدّث بيانات الجامعة.','Nothing loaded yet. Refresh university data.')}</Txt><Button title={tr('تحديث','Refresh')} loading={a.refreshing} disabled={!a.session} onPress={a.refreshAll}/></Glass>:null}
  {final&&(info.gpa!==null||info.earned!==null)?<Glass><View style={{gap:12}}>
   <View style={{flexDirection:row,justifyContent:'space-around',gap:8}}>
    {([[tr('التراكمي','CGPA'),info.gpa===null?'—':info.gpa.toFixed(2)],[tr('ساعات مكتسبة','Earned'),info.earned??'—'],[tr('ساعات مسجّلة','Attempted'),info.attempted??'—']] as const).map(([k,v])=>
     <View key={k} style={{alignItems:'center',gap:4}}><Txt variant="h2" color={palette.primary}>{String(v)}</Txt><Txt variant="caption">{k}</Txt></View>)}
   </View>
   {last&&before?<Txt variant="caption" center color={last.gpa>=before.gpa?palette.success:palette.danger}>
    {last.gpa>=before.gpa?tr(`آخر ترم ${last.gpa.toFixed(2)} ▲ ${fmt(last.gpa-before.gpa)} عن اللي قبله`,`Last term ${last.gpa.toFixed(2)} ▲ ${fmt(last.gpa-before.gpa)}`):tr(`آخر ترم ${last.gpa.toFixed(2)} ▼ ${fmt(before.gpa-last.gpa)} عن اللي قبله`,`Last term ${last.gpa.toFixed(2)} ▼ ${fmt(before.gpa-last.gpa)}`)}
   </Txt>:null}
  </View></Glass>:null}
  {final&&points.length?<Glass><View style={{gap:8}}>
   <Txt variant="h3">{tr('معدّلك ترم بترم','GPA term by term')}</Txt>
   {best?<Txt variant="caption">{tr(`أحسن ترم: ${best.label} ${best.sub} (${best.gpa.toFixed(2)})`,`Best term: ${best.label} ${best.sub} (${best.gpa.toFixed(2)})`)}</Txt>:null}
   <GpaChart points={points} isAr={lang==='ar'} palette={palette}/>
  </View></Glass>:null}
  {final?history.map(t=>{const s=t.summary;const gpa=number(s?.GPA);const cg=number(s?.CGPA);
   return <Glass key={t.serial}><View style={{gap:6}}>
    <View style={{flexDirection:row,justifyContent:'space-between',alignItems:'center',gap:8}}>
     <Txt variant="h3">{`${termLabel(t)} ${t.year}`.trim()}</Txt>
     {gpa!==null?<Chip active color={gpaColor(gpa)} label={`GPA ${gpa.toFixed(2)}`}/>:null}
    </View>
    {t.courses.map(line)}
    {s?<Txt variant="caption">{tr(`التراكمي بعد الترم ده ${cg===null?'—':cg.toFixed(2)} · مكتسب ${text(s.CumEarnedCredits)||'—'} ساعة`,`CGPA after this term ${cg===null?'—':cg.toFixed(2)} · ${text(s.CumEarnedCredits)||'—'} credits earned`)}</Txt>:null}
   </View></Glass>;}):null}
  {final&&!history.length&&legacy.length?<Glass><View style={{gap:4}}><Txt variant="caption">{tr('ده آخر ترم بس. حدّث عشان يجيب كل الترمات.','Latest term only. Refresh to load every term.')}</Txt>{legacy.map(line)}</View></Glass>:null}
  {!final?current.map((c,i)=>{
   const code=text(c.CourseCode);const entry=cache[`GRADES:${code}`];
   const list=marks(entry?.data);const total=markTotal(list);
   return <Glass key={`${code}-${i}`}><View style={{gap:12}}>
    <View style={{flexDirection:row,alignItems:'center',gap:10}}>
     <PressScale style={{flex:1}} label={code} onPress={()=>router.push(`/course/${encodeURIComponent(code)}`)}>
      <Txt variant="h3" numberOfLines={2}>{title(c)}</Txt>
      <Txt variant="caption">{[code,text(c.CreditHours)?`${text(c.CreditHours)} ${tr('ساعات','cr')}`:''].filter(Boolean).join(' · ')}</Txt>
     </PressScale>
     {total?<Chip active label={`${fmt(total.score)} / ${fmt(total.outOf)}`}/>:null}
    </View>
    {total?<ProgressBar value={Math.min(1,total.score/total.outOf)}/>:null}
    {list.map(m=><View key={m.key} style={{flexDirection:row,alignItems:'center',justifyContent:'space-between',gap:12}}>
     <View style={{flex:1,gap:2}}><Txt>{m.label}</Txt><Txt variant="caption">{kindLabel(m)}</Txt></View>
     <Txt variant="label" color={markTone(m)}>{`${m.value||'—'}${m.max?` / ${m.max}`:''}`}</Txt>
    </View>)}
    {entry&&!list.length?<Txt variant="caption">{tr('لسه مفيش درجات نزلت للمادة دي. أول ما تنزل هتظهر هنا ويجيلك إشعار.','No marks yet. They will appear here, with a notification, once posted.')}</Txt>:null}
    <View style={{flexDirection:row,justifyContent:'space-between',alignItems:'center',gap:8}}>
     <Txt variant="caption" style={{flex:1}}>{entry?.at?tr(`آخر تحديث: ${when(entry.at)}`,`Updated: ${when(entry.at)}`):tr('لسه متحمّلتش','Not loaded yet')}</Txt>
     <Button small variant="glass" icon="refresh" title={tr('حدّث','Refresh')} loading={busy===code} disabled={!!busy||!a.session} onPress={()=>{void load(code);}}/>
    </View>
   </View></Glass>;
  }):null}
 </Screen>;
}