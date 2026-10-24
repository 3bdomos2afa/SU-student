import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useApp } from '@/context/app-context';

/** Subtle dot grid with a soft glow at the top, drawn under the moving colour blobs. */
export function Backdrop() {
  const { scheme, palette } = useApp();
  const dark = scheme === 'dark';
  const dot = dark ? 'rgba(255,255,255,0.07)' : 'rgba(79,70,229,0.09)';
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="su-dots" width={22} height={22} patternUnits="userSpaceOnUse">
            <Circle cx={2} cy={2} r={1.2} fill={dot} />
          </Pattern>
          <RadialGradient id="su-glow" cx="50%" cy="0%" r="80%">
            <Stop offset="0" stopColor={palette.blobs[0]} stopOpacity={dark ? 0.38 : 0.2} />
            <Stop offset="0.55" stopColor={palette.blobs[2]} stopOpacity={dark ? 0.12 : 0.07} />
            <Stop offset="1" stopColor={palette.blobs[2]} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#su-dots)" />
        <Rect width="100%" height="65%" fill="url(#su-glow)" />
      </Svg>
    </View>
  );
}