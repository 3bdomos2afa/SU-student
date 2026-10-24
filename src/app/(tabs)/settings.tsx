import { useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Glass, Header, Screen, Segmented, Txt } from '@/components/ui';
import { useApp, type ThemePref } from '@/context/app-context';
import { timeAgo } from '@/lib/format';
import { PortalModal } from '@/components/portal-modal';

export default function Settings(){
 const a=useApp();const {tr,settings,updateSettings,session,palette,row,lang}=a;
 const [open,setOpen]=useState(false);
 const [msg,setMsg]=useState('');
 return <Screen>
   <Header title={tr('على راحتك','Make it yours')} subtitle="SU Student / 1.2.0"/>
   <Glass><View style={{gap:12}}>
     <Txt variant="h3">{session?.name??tr('أدوات الدراسة المحلية','Local study tools')}</Txt>
     <Txt variant="caption">{session?`${tr('رقم الطالب','Student ID')}: ${session.studentId}`:tr('لم يتم ربط حساب جامعة','No university account connected')}</Txt>
     <Button title={tr('الدخول إلى بوابة الجامعة','Sign in to university portal')} onPress={()=>setOpen(true)}/>
   </View></Glass>
   <Glass><View style={{gap:16}}>
    <Txt variant="h3">{tr('اللغة والمظهر','Language & appearance')}</Txt>
    <Segmented options={[{value:'ar',label:'العربية'},{value:'en',label:'English'}]} value={lang} onChange={lang=>updateSettings({lang})}/>
    <Segmented<ThemePref> options={[{value:'light',label:tr('فاتح','Light')},{value:'dark',label:tr('داكن','Dark')},{value:'system',label:tr('الجهاز','System')}]} value={settings.theme} onChange={theme=>updateSettings({theme})}/>
    {[{title:tr('اهتزاز خفيف','Haptic feedback'),value:settings.haptics,onChange:(haptics:boolean)=>updateSettings({haptics})},
      {title:tr('قفل بالبصمة','Biometric lock'),value:settings.biometric,onChange:async(v:boolean)=>{setMsg(await a.setBiometric(v)??'');}}].map(s=><View key={s.title} style={{flexDirection:row,alignItems:'center',justifyContent:'space-between'}}><Txt>{s.title}</Txt><Switch value={s.value} onValueChange={s.onChange} trackColor={{true:palette.primary}}/></View>)}
    {msg?<Txt color={palette.warn}>{msg}</Txt>:null}
   </View></Glass>
   <Glass><View style={{gap:12}}>
     <Txt variant="h3">{tr('البيانات والخصوصية','Data & privacy')}</Txt>
     <Txt variant="caption">{tr('آخر خدمة تم تحديثها','Most recent service update')}: {timeAgo(a.lastSync,lang)}</Txt>
     <Txt variant="sub">{tr('الجلسة والبيانات المحفوظة مشفّرة على الجهاز. لا نخزّن كلمة السر. الموقع نفسه HTTP غير مشفّر. تسجيل الخروج يمسح بيانات الحساب وأدواته المحفوظة.','Session and saved data are encrypted on-device. Passwords are never stored. The website itself uses unencrypted HTTP. Signing out deletes this account’s cached records and study data.')}</Txt>
     <Button title={tr('تحديث الخدمات المدعومة','Refresh supported services')} loading={a.refreshing} disabled={!session||!a.online} onPress={a.refreshAll}/>
     <Button variant="glass" title={tr('مسح البيانات المحفوظة أوفلاين','Clear offline records')} onPress={()=>{void a.clearCache();}}/>
     {session?<Button variant="danger" title={tr('تسجيل خروج ومسح بيانات الحساب','Sign out & erase account data')} onPress={()=>Alert.alert(tr('تأكيد','Confirm'),tr('ستُمسح بيانات الحساب والمهام المحلية الخاصة به.','This account’s records and local tasks will be erased.'),[{text:tr('إلغاء','Cancel'),style:'cancel'},{text:tr('خروج','Sign out'),style:'destructive',onPress:()=>{void a.signOut().then(()=>router.replace('/login')).catch(()=>setMsg(tr('تعذر المسح؛ أعد المحاولة','Could not clear storage; retry')));}}])}/>:null}
   </View></Glass>
   <Txt variant="caption" center>{tr('الخطة والحاسبة أدوات مساعدة، وليست قرار تسجيل أو كشف درجات رسمي.','Planner and calculator are aids, not official registration or transcripts.')}</Txt>
   <PortalModal visible={open} onClose={()=>setOpen(false)}/>
 </Screen>;
}