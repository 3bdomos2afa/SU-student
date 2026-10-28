import { backgroundSyncAvailable } from '@/lib/background-sync';
import { requestReminders } from '@/lib/notifications';
import { ReminderSettings } from '@/components/reminder-settings';
import { useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Glass, Header, Screen, Segmented, Txt } from '@/components/ui';
import { useApp, type ThemePref } from '@/context/app-context';
import { studentCode } from '@/lib/student';
import { PortalModal } from '@/components/portal-entry';
import { setJSON } from '@/lib/storage';

export default function Settings(){
 const a=useApp();const {tr,settings,updateSettings,session,palette,row,lang}=a;
 const [open,setOpen]=useState(false);
 const [msg,setMsg]=useState('');
 const [busy,setBusy]=useState(false);
 const code=studentCode(a.cache??{});
 const fail=()=>setMsg(tr('المسح منجحش، جرّب تاني','Could not clear storage; retry'));
 const signOut=()=>Alert.alert(tr('تسجيل الخروج؟','Sign out?'),
   tr('هتخرج من حساب الجامعة، والدرجات والجدول ومهامك المحفوظة على الجهاز هتتمسح. الكشكول هيفضل لحد ما تمسح كل البيانات.','You will be signed out. Saved grades, timetable and tasks on this device will be erased. Your notebook stays until you erase all data.'),
   [{text:tr('إلغاء','Cancel'),style:'cancel'},{text:tr('اخرج','Sign out'),style:'destructive',onPress:()=>{void a.signOut().then(()=>router.replace('/login')).catch(fail);}}]);
 const eraseAll=()=>Alert.alert(tr('تمسح كل بيانات الأبلكيشن؟','Erase all app data?'),
   tr('هيتمسح من الجهاز نهائي:\n• تسجيل دخولك\n• الدرجات والجدول والسجل المحفوظ\n• الكشكول بكل صفحاته ورسوماته\n• جدول المذاكرة والتذكيرات\n• مواد الخطة والحاسبة وبيانات مودل\n\nمفيش رجوع بعد كده. حسابك على موقع الجامعة مش هيتأثر.','This permanently erases from this device:\n• your sign-in\n• saved grades, timetable and records\n• the notebook with all pages and drawings\n• the study schedule and reminders\n• planner, calculator and Moodle data\n\nThis cannot be undone. Your university account is not affected.'),
   [{text:tr('إلغاء','Cancel'),style:'cancel'},{text:tr('امسح كله','Erase everything'),style:'destructive',onPress:()=>{setBusy(true);void a.eraseAll().then(()=>router.replace('/login')).catch(fail).finally(()=>setBusy(false));}}]);
 return <Screen>
   <Header title={tr('على راحتك','Make it yours')} subtitle="SU+ / 1.13.0"/>
   {!backgroundSyncAvailable ? <Glass><Txt variant="caption">{tr('المزامنة في الخلفية مش متاحة في النسخة دي. بس التحديث لما تفتح الأبلكيشن أو تعمل ريفرش لسه شغال.','Background sync is unavailable in this build. Foreground and manual refresh still work.')}</Txt></Glass> : null}
   <Glass><View style={{gap:12}}>
     <Txt variant="h3">{session?.name??tr('أدوات المذاكرة على جهازك','Local study tools')}</Txt>
     <Txt variant="caption">{session?`${tr('رقم الطالب','Student ID')}: ${code||tr('هيظهر بعد ما بياناتك تتحدث','shows after your data refreshes')}`:tr('مفيش حساب جامعة مربوط','No university account connected')}</Txt>
     <Button icon="logo-google" title={session?tr('جدّد الدخول بجوجل','Renew Google sign-in'):tr('ادخل بحساب جوجل الجامعي','Sign in with university Google')} onPress={()=>setOpen(true)}/>
     <Txt variant="caption">{tr('حساب جوجل بيفضل محفوظ على الموبايل لحد ما تعمل تسجيل خروج. لو الجلسة خلصت، دوسة واحدة بتدخلك تاني من غير ما تكتب الإيميل.','Your Google account stays remembered on this phone until you sign out. If the session ends, one tap signs you back in.')}</Txt>
     <Button small variant="glass" icon="person-remove-outline" title={tr('انسى حساب جوجل','Forget Google account')} onPress={()=>{void Promise.all([setJSON('su:v2:forget-web',true),setJSON('su:v2:google-used',false)]).then(()=>setMsg(tr('تمام، المرة الجاية هتختار الحساب من الأول.','Done — next time you pick the account again.'))).catch(fail);}}/>
   </View></Glass>
   <Glass><View style={{gap:16}}>
    <Txt variant="h3">{tr('اللغة والمظهر','Language & appearance')}</Txt>
    <Segmented options={[{value:'ar',label:'العربية'},{value:'en',label:'English'}]} value={lang} onChange={lang=>updateSettings({lang})}/>
    <Segmented<ThemePref> options={[{value:'light',label:tr('فاتح','Light')},{value:'dark',label:tr('داكن','Dark')},{value:'system',label:tr('الجهاز','System')}]} value={settings.theme} onChange={theme=>updateSettings({theme})}/>
    {[{title:tr('اهتزاز خفيف','Haptic feedback'),value:settings.haptics,onChange:(haptics:boolean)=>updateSettings({haptics})},
      {title:tr('إشعارات الغياب والإنذارات والدرجات','Absence, warning & grade alerts'),value:settings.alerts,onChange:(alerts:boolean)=>{updateSettings({alerts});if(alerts)void requestReminders();}},
      {title:tr('قفل بالبصمة','Biometric lock'),value:settings.biometric,onChange:async(v:boolean)=>{setMsg(await a.setBiometric(v)??'');}}].map(s=><View key={s.title} style={{flexDirection:row,alignItems:'center',justifyContent:'space-between'}}><Txt>{s.title}</Txt><Switch value={s.value} onValueChange={s.onChange} trackColor={{true:palette.primary}}/></View>)}
    <Txt variant="caption">{tr('بنشيّك على الجامعة أول ما تفتح الأبلكيشن أو النت يرجع، وكل 10 دقايق والأبلكيشن مفتوح، وفي الخلفية كل حوالي ربع ساعة لما الموبايل يسمح (أندرويد بيأخر ده لما البطارية موفّرة).','We check when you open the app or come back online, every 10 minutes while open, and in the background about every 15 minutes when the phone allows it.')}</Txt>
   </View></Glass>
   <Glass><View style={{gap:12}}>
     <Txt variant="h3">{tr('حسابك وبياناتك','Account & data')}</Txt>
     <Txt variant="sub">{tr('الجلسة وبياناتك متشفّرة على جهازك، ومش بنحفظ كلمة السر.','Your session and data are encrypted on this device. Passwords are never stored.')}</Txt>
     {session?<Button variant="glass" icon="log-out-outline" title={tr('تسجيل الخروج','Sign out')} onPress={signOut}/>:null}
     <Button variant="danger" icon="trash-outline" title={tr('امسح كل بيانات الأبلكيشن','Erase all app data')} loading={busy} onPress={eraseAll}/>
     <Txt variant="caption" color={palette.danger}>{tr('المسح بيشيل كل حاجة من الجهاز، ومنها الكشكول وجدول المذاكرة، ومفيش رجوع.','Erasing removes everything on this device, including the notebook and study schedule. It cannot be undone.')}</Txt>
     {msg?<Txt color={palette.warn}>{msg}</Txt>:null}
   </View></Glass>
   <ReminderSettings/>
   <Txt variant="caption" center>{tr('الخطة والحاسبة أدوات مساعدة بس، مش قرار تسجيل ولا كشف درجات رسمي.','Planner and calculator are aids, not official registration or transcripts.')}</Txt>
   <PortalModal visible={open} onClose={()=>setOpen(false)}/>
 </Screen>;
}