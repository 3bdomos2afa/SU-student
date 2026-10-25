import { backgroundSyncAvailable } from '@/lib/background-sync';
import { requestReminders } from '@/lib/notifications';
import { ReminderSettings } from '@/components/reminder-settings';
import { useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Glass, Header, Screen, Segmented, Txt } from '@/components/ui';
import { useApp, type ThemePref } from '@/context/app-context';
import { timeAgo } from '@/lib/format';
import { PortalModal } from '@/components/portal-entry';

export default function Settings(){
 const a=useApp();const {tr,settings,updateSettings,session,palette,row,lang}=a;
 const [open,setOpen]=useState(false);
 const [msg,setMsg]=useState('');
 return <Screen>
   <Header title={tr('على راحتك','Make it yours')} subtitle="SU Student / 1.6.3"/>
   {!backgroundSyncAvailable ? <Glass><Txt variant="caption">{tr('مزامنة الخلفية مش متاحة في النسخة دي. التحديث عند فتح التطبيق والريفرش لسه شغال.','Background sync is unavailable in this build. Foreground and manual refresh still work.')}</Txt></Glass> : null}
   <Glass><View style={{gap:12}}>
     <Txt variant="h3">{session?.name??tr('أدوات المذاكرة على جهازك','Local study tools')}</Txt>
     <Txt variant="caption">{session?`${tr('رقم الطالب','Student ID')}: ${session.studentId}`:tr('مفيش حساب جامعة مربوط','No university account connected')}</Txt>
     <Button title={tr('دخول بوابة الجامعة','Sign in to university portal')} onPress={()=>setOpen(true)}/>
   </View></Glass>
   <Glass><View style={{gap:16}}>
    <Txt variant="h3">{tr('اللغة والمظهر','Language & appearance')}</Txt>
    <Segmented options={[{value:'ar',label:'العربية'},{value:'en',label:'English'}]} value={lang} onChange={lang=>updateSettings({lang})}/>
    <Segmented<ThemePref> options={[{value:'light',label:tr('فاتح','Light')},{value:'dark',label:tr('داكن','Dark')},{value:'system',label:tr('الجهاز','System')}]} value={settings.theme} onChange={theme=>updateSettings({theme})}/>
    {[{title:tr('اهتزاز خفيف','Haptic feedback'),value:settings.haptics,onChange:(haptics:boolean)=>updateSettings({haptics})},
      {title:tr('إشعارات الغياب والإنذارات والدرجات','Absence, warning & grade alerts'),value:settings.alerts,onChange:(alerts:boolean)=>{updateSettings({alerts});if(alerts)void requestReminders();}},
      {title:tr('قفل بالبصمة','Biometric lock'),value:settings.biometric,onChange:async(v:boolean)=>{setMsg(await a.setBiometric(v)??'');}}].map(s=><View key={s.title} style={{flexDirection:row,alignItems:'center',justifyContent:'space-between'}}><Txt>{s.title}</Txt><Switch value={s.value} onValueChange={s.onChange} trackColor={{true:palette.primary}}/></View>)}
    {msg?<Txt color={palette.warn}>{msg}</Txt>:null}
    <Txt variant="caption">{tr('بنشيّك على الجامعة أول ما تفتح الأبلكيشن أو النت يرجع، وفي الخلفية كل حوالي نص ساعة لما الموبايل يسمح.','We check when you open the app or come back online, and in the background about every 30 minutes when the phone allows it.')}</Txt>
   </View></Glass>
   <Glass><View style={{gap:12}}>
     <Txt variant="h3">{tr('البيانات والخصوصية','Data & privacy')}</Txt>
     <Txt variant="caption">{tr('آخر خدمة اتحدثت','Most recent service update')}: {timeAgo(a.lastSync,lang)}</Txt>
     <Txt variant="sub">{tr('الجلسة والبيانات المحفوظة متشفّرة على جهازك، ومش بنحفظ كلمة السر. موقع الجامعة نفسه HTTP ومش مشفّر. تسجيل الخروج بيمسح بيانات الحساب وأدواته المحفوظة.','Session and saved data are encrypted on-device. Passwords are never stored. The website itself uses unencrypted HTTP. Signing out deletes this account’s cached records and study data.')}</Txt>
     <Button title={tr('تحديث الخدمات المدعومة','Refresh supported services')} loading={a.refreshing} disabled={!session||!a.online} onPress={a.refreshAll}/>
     <Button variant="glass" title={tr('مسح البيانات المحفوظة أوفلاين','Clear offline records')} onPress={()=>{void a.clearCache();}}/>
     {session?<Button variant="danger" title={tr('اخرج وامسح بيانات الحساب','Sign out & erase account data')} onPress={()=>Alert.alert(tr('تأكيد','Confirm'),tr('بيانات الحساب ومهامه اللي على الجهاز هتتمسح.','This account’s records and local tasks will be erased.'),[{text:tr('إلغاء','Cancel'),style:'cancel'},{text:tr('خروج','Sign out'),style:'destructive',onPress:()=>{void a.signOut().then(()=>router.replace('/login')).catch(()=>setMsg(tr('المسح منجحش، جرّب تاني','Could not clear storage; retry')));}}])}/>:null}
   </View></Glass>
   <ReminderSettings/>
   <Txt variant="caption" center>{tr('الخطة والحاسبة أدوات مساعدة بس، مش قرار تسجيل ولا كشف درجات رسمي.','Planner and calculator are aids, not official registration or transcripts.')}</Txt>
   <PortalModal visible={open} onClose={()=>setOpen(false)}/>
 </Screen>;
}