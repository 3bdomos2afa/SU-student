import { Redirect, Tabs } from 'expo-router';

import { GlassTabBar, type TabBarProps } from '@/components/chrome';
import { useApp } from '@/context/app-context';

export default function TabsLayout() {
  const { session } = useApp();
  if (!session) return <Redirect href="/login" />;
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <GlassTabBar {...(props as unknown as TabBarProps)} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="services" />
      <Tabs.Screen name="plan" />
      <Tabs.Screen name="tools" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}