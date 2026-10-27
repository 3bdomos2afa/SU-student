import { useState, type ReactNode } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useApp } from '@/context/app-context';
import { terms, type Cache, type Term } from '@/lib/academic';
import { entryYearOf, studyLabel, studyTerms, type LabelPart } from '@/lib/term-label';
import { studentCode } from '@/lib/student';
import { Glass, Header, PressScale, Txt } from './ui';

export function PageTop({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const { tr, row, palette, isAr } = useApp();
  return <View style={{ gap: 6 }}>
    <View style={{ flexDirection: row }}>
      <PressScale label={tr('رجوع', 'Back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))}>
        <View style={{ flexDirection: row, alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 18, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.glassBorder }}>
          <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={18} color={palette.primary} />
          <Txt variant="label" color={palette.primary}>{tr('رجوع', 'Back')}</Txt>
        </View>
      </PressScale>
    </View>
    <Header title={title} subtitle={subtitle} right={right} />
  </View>;
}

/** A card that opens a dropdown with its details when tapped. */
export function Expand({ head, children, color, open: initial = false, onOpen }: { head: ReactNode; children: ReactNode; color?: string; open?: boolean; onOpen?: () => void }) {
  const { row, palette } = useApp(); const [open, setOpen] = useState(initial);
  return <Glass padding={0}>
    <PressScale label="details" onPress={() => { if (!open) onOpen?.(); setOpen(o => !o); }}>
      <View style={{ flexDirection: row, alignItems: 'center', gap: 10, padding: 14 }}>
        {color ? <View style={{ width: 5, alignSelf: 'stretch', borderRadius: 3, backgroundColor: color }} /> : null}
        <View style={{ flex: 1 }}>{head}</View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={palette.sub} />
      </View>
    </PressScale>
    {open ? <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 10, borderTopWidth: 1, borderTopColor: palette.glassBorder, paddingTop: 12 }}>{children}</View> : null}
  </Glass>;
}

export function Stat({ k, v, color, hint }: { k: string; v: string; color?: string; hint?: string }) {
  const { palette } = useApp();
  return <View style={{ flex: 1, minWidth: 90, alignItems: 'center', gap: 2, paddingVertical: 10, borderRadius: 18, backgroundColor: palette.inputBg }}>
    <Txt variant="h2" color={color ?? palette.primary} center>{v}</Txt>
    <Txt variant="caption" center numberOfLines={2}>{k}</Txt>
    {hint ? <Txt variant="caption" center style={{ fontSize: 10, lineHeight: 13 }}>{hint}</Txt> : null}
  </View>;
}

/** Terms oldest → newest with student-friendly names ("سنة أولى · ترم أول"). */
export function useTerms(cache: Cache) {
  const { isAr } = useApp();
  const entry = entryYearOf(studentCode(cache));
  const list = terms(cache); const pos = studyTerms(list, entry);
  const label = (t: Term, part: LabelPart = 'full') => studyLabel(pos.get(t.serial), isAr, part);
  return { list, label, pos, entry };
}