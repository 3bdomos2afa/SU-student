import { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useApp } from '@/context/app-context';
import { canonical, timetable } from '@/lib/academic';
import { absenceByCourse, absenceTone, toneColor } from '@/lib/absence';
import { currentCourses, toMinutes, WEEK } from '@/lib/student';
import { markTotal, marks } from '@/lib/marks';
import { AbsenceBar, SlotCard } from '@/components/academic-cards';
import { Expand, PageTop } from '@/components/page';
import { Button, Glass, Screen, Txt } from '@/components/ui';

const dayIdx = (d: number | null) => (d === null ? 99 : d === 5 ? 6 : WEEK.indexOf(d as (typeof WEEK)[number]));
const fmt = (n: number) => String(Math.round(n * 100) / 100);

export default function Courses() {
  const a = useApp(); const { tr, row, palette, cache } = a; const [busy, setBusy] = useState('');
  const by = absenceByCourse(cache); const slots = timetable(cache);
  const list = currentCourses(cache);
  async function load(code: string) { setBusy(code); try { await a.fetchService(`GRADES:${code}`, true); } finally { setBusy(''); } }
  return <Screen padBottom={false} refreshing={a.refreshing} onRefresh={a.refreshAll}>
    <PageTop title={tr('المواد الحالية', 'Current courses')} subtitle={tr('دوس على أي مادة عشان تشوف مواعيدها ودرجاتها وغيابها', 'Tap a course for its times, marks and absence')} />
    {!list.length ? <Glass><Txt variant="sub">{tr('لسه مفيش مواد اتحمّلت. حدّث بيانات الجامعة.', 'No courses loaded yet. Refresh university data.')}</Txt><Button small title={tr('تحديث', 'Refresh')} disabled={!a.session || a.refreshing} onPress={() => { void a.refreshAll(); }} /></Glass> : null}
    {list.map(c => {
      const pct = by.get(canonical(c.code)) ?? null; const tone = toneColor(absenceTone(pct));
      const own = slots.filter(s => canonical(s.code) === canonical(c.code)).sort((x, y) => dayIdx(x.day) - dayIdx(y.day) || toMinutes(x.start) - toMinutes(y.start));
      const entry = cache[`GRADES:${c.code}`]; const ms = marks(entry?.data); const total = markTotal(ms);
      return <Expand key={c.code} color={palette.primary}
        head={<View style={{ gap: 2 }}>
          <Txt variant="label" numberOfLines={2}>{c.title}</Txt>
          <Txt variant="caption">{[c.credits !== null ? tr(`${c.credits} ساعات`, `${c.credits} cr`) : '', pct !== null ? tr(`غياب ${pct}%`, `absence ${pct}%`) : '', total ? `${fmt(total.score)} / ${fmt(total.outOf)}` : ''].filter(Boolean).join(' · ')}</Txt>
        </View>}>
        <Txt variant="h3">{tr('المواعيد', 'Times')}</Txt>
        {own.length ? own.map((s, i) => <SlotCard key={i} slot={s} showDay />) : <Txt variant="sub">{tr('مواعيدها مش منشورة.', 'Times not published.')}</Txt>}
        <Txt variant="h3">{tr('الدرجات', 'Marks')}</Txt>
        {ms.length ? ms.map(m => <View key={m.key} style={{ flexDirection: row, justifyContent: 'space-between', gap: 10 }}>
          <Txt style={{ flex: 1 }}>{m.label}</Txt><Txt variant="label">{`${m.value || '—'}${m.max ? ` / ${m.max}` : ''}`}</Txt>
        </View>) : <Txt variant="sub">{entry ? tr('لسه مفيش درجات نزلت.', 'No marks posted yet.') : tr('الدرجات لسه متحمّلتش.', 'Marks not loaded yet.')}</Txt>}
        <Button small variant="glass" icon="refresh" title={tr('حدّث الدرجات', 'Refresh marks')} loading={busy === c.code} disabled={!!busy || !a.session} onPress={() => { void load(c.code); }} />
        <View style={{ flexDirection: row, justifyContent: 'space-between' }}><Txt variant="h3">{tr('الغياب', 'Absence')}</Txt><Txt variant="h3" color={tone}>{pct ?? 0}%</Txt></View>
        <AbsenceBar pct={pct} />
        <View style={{ flexDirection: row, gap: 8, flexWrap: 'wrap' }}>
          <Button small variant="glass" title={tr('تفاصيل الغياب', 'Absence details')} onPress={() => router.push(`/absence?code=${encodeURIComponent(c.code)}` as never)} />
          <Button small variant="glass" title={tr('صفحة المادة', 'Course page')} onPress={() => router.push(`/course/${encodeURIComponent(c.code)}` as never)} />
        </View>
      </Expand>;
    })}
  </Screen>;
}