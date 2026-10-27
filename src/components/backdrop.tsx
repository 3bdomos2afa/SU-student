import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { useApp } from '@/context/app-context';

/** Flat sticker-style backdrop: a very faint dot grid on the plain background. */
export function Backdrop() {
  const { scheme } = useApp();
  const dot = scheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(11,13,20,0.06)';
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="su-dots" width={22} height={22} patternUnits="userSpaceOnUse">
            <Circle cx={2} cy={2} r={1.2} fill={dot} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#su-dots)" />
      </Svg>
    </View>
  );
}