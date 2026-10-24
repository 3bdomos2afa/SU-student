import { useState } from 'react';
import { Linking, Platform, Switch, View } from 'react-native';
import { useApp } from '@/context/app-context';
import { requestReminders, reconcileReminders } from '@/lib/notifications';
import { Glass, Txt, Button } from './ui';
export function ReminderSettings(){
 const {tr,reminders,setReminders,row,palette,reminderError}=useApp();
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function enable(on:boolean){
  setBusy(true);try{
   if(on&&!await requestReminders()){setMessage(tr('الإذن غير متاح. اسمح بالإشعارات من إعدادات الجهاز؛ تحتاج نسخة موبايل مثبتة.','Permission unavailable. Allow notifications in device settings; an installed mobile app is required.'));return;}
   setReminders({enabled:on});if(!on)await reconcileReminders([]);
   setMessage(on?tr('تم التفعيل. لا تظهر أسماءك أو درجاتك على شاشة القفل.','Enabled. Names and marks are not displayed on the lock screen.'):'');
  }catch{setMessage(tr('تعذر ضبط التذكيرات؛ جرّب في النسخة المثبتة.','Could not configure reminders. Try an installed build.'));}
  finally{setBusy(false);}
 }
 return <Glass><View style={{gap:14}}>
  <View style={{flexDirection:row,alignItems:'center',justifyContent:'space-between'}}><Txt variant="h3">{tr('تذكيرات يومك','Your reminders')}</Txt><Switch disabled={busy} accessibilityLabel={tr('تفعيل الإشعارات','Enable reminders')} value={reminders.enabled} onValueChange={enable}/></View>
  {([
   ['tasks',tr('المهام ووقت الجلسة','Tasks & session times')],
   ['classes',tr('قبل المحاضرة بـ10 دقائق','10 minutes before class')],
   ['daily',tr('ملخص اليوم الساعة 7 صباحًا','Daily schedule at 7 AM')],
   ['absence',tr('عند وصول تحديث تنبيهات الغياب','When absence notices are synchronized')]
  ] as const).map(([k,title])=><View key={k} style={{flexDirection:row,justifyContent:'space-between',alignItems:'center',gap:10}}>
    <Txt style={{flex:1}}>{title}</Txt><Switch disabled={!reminders.enabled} value={reminders[k]} onValueChange={v=>setReminders({[k]:v})}/>
   </View>)}
  <Txt variant="caption">{tr('محليًا على الجهاز: أقرب 48 تذكيرًا، جدول الجامعة للأسبوع المقبل والمهام لأسبوعين. افتح التطبيق لتجديدها. الغياب يحتاج مزامنة فعلية، ولا تتم مراقبته والتطبيق مغلق.','On-device: the next 48 reminders, one week of classes and two weeks of tasks. Reopen to renew them. Absence notices require a real sync; there is no monitoring while the app is closed.')}</Txt>
  {reminderError&&<Txt color={palette.warn}>{tr('تعذر جدولة بعض التذكيرات. راجع الإذن واتصال إعدادات الجهاز ثم أعد فتح التطبيق للمحاولة.','Some reminders could not be scheduled. Check device permissions, then reopen the app to retry.')}</Txt>}
  {!!message&&<Txt color={palette.warn}>{message}</Txt>}
  {Platform.OS!=='web'&&<Button small variant="glass" title={tr('إعدادات إشعارات الجهاز','Device notification settings')} onPress={()=>{void Linking.openSettings().catch(()=>{});}}/>}
 </View></Glass>;
}