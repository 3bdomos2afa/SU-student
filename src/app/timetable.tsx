import { router } from 'expo-router';
import { Button, Header, Screen } from '@/components/ui';
import { DaySchedule } from '@/components/academic-cards';
import { useApp } from '@/context/app-context';
export default function Timetable(){
 const a=useApp();return <Screen padBottom={false} refreshing={a.refreshing} onRefresh={a.refreshAll}>
 <Button small variant="glass" title={a.tr('رجوع','Back')} onPress={()=>router.canGoBack()?router.back():router.replace('/(tabs)')}/>
 <Header title={a.tr('الأسبوع كاملًا','The whole week')} subtitle={a.tr('المواعيد كما ترد من الجامعة','Times as reported by the university')}/>
 <DaySchedule full/>
 </Screen>;
}