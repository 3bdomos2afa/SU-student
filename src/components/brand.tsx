import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

/** SU Student sticker mark: a tilted purple "SU" sticker with a lime grad cap and stars on a navy tile. */
export const BRAND = { navy: '#1D2331', purple: '#8B53FE', lime: '#8EFF01', ink: '#0B0D14' };
const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><defs><clipPath id="suc"><rect width="1024" height="1024" rx="232"/></clipPath></defs><g clip-path="url(#suc)"><rect width="1024" height="1024" fill="#1D2331"/>
<g transform="rotate(-6 512 548)"><rect x="164" y="318" width="724" height="460" rx="96" fill="#0B0D14" transform="translate(26 26)"/><rect x="164" y="318" width="724" height="460" rx="96" fill="#8B53FE" stroke="#0B0D14" stroke-width="20"/><g fill="none" stroke="#0B0D14" stroke-width="108" stroke-linecap="round" stroke-linejoin="round" transform="translate(12 14)"><path d="M225 35 Q190 0 120 0 Q20 0 20 70 Q20 130 120 135 Q220 140 220 200 Q220 270 115 270 Q40 270 5 230" transform="translate(252.5 413) scale(1)"/><path d="M20 0 L20 140 Q20 270 120 270 Q220 270 220 140 L220 0" transform="translate(574.5 413) scale(1)"/></g><g fill="none" stroke="#0B0D14" stroke-width="108" stroke-linecap="round" stroke-linejoin="round" ><path d="M225 35 Q190 0 120 0 Q20 0 20 70 Q20 130 120 135 Q220 140 220 200 Q220 270 115 270 Q40 270 5 230" transform="translate(252.5 413) scale(1)"/><path d="M20 0 L20 140 Q20 270 120 270 Q220 270 220 140 L220 0" transform="translate(574.5 413) scale(1)"/></g><g fill="none" stroke="#FFFFFF" stroke-width="74" stroke-linecap="round" stroke-linejoin="round" ><path d="M225 35 Q190 0 120 0 Q20 0 20 70 Q20 130 120 135 Q220 140 220 200 Q220 270 115 270 Q40 270 5 230" transform="translate(252.5 413) scale(1)"/><path d="M20 0 L20 140 Q20 270 120 270 Q220 270 220 140 L220 0" transform="translate(574.5 413) scale(1)"/></g></g>
<g transform="translate(712 262) rotate(14) scale(0.52) translate(-512 -205)"><path d="M390 250 L390 340 Q512 395 634 340 L634 250 L512 300 Z" fill="#8EFF01" stroke="#0B0D14" stroke-width="18" stroke-linejoin="round"/><polygon points="512,110 760,205 512,300 264,205" fill="#FFFFFF" stroke="#0B0D14" stroke-width="18" stroke-linejoin="round"/><path d="M512 205 L720 240 L720 350" fill="none" stroke="#0B0D14" stroke-width="30" stroke-linecap="round"/><path d="M512 205 L720 240 L720 350" fill="none" stroke="#8EFF01" stroke-width="14" stroke-linecap="round"/><circle cx="720" cy="362" r="24" fill="#8EFF01" stroke="#0B0D14" stroke-width="18" stroke-linejoin="round"/></g><path d="M196 130 Q216.72 183.28 270 204 Q216.72 224.72 196 278 Q175.28 224.72 122 204 Q175.28 183.28 196 130 Z" fill="#8EFF01" /><path d="M846 796 Q862.8 839.2 906 856 Q862.8 872.8 846 916 Q829.2 872.8 786 856 Q829.2 839.2 846 796 Z" fill="#8EFF01" stroke="#0B0D14" stroke-width="14" stroke-linejoin="round"/><path d="M140 830 Q148.4 851.6 170 860 Q148.4 868.4 140 890 Q131.6 868.4 110 860 Q131.6 851.6 140 830 Z" fill="#8B53FE" /></g></svg>`;

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
  return <Animated.View accessibilityLabel="SU Student" style={{ width: size, height: size, transform: [
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
    <Text style={{ color, fontSize: size * 0.5, letterSpacing: 0.5, fontWeight: '700' }}>SU Student</Text>
  </View>;
}