import { FocusCard } from '@/components/focus-card';
import { Entrance } from '@/components/entrance';
import { localDate } from '@/lib/academic';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useApp } from '@/context/app-context';
import { academic } from '@/lib/academic';
import { earnedCredits, PROGRAM_TOTAL_CREDITS } from '@/data/curriculum-helpers';
import { curriculumCourses } from '@/data/curriculum';
import { Avatar, Button, Chip, Glass, IconBadge, PressScale, ProgressBar, Screen, SectionTitle, Txt } from '@/components/ui';
import { AbsenceCards, DaySchedule, TodayTasks } from '@/components/academic-cards';
import type { IconName } from '@/data/services';
import { timeAgo } from '@/lib/format';
export default function Home(){
 const a=useApp();const {tr,lang,row,palette,session,cache}=a;const data=academic(cache);
 const name=data.name||session?.name||tr('مساحتك الجامعية','Your campus space');
 const metrics=[
  {label:tr('مواد ناجحة محمّلة','Passed · loaded'),value:data.hasTranscript?data.passed.size:null,total:curriculumCourses.length,icon:'checkmark-circle-outline' as IconName,source:tr('من السجل المحمّل، قد لا يشمل كل السنوات','Loaded transcript may not cover all years')},
  {label:tr('ساعات مكتسبة','Earned credits'),value:data.earned,total:PROGRAM_TOTAL_CREDITS,icon:'layers-outline' as IconName,source:tr('رصيد تراكمي · خطة IT: 144 ساعة','Cumulative credits · IT target: 144')},
  {label:'CGPA',value:data.gpa,total:4,icon:'sparkles-outline' as IconName,source:tr('مقياس العرض 4.0؛ القيمة كما ترسلها الجامعة','4.0 display scale; value supplied by university')}
 ];
 return <Screen refreshing={a.refreshing} onRefresh={a.refreshAll}>
  <View style={{flexDirection:row,justifyContent:'space-between',alignItems:'center'}}>
   <Txt variant="label" color={palette.primary}>SU / CAMPUS</Txt><Chip label={lang==='ar'?'EN':'AR'} onPress={()=>a.updateSettings({lang:lang==='ar'?'en':'ar'})}/>
  </View>
  <Entrance><Glass padding={24}><View style={{gap:16}}>
   <View style={{flexDirection:row,alignItems:'center',gap:14}}><Avatar name={name} size={56}/><View style={{flex:1}}>
    <Txt variant="caption">{tr('أهلًا بعودتك','WELCOME BACK')}</Txt><Txt variant="h2">{name}</Txt>
    <Txt variant="caption">{session?`ID · ${session.studentId}`:tr('لم يتم ربط حساب','Account not connected')}</Txt>
   </View></View>
   <Txt variant="sub">{data.faculty||tr('كل يوم، أقرب للي نفسك فيه.','Every day, closer to your goals.')}</Txt>
   <Button title={tr('جدول المذاكرة والمهام','Study schedule & tasks')} icon="calendar-outline" onPress={()=>router.push('/study')}/>
  </View></Glass></Entrance>
  <View style={{flexDirection:row,gap:10}}>
   <PressScale style={{flex:1}} label={tr('مهام اليوم','Today tasks')} onPress={()=>router.push('/study')}><Glass padding={16}><View style={{gap:8}}><IconBadge icon="checkmark-done-outline" color={palette.success}/><Txt variant="h2">{a.tasks.filter(t=>!t.done&&(!t.date||t.date===localDate())).length}</Txt><Txt variant="caption">{tr('خطوات بانتظارك اليوم','Steps waiting today')}</Txt></View></Glass></PressScale>
   <PressScale style={{flex:1}} label={tr('مواعيد الجامعة','Campus timetable')} onPress={()=>router.push('/timetable')}><Glass padding={16}><View style={{gap:8}}><IconBadge icon="calendar-outline" color={palette.primary}/><Txt variant="h2">{cache.SEC_TIMETABLE?data.slots.filter(s=>s.day===new Date().getDay()).length:'—'}</Txt><Txt variant="caption">{tr('مواعيد في الجدول المحفوظ','Sessions in saved timetable')}</Txt></View></Glass></PressScale>
  </View>
  {a.focus.endAt!==null&&<FocusCard compact/>}
  {!session?<Button title={tr('اربط حساب الجامعة','Connect university account')} icon="log-in-outline" onPress={()=>router.push('/login')}/>:null}
  {a.authExpired?<Button title={tr('الجلسة انتهت — سجّل مجددًا','Session expired — sign in again')} onPress={()=>router.push('/settings')}/>:null}
  {(a.syncErrors>0||a.storageError)?<Glass><Txt color={palette.warn}>{a.storageError?tr('تعذر حفظ بعض التغييرات. افحص مساحة الجهاز.','Some changes could not be saved. Check device space.'):tr('بعض الخدمات لم تتحدث؛ آخر بيانات محفوظة ما زالت ظاهرة.','Some services could not refresh; last saved records remain visible.')}</Txt></Glass>:null}
  <SectionTitle title={tr('صورتك الأكاديمية','Academic overview')} action={tr('الخريطة','Map')} onAction={()=>router.push('/plan')}/>
  <Glass><View style={{gap:20}}>
   {metrics.map((m,i)=><View key={m.label} style={{gap:8}}>
    <View style={{flexDirection:row,justifyContent:'space-between',alignItems:'center',gap:12}}>
     <View style={{flexDirection:row,alignItems:'center',gap:10}}><IconBadge icon={m.icon} color={[palette.primary,palette.accent,palette.pink][i]} size={34}/><Txt variant="label">{m.label}</Txt></View>
     <Txt variant="h2">{m.value===null?'—':i===2?m.value.toFixed(2):m.value} <Txt variant="caption">{m.value===null?'':`${Math.round(m.value/m.total*100)}%`}</Txt></Txt>
    </View>
    <ProgressBar value={(m.value??0)/m.total} color={[palette.primary,palette.accent,palette.pink][i]}/>
    <Txt variant="caption">{m.value===null?tr('لم تصل بيانات مؤكدة بعد','No confirmed data yet'):m.source}</Txt>
   </View>)}
  </View></Glass>
  {!session&&a.completed.size>0?<Txt variant="caption">{tr(`خطتك اليدوية منفصلة: ${a.completed.size} مواد، ${earnedCredits(a.completed)} ساعة.`,`Separate manual plan: ${a.completed.size} courses, ${earnedCredits(a.completed)} credits.`)}</Txt>:null}
  <SectionTitle title={tr('يومك في الجامعة','Your campus day')} action={tr('الجدول الكامل','Full timetable')} onAction={()=>router.push('/timetable')}/>
  <DaySchedule/>
  <SectionTitle title={tr('الغياب تحت عينك','Absence overview')} action={tr('الكل','All')} onAction={()=>router.push('/service/SEC_ATTENDANCE')}/>
  <AbsenceCards/>
  <SectionTitle title={tr('درجاتك ومواعيدك','Grades & schedules')}/>
  <View style={{flexDirection:row,flexWrap:'wrap',gap:12}}>
   {[
    {ar:'الميد والكورس ورك',en:'Midterm & coursework',icon:'create-outline',path:'/grades',color:palette.primary},
    {ar:'نتائج الفاينل',en:'Final results',icon:'ribbon-outline',path:'/grades?mode=final',color:palette.pink},
    {ar:'الجدول الكامل',en:'Full timetable',icon:'calendar-outline',path:'/timetable',color:palette.accent},
    {ar:'الخدمات',en:'Student services',icon:'grid-outline',path:'/services',color:palette.success}
   ].map(c=><PressScale key={c.en} label={tr(c.ar,c.en)} style={{width:'46%',flexGrow:1}} onPress={()=>router.push(c.path as never)}><Glass padding={18}><View style={{gap:16}}><IconBadge icon={c.icon as IconName} color={c.color}/><Txt variant="h3">{tr(c.ar,c.en)}</Txt></View></Glass></PressScale>)}
  </View>
  <SectionTitle title={tr('خطواتك النهارده','Today’s small wins')} action={tr('تنظيم','Organize')} onAction={()=>router.push('/study')}/>
  <TodayTasks/>
  <Txt variant="caption" center>{tr('أحدث مزامنة لخدمة','Latest service sync')} · {timeAgo(a.lastSync,lang)}</Txt>
 </Screen>;
}