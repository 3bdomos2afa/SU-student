import { Ionicons } from '@/components/icon';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Txt } from '@/components/ui';
import { useApp } from '@/context/app-context';
import type { IconName } from '@/data/services';
import { alpha } from '@/lib/theme';

export type Option<T extends string | number> = { value: T; label: string; hint?: string };

/** Tap-to-open select: a field that opens a bottom sheet list of options. */
export function Dropdown<T extends string | number>({ label, value, options, onChange, icon, title }: {
  label?: string; value: T; options: Option<T>[]; onChange: (v: T) => void; icon?: IconName; title?: string;
}) {
  const { palette, row } = useApp();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.value === value);
  const ROW = 52;
  const index = Math.max(0, options.findIndex(o => o.value === value));
  return (
    <View style={{ flex: 1, gap: 6 }}>
      {label ? <Txt variant="caption">{label}</Txt> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={label || title} onPress={() => setOpen(true)}
        style={({ pressed }) => ({ flexDirection: row, alignItems: 'center', gap: 8, minHeight: 50, paddingHorizontal: 14, borderRadius: 16,
          borderWidth: 1.5, borderColor: open ? palette.primary : palette.glassBorder, backgroundColor: palette.inputBg, opacity: pressed ? 0.8 : 1 })}>
        {icon ? <Ionicons name={icon} size={18} color={palette.primary} /> : null}
        <Txt variant="label" style={{ flex: 1 }} numberOfLines={1}>{current?.label ?? '—'}</Txt>
        <Ionicons name="chevron-down" size={16} color={palette.sub} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }} onPress={() => setOpen(false)}>
          <Pressable onPress={() => {}} style={{ maxHeight: '70%', backgroundColor: palette.bg[0], borderTopLeftRadius: 28, borderTopRightRadius: 28,
            paddingTop: 10, paddingBottom: insets.bottom + 12, borderWidth: 1, borderColor: palette.glassBorder }}>
            <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: palette.faint, marginBottom: 10 }} />
            <Txt variant="h3" style={{ paddingHorizontal: 20, marginBottom: 8 }}>{title || label}</Txt>
            <ScrollView contentOffset={{ x: 0, y: Math.max(0, (index - 2) * ROW) }}>
              {options.map(o => {
                const on = o.value === value;
                return (
                  <Pressable key={String(o.value)} accessibilityRole="button" accessibilityState={{ selected: on }}
                    onPress={() => { onChange(o.value); setOpen(false); }}
                    style={({ pressed }) => ({ flexDirection: row, alignItems: 'center', gap: 10, minHeight: ROW, paddingHorizontal: 20,
                      backgroundColor: on ? alpha(palette.primary, 0.16) : pressed ? alpha(palette.primary, 0.08) : 'transparent' })}>
                    <View style={{ flex: 1 }}>
                      <Txt variant="label" color={on ? palette.primary : undefined}>{o.label}</Txt>
                      {o.hint ? <Txt variant="caption">{o.hint}</Txt> : null}
                    </View>
                    {on ? <Ionicons name="checkmark-circle" size={20} color={palette.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/** Short success message that slides in at the top and hides itself. */
export function Toast({ message, onHide }: { message: string; onHide: () => void }) {
  const { palette, row } = useApp();
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(-40)).current;
  useEffect(() => {
    if (!message) return;
    y.setValue(-40);
    Animated.spring(y, { toValue: 0, useNativeDriver: true, friction: 7 }).start();
    const t = setTimeout(onHide, 1800);
    return () => clearTimeout(t);
  }, [message]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!message) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onHide}>
      <Pressable style={{ flex: 1, alignItems: 'center', paddingTop: insets.top + 18, paddingHorizontal: 24 }} onPress={onHide}>
        <Animated.View accessibilityLiveRegion="polite" style={{ transform: [{ translateY: y }], flexDirection: row, alignItems: 'center', gap: 10,
          backgroundColor: palette.success, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 18 }}>
          <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
          <Txt variant="label" color="#FFFFFF">{message}</Txt>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
/** Bottom sheet list opened from any button (used by the planner's "change" / "add"). */
export function OptionSheet<T extends string | number>({ visible, title, options, onPick, onClose, empty }: {
  visible: boolean; title: string; options: Option<T>[]; onPick: (v: T) => void; onClose: () => void; empty?: string;
}) {
  const { palette, row } = useApp();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable onPress={() => {}} style={{ maxHeight: '75%', backgroundColor: palette.bg[0], borderTopLeftRadius: 28, borderTopRightRadius: 28,
          paddingTop: 10, paddingBottom: insets.bottom + 12, borderWidth: 1, borderColor: palette.glassBorder }}>
          <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: palette.faint, marginBottom: 10 }} />
          <Txt variant="h3" style={{ paddingHorizontal: 20, marginBottom: 8 }}>{title}</Txt>
          {!options.length && empty ? <Txt variant="sub" style={{ paddingHorizontal: 20, paddingBottom: 12 }}>{empty}</Txt> : null}
          <ScrollView>
            {options.map(o => (
              <Pressable key={String(o.value)} accessibilityRole="button" onPress={() => onPick(o.value)}
                style={({ pressed }) => ({ flexDirection: row, alignItems: 'center', gap: 10, minHeight: 56, paddingHorizontal: 20, paddingVertical: 8,
                  backgroundColor: pressed ? alpha(palette.primary, 0.1) : 'transparent' })}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="label">{o.label}</Txt>
                  {o.hint ? <Txt variant="caption">{o.hint}</Txt> : null}
                </View>
                <Ionicons name="add-circle-outline" size={20} color={palette.primary} />
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
