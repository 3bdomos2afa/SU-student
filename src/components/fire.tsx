// Animated fire for the streak: flickering flame, pulsing glow and rising embers.
import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Ionicons } from '@/components/icon';

const t = (v: Animated.Value, to: number, ms: number) =>
  Animated.timing(v, { toValue: to, duration: ms, easing: Easing.inOut(Easing.quad), useNativeDriver: true });

export function Fire({ size = 92, lit = true }: { size?: number; lit?: boolean }) {
  const flick = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const embers = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (!lit) { flick.setValue(0.5); glow.setValue(0); embers.forEach(e => e.setValue(0)); return; }
    const loops = [
      Animated.loop(Animated.sequence([t(flick, 1, 360), t(flick, 0.3, 280), t(flick, 0.8, 300), t(flick, 0, 340)])),
      Animated.loop(Animated.sequence([t(glow, 1, 900), t(glow, 0, 900)])),
      ...embers.map((e, i) => Animated.loop(Animated.sequence([
        Animated.delay(i * 520),
        Animated.timing(e, { toValue: 1, duration: 1500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(e, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]))),
    ];
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [lit, flick, glow, embers]);

  const scaleY = flick.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.12] });
  const scaleX = flick.interpolate({ inputRange: [0, 1], outputRange: [1.04, 0.94] });
  const rotate = flick.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '5deg'] });
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });
  const c = lit ? '#FFD23F' : 'rgba(255,255,255,0.45)';

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: '#FFB300', opacity: lit ? glowOpacity : 0.15, transform: [{ scale: glowScale }] }} />
      <View style={{ position: 'absolute', width: size * 0.8, height: size * 0.8, borderRadius: size * 0.4, backgroundColor: 'rgba(255,255,255,0.22)' }} />
      {lit ? embers.map((e, i) => (
        <Animated.View key={i} style={{
          position: 'absolute', bottom: size * 0.3, left: size * (0.3 + i * 0.2),
          width: 6, height: 6, borderRadius: 3, backgroundColor: i === 1 ? '#FFF4C2' : '#FFD23F',
          opacity: e.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
          transform: [
            { translateY: e.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.75] }) },
            { translateX: e.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, i === 1 ? 4 : -4, 0] }) },
          ],
        }} />
      )) : null}
      <Animated.View style={{ alignItems: 'center', justifyContent: 'center', transform: [{ rotate }, { scaleX }, { scaleY }] }}>
        <Ionicons name="flame" size={size * 0.62} color={c} />
        <View style={{ position: 'absolute', top: size * 0.2 }}>
          <Ionicons name="flame" size={size * 0.32} color={lit ? '#FFF4C2' : 'rgba(255,255,255,0.6)'} />
        </View>
      </Animated.View>
    </View>
  );
}