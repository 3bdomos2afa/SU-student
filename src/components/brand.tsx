import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/** SU Student mark: a winding "S" route (the student journey) with a start ring and a spark at the goal. */
const ROUTE = 'M690 318 C610 238 352 246 352 404 C352 548 672 484 672 632 C672 772 430 790 338 706';
export const BRAND = { indigo: '#4338CA', violet: '#7C3AED', cyan: '#0891B2', spark: '#FDE68A' };

export function BrandMark({ size = 88, animated = true }: { size?: number; animated?: boolean }) {
  const float = useRef(new Animated.Value(0)).current;
  const spark = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!animated) return;
    let loop: Animated.CompositeAnimation | undefined; let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (!alive || reduce) return;
      loop = Animated.parallel([
        Animated.loop(Animated.sequence([
          Animated.timing(float, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(float, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])),
        Animated.loop(Animated.sequence([
          Animated.timing(spark, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(spark, { toValue: 0, duration: 900, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay(1400),
        ])),
      ]);
      loop.start();
    }).catch(() => {});
    return () => { alive = false; loop?.stop(); };
  }, [animated, float, spark]);
  const s = size / 1024;
  return <Animated.View accessibilityLabel="SU Student" style={{ width: size, height: size, transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }] }}>
    <Svg width={size} height={size} viewBox="0 0 1024 1024">
      <Defs>
        <LinearGradient id="suG" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={BRAND.indigo} /><Stop offset="0.55" stopColor={BRAND.violet} /><Stop offset="1" stopColor={BRAND.cyan} />
        </LinearGradient>
      </Defs>
      <Rect width="1024" height="1024" rx="232" fill="url(#suG)" />
      <Circle cx="250" cy="210" r="300" fill="#FFFFFF" opacity={0.1} />
      <Path d={ROUTE} fill="none" stroke="#0B1035" strokeOpacity={0.18} strokeWidth={104} strokeLinecap="round" transform="translate(0 18)" />
      <Path d={ROUTE} fill="none" stroke="#FFFFFF" strokeWidth={96} strokeLinecap="round" />
      <Path d={ROUTE} fill="none" stroke="#C7D2FE" strokeWidth={14} strokeLinecap="round" strokeDasharray="2 46" opacity={0.9} />
      <Circle cx="338" cy="706" r="78" fill="#FFFFFF" /><Circle cx="338" cy="706" r="34" fill={BRAND.violet} />
    </Svg>
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 684 * s, top: 176 * s, width: 172 * s, height: 172 * s,
      opacity: spark.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
      transform: [{ scale: spark.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] }) }, { rotate: spark.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '20deg'] }) }] }}>
      <Svg width={172 * s} height={172 * s} viewBox="684 176 172 172">
        <Path d="M770 176 L792 240 L856 262 L792 284 L770 348 L748 284 L684 262 L748 240 Z" fill={BRAND.spark} />
      </Svg>
    </Animated.View>
  </Animated.View>;
}

/** Mark + wordmark, for headers. */
export function BrandLockup({ size = 34, color }: { size?: number; color: string }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
    <BrandMark size={size} animated={false} />
    <Text style={{ color, fontSize: size * 0.5, letterSpacing: 0.5, fontWeight: '700' }}>SU Student</Text>
  </View>;
}