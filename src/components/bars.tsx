import { View } from 'react-native';
import { useApp } from '@/context/app-context';
import { Txt } from './ui';

export type BarItem = { label: string; sub?: string; value: number | null };
/** Simple vertical bar chart (one bar per term). */
export function Bars({ items, color, max, format = (n: number) => String(n) }: { items: BarItem[]; color: string; max?: number; format?: (n: number) => string }) {
  const { palette, isAr } = useApp();
  const top = Math.max(1, max ?? 0, ...items.map(i => i.value ?? 0));
  const H = 140;
  return <View style={{ flexDirection: isAr ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 6, paddingTop: 8 }}>
    {items.map((i, k) => <View key={k} style={{ flex: 1, alignItems: 'center', gap: 4, minWidth: 0 }}>
      <Txt variant="caption" style={{ fontSize: 10, lineHeight: 13 }} numberOfLines={1}>{i.value === null ? '—' : format(i.value)}</Txt>
      <View style={{ width: '70%', maxWidth: 34, height: H, justifyContent: 'flex-end', borderRadius: 8, backgroundColor: palette.inputBg }}>
        <View style={{ height: Math.max(3, ((i.value ?? 0) / top) * H), borderRadius: 8, backgroundColor: i.value === null ? palette.faint : color }} />
      </View>
      <Txt variant="caption" center style={{ fontSize: 10, lineHeight: 13 }} numberOfLines={1}>{i.label}</Txt>
      {i.sub ? <Txt variant="caption" center style={{ fontSize: 9, lineHeight: 12 }} numberOfLines={1} color={palette.faint}>{i.sub}</Txt> : null}
    </View>)}
  </View>;
}