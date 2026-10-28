import { Platform } from 'react-native';
import type { PlannedReminder } from './reminder-plan';
const native=async()=>Platform.OS==='web'?null:import('expo-notifications');
type N=typeof import('expo-notifications');
let queue:Promise<boolean>=Promise.resolve(true);
let generation=0;
/** Android channel sound cannot change after creation, hence a versioned id for the chime channel. */
export const TASK_CHANNEL='su-tasks-v2';
export const TASK_SOUND='su_chime.wav';
/** High importance so reminders pop up as banners; channel importance cannot change later, hence a new id. */
export const MAIN_CHANNEL='su-main-v3';
const SHOW={shouldShowBanner:true,shouldShowList:true,shouldPlaySound:true,shouldSetBadge:false};
let handlerSet=false;
/** Installed at startup so notifications also show while the app is open. */
export async function installNotificationHandler(){
 if(handlerSet)return;const n=await native();if(!n)return;
 n.setNotificationHandler({handleNotification:async()=>SHOW});handlerSet=true;
}
void installNotificationHandler().catch(()=>{});
export async function ensureChannels(n:N){
 if(Platform.OS!=='android')return;
 await n.setNotificationChannelAsync(MAIN_CHANNEL,{name:'الجدول والمذاكرة',description:'ملخص اليوم، قبل المحاضرة، الاستريك والمهام',importance:n.AndroidImportance.HIGH,
  vibrationPattern:[0,200,120,200],enableVibrate:true,lockscreenVisibility:n.AndroidNotificationVisibility.PRIVATE});
 await n.deleteNotificationChannelAsync('study').catch(()=>{});
 await n.setNotificationChannelAsync(TASK_CHANNEL,{name:'مواعيد المهام والتركيز',description:'تنبيه بصوت قبل المهمة بدقايق ووقت بدايتها',
  importance:n.AndroidImportance.HIGH,sound:TASK_SOUND,vibrationPattern:[0,260,140,260],enableVibrate:true,lightColor:'#6D28D9',
  lockscreenVisibility:n.AndroidNotificationVisibility.PRIVATE});
}
export async function requestReminders(){
 const n=await native();if(!n)return false;
 await ensureChannels(n).catch(()=>{});
 const p=await n.requestPermissionsAsync();
 return p.granted||p.ios?.status===n.IosAuthorizationStatus.PROVISIONAL;
}
/** Asks for the notification permission (Android 13+/iOS) without nagging: only while the system still allows asking. */
export async function prepareNotifications(){
 const n=await native();if(!n)return false;
 await ensureChannels(n).catch(()=>{});await installNotificationHandler().catch(()=>{});
 let p=await n.getPermissionsAsync();
 if(!p.granted&&p.canAskAgain)p=await n.requestPermissionsAsync();
 return p.granted||p.ios?.status===n.IosAuthorizationStatus.PROVISIONAL;
}
/** Android 12+: exact alarms make class/task reminders arrive on the minute instead of minutes late. */
export async function exactAlarms(ask=false){
 if(Platform.OS!=='android')return true;
 try{const n=await native();if(!n)return true;
  const p=await n.getExactAlarmPermissionsAsync();if(p.granted||!ask)return p.granted;
  return (await n.requestExactAlarmPermissionsAsync()).granted;}catch{return true;}
}
export function reconcileReminders(items:PlannedReminder[]){
 const version=++generation;
 queue=queue.catch(()=>false).then(async()=>{
  const n=await native();if(!n||version!==generation)return false;
  await installNotificationHandler().catch(()=>{});
  await ensureChannels(n).catch(()=>{});
  const permission=await n.getPermissionsAsync();
  const enabled=permission.granted||permission.ios?.status===n.IosAuthorizationStatus.PROVISIONAL;
  const desired=new Map((enabled?items:[]).map(x=>[x.id,x]));
  const existing=await n.getAllScheduledNotificationsAsync();
  for(const old of existing){
   if(version!==generation)return false;
   if(!old.identifier.startsWith('su13-'))continue;
   const target=desired.get(old.identifier);
   if(target&&old.content.data?.fingerprint===target.fingerprint){desired.delete(old.identifier);continue;}
   await n.cancelScheduledNotificationAsync(old.identifier);
  }
  for(const item of desired.values()){
   if(version!==generation)return false;
   if(item.at<Date.now()+1000)continue;
   await n.scheduleNotificationAsync({identifier:item.id,
    content:{title:item.title,body:item.body,sound:item.loud?TASK_SOUND:'default',color:'#6D28D9',
     ...(item.loud?{priority:n.AndroidNotificationPriority.MAX}:{}),
     data:{route:item.route,fingerprint:item.fingerprint}},
    // Class and task reminders are time-critical: alarmClock delivery is never deferred by battery saving.
    trigger:{type:n.SchedulableTriggerInputTypes.DATE,date:new Date(item.at),channelId:item.loud?TASK_CHANNEL:MAIN_CHANNEL,
     delivery:item.loud||item.id.includes('-class-')?'alarmClock':'bestEffort'}});
  }
  return enabled||items.length===0;
 });
 return queue;
}
export async function listenReminderNavigation(open:(route:string)=>void){
 const n=await native();if(!n)return ()=>{};
 const handle=(r:import('expo-notifications').NotificationResponse)=>{
  const route=r.notification.request.content.data?.route;
  if(typeof route==='string'&&(['/study','/streak','/timetable','/grades','/transcript','/progress','/absence','/warnings','/courses','/moodle','/notebook','/registration','/(tabs)','/(tabs)/settings'].includes(route)||/^\/absence\?code=[A-Za-z0-9%_-]+$/.test(route)||/^\/service\/SEC_[A-Z]+$/.test(route)))open(route);
 };
 const last=await n.getLastNotificationResponseAsync();
 if(last){handle(last);await n.clearLastNotificationResponseAsync();}
 const sub=n.addNotificationResponseReceivedListener(handle);
 return()=>sub.remove();
}
