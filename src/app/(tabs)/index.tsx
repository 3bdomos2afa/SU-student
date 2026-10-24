import { router } from 'expo-router';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Chip, Glass, Header, IconBadge, PressScale, ProgressBar, Screen, SectionTitle, Txt } from '@/components/ui';
import { useApp } from '@/context/app-context';
import { earnedCredits, PROGRAM_TOTAL_CREDITS } from '@/data/curriculum-helpers';
import { quickActions, serviceByAction } from '@/data/services';
import { timeAgo } from '@/lib/format';

export default function Home(){
 const a=useApp();const {session,tr,lang,row,palette,completed,cache,tasks}=a;
 const earned=earnedCredits(completed);
 const open=tasks.filter(t=>!t.done);
 const date=new Date().toLocaleDateString(lang==='ar'?'ar-EG':'en-GB',{weekday:'long',month:'long',day:'numeric'});
 return <Screen refreshing={a.refreshing} onRefresh={a.refreshAll}>
  <View style={{flexDirection:row,alignItems:'center',justifyContent:'space-between'}}><Txt variant="label">SU / STUDENT</Txt><Chip label={lang==='ar'?'EN':'AR'} onPress={()=>a.updateSettings({lang:lang==='ar'?'en':'ar'})}/></View>
  <Header title={session?tr(`أهلًا، ${session.name.split(' ')[0]}`,`Hi, ${session.name.split(' ')[0]}`):tr('يوم جديد. خطوة أقرب.','New day. One step closer.')} subtitle={date}/>
  <LinearGradient colors={['#143F40','#216B61']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:28,padding:24,gap:12}}>
    <Txt variant="caption" color="#C3E5D6">{tr('مساحتك الدراسية','YOUR STUDY SPACE')}</Txt>
    <Txt variant="h1" color="#FFFFFF">{tr('ركّز على اللي جاي.','Make room\nfor what’s next.')}</Txt>
    <Txt color="#D6EBE3">{open.length?tr(`عندك ${open.length} مهام مفتوحة. خلّص واحدة وابدأ يومك.`,`${open.length} open tasks. Start with one small win.`):tr('رتّب مهامك، وابدأ جلسة تركيز من غير تشتيت.','Plan your tasks. Start a distraction-free focus session.')}</Txt>
    <Button icon="timer-outline" title={tr('ابدأ وقت المذاكرة','Start study time')} onPress={()=>router.push('/study')}/>
  </LinearGradient>
  {a.authExpired?<Glass><Txt color={palette.warn}>{tr('الجلسة انتهت. البيانات المحفوظة ما زالت متاحة.','Session expired. Saved data is still available.')}</Txt><Button title={tr('تجديد الدخول','Renew login')} onPress={()=>router.push('/settings')}/></Glass>:null}
  {a.syncErrors>0?<Glass><Txt color={palette.warn}>{tr(`تعذر تحديث ${a.syncErrors} من الخدمات التي جُرّبت. اسحب للتحديث أو افتح الخدمة لمعرفة التفاصيل.`, `${a.syncErrors} attempted services could not refresh. Pull to retry or open the service for details.`)}</Txt></Glass>:null}
  {a.storageError?<Glass><Txt color={palette.warn}>{tr('تعذر حفظ بعض التغييرات؛ افحص مساحة الجهاز.','Some changes could not be saved. Check device storage.')}</Txt></Glass>:null}
  {!session?<Glass><View style={{gap:10}}><Txt variant="h3">{tr('بياناتك الحقيقية تبدأ هنا','Connect your university records')}</Txt><Txt variant="sub">{tr('الدخول من موقع الجامعة لعرض بيانات حسابك.','Sign in on the university website to view your own records.')}</Txt><Button title={tr('ربط حساب الجامعة','Connect university account')} onPress={()=>router.push('/login')}/></View></Glass>:null}
  <SectionTitle title={tr('الجامعة في لمحة','Campus at a glance')} action={tr('كل الخدمات','All services')} onAction={()=>router.push('/services')}/>
  <View style={{flexDirection:row,flexWrap:'wrap',gap:12}}>
    {quickActions.map(action=>{const s=serviceByAction(action)!;return <PressScale key={action} style={{width:'46%',flexGrow:1}} onPress={()=>router.push(`/service/${action}`)}><Glass padding={18}>
      <IconBadge icon={s.icon} color={palette[s.color]}/>
      <Txt variant="h3" style={{marginTop:14}}>{s.title[lang]}</Txt>
      <Txt variant="caption" style={{marginTop:4}}>{cache[action]?timeAgo(cache[action].at,lang):tr('لم تتم المزامنة','Not synced')}</Txt>
    </Glass></PressScale>;})}
  </View>
  <SectionTitle title={tr('خطوتك نحو التخرج','Your graduation path')} action={tr('عرض الخطة','View plan')} onAction={()=>router.push('/plan')}/>
  <Glass padding={22}><View style={{gap:12}}>
    <View style={{flexDirection:row,justifyContent:'space-between',alignItems:'baseline'}}><Txt variant="h1">{earned}<Txt variant="sub"> / {PROGRAM_TOTAL_CREDITS}</Txt></Txt><Txt variant="caption">{tr('ساعة في خطتك اليدوية','credits in your manual plan')}</Txt></View>
    <ProgressBar value={earned/PROGRAM_TOTAL_CREDITS} height={10}/>
    <Txt variant="caption">{tr('تقدّم يدوي حسب المواد التي علّمتها؛ مش السجل الرسمي. الخطة المرفقة لتخصص IT.','Manual progress based on courses you marked; not an official transcript. Included curriculum is for IT.')}</Txt>
  </View></Glass>
  <SectionTitle title={tr('على قائمتك','On your list')} action={tr('إدارة','Manage')} onAction={()=>router.push('/study')}/>
  <Glass><View style={{gap:14}}>
    {open.length?open.slice(0,3).map(t=><PressScale key={t.id} onPress={()=>a.toggleTask(t.id)}><View style={{flexDirection:row,alignItems:'center',gap:10}}><IconBadge icon="ellipse-outline" color={palette.primary} size={28}/><Txt style={{flex:1}}>{t.title}</Txt></View></PressScale>):<Txt variant="sub">{tr('مفيش مهام مفتوحة. ضيف أول مهمة من مساحة المذاكرة.','All clear. Add your first task in the study space.')}</Txt>}
  </View></Glass>
  {session?<Txt variant="caption" center>{tr('أحدث تحديث لخدمة','Most recent service update')}: {timeAgo(a.lastSync,lang)} · {Object.keys(cache).length} {tr('خدمات محفوظة','saved services')}</Txt>:null}
 </Screen>;
}