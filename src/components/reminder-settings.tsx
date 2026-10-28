import { useState } from 'react';
import { Linking, Platform, Pressable, Switch, View } from 'react-native';
import { useApp } from '@/context/app-context';
import { requestReminders, reconcileReminders, exactAlarms } from '@/lib/notifications';
import { detectGender, type GenderPref } from '@/lib/notify-text';
import type { PrefKey } from '@/lib/reminder-plan';
import { Glass, Txt, Button } from './ui';

/** One switch per notification type, grouped by where it comes from. */
export function ReminderSettings(){
 const {tr,reminders,setReminders,row,palette,reminderError,cache}=useApp();
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function enable(on:boolean){
  setBusy(true);try{
   if(on&&!await requestReminders()){setMessage(tr('الإذن مش متاح. اسمح بالإشعارات من إعدادات الجهاز.','Permission unavailable. Allow notifications in device settings.'));return;}
   setReminders({enabled:on});if(!on)await reconcileReminders([]);
   if(on)void exactAlarms(true);
   setMessage('');
  }catch{setMessage(tr('مقدرناش نظبط الإشعارات. جرّب من النسخة المتثبتة.','Could not configure notifications. Try an installed build.'));}
  finally{setBusy(false);}
 }
 const groups:[string,[PrefKey,string][]][]=[
  [tr('الجدول','Timetable'),[
   ['daily',tr('ملخص يومك الساعة 7 الصبح','Your day at 7 AM')],
   ['classes',tr('قبل المحاضرة/السكشن بـ10 دقايق','10 minutes before each class')],
  ]],
  [tr('الدرجات والغياب','Marks & attendance'),[
   ['coursework',tr('درجة الكورس ورك نزلت','Coursework mark posted')],
   ['midterm',tr('درجات الميد ظهرت','Midterm marks posted')],
   ['final',tr('درجات الفاينل ظهرت','Final results posted')],
   ['absence',tr('غياب جديد ونسبته','New absence and its %')],
   ['warning',tr('إنذار غياب','Absence warning')],
  ]],
  [tr('المذاكرة','Studying'),[
   ['tasks',tr('قبل المهمة بالوقت اللي تختاره','Before a task (your chosen time)')],
   ['overdue',tr('مهمة متعملتش بعد ساعتين','Task not done 2 hours later')],
   ['streak',tr('الاستريك (9 م، 10 م، 11:30 م)','Streak (9 PM, 10 PM, 11:30 PM)')],
   ['summary',tr('ملخص مذاكرة آخر اليوم','End-of-day study summary')],
  ]],
  ['KMoodle',[
   ['moodle',tr('الدكتور رفع محاضرة أو اسايمنت','New lecture file or assignment')],
  ]],
 ];
 const detected=detectGender(cache);
 const genders:[GenderPref,string][]=[
  ['auto',tr(`تلقائي${detected==='f'?' (طالبة)':detected==='m'?' (طالب)':''}`,`Auto${detected?` (${detected==='f'?'female':'male'})`:''}`)],
  ['m',tr('طالب','Male')],['f',tr('طالبة','Female')],
 ];
 const sw=(k:PrefKey,title:string)=><View key={k} style={{flexDirection:row,justifyContent:'space-between',alignItems:'center',gap:10}}>
  <Txt style={{flex:1}}>{title}</Txt><Switch disabled={!reminders.enabled} value={reminders[k]} onValueChange={v=>setReminders({[k]:v})}/>
 </View>;
 return <Glass><View style={{gap:14}}>
  <View style={{flexDirection:row,alignItems:'center',justifyContent:'space-between'}}><Txt variant="h3">{tr('الإشعارات','Notifications')}</Txt><Switch disabled={busy} accessibilityLabel={tr('كل الإشعارات','All notifications')} value={reminders.enabled} onValueChange={enable}/></View>
  {groups.map(([head,items])=><View key={head} style={{gap:10}}>
   <Txt variant="caption" color={palette.sub}>{head}</Txt>
   {items.map(([k,t])=>sw(k,t))}
  </View>)}
  <View style={{gap:8}}>
   <Txt variant="caption" color={palette.sub}>{tr('صيغة الكلام','Wording')}</Txt>
   <View style={{flexDirection:row,gap:8,flexWrap:'wrap'}}>
    {genders.map(([v,l])=>{const on=(reminders.gender??'auto')===v;return <Pressable key={v} accessibilityRole="button" accessibilityState={{selected:on}} onPress={()=>setReminders({gender:v})}
     style={{paddingVertical:8,paddingHorizontal:14,borderRadius:999,borderWidth:1,borderColor:on?palette.primary:palette.faint,backgroundColor:on?palette.primary:'transparent'}}>
     <Txt style={{color:on?'#fff':palette.text}}>{l}</Txt></Pressable>;})}
   </View>
  </View>
  <Txt variant="caption">{tr('الإشعارات بتتجدول على الموبايل نفسه، ومفيش إشعارات "اتحدّث" أو "خلص التحديث". في الإجازة من غير جدول، إشعارات الجدول بتقف لوحدها والباقي شغال.','Scheduled on the device. No "sync finished" noise. During breaks with no timetable, class reminders pause; the rest keep working.')}</Txt>
  {reminderError&&<Txt color={palette.warn}>{tr('فيه إشعارات متجدولتش. راجع الإذن من إعدادات الجهاز وافتح التطبيق تاني.','Some notifications could not be scheduled. Check device permissions, then reopen the app.')}</Txt>}
  {!!message&&<Txt color={palette.warn}>{message}</Txt>}
  {Platform.OS!=='web'&&<Button small variant="glass" title={tr('إعدادات إشعارات الجهاز','Device notification settings')} onPress={()=>{void Linking.openSettings().catch(()=>{});}}/>}
 </View></Glass>;
}