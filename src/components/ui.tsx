import { Backdrop } from './backdrop';
import { Ionicons } from '@expo/vector-icons';
import { fontFamily } from '@/lib/fonts';
import { useCustomFontsReady } from '@/lib/font-ready';

import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  AccessibilityInfo,
  Animated,
  Easing,
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
import { alpha, hard, readableOn, radius as R } from '@/lib/theme';

export const BRAND_GRADIENT = ['#8B53FE', '#6B3FE0'] as const;

/** True when the OS asks for reduced motion (false until known). */
export function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((r) => alive && setReduce(r)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (r: boolean) => setReduce(r));
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  return reduce;
}

/** Slowly drifting aurora blob (native-driver transform only). */
function Blob({ color, size, style, dx, dy, duration }: { color: string; size: number; style: ViewStyle; dx: number; dy: number; duration: number }) {
  const v = useRef(new Animated.Value(0)).current;
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const ease = Easing.inOut(Easing.sin);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, easing: ease, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration, easing: ease, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, duration, reduce]);
  return (
    <Animated.View
      style={[
        { position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
        {
          transform: [
            { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
          ],
        },
      ]}
    />
  );
}

export function GlassBackground() {
  const { palette } = useApp();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.bg[0] }]} />
      <Backdrop />
    </View>
  );
}

type GlassProps = { children?: ReactNode; style?: StyleProp<ViewStyle>; padding?: number; radius?: number; intensity?: number; tint?: string };
export function Glass({ children, style, padding = 18, radius = 20, tint }: GlassProps) {
  const { palette } = useApp();
  return (
    <View
      style={[
        { borderRadius: radius, padding, backgroundColor: tint ?? palette.card, borderWidth: 2.5, borderColor: palette.ink, boxShadow: hard(palette.ink, 5) },
        style,
      ]}>
      {children}
    </View>
  );
}

/* ---------- Text ---------- */

type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'sub' | 'caption' | 'label';
const variants: Record<Variant, TextStyle> = {
  display: { fontSize: 38, lineHeight: 46 },
  h1: { fontSize: 30, lineHeight: 42 },
  h2: { fontSize: 22, lineHeight: 32 },
  h3: { fontSize: 17, lineHeight: 25 },
  body: { fontSize: 15, lineHeight: 25 },
  sub: { fontSize: 14, lineHeight: 21 },
  caption: { fontSize: 12.5, lineHeight: 19 },
  label: { fontSize: 14, lineHeight: 20 },
};

type TxtProps = TextProps & { variant?: Variant; color?: string; center?: boolean; weight?: TextStyle['fontWeight'] };

export function Txt({ variant = 'body', color, center, weight, style, ...rest }: TxtProps) {
  const { palette, align, isAr } = useApp();
  const fontsReady = useCustomFontsReady();
  const muted = variant === 'sub' || variant === 'caption';
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const bold = !!weight || ['display', 'h1', 'h2', 'h3', 'label'].includes(variant) || ['600', '700', '800', '900', 'bold'].includes(String(flat?.fontWeight ?? ''));
  return (
    <Text
      {...rest}
      style={[
        variants[variant],
        { color: color ?? (muted ? palette.sub : palette.text), textAlign: center ? 'center' : align, writingDirection: isAr ? 'rtl' : 'ltr' },
        style,
        { fontFamily: fontsReady ? fontFamily(isAr, bold, variant === 'h1' || variant === 'display') : undefined, fontWeight: fontsReady ? 'normal' : (bold ? '700' : '400') },
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

/** Springy press feedback (scale) for every tappable surface. */
export function PressScale({ children, onPress, onLongPress, style, disabled, haptic = true, label }: PressProps) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(s, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 7 }).start();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={() => to(0.95)}
      onPressOut={() => to(1)}
      onPress={() => {
        if (haptic) tap();
        onPress?.();
      }}
      onLongPress={onLongPress}
      style={style}>
      <Animated.View style={{ transform: [{ scale: s }], opacity: disabled ? 0.45 : 1 }}>{children}</Animated.View>
    </Pressable>
  );
}

type ButtonProps = {
  title: string;
  onPress?: () => void;
  icon?: IconName;
  variant?: 'primary' | 'glass' | 'danger' | 'light';
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, icon, variant = 'primary', loading, disabled, small, style }: ButtonProps) {
  const { palette, row } = useApp();
  const h = small ? 40 : 54;
  const bg = variant === 'primary' ? palette.lime : variant === 'danger' ? palette.pnk : variant === 'light' ? '#FFFFFF' : palette.card;
  const fg = variant === 'primary' ? palette.onLime : variant === 'danger' ? palette.danger : variant === 'light' ? '#0B0D14' : palette.text;
  const border = variant === 'light' ? '#0B0D14' : palette.ink;
  return (
    <PressScale onPress={onPress} disabled={disabled || loading} style={style} label={title}>
      <View
        style={{
          flexDirection: row, alignItems: 'center', justifyContent: 'center', gap: 8, height: h, paddingHorizontal: small ? 14 : 22,
          borderRadius: small ? 13 : 16, borderWidth: small ? 2 : 2.5, borderColor: border, backgroundColor: bg,
          boxShadow: hard(border, small ? 2 : 4), opacity: disabled ? 0.55 : 1,
        }}>
        {loading ? <ActivityIndicator color={fg} size="small" /> : icon ? <Ionicons name={icon} size={small ? 16 : 19} color={fg} /> : null}
        <Txt variant="label" style={{ color: fg, fontSize: small ? 13 : 16 }}>
          {title}
        </Txt>
      </View>
    </PressScale>
  );
}

export function Chip({ label, active, onPress, icon, color }: { label?: string; active?: boolean; onPress?: () => void; icon?: IconName; color?: string }) {
  const { palette, row } = useApp();
  const c = color ?? palette.purple;
  const fg = active ? readableOn(c) : palette.sub;
  const body = (
    <View
      style={{
        flexDirection: row, alignItems: 'center', gap: 6, paddingHorizontal: label ? 14 : 10, height: 36, borderRadius: 18,
        borderWidth: 2, borderColor: palette.ink, backgroundColor: active ? c : palette.card, boxShadow: active ? hard(palette.ink, 2) : undefined,
      }}>
      {icon ? <Ionicons name={icon} size={15} color={fg} /> : null}
      {label ? (
        <Txt variant="label" style={{ color: active ? fg : palette.text, fontSize: 13, lineHeight: 18 }}>
          {label}
        </Txt>
      ) : null}
    </View>
  );
  return onPress ? (
    <PressScale onPress={onPress} label={label}>
      {body}
    </PressScale>
  ) : (
    body
  );
}

export function IconBadge({ icon, color, size = 44, solid }: { icon: IconName; color: string; size?: number; solid?: boolean }) {
  const { palette } = useApp();
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size * 0.3, backgroundColor: solid ? color : alpha(color, 0.22),
        borderWidth: size >= 36 ? 2 : 1.5, borderColor: palette.ink, alignItems: 'center', justifyContent: 'center',
      }}>
      <Ionicons name={icon} size={size * 0.5} color={solid ? readableOn(color) : color} />
    </View>
  );
}

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const { palette } = useApp();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.lime, borderWidth: 2.5, borderColor: palette.ink, boxShadow: hard(palette.ink, 3) }}>
      <Txt variant="label" style={{ color: palette.onLime, fontSize: size * 0.36, lineHeight: size * 0.5 }}>
        {initials(name)}
      </Txt>
    </View>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string; icon?: IconName }[]; value: T; onChange: (v: T) => void }) {
  const { palette, row } = useApp();
  return (
    <View style={{ flexDirection: row, padding: 4, borderRadius: 18, backgroundColor: palette.soft, borderWidth: 2, borderColor: palette.ink, gap: 4 }}>
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
              flex: 1, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexDirection: row, gap: 6,
              backgroundColor: active ? palette.purple : 'transparent', borderWidth: active ? 2 : 0, borderColor: palette.ink,
            }}>
            {o.icon ? <Ionicons name={o.icon} size={15} color={active ? '#FFFFFF' : palette.sub} /> : null}
            <Txt variant="label" style={{ color: active ? '#FFFFFF' : palette.sub, fontSize: 13, lineHeight: 18 }}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

let ringSeq = 0;
export function ProgressRing({
  value,
  size = 120,
  stroke = 12,
  children,
  track,
  colors,
}: {
  value: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  track?: string;
  colors?: readonly [string, string];
}) {
  const { palette } = useApp();
  const id = useRef(`ring${++ringSeq}`).current;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  const [c0, c1] = colors ?? [palette.lime, palette.lime];
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={c0} />
            <Stop offset="1" stopColor={c1} />
          </SvgGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track ?? palette.inputBg} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${id})`}
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

export function ProgressBar({ value, color, height = 8, track }: { value: number; color?: string; height?: number; track?: string }) {
  const { palette, isAr } = useApp();
  const fraction = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let alive = true;
    let running: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduce) => {
        if (!alive) return;
        if (reduce) anim.setValue(fraction);
        else {
          running = Animated.timing(anim, { toValue: fraction, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: false });
          running.start();
        }
      })
      .catch(() => anim.setValue(fraction));
    return () => {
      alive = false;
      running?.stop();
    };
  }, [fraction, anim]);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(fraction * 100) }}
      style={{ height: height + 3, borderRadius: (height + 3) / 2, backgroundColor: track ?? palette.soft, borderWidth: 1.5, borderColor: palette.ink, overflow: 'hidden' }}>
      <Animated.View style={{ width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), height: '100%', alignSelf: isAr ? 'flex-end' : 'flex-start' }}>
        <View style={{ flex: 1, borderRadius: height / 2, backgroundColor: color ?? palette.lime }} />
      </Animated.View>
    </View>
  );
}

export function Field({ icon, style, ...props }: TextInputProps & { icon?: IconName }) {
  const { palette, row, align, isAr } = useApp();
  const fontsReady = useCustomFontsReady();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={{
        flexDirection: row,
        alignItems: 'center',
        gap: 10,
        backgroundColor: palette.card,
        borderRadius: R.md,
        borderWidth: 2,
        borderColor: focused ? palette.purple : palette.ink,
        boxShadow: hard(palette.ink, focused ? 3 : 2),
        paddingHorizontal: 14,
        minHeight: 52,
      }}>
      {icon ? <Ionicons name={icon} size={19} color={focused ? palette.primary : palette.sub} /> : null}
      <TextInput
        placeholderTextColor={palette.faint}
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={[{ flex: 1, color: palette.text, fontSize: 16, fontFamily: fontsReady ? fontFamily(isAr) : undefined, textAlign: align, paddingVertical: 12 }, style]}
      />
    </View>
  );
}

/* ---------- Layout ---------- */

export function Screen({
  children,
  refreshing,
  onRefresh,
  padBottom = true,
  scrollEnabled = true,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  padBottom?: boolean;
  scrollEnabled?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { palette, banner } = useApp();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg[0] }}>
      <GlassBackground />
      <ScrollView
        scrollEnabled={scrollEnabled}
        contentContainerStyle={{
          paddingTop: insets.top + 12 + (banner ? 64 : 0),
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + (padBottom ? 124 : 28),
          gap: 16,
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
  const { row, palette, isAr } = useApp();
  return (
    <View style={{ flexDirection: row, alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
      <View style={{ flexDirection: row, alignItems: 'center', gap: 8 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: palette.lime, borderWidth: 2, borderColor: palette.ink }} />
        <Txt variant="h3">{title}</Txt>
      </View>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10} style={{ flexDirection: row, alignItems: 'center', gap: 2, paddingHorizontal: 10, height: 30, borderRadius: 15, backgroundColor: alpha(palette.primary, 0.1) }}>
          <Txt variant="label" style={{ color: palette.primary, fontSize: 12.5, lineHeight: 18 }}>
            {action}
          </Txt>
          <Ionicons name={isAr ? 'chevron-back' : 'chevron-forward'} size={13} color={palette.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({ icon, title, text, children }: { icon: IconName; title: string; text?: string; children?: ReactNode }) {
  const { palette } = useApp();
  return (
    <View style={{ alignItems: 'center', gap: 8, paddingVertical: 18 }}>
      <IconBadge icon={icon} color={palette.primary} size={60} />
      <Txt variant="h3" center>
        {title}
      </Txt>
      {text ? (
        <Txt variant="sub" center>
          {text}
        </Txt>
      ) : null}
      {children}
    </View>
  );
}

export function Divider() {
  const { palette } = useApp();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: palette.glassBorder, marginHorizontal: 12 }} />;
}