import type { BottomTabBarProps } from 'expo-router/tabs';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Button, Glass, GlassBackground, Txt } from '@/components/ui';
import { useApp } from '@/context/app-context';
import type { IconName } from '@/data/services';
import { tap } from '@/lib/haptics';
import { alpha } from '@/lib/theme';

/** Offline / back-online banner shown above every screen. */
export function NetworkBanner() {
  const { banner, tr, palette, row, refreshAll, refreshing, dismissBanner, session } = useApp();
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(-160)).current;
  useEffect(() => {
    Animated.spring(y, { toValue: banner ? 0 : -160, useNativeDriver: true, bounciness: 8 }).start();
  }, [banner, y]);
  const offline = banner === 'offline';
  const color = offline ? palette.warn : palette.success;
  return (
    <Animated.View
      pointerEvents={banner ? 'box-none' : 'none'}
      style={{ position: 'absolute', top: insets.top + 6, left: 12, right: 12, transform: [{ translateY: y }] }}>
      <Glass padding={12} radius={20} intensity={70} tint={alpha(color, 0.2)}>
        <View style={{ flexDirection: row, alignItems: 'center', gap: 10 }}>
          <Ionicons name={offline ? 'cloud-offline' : 'wifi'} size={22} color={color} />
          <View style={{ flex: 1 }}>
            <Txt variant="label">{offline ? tr('أنت أوفلاين', 'You are offline') : tr('النت رجع ✅', 'Back online ✅')}</Txt>
            <Txt variant="caption">
              {offline
                ? tr('بتشوف آخر بيانات محفوظة على جهازك', 'Showing the last data saved on this device')
                : tr('حدّث دلوقتي عشان بياناتك تتحدث', 'Refresh now to update your data')}
            </Txt>
          </View>
          {!offline && session ? <Button small icon="refresh" title={tr('تحديث', 'Refresh')} loading={refreshing} onPress={refreshAll} /> : null}
          <Pressable onPress={dismissBanner} hitSlop={12} accessibilityLabel={tr('إغلاق', 'Dismiss')}>
            <Ionicons name="close" size={18} color={palette.sub} />
          </Pressable>
        </View>
      </Glass>
    </Animated.View>
  );
}

/** Face ID / fingerprint lock shown on launch when enabled. */
export function LockOverlay() {
  const { locked, unlock, tr, session, signOut } = useApp();
  useEffect(() => {
    if (locked) unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);
  if (!locked) return null;
  return (
    <Modal visible animationType="none" presentationStyle="fullScreen" onRequestClose={()=>{}}><View style={[StyleSheet.absoluteFill, { backgroundColor:"#173F3B", alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
      <GlassBackground />
      <Glass padding={24} style={{ width: '100%', maxWidth: 380 }}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Avatar name="SU" size={72} />
          <Txt variant="h2" center>{tr('أهلًا تاني', 'Welcome back')}</Txt>
          <Txt variant="sub" center>{tr('افتح التطبيق بالبصمة أو Face ID', 'Unlock with Face ID or fingerprint')}</Txt>
          <Button variant="glass" title={tr('تسجيل الخروج', 'Sign out')} onPress={()=>{void signOut().catch(()=>{});}} />
          <Button title={tr('فتح', 'Unlock')} icon="finger-print" onPress={unlock} style={{ alignSelf: 'stretch', marginTop: 6 }} />
        </View>
      </Glass>
    </View></Modal>
  );
}

const TABS: Record<string, { on: IconName; off: IconName; ar: string; en: string }> = {
  index: { on: 'home', off: 'home-outline', ar: 'الرئيسية', en: 'Home' },
  services: { on: 'grid', off: 'grid-outline', ar: 'الخدمات', en: 'Services' },
  plan: { on: 'git-network', off: 'git-network-outline', ar: 'الخطة', en: 'Plan' },
  tools: { on: 'construct', off: 'construct-outline', ar: 'الأدوات', en: 'Tools' },
  settings: { on: 'settings', off: 'settings-outline', ar: 'الإعدادات', en: 'Settings' },
};

export type TabBarProps = BottomTabBarProps;

/** Floating glass tab bar. */
export function GlassTabBar({ state, emitter, navigateToTab }: TabBarProps) {
  const { palette, row, tr } = useApp();
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 14, right: 14, bottom: Math.max(insets.bottom, 10) + 4 }}>
      <Glass padding={6} radius={30} intensity={70}>
        <View style={{ flexDirection: row, alignItems: 'center' }}>
          {state.routes.map((route, i) => {
            const meta = TABS[route.name];
            if (!meta) return null;
            const active = state.index === i;
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  tap();
                  const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!active && !event.defaultPrevented) navigateToTab(route.key);
                }}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 54,
                  borderRadius: 24,
                  backgroundColor: active ? alpha(palette.primary, 0.22) : 'transparent',
                }}>
                <Ionicons name={active ? meta.on : meta.off} size={22} color={active ? palette.primary : palette.sub} />
                <Txt numberOfLines={1} style={{ fontSize: 10.5, marginTop: 2, fontWeight: active ? '700' : '500', color: active ? palette.text : palette.sub }}>
                  {tr(meta.ar, meta.en)}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      </Glass>
    </View>
  );
}