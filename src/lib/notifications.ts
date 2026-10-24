import { Platform } from 'react-native';
import type { PlannedReminder } from './reminder-plan';
const native=async()=>Platform.OS==='web'?null:import('expo-notifications');
let queue:Promise<boolean>=Promise.resolve(true);
let generation=0;
export async function requestReminders(){
 const n=await native();if(!n)return false;
 if(Platform.OS==='android')await n.setNotificationChannelAsync('study',{name:'Study & campus',importance:n.AndroidImportance.DEFAULT,lockscreenVisibility:n.AndroidNotificationVisibility.PRIVATE});
 const p=await n.requestPermissionsAsync();
 return p.granted||p.ios?.status===n.IosAuthorizationStatus.PROVISIONAL;
}
export function reconcileReminders(items:PlannedReminder[]){
 const version=++generation;
 queue=queue.catch(()=>false).then(async()=>{
  const n=await native();if(!n||version!==generation)return false;
  n.setNotificationHandler({handleNotification:async()=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:true,shouldSetBadge:false})});
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
    content:{title:item.title,body:item.body,sound:'default',data:{route:item.route,fingerprint:item.fingerprint}},
    trigger:{type:n.SchedulableTriggerInputTypes.DATE,date:new Date(item.at),channelId:'study'}});
  }
  return enabled||items.length===0;
 });
 return queue;
}
export async function listenReminderNavigation(open:(route:string)=>void){
 const n=await native();if(!n)return ()=>{};
 const handle=(r:import('expo-notifications').NotificationResponse)=>{
  const route=r.notification.request.content.data?.route;
  if(typeof route==='string'&&(['/study','/timetable','/grades','/grades?mode=final','/(tabs)','/(tabs)/settings'].includes(route)||/^\/service\/SEC_[A-Z]+$/.test(route)))open(route);
 };
 const last=await n.getLastNotificationResponseAsync();
 if(last){handle(last);await n.clearLastNotificationResponseAsync();}
 const sub=n.addNotificationResponseReceivedListener(handle);
 return()=>sub.remove();
}
/** Shows a local notification right away (used for "sync complete"). */
export async function notifyNow(title:string,body:string){
 try{
  const n=await native();if(!n)return false;
  if(Platform.OS==='android')await n.setNotificationChannelAsync('study',{name:'Study & campus',importance:n.AndroidImportance.DEFAULT,lockscreenVisibility:n.AndroidNotificationVisibility.PRIVATE});
  let p=await n.getPermissionsAsync();
  if(!p.granted&&p.canAskAgain)p=await n.requestPermissionsAsync();
  if(!(p.granted||p.ios?.status===n.IosAuthorizationStatus.PROVISIONAL))return false;
  n.setNotificationHandler({handleNotification:async()=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:false,shouldSetBadge:false})});
  await n.scheduleNotificationAsync({content:{title,body,data:{route:'/(tabs)'}},trigger:Platform.OS==='android'?{channelId:'study'}:null});
  return true;
 }catch{return false;}
}
