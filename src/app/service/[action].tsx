import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { Button, Chip, Glass, Header, Screen, Txt } from '@/components/ui';
import { PortalModal } from '@/components/portal-modal';
import { useApp } from '@/context/app-context';
import { serviceByAction } from '@/data/services';
import { recordsOf, endpoints } from '@/lib/portal';
import { timeAgo } from '@/lib/format';

function printable(value:unknown):string {
 if(value===null||value===undefined||value==='')return '—';
 if(typeof value==='object')return JSON.stringify(value).slice(0,2000);
 return String(value).slice(0,2000);
}
export default function Service(){
 const params=useLocalSearchParams<{action:string}>();const action=String(params.action??'');
 const {tr,lang,row,palette,cache,fetchService,online}=useApp();
 const [loading,setLoading]=useState(false),[error,setError]=useState(''),[page,setPage]=useState(0),[open,setOpen]=useState(false);
 const service=serviceByAction(action);
 const entry=cache[action];
 const records=recordsOf(entry?.data);
 const load=async(force=false)=>{setLoading(true);setError('');try{const r=await fetchService(action,force);setError(r.error??'');}catch{setError(tr('تعذر تحميل البيانات','Could not load records'));}finally{setLoading(false);}};
 useEffect(()=>{setPage(0);void load();},[action]);
 return <Screen padBottom={false}>
   <Button small variant="glass" title={tr('رجوع','Back')} onPress={()=>router.canGoBack()?router.back():router.replace('/(tabs)')}/>
   <Header title={service?.title[lang]??tr('بيانات الجامعة','University records')} subtitle={service?.desc[lang]}/>
   {entry?<View style={{flexDirection:row,gap:8,flexWrap:'wrap'}}><Chip label={tr('من بوابة الجامعة','University records')} icon="school-outline"/><Chip label={timeAgo(entry.at,lang)} icon="time-outline"/></View>:null}
   {loading?<ActivityIndicator color={palette.primary}/>:null}
   {error?<Glass><Txt color={palette.warn}>{error}</Txt></Glass>:null}
   {records.length===0&&!loading?<Glass><Txt>{entry?tr('الجامعة لم تُرجع سجلات لهذه الخدمة.','The university returned no records for this service.'):tr('مفيش بيانات محفوظة لسه.','No records saved yet.')}</Txt></Glass>:null}
   {records.slice(page*15,page*15+15).map((record,index)=><Glass key={page*15+index}><View style={{gap:9}}>
     <Txt variant="caption">{tr('سجل','Record')} {page*15+index+1}</Txt>
     {Object.entries(record).slice(0,80).map(([k,v])=><View key={k} style={{gap:2,borderBottomWidth:0.5,borderColor:palette.glassBorder,paddingBottom:8}}>
       <Txt variant="caption">{k.replace(/([a-z])([A-Z])/g,'$1 $2').replaceAll('_',' ')}</Txt>
       <Txt selectable>{printable(v)}</Txt>
     </View>)}
   </View></Glass>)}
   {records.length>15?<View style={{flexDirection:row,gap:8}}><Button small disabled={page===0} title={tr('السابق','Previous')} onPress={()=>setPage(p=>p-1)}/><Txt>{page+1}/{Math.ceil(records.length/15)}</Txt><Button small disabled={(page+1)*15>=records.length} title={tr('التالي','Next')} onPress={()=>setPage(p=>p+1)}/></View>:null}
   {endpoints[action]?<Button icon="refresh" disabled={!online} loading={loading} title={tr('تحديث من الجامعة','Refresh from university')} onPress={()=>void load(true)}/>:null}
   <Button variant="glass" title={tr('فتح الموقع الرسمي','Open official website')} onPress={()=>setOpen(true)}/>
   <Txt variant="caption">{tr('أسماء الحقول كما وردت من الجامعة. كل خدمة لها وقت تحديث مستقل؛ القديم لا يُعتبر بيانات حية.','Field names are preserved from the university. Each service has its own update time; cached records are not live data.')}</Txt>
   <PortalModal visible={open} browse onClose={()=>setOpen(false)}/>
 </Screen>;
}