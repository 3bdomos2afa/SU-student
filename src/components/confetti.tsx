import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useReducedMotion } from './ui';

const COLORS = ['#6A4BEF', '#D6F77E', '#C9BBFA', '#FFD0DE', '#FFEBA3', '#CBE7FF'];
const BITS = Array.from({ length: 18 }, (_, i) => ({
  x: ((i * 37) % 100) / 100, dx: ((i * 53) % 60) - 30, size: 7 + (i % 4) * 2, color: COLORS[i % COLORS.length], spin: (i % 2 ? 1 : -1) * (180 + i * 20), delay: (i % 6) * 70,
}));

/** One-shot confetti burst (skipped when the OS asks for reduced motion). */
export function Confetti() {
  const v = useRef(new Animated.Value(0)).current;
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const a = Animated.timing(v, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [v, reduce]);
  if (reduce) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden', zIndex: 50 }]}>
      {BITS.map((b, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute', top: 40, left: `${b.x * 100}%`, width: b.size, height: b.size * 1.4, borderRadius: 2, backgroundColor: b.color,
            opacity: v.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-30, 420 + (i % 5) * 40] }) },
              { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, b.dx] }) },
              { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${b.spin}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}
