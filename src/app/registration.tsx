import { useState } from 'react';
import { router } from 'expo-router';
import { Linking, View } from 'react-native';
import { useApp } from '@/context/app-context';
import { text } from '@/lib/academic';
import { displayRecords, fieldLabel, formatValue, hiddenField } from '@/lib/field-labels';
import { PORTAL_ORIGIN } from '@/lib/portal';
import { studyLabel, upcomingStudyTerm } from '@/lib/term-label';
import { PageTop, useTerms } from '@/components/page';
import { Button, Glass, Screen, Txt } from '@/components/ui';

export default function Registration() {
  const a = useApp(); const { tr, row, palette, cache, lang, isAr } = a; const [busy, setBusy] = useState(false);
  const { pos, entry } = useTerms(cache);
  const next = upcomingStudyTerm(pos, entry);
  const recs = displayRecords(cache.SEC_REGISTRATION?.data);
  async function load() { setBusy(true); try { await a.fetchService('SEC_REGISTRATION', true); } finally { setBusy(false); } }
  return <Screen padBottom={false} refreshing={busy} onRefresh={() => { void load(); }}>
    <PageTop title={tr('حالة التسجيل', 'Registration status')} subtitle={next ? tr(`الترم الجاي: ${studyLabel(next, true, 'long')}`, `Next term: ${studyLabel(next, false, 'long')}`) : undefined} />
    <Glass><View style={{ gap: 10 }}>
      <Txt variant="h3">{tr('ميعاد التسجيل من الجامعة', 'Registration window from the university')}</Txt>
      {!recs.length ? <Txt variant="sub">{cache.SEC_REGISTRATION ? tr('الجامعة لسه ما فتحتش فترة تسجيل للترم الجاي.', 'No registration window published yet.') : tr('لسه متحمّلتش. دوس تحديث.', 'Not loaded yet. Tap refresh.')}</Txt>
        : recs.map((r, i) => <View key={i} style={{ gap: 6, paddingVertical: 4 }}>
          {Object.entries(r).filter(([k, v]) => !hiddenField(k) && v !== null && typeof v !== 'object' && text(v).trim()).map(([k, v]) =>
            <View key={k} style={{ flexDirection: row, justifyContent: 'space-between', gap: 10 }}>
              <Txt variant="caption" style={{ flex: 1 }}>{fieldLabel(k, lang)}</Txt>
              <Txt variant="label" style={{ flex: 1.3, textAlign: isAr ? 'left' : 'right' }}>{formatValue(k, v, lang)}</Txt>
            </View>)}
        </View>)}
      <Button small variant="glass" icon="refresh" title={tr('تحديث', 'Refresh')} loading={busy} disabled={!a.session} onPress={() => { void load(); }} />
    </View></Glass>
    <Glass><View style={{ gap: 10 }}>
      <Txt variant="h3">{tr('التسجيل نفسه', 'Registering')}</Txt>
      <Txt variant="sub">{tr('بصراحة: لسه معرفناش الطريقة الرسمية اللي البوابة بتسجّل بيها المواد، فمش هنسجّل من الأبلكيشن عشان تسجيلك يفضل سليم. حضّر موادك في "تخطيط التسجيل" وبعدين سجّل من الموقع الرسمي.', 'Honestly: the portal\'s official registration method is not known yet, so the app does not register for you. Plan your courses here, then register on the official site.')}</Txt>
      <Button icon="clipboard-outline" title={tr('تخطيط التسجيل', 'Registration planner')} onPress={() => router.push('/tools?tab=planner' as never)} />
      <Button variant="glass" icon="open-outline" title={tr('افتح الموقع الرسمي', 'Open the official site')} onPress={() => { void Linking.openURL(PORTAL_ORIGIN); }} />
    </View></Glass>
    <Txt variant="caption" center color={palette.faint}>{tr('المواعيد دي من حساب الجامعة نفسه.', 'These dates come from your university account.')}</Txt>
  </Screen>;
}