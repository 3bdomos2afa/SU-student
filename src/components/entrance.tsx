import { useEffect, useRef, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';

/** Fade + slide-up entrance. Shows instantly when the OS asks for reduced motion. */
export function Entrance({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let alive = true;
    let animation: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduce) => {
        if (!alive) return;
        if (reduce) {
          v.setValue(1);
          return;
        }
        animation = Animated.timing(v, { toValue: 1, duration: 520, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true });
        animation.start();
      })
      .catch(() => v.setValue(1));
    return () => {
      alive = false;
      animation?.stop();
      v.setValue(1);
    };
  }, [v, delay]);
  return (
    <Animated.View style={[{ opacity: v, gap: 14, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) }] }, style]}>
      {children}
    </Animated.View>
  );
}