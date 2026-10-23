import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Stop, LinearGradient as SvgGradient } from 'react-native-svg';

import { useApp } from '@/context/app-context';
import type { IconName } from '@/data/services';
import { initials } from '@/lib/format';
import { tap } from '@/lib/haptics';
import { alpha, radius as R } from '@/lib/theme';

export const BRAND_GRADIENT = ['#6366F1', '#A855F7', '#EC4899'] as const;

function detectLiquidGlass() {
  if (Platform.OS !== 'ios') return false;
  try {
    return isLiquidGlassAvailable();
  } catch {
    return false;
  }
}
const LIQUID_GLASS = detectLiquidGlass();

/* ---------- Animated liquid background ---------- */

function Blob({ color, size, style, dx, dy, t }: { color: string; size: number; style: ViewStyle; dx: number; dy: number; t: Animated.Value }) {
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          transform: [
            { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
            { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) },
          ],
        },
        style,
      ]}>
      <LinearGradient colors={[alpha(color, 0.6), alpha(color, 0)]} start={{ x: 0.15, y: 0.15 }} end={{ x: 0.85, y: 0.85 }} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

export function GlassBackground() {
  const { palette } = useApp();
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={palette.bg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Blob t={t} color={palette.blobs[0]} size={360} dx={60} dy={40} style={{ top: -110, left: -90 }} />
      <Blob t={t} color={palette.blobs[1]} size={320} dx={-50} dy={80} style={{ top: 240, right: -120 }} />
      <Blob t={t} color={palette.blobs[2]} size={300} dx={40} dy={-70} style={{ bottom: -110, left: -20 }} />
    </View>
  );
}

/* ---------- Glass surface ---------- */

type GlassProps = { children?: ReactNode; style?: StyleProp<ViewStyle>; padding?: number; radius?: number; intensity?: number; tint?: string };

export function Glass({ children, style, padding = 16, radius = R.lg, intensity = 45, tint }: GlassProps) {
  const { palette, scheme } = useApp();
  if (LIQUID_GLASS) {
    // iOS 26+: native Liquid Glass material.
    return (
      <GlassView glassEffectStyle="regular" tintColor={tint} style={[{ borderRadius: radius, padding, overflow: 'hidden' }, style]}>
        {children}
      </GlassView>
    );
  }
  const fill = tint ?? (Platform.OS === 'android' ? alpha(palette.card, scheme === 'dark' ? 0.62 : 0.7) : palette.glassTint);
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden', borderWidth: 1, borderColor: palette.glassBorder }, style]}>
      {Platform.OS !== 'android' ? (
        <BlurView intensity={intensity} tint={scheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      ) : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} />
      <LinearGradient
        pointerEvents="none"
        colors={[palette.glassHighlight, 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.7 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ padding }}>{children}</View>
    </View>
  );
}

/* ---------- Text ---------- */

type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'sub' | 'caption' | 'label';
const variants: Record<Variant, TextStyle> = {
  h1: { fontSize: 30, fontWeight: '800' },
  h2: { fontSize: 22, fontWeight: '800' },
  h3: { fontSize: 17, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 24 },
  sub: { fontSize: 14, lineHeight: 21 },
  caption: { fontSize: 12, lineHeight: 18 },
  label: { fontSize: 14, fontWeight: '700' },
};

type TxtProps = TextProps & { variant?: Variant; color?: string; center?: boolean; weight?: TextStyle['fontWeight'] };

export function Txt({ variant = 'body', color, center, weight, style, ...rest }: TxtProps) {
  const { palette, align, isAr } = useApp();
  const muted = variant === 'sub' || variant === 'caption';
  return (
    <Text
      {...rest}
      style={[
        variants[variant],
        { color: color ?? (muted ? palette.sub : palette.text), textAlign: center ? 'center' : align, writingDirection: isAr ? 'rtl' : 'ltr' },
        weight ? { fontWeight: weight } : null,
        style,
      ]}
    />
  );
}

/* ---------- Pressables ---------- */

type PressProps = {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  haptic?: boolean;
  label?: string;
};

export function PressScale({ children, onPress, onLongPress, style, disabled, haptic = true, label }: PressProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPressIn={() => to(0.96)}
      onPressOut={() => to(1)}
      onPress={() => {
        if (haptic) tap();
        onPress?.();
      }}
      onLongPress={onLongPress}
      style={style}>
      <Animated.View style={{ transform: [{ scale }], opacity: disabled ? 0.5 : 1 }}>{children}</Animated.View>
    </Pressable>
  );
}

type ButtonProps = {
  title: string;
  onPress?: () => void;
  icon?: IconName;
  variant?: 'primary' | 'glass' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, icon, variant = 'primary', loading, disabled, small, style }: ButtonProps) {
  const { palette, row } = useApp();
  const h = small ? 38 : 52;
  const fg = variant === 'primary' ? '#FFFFFF' : variant === 'danger' ? palette.danger : palette.text;
  const content = (
    <View style={{ flexDirection: row, alignItems: 'center', justifyContent: 'center', gap: 8, height: h, paddingHorizontal: small ? 14 : 20 }}>
      {loading ? <ActivityIndicator color={fg} size="small" /> : icon ? <Ionicons name={icon} size={small ? 16 : 19} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: small ? 13 : 16, fontWeight: '700' }}>{title}</Text>
    </View>
  );
  return (
    <PressScale onPress={onPress} disabled={disabled || loading} style={style} label={title}>
      {variant === 'primary' ? (
        <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: h / 2 }}>
          {content}
        </LinearGradient>
      ) : (
        <View
          style={{
            borderRadius: h / 2,
            borderWidth: 1,
            borderColor: variant === 'danger' ? alpha(palette.danger, 0.5) : palette.glassBorder,
            backgroundColor: variant === 'danger' ? alpha(palette.danger, 0.1) : palette.inputBg,
          }}>
          {content}
        </View>
      )}
    </PressScale>
  );
}

export function Chip({ label, active, onPress, icon, color }: { label?: string; active?: boolean; onPress?: () => void; icon?: IconName; color?: string }) {
  const { palette, row } = useApp();
  const c = color ?? palette.primary;
  const body = (
    <View
      style={{
        flexDirection: row,
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: label ? 13 : 10,
        height: 34,
        borderRadius: 17,
        borderWidth: 1,
        borderColor: active ? alpha(c, 0.6) : palette.glassBorder,
        backgroundColor: active ? alpha(c, 0.2) : palette.inputBg,
      }}>
      {icon ? <Ionicons name={icon} size={15} color={active ? c : palette.sub} /> : null}
      {label ? <Text style={{ color: active ? palette.text : palette.sub, fontWeight: active ? '700' : '500', fontSize: 13 }}>{label}</Text> : null}
    </View>
  );
  return onPress ? <PressScale onPress={onPress} label={label}>{body}</PressScale> : body;
}

export function IconBadge({ icon, color, size = 44 }: { icon: IconName; color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: alpha(color, 0.18),
        borderWidth: 1,
        borderColor: alpha(color, 0.35),
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Ionicons name={icon} size={size * 0.5} color={color} />
    </View>
  );
}

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  return (
    <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.36 }}>{initials(name)}</Text>
    </LinearGradient>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string; icon?: IconName }[]; value: T; onChange: (v: T) => void }) {
  const { palette, row } = useApp();
  return (
    <View style={{ flexDirection: row, padding: 4, borderRadius: 16, backgroundColor: palette.inputBg, borderWidth: 1, borderColor: palette.glassBorder, gap: 4 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              tap();
              onChange(o.value);
            }}
            style={{
              flex: 1,
              height: 38,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: row,
              gap: 6,
              backgroundColor: active ? alpha(palette.primary, 0.25) : 'transparent',
              borderWidth: active ? 1 : 0,
              borderColor: alpha(palette.primary, 0.5),
            }}>
            {o.icon ? <Ionicons name={o.icon} size={15} color={active ? palette.text : palette.sub} /> : null}
            <Text style={{ color: active ? palette.text : palette.sub, fontWeight: active ? '700' : '500', fontSize: 13 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProgressRing({ value, size = 120, stroke = 12, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const { palette } = useApp();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={palette.accent} />
            <Stop offset="1" stopColor={palette.pink} />
          </SvgGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={palette.glassBorder} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ring)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - v)}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {children}
    </View>
  );
}

export function ProgressBar({ value, color, height = 8 }: { value: number; color?: string; height?: number }) {
  const { palette, isAr } = useApp();
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: palette.inputBg, overflow: 'hidden' }}>
      <LinearGradient
        colors={[color ?? palette.accent, palette.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: `${pct}%` as `${number}%`, height: '100%', borderRadius: height / 2, alignSelf: isAr ? 'flex-end' : 'flex-start' }}
      />
    </View>
  );
}

export function Field({ icon, style, ...props }: TextInputProps & { icon?: IconName }) {
  const { palette, row, align } = useApp();
  return (
    <View
      style={{
        flexDirection: row,
        alignItems: 'center',
        gap: 10,
        backgroundColor: palette.inputBg,
        borderRadius: R.md,
        borderWidth: 1,
        borderColor: palette.glassBorder,
        paddingHorizontal: 14,
        minHeight: 50,
      }}>
      {icon ? <Ionicons name={icon} size={19} color={palette.sub} /> : null}
      <TextInput placeholderTextColor={palette.faint} {...props} style={[{ flex: 1, color: palette.text, fontSize: 16, textAlign: align, paddingVertical: 12 }, style]} />
    </View>
  );
}

/* ---------- Layout ---------- */

export function Screen({
  children,
  refreshing,
  onRefresh,
  padBottom = true,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  padBottom?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { palette, banner } = useApp();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg[0] }}>
      <GlassBackground />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12 + (banner ? 64 : 0),
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + (padBottom ? 120 : 28),
          gap: 14,
        }}
        refreshControl={
          onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={palette.primary} colors={[palette.primary]} /> : undefined
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

export function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const { row } = useApp();
  return (
    <View style={{ flexDirection: row, alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Txt variant="h1">{title}</Txt>
        {subtitle ? <Txt variant="sub">{subtitle}</Txt> : null}
      </View>
      {right}
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { row, palette } = useApp();
  return (
    <View style={{ flexDirection: row, alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
      <Txt variant="h3">{title}</Txt>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={{ color: palette.primary, fontWeight: '700', fontSize: 13 }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({ icon, title, text, children }: { icon: IconName; title: string; text?: string; children?: ReactNode }) {
  const { palette } = useApp();
  return (
    <View style={{ alignItems: 'center', gap: 8, paddingVertical: 18 }}>
      <IconBadge icon={icon} color={palette.primary} size={56} />
      <Txt variant="h3" center>{title}</Txt>
      {text ? <Txt variant="sub" center>{text}</Txt> : null}
      {children}
    </View>
  );
}

export function Divider() {
  const { palette } = useApp();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: palette.glassBorder, marginHorizontal: 12 }} />;
}