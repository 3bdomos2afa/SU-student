import { ReminderController } from '@/components/reminder-controller';
import { useFonts } from 'expo-font';
import { fonts } from '@/lib/fonts';
import { ErrorBoundary } from '@/components/error-boundary';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LockOverlay, NetworkBanner } from '@/components/chrome';
import { AppProvider, useApp } from '@/context/app-context';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Shell() {
  const { ready, scheme, palette } = useApp();
  const [loaded, fontError] = useFonts(fonts);
  const [fontTimedOut, setFontTimedOut] = useState(false);
  useEffect(()=>{const t=setTimeout(()=>setFontTimedOut(true),7000);return()=>clearTimeout(t);},[]);
  const fontReady = loaded || !!fontError || fontTimedOut;
  useEffect(() => {
    if (ready && fontReady) SplashScreen.hideAsync().catch(() => {});
  }, [ready, fontReady]);
  if (!ready || !fontReady) return null;
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg[0] }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: palette.bg[0] } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="study" />
        <Stack.Screen name="timetable" />
        <Stack.Screen name="grades" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="service/[action]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="course/[code]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
      <ReminderController />
      <NetworkBanner />
      <LockOverlay />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary><GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <Shell />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView></ErrorBoundary>
  );
}