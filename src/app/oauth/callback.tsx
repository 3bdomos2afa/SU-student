import { router } from 'expo-router';
import { Button, Glass, Screen, Txt } from '@/components/ui';
import { useApp } from '@/context/app-context';
// AuthSession owns state/PKCE validation and code exchange. Never accept tokens here.
export default function OAuthCallback(){
 const {tr,session}=useApp();
 return <Screen padBottom={false}><Glass><Txt variant="h2">{tr('العودة من تسجيل الدخول','Returning from sign-in')}</Txt>
  <Txt>{tr('يكتمل ربط الحساب من نافذة الدخول الأصلية. إذا أغلق النظام التطبيق أثناء الدخول، ابدأ محاولة جديدة.','Sign-in completes in the original login window. If the OS closed the app during authentication, start a new attempt.')}</Txt>
  <Button title={tr('متابعة','Continue')} onPress={()=>router.replace(session?'/(tabs)':'/login')}/>
 </Glass></Screen>;
}