import type { BottomTabBarProps } from 'expo-router/tabs';
import { Ionicons } from '@/components/icon';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import { Avatar, BRAND_GRADIENT, Button, Glass, GlassBackground, Txt } from '@/components/ui';
import { useApp } from '@/context/app-context';
import type { IconName } from '@/data/services';
import { tap } from '@/lib/haptics';
import { alpha } from '@/lib/theme';

/** Offline / back-online banner shown above every screen. */
export function NetworkBanner() {
  const { banner, tr, palette, row, refreshAll, refreshing, dismissBanner, session, syncErrors } = useApp();
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(-160)).current;
  useEffect(() => {
    Animated.spring(y, { toValue: banner ? 0 : -160, useNativeDriver: true, bounciness: 8 }).start();
  }, [banner, y]);
  const offline = banner === 'offline';
  const synced = banner === 'synced';
  const color = offline || (synced && syncErrors > 0) ? palette.warn : palette.success;
  return (
    <Animated.View
      pointerEvents={banner ? 'box-none' : 'none'}
      style={{ position: 'absolute', top: insets.top + 6, left: 12, right: 12, transform: [{ translateY: y }] }}>
      <Glass padding={12} radius={20} intensity={70} tint={alpha(color, 0.2)}>
        <View style={{ flexDirection: row, alignItems: 'center', gap: 10 }}>
          <Ionicons name={offline ? 'cloud-offline' : synced ? (syncErrors ? 'warning' : 'checkmark-circle') : 'wifi'} size={22} color={color} />
          <View style={{ flex: 1 }}>
            <Txt variant="label">{offline ? tr('إنت أوفلاين', 'You are offline') : synced ? (syncErrors ? tr('التحديث لسه مخلصش', 'Update incomplete') : tr('تمام، التحديث خلص ✅', 'Update finished ✅')) : tr('النت رجع ✅', 'Back online ✅')}</Txt>
            <Txt variant="caption">
              {offline
                ? tr('دي آخر بيانات محفوظة على جهازك', 'Showing the last data saved on this device')
                : synced
                ? (syncErrors ? tr(`بياناتك اتحدثت، و${syncErrors} خدمة محتاجة إعادة محاولة`, `Data updated; ${syncErrors} service(s) need another attempt`) : tr('الخدمات المتصلة اتحدثت', 'Connected services refreshed'))
                : tr('حدّث دلوقتي عشان تشوف آخر بياناتك', 'Refresh now to update your data')}
            </Txt>
          </View>
          {banner === 'back' && session ? <Button small icon="refresh" title={tr('تحديث', 'Refresh')} loading={refreshing} onPress={refreshAll} /> : null}
          <Pressable onPress={dismissBanner} hitSlop={12} accessibilityLabel={tr('اقفل', 'Dismiss')}>
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
    <Modal visible animationType="none" presentationStyle="fullScreen" onRequestClose={()=>{}}><View style={[StyleSheet.absoluteFill, { backgroundColor:"#121118", alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
      <GlassBackground />
      <Glass padding={24} style={{ width: '100%', maxWidth: 380 }}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Avatar name="SU" size={72} />
          <Txt variant="h2" center>{tr('أهلًا بيك تاني', 'Welcome back')}</Txt>
          <Txt variant="sub" center>{tr('افتح التطبيق بالبصمة أو Face ID', 'Unlock with Face ID or fingerprint')}</Txt>
          <Button variant="glass" title={tr('تسجيل الخروج', 'Sign out')} onPress={()=>{void signOut().catch(()=>{});}} />
          <Button title={tr('افتح', 'Unlock')} icon="finger-print" onPress={unlock} style={{ alignSelf: 'stretch', marginTop: 6 }} />
        </View>
      </Glass>
    </View></Modal>
  );
}

const TABS: Record<string, { on: IconName; off: IconName; ar: string; en: string }> = {
  index: { on: 'home', off: 'home-outline', ar: 'الرئيسية', en: 'Home' },
  services: { on: 'grid', off: 'grid-outline', ar: 'الخدمات', en: 'Services' },
  plan: { on: 'map', off: 'map-outline', ar: 'الخريطة', en: 'Map' },
  tools: { on: 'construct', off: 'construct-outline', ar: 'الأدوات', en: 'Tools' },
  settings: { on: 'settings', off: 'settings-outline', ar: 'الإعدادات', en: 'Settings' },
};

const TAB_ON = '#C9BBFA';
const TAB_OFF = 'rgba(201,187,250,0)';

function TabButton({ active, icon, label, onPress }: { active: boolean; icon: IconName; label: string; onPress: () => void }) {
  const { palette, row } = useApp();
  const s = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(s, { toValue: active ? 1 : 0, useNativeDriver: false, speed: 16, bounciness: 9 }).start();
  }, [active, s]);
  return (
    <Pressable accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: active }} onPress={onPress}>
      <Animated.View
        style={{
          height: 48, minWidth: 46, borderRadius: 24, flexDirection: row, alignItems: 'center', justifyContent: 'center', gap: 6,
          paddingHorizontal: s.interpolate({ inputRange: [0, 1], outputRange: [12, 16] }),
          backgroundColor: s.interpolate({ inputRange: [0, 1], outputRange: [TAB_OFF, TAB_ON] }),
          transform: [{ scale: s.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.94, 1] }) }],
        }}>
        <Ionicons name={icon} size={20} color={active ? '#17161D' : palette.onInk} />
        {active ? <Txt variant="label" numberOfLines={1} style={{ color: '#17161D', fontSize: 13, lineHeight: 18 }}>{label}</Txt> : null}
      </Animated.View>
    </Pressable>
  );
}

export type TabBarProps = BottomTabBarProps;

/** Floating dark pill tab bar; the active tab grows into a lilac bubble with its label. */
export function GlassTabBar({ state, emitter, navigateToTab }: TabBarProps) {
  const { palette, row, tr } = useApp();
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', zIndex: 100, elevation: 20, left: 0, right: 0, bottom: Math.max(insets.bottom, 10) + 6, alignItems: 'center' }}>
      <View style={{ flexDirection: row, alignItems: 'center', gap: 4, padding: 6, borderRadius: 40, backgroundColor: palette.ink, boxShadow: '0px 14px 30px rgba(23,22,29,0.28)' }}>
        {state.routes.map((route, i) => {
          const meta = TABS[route.name];
          if (!meta) return null;
          const active = state.index === i;
          return (
            <TabButton
              key={route.key}
              active={active}
              icon={active ? meta.on : meta.off}
              label={tr(meta.ar, meta.en)}
              onPress={() => {
                tap();
                const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!active && !event.defaultPrevented) navigateToTab(route.key);
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
