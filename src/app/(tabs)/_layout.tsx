import { Tabs } from 'expo-router';
import { GlassTabBar } from '@/components/chrome';
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown:false }} tabBar={(props)=><GlassTabBar {...props}/>}>
      <Tabs.Screen name="index"/><Tabs.Screen name="services"/><Tabs.Screen name="plan"/>
      <Tabs.Screen name="tools"/><Tabs.Screen name="settings"/>
    </Tabs>
  );
}
