import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

/** SU+ mark: white "SU" on a violet gradient tile with a lime plus. */
export const BRAND = { navy: '#17161D', purple: '#6A4BEF', lime: '#D6F77E', ink: '#17161D' };
const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><defs><linearGradient id="sug" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#A994FB"/><stop offset="1" stop-color="#6A4BEF"/></linearGradient></defs><rect width="1024" height="1024" rx="286" fill="url(#sug)"/><g fill="none" stroke="#FFFFFF" stroke-width="84" stroke-linecap="round" stroke-linejoin="round"><path d="M225 35 Q190 0 120 0 Q20 0 20 70 Q20 130 120 135 Q220 140 220 200 Q220 270 115 270 Q40 270 5 230" transform="translate(178 388)"/><path d="M20 0 L20 140 Q20 270 120 270 Q220 270 220 140 L220 0" transform="translate(478 388)"/></g><rect x="728" y="268" width="196" height="68" rx="34" fill="#D6F77E"/><rect x="792" y="204" width="68" height="196" rx="34" fill="#D6F77E"/></svg>`;

export function BrandMark({ size = 88, animated = true }: { size?: number; animated?: boolean }) {
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!animated) return;
    let loop: Animated.CompositeAnimation | undefined; let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (!alive || reduce) return;
      loop = Animated.loop(Animated.sequence([
        Animated.timing(pop, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pop, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]));
      loop.start();
    }).catch(() => {});
    return () => { alive = false; loop?.stop(); };
  }, [animated, pop]);
  return <Animated.View accessibilityLabel="SU+" style={{ width: size, height: size, transform: [
    { translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) },
    { rotate: pop.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-3deg'] }) },
  ] }}>
    <SvgXml xml={MARK} width={size} height={size} />
  </Animated.View>;
}

/** Mark + wordmark, for headers. */
export function BrandLockup({ size = 34, color }: { size?: number; color: string }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
    <BrandMark size={size} animated={false} />
    <Text style={{ color, fontSize: size * 0.5, letterSpacing: 0.5, fontWeight: '700' }}>SU+</Text>
  </View>;
}