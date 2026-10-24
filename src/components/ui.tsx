import { Ionicons } from '@expo/vector-icons';
import { fontFamily } from '@/lib/fonts';

import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, type ReactNode } from 'react';
import {
  ActivityIndicator,
  AccessibilityInfo,
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

export const BRAND_GRADIENT = ['#3261EC', '#6374F5'] as const;

// Glass-like rendering with ordinary views: no native glass compatibility risk.
export function GlassBackground() {
 const {palette}=useApp();
 return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
  <LinearGradient colors={palette.bg} style={StyleSheet.absoluteFill}/>
  <View style={{position:'absolute',top:-95,right:-60,width:330,height:330,borderRadius:165,backgroundColor:alpha(palette.accent,0.12)}}/>
  <View style={{position:'absolute',top:340,left:-170,width:340,height:340,borderRadius:170,backgroundColor:alpha(palette.pink,0.07)}}/>
 </View>;
}
type GlassProps={children?:ReactNode;style?:StyleProp<ViewStyle>;padding?:number;radius?:number;intensity?:number;tint?:string};
export function Glass({children,style,padding=20,radius=28,tint}:GlassProps){
 const {palette,scheme}=useApp();
 return <View style={[{borderRadius:radius,padding,overflow:'hidden',backgroundColor:tint??palette.card,borderWidth:1,borderColor:palette.glassBorder,boxShadow:scheme==='dark'?'0 8px 28px rgba(0,0,0,0.10)':'0 8px 28px rgba(47,74,135,0.06)'},style]}>
  <LinearGradient pointerEvents="none" colors={scheme==='dark'?['rgba(255,255,255,0.055)','rgba(255,255,255,0)']:['rgba(255,255,255,0.8)','rgba(255,255,255,0.05)']} style={StyleSheet.absoluteFill}/>
  <View pointerEvents="none" style={{height:1,position:'absolute',left:20,right:20,top:0,backgroundColor:palette.glassHighlight}}/>
  {children}
 </View>;
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
        { fontFamily: fontFamily(isAr, !!weight || ['h1','h2','h3','label'].includes(variant), variant === 'h1'), fontWeight: 'normal' },
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
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled}
    onPress={()=>{ if(haptic)tap(); onPress?.(); }} onLongPress={onLongPress}
    style={({pressed})=>[style,{opacity:disabled?0.45:pressed?0.75:1}]}>
      {children}
    </Pressable>;
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
      <Txt style={{ color: fg, fontSize: small ? 13 : 16, fontWeight: '700' }}>{title}</Txt>
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
      {label ? <Txt style={{ color: active ? palette.text : palette.sub, fontWeight: active ? '700' : '500', fontSize: 13 }}>{label}</Txt> : null}
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
      <Txt style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.36 }}>{initials(name)}</Txt>
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
            <Txt style={{ color: active ? palette.text : palette.sub, fontWeight: active ? '700' : '500', fontSize: 13 }}>{o.label}</Txt>
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
  const v = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
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

export function ProgressBar({value,color,height=8}:{value:number;color?:string;height?:number}){
 const {palette,isAr}=useApp();
 const fraction=Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;
 const anim=useRef(new Animated.Value(0)).current;
 useEffect(()=>{
  let alive=true;let running:Animated.CompositeAnimation|undefined;
  AccessibilityInfo.isReduceMotionEnabled().then(reduce=>{
   if(!alive)return;
   if(reduce)anim.setValue(fraction);
   else{running=Animated.timing(anim,{toValue:fraction,duration:650,useNativeDriver:false});running.start();}
  }).catch(()=>anim.setValue(fraction));
  return()=>{alive=false;running?.stop();};
 },[fraction,anim]);
 return <View accessibilityRole="progressbar" accessibilityValue={{min:0,max:100,now:Math.round(fraction*100)}} style={{height,borderRadius:height/2,backgroundColor:palette.inputBg,overflow:'hidden'}}>
  <Animated.View style={{width:anim.interpolate({inputRange:[0,1],outputRange:['0%','100%']}),height:'100%',alignSelf:isAr?'flex-end':'flex-start'}}>
   <LinearGradient colors={[color??palette.accent,palette.primary]} style={{flex:1,borderRadius:height/2}} start={{x:0,y:0}} end={{x:1,y:0}}/>
  </Animated.View>
 </View>;
}

export function Field({ icon, style, ...props }: TextInputProps & { icon?: IconName }) {
  const { palette, row, align, isAr } = useApp();
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
      <TextInput placeholderTextColor={palette.faint} {...props} style={[{ flex: 1, color: palette.text, fontSize: 16, fontFamily: fontFamily(isAr), textAlign: align, paddingVertical: 12 }, style]} />
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
          <Txt style={{ color: palette.primary, fontWeight: '700', fontSize: 13 }}>{action}</Txt>
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