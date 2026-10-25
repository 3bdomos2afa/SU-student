import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { Button, Chip, Glass, Header, Screen, Txt } from '@/components/ui';
import { PortalModal } from '@/components/portal-entry';
import { useApp } from '@/context/app-context';
import { serviceByAction } from '@/data/services';
import { endpoints } from '@/lib/portal';
import { timeAgo } from '@/lib/format';
import { displayRecords, fieldLabel, formatValue, hiddenField, recordTitle } from '@/lib/field-labels';

// These records read better on the grades screen (every term, grade colours, GPA).
const REDIRECT:Record<string,string>={SEC_TRANSCRIPT:'/grades?mode=final',SEC_HISTORY:'/grades?mode=final',SEC_YEARS:'/grades?mode=final',SEC_GRADING:'/grades'};
const filled=(x:unknown)=>x!==null&&x!==undefined&&x!==''&&typeof x!=='object';
const TITLE_KEYS=['CourseNameEN','CourseName','CourseNameAr'];
export default function Service(){
 const params=useLocalSearchParams<{action:string}>();const action=String(params.action??'');
 const {tr,lang,row,palette,cache,fetchService,online}=useApp();
 const [loading,setLoading]=useState(false),[error,setError]=useState(''),[page,setPage]=useState(0),[open,setOpen]=useState(false);
 const service=serviceByAction(action);
 const entry=cache[action];
 const records=displayRecords(entry?.data);
 const load=async(force=false)=>{setLoading(true);setError('');try{const r=await fetchService(action,force);setError(r.error??'');}catch{setError(tr('مقدرناش نحمّل البيانات','Could not load records'));}finally{setLoading(false);}};
 useEffect(()=>{const to=REDIRECT[action];if(to){router.replace(to as never);return;}setPage(0);void load();},[action]);
 return <Screen padBottom={false}>
   <Button small variant="glass" title={tr('رجوع','Back')} onPress={()=>router.canGoBack()?router.back():router.replace('/(tabs)')}/>
   <Header title={service?.title[lang]??tr('بيانات الجامعة','University records')} subtitle={service?.desc[lang]}/>
   {entry?<View style={{flexDirection:row,gap:8,flexWrap:'wrap'}}><Chip label={tr('من بوابة الجامعة','University records')} icon="school-outline"/><Chip label={timeAgo(entry.at,lang)} icon="time-outline"/>{records.length>1?<Chip label={`${records.length}`} icon="list-outline"/>:null}</View>:null}
   {loading?<ActivityIndicator color={palette.primary}/>:null}
   {error?<Glass><Txt color={palette.warn}>{error}</Txt></Glass>:null}
   {records.length===0&&!loading?<Glass><Txt>{entry?tr('الجامعة مش منزّلة حاجة هنا لحد دلوقتي.','The university has nothing published here yet.'):tr('مفيش بيانات محفوظة لسه.','No records saved yet.')}</Txt></Glass>:null}
   {records.slice(page*15,page*15+15).map((record,index)=>{
     const head=recordTitle(record);
     const fields=Object.entries(record).filter(([k,v])=>filled(v)&&!hiddenField(k)&&!(head&&TITLE_KEYS.includes(k)));
     return <Glass key={page*15+index}><View style={{gap:9}}>
       {head?<Txt variant="h3">{head}</Txt>:records.length>1?<Txt variant="caption">{tr('سجل','Record')} {page*15+index+1}</Txt>:null}
       {fields.slice(0,40).map(([k,v])=><View key={k} style={{flexDirection:row,justifyContent:'space-between',alignItems:'center',gap:12,borderBottomWidth:0.5,borderColor:palette.glassBorder,paddingBottom:8}}>
         <Txt variant="caption" style={{flexShrink:1}}>{fieldLabel(k,lang)}</Txt>
         <Txt selectable variant="label" style={{flexShrink:1}}>{formatValue(k,v,lang)}</Txt>
       </View>)}
     </View></Glass>;})}
   {records.length>15?<View style={{flexDirection:row,gap:8}}><Button small disabled={page===0} title={tr('السابق','Previous')} onPress={()=>setPage(p=>p-1)}/><Txt>{page+1}/{Math.ceil(records.length/15)}</Txt><Button small disabled={(page+1)*15>=records.length} title={tr('التالي','Next')} onPress={()=>setPage(p=>p+1)}/></View>:null}
   {endpoints[action]?<Button icon="refresh" disabled={!online} loading={loading} title={tr('تحديث من الجامعة','Refresh from university')} onPress={()=>void load(true)}/>:null}
   <Button variant="glass" title={tr('افتح الموقع الرسمي','Open official website')} onPress={()=>setOpen(true)}/>
   <Txt variant="caption">{tr('البيانات من بوابة الجامعة وبتتحفظ على موبايلك. كل خدمة ليها وقت تحديث لوحدها.','Records come from the university portal and are saved on this phone. Each service has its own update time.')}</Txt>
   <PortalModal visible={open} browse onClose={()=>setOpen(false)}/>
 </Screen>;
}
