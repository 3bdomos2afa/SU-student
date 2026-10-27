import { useState } from 'react';
import { View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { BrandLockup, BrandMark } from '@/components/brand';
import { Entrance } from '@/components/entrance';
import { Button, Chip, Glass, Screen, Txt } from '@/components/ui';
import { PortalModal } from '@/components/portal-entry';
import { useApp } from '@/context/app-context';

export default function Login(){
 const {tr,lang,updateSettings,palette,row,session}=useApp();
 const [open,setOpen]=useState(false);
 if(session&&!open)return <Redirect href="/(tabs)"/>;
 return <Screen padBottom={false}>
   <View style={{flexDirection:row,justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
     <BrandLockup size={30} color={palette.text}/>
     <Chip label={lang==='ar'?'English':'عربي'} onPress={()=>updateSettings({lang:lang==='ar'?'en':'ar'})}/>
   </View>
   <View style={{paddingVertical:22,gap:16}}>
     <Entrance><BrandMark size={96}/></Entrance>
     <Txt variant="h1" style={{fontSize:42,lineHeight:58}}>{tr('يومك الدراسي.\nأوضح وأبسط.','Your campus.\nYour rhythm.')}</Txt>
     <Txt variant="sub">{tr('محاضراتك ونتايجك وخطة تخرجك في مكان واحد — ومعاهم وقت للمذاكرة.','Your space for classes, results and graduation planning — with room to focus.')}</Txt>
   </View>
   <Glass padding={22}>
     <View style={{gap:14}}>
       <Txt variant="h2">{tr('أهلًا بيك','Welcome in')}</Txt>
       <Txt>{tr('سجّل دخولك من صفحة UnicodeSIS الأصلية جوه التطبيق.','Sign in on the original UnicodeSIS website inside the app.')}</Txt>
       <Button icon="log-in-outline" title={tr('ادخل بحساب الجامعة','Sign in with university')} onPress={()=>setOpen(true)}/>
       <Button variant="glass" title={tr('جرّب أدوات المذاكرة من غير حساب','Explore study tools without an account')} onPress={()=>router.replace('/(tabs)')}/>
       <Txt variant="caption">{tr('تطبيق مستقل ومش رسمي. بيانات الجامعة مش هتظهر غير بعد تسجيل الدخول.','Independent, unofficial app. University records appear only after sign-in.')}</Txt>
     </View>
   </Glass>
   <PortalModal visible={open} onClose={()=>setOpen(false)}/>
 </Screen>;
}