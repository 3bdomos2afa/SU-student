// Round streak badge for the home header: animated flame + current streak days. Tap → streak screen.
import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@/components/icon';
import { PressScale, Txt } from '@/components/ui';
import { useApp } from '@/context/app-context';
import { computeStreak } from '@/lib/streak';
import { useTicker } from './streak-card';

export function StreakBadge() {
  const { tr, streak, focus, palette, scheme } = useApp();
  const running = focus.endAt !== null || streak.free !== null;
  const now = useTicker(running, 30000);
  const v = computeStreak(streak, focus, now);
  const lit = v.current > 0 || v.met || running;
  const k = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!lit) { k.setValue(0.5); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(k, { toValue: 1, duration: 380, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(k, { toValue: 0, duration: 380, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [k, lit]);
  const scale = k.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.14] });
  const rotate = k.interpolate({ inputRange: [0, 1], outputRange: ['-7deg', '7deg'] });
  const fill = lit ? (scheme === 'dark' ? '#4A1410' : '#FFE1DB') : palette.card;
  const ring = lit ? '#FF2D17' : palette.soft;
  return (
    <PressScale label={tr(`ستريك ${v.current} يوم`, `${v.current}-day streak`)} onPress={() => router.push('/streak' as never)}>
      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: fill, borderWidth: 2, borderColor: ring, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{ transform: [{ scale }, { rotate }] }}>
          <Ionicons name="flame" size={19} color={lit ? '#FF2D17' : palette.faint} />
        </Animated.View>
        <Txt variant="label" center color={lit ? (scheme === 'dark' ? '#FFB4A8' : '#C41A0A') : palette.sub} style={{ fontSize: 11.5, lineHeight: 13, marginTop: -1 }}>{v.current}</Txt>
      </View>
    </PressScale>
  );
}